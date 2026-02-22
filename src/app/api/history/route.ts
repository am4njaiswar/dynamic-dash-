import { NextResponse } from "next/server";
import { ChatSession } from "@/models/ChatSessionSchema";
import { dbConnect } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user_123";

    // CHANGE: Fetch ALL sessions for the user, sorted by newest first
    const sessions = await ChatSession.find({ userId }).sort({ lastUpdated: -1 });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("HISTORY GET ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    // CHANGE: Expect a sessionId from the frontend. If it doesn't exist, create a new chat.
    const { userId, messages, sessionId } = await req.json();

    let session;
    if (sessionId) {
      // Update the specific existing chat
      session = await ChatSession.findByIdAndUpdate(
        sessionId,
        { messages, lastUpdated: new Date() },
        { new: true }
      );
    } else {
      // Create a brand new chat history row
      session = await ChatSession.create({
        userId,
        messages,
        lastUpdated: new Date()
      });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("HISTORY POST ERROR:", error);
    return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
  }
}