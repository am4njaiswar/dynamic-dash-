import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getSalesData } from "@/lib/data";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, data } = await req.json();

    let systemPrompt = `You are Dynamic Dash. Use 'getSalesData' for database queries.`;
    if (data) {
      systemPrompt += `\n\nContext from file: ${JSON.stringify(data).slice(0, 10000)}`;
    }

    const result = streamText({
      model: google("gemini-1.5-flash"),
      messages,
      system: systemPrompt,
      maxSteps: 5,
      tools: {
        getSalesData: tool({
          description: "Fetch sales data based on a query",
          parameters: z.object({
            query: z.string().describe("The search or filter query"),
          }),
          execute: async ({ query }: { query: string }) => {
            console.log("🛠️ Tool triggered:", query);
            return await getSalesData(query);
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Route Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}