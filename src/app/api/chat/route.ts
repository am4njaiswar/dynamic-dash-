import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getSalesData } from "@/lib/data";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // 1. Extract 'data' (from CSV) along with 'messages'
    const { messages, data } = await req.json();

    // 2. Build the System Prompt dynamically
    const initialSystemPrompt = `You are a helpful business assistant.
    You have access to a tool called 'getSalesData' to query the main database.
    If the user asks about sales, revenue, or performance from the database, ALWAYS use this tool.
    Do not make up numbers.`;

    // 3. Inject CSV Data if it exists
    let finalSystemPrompt = initialSystemPrompt;
    if (data) {
      console.log("📂 Injecting File Data into AI Context...");
      finalSystemPrompt += `\n\nUSER UPLOADED FILE CONTEXT:
      The user has uploaded a file with the following data:
      ${JSON.stringify(data).slice(0, 20000)} 
      // (Truncated to first 20k chars to save tokens)
      
      INSTRUCTIONS FOR FILE:
      - Prioritize this file data if the user asks about "the file", "uploaded data", or specific rows in it.
      - If the user asks for charts based on this file, generate the text response describing the data points.`;
    }

    const result = streamText({
      model: google("gemini-flash-latest"), 
      messages,
      system: finalSystemPrompt,
      maxSteps: 5,
      tools: {
        getSalesData: tool({
          description: "Get sales data from the database",
          parameters: z.object({
            query: z.string().describe("The user's query or filter"),
          }),
          execute: async ({ query }) => {
            console.log("Gemini is calling the getSalesData tool...");
            const data = await getSalesData(query);
            return data;
          },
        }),
      },
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return new Response(JSON.stringify({ error: "Check server console" }), { status: 500 });
  }
}