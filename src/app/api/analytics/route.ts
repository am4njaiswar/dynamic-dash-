import { NextResponse } from "next/server";
import { ChatSession } from "@/models/ChatSessionSchema";
import { dbConnect } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user_123";

    // CHANGE: Fetch ALL sessions
    const sessions = await ChatSession.find({ userId });

    let userQueries = 0;
    let aiInsights = 0;

    // Loop through all past chats to get the true total
    sessions.forEach(session => {
      if (session.messages) {
        userQueries += session.messages.filter((m: any) => m.role === "user").length;
        aiInsights += session.messages.filter((m: any) => m.role === "assistant").length;
      }
    });

    return NextResponse.json({
      totalFiles: sessions.length, // Let's use total sessions as the file count for now
      queriesExecuted: userQueries,
      insightsGenerated: aiInsights,
      activeDatabases: 1 
    });

  } catch (error) {
    console.error("ANALYTICS ERROR:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}