import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, data } = await req.json();

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