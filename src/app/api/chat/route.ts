import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, data } = await req.json();

    let systemPrompt = `You are a helpful data assistant.`;
    if (data) systemPrompt += `\nContext: ${JSON.stringify(data).slice(0, 10000)}`;

    console.log("Starting Gemini Stream...");

    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages,
      system: systemPrompt,
      maxSteps: 5,
      // Log any errors that happen DURING the stream
      onError: (error) => {
        console.error("Stream Error:", error);
      }
    });

    return result.toDataStreamResponse();
  } catch (error) {
    // Log any errors that happen BEFORE the stream starts (like a bad API key)
    console.error("FATAL ROUTE ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}