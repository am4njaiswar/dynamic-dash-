import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import mongoose from "mongoose";

import { getSessionUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db"; 
import { ChatSession } from "@/models/ChatSessionSchema";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { messages, data, sessionId, connectionString, schema, apiKey } = await req.json();

    const customGoogle = createGoogleGenerativeAI({
      apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    let systemPrompt = `You are an expert data scientist, business strategist, and enterprise AI assistant. 
    
    CORE RESPONSIBILITIES:
    1. VISUALIZATION: If the user asks for a chart or visual, you MUST use the 'render_chart' tool.
    2. ANALYSIS: ALWAYS provide a clear, concise text explanation alongside the chart.
    
    3. PREDICTIVE FORECASTING & STRATEGY: 
       If the user asks for predictions, future trends, forecasts, or what decisions to make:
       - Analyze the historical trends in the provided data.
       - Mathematically extrapolate 3 to 5 realistic future data points based on that trend.
       - Include these future points in the data you send to the 'render_chart' tool.
       - CLEARLY label the X-axis for these future points (e.g., "Q4 (Proj)").
       - In your text response, explicitly list 2-3 actionable business decisions.`;

    // 1. HIGHEST PRIORITY: Handle CSV Data State
    if (data && Array.isArray(data)) {
      const safeData = data.slice(0, 200); 
      systemPrompt += `\n\nCURRENT STATE: Analyzing uploaded CSV data.
      Context: ${JSON.stringify(safeData)}
      IMPORTANT: Base your analysis STRICTLY on the provided Context. DO NOT attempt to query the live database right now.`;
    } 
    // 2. SECONDARY PRIORITY: Handle Live DB State
    else if (schema && connectionString) {
      systemPrompt += `\n\nLIVE DATABASE CONNECTED: You have access to the user's live MongoDB database.
      Here is the Database Schema Blueprint: ${JSON.stringify(schema)}
      When the user asks a question about their data, you MUST use the 'query_database' tool.`;
    } 
    // 3. FALLBACK: "No Data" State
    else {
      systemPrompt += `\n\nCRITICAL STATE: The user has not provided any data context. 
      Do NOT attempt to use the 'query_database' tool. 
      Politely inform the user that you need them to upload a CSV file or connect a database to answer data-specific questions.`;
    }

    console.log("Starting Gemini Stream...");

    const staticTools = {
      render_chart: tool({
        description: "Renders a bar, line, area, or pie chart based on the provided data.",
        parameters: z.object({
          config: z.object({
            type: z.enum(['bar', 'line', 'area', 'pie']).describe('The type of chart to render'),
            xAxisKey: z.string().describe('The key in the data objects to use for the X axis'),
            yAxisKey: z.string().describe('The key in the data objects to use for the Y axis'),
            title: z.string().optional().describe('An optional title for the chart'),
          }),
          data: z.array(z.record(z.any())).describe('The array of data objects to plot'),
        }),
        execute: async ({ config, data }) => {
          return { config, data };
        },
      }),

      query_database: tool({
        description: "Executes a query against the connected MongoDB database to fetch live data.",
        parameters: z.object({
          collectionName: z.string().describe("The name of the MongoDB collection to query"),
          filter: z.record(z.any()).optional().describe("The MongoDB query filter object (e.g., { status: 'active' })"),
          sort: z.record(z.any()).optional().describe("Optional MongoDB sort object (e.g., { createdAt: -1 })"),
        }),
        execute: async ({ collectionName, filter, sort }) => {
          
          if (!connectionString) {
             console.log("Blocked AI from querying DB while disconnected.");
             return { error: "Database is currently disconnected. Inform the user they must connect a database to use this feature." };
          }

          console.log(`Executing live query on ${collectionName}...`);
          try {
            const liveConn = await mongoose.createConnection(connectionString, {
              serverSelectionTimeoutMS: 5000,
            }).asPromise();
            
            let query = liveConn.db.collection(collectionName).find(filter || {});
            if (sort) query = query.sort(sort);
            
            const results = await query.limit(100).toArray(); 
            await liveConn.close();
            return results;
          } catch (error: any) {
            console.error("Live DB Query Failed:", error);
            return { error: "Failed to query live database", details: error.message };
          }
        },
      }),
    };

    const result = streamText({
      model: customGoogle("gemini-2.5-flash"), 
      messages,
      system: systemPrompt,
      maxSteps: 5, 
      tools: staticTools, 
      
      async onFinish({ text }) {
        try {
          await dbConnect();
          const updatedMessages = [
            ...messages,
            { role: "assistant", content: text || "Finished analyzing data." }
          ];

          if (sessionId) {
            await ChatSession.findByIdAndUpdate(sessionId, {
              messages: updatedMessages,
              lastUpdated: new Date()
            });
            console.log("Updated existing chat session in DB");
          } else {
            await ChatSession.create({
              userId: user.id, 
              messages: updatedMessages,
              lastUpdated: new Date()
            });
            console.log("Created new chat session in DB for user");
          }
        } catch (dbError) {
          console.error("Failed to save chat to database:", dbError);
        }
      },

      onError: (error) => {
        console.error("Stream Error Caught:", error);
      }
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("FATAL ROUTE ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}