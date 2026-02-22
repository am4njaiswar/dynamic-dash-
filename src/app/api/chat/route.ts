import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";

// 1. Import our Auth Helper and Database tools
import { getSessionUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db"; // Adjust path if yours is different
import {ChatSession} from "@/models/ChatSessionSchema"; // Adjust path if yours is different

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // 2. Secure the route: Get the real logged-in user
    const user = await getSessionUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Notice we are also extracting a sessionId if one exists!
    const { messages, data, sessionId } = await req.json();

    // --- UPDATED: The Predictive Data Scientist Prompt ---
    let systemPrompt = `You are an expert data scientist, business strategist, and enterprise AI assistant. 
    
    CORE RESPONSIBILITIES:
    1. VISUALIZATION: If the user asks for a chart or visual, you MUST use the 'render_chart' tool.
    2. ANALYSIS: ALWAYS provide a clear, concise text explanation alongside the chart.
    
    3. PREDICTIVE FORECASTING & STRATEGY: 
       If the user asks for predictions, future trends, forecasts, or what decisions to make:
       - Analyze the historical trends in the provided data (calculate growth rates, identify seasonality or declines).
       - Mathematically extrapolate 3 to 5 realistic future data points based on that trend.
       - Include these future points in the data you send to the 'render_chart' tool.
       - CLEARLY label the X-axis for these future points (e.g., "Q4 (Proj)", "2026 (Forecast)") so the user knows they are predictions.
       - Best practice is to use an 'area' or 'line' chart for time-series forecasting.
       - In your text response, act as a C-level business consultant. Explicitly list 2-3 actionable business decisions the user should make to either capitalize on the predicted growth or mitigate the predicted drop.

    Extract or synthesize the relevant data from the provided context. Keep your text analysis professional, crisp, and highly readable.`;
    
    if (data) systemPrompt += `\nContext: ${JSON.stringify(data).slice(0, 10000)}`;

    console.log("🚀 Starting Gemini Stream...");

    const result = streamText({
      model: google("gemini-2.5-flash"), 
      messages,
      system: systemPrompt,
      maxSteps: 5,
      
      tools: {
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
      },
      
      // 3. THE MAGIC FIX: Save to Database when the AI finishes!
      async onFinish({ text }) {
        try {
          await dbConnect();

          // Create the full conversation array (Previous History + User Prompt + New AI Response)
          const updatedMessages = [
            ...messages,
            { role: "assistant", content: text }
          ];

          if (sessionId) {
            // If they are continuing an old chat, update that specific session
            await ChatSession.findByIdAndUpdate(sessionId, {
              messages: updatedMessages,
              lastUpdated: new Date()
            });
            console.log("💾 Updated existing chat session in DB");
          } else {
            // If it's a brand new chat, create a new session tied to THEIR user ID!
            await ChatSession.create({
              userId: user.id, // <--- Secured to the logged-in user!
              messages: updatedMessages,
              lastUpdated: new Date()
            });
            console.log("💾 Created new chat session in DB for user:", user.name);
          }
        } catch (dbError) {
          console.error("🚨 Failed to save chat to database:", dbError);
        }
      },

      onError: (error) => {
        console.error("❌ Stream Error:", error);
      }
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("🚨 FATAL ROUTE ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}