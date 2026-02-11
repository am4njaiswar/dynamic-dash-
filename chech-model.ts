// app/api/chat/route.ts
import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getSalesData } from "@/lib/data";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      // ✅ FIXED: Using the model we PROVED exists on your key
      model: google("gemini-2.0-flash"), 
      messages,
      system: `You are a helpful business assistant. 
      You have access to a tool called 'getSalesData'. 
      If the user asks about sales, revenue, or performance, ALWAYS use this tool to get real data.
      Do not make up numbers.`,
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
    console.error("🔴 SERVER ERROR:", error);
    return new Response(JSON.stringify({ error: "Check server console for details" }), { status: 500 });
  }
}