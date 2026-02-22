import { NextResponse } from "next/server";
import { ChatSession } from "@/models/ChatSessionSchema";
import { dbConnect } from "@/lib/db";
import { getSessionUser } from "@/lib/auth"; 

export async function GET(req: Request) {
  try {
    // 1. Secure the route: Get the real user from the encrypted cookie
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Connect to database
    await dbConnect();

    // 3. Fetch ALL sessions strictly belonging to the authenticated user
    const sessions = await ChatSession.find({ userId: user.id });

    let userQueries = 0;
    let aiInsights = 0;

    // 4. Calculate exact interaction counts
    sessions.forEach(session => {
      if (session.messages && Array.isArray(session.messages)) {
        userQueries += session.messages.filter((m: any) => m.role === "user").length;
        aiInsights += session.messages.filter((m: any) => m.role === "assistant").length;
      }
    });

    // 5. Return 100% accurate analytics
    return NextResponse.json({
      totalFiles: 0, // Accurately 0 until we build a file-tracking database table
      queriesExecuted: userQueries,
      insightsGenerated: aiInsights,
      activeDatabases: 0 // Accurately 0 until the "Connect DB" feature is implemented
    });

  } catch (error) {
    console.error("ANALYTICS ERROR:", error);
    // Return empty state instead of crashing the frontend UI if DB fails
    return NextResponse.json(
      { totalFiles: 0, queriesExecuted: 0, insightsGenerated: 0, activeDatabases: 0 }, 
      { status: 500 }
    );
  }
}