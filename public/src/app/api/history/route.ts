import { NextResponse } from "next/server";
import { ChatSession } from "@/models/ChatSessionSchema";
import {dbConnect} from "@/lib/db"; // Assuming your DB connection utility

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    const session = await ChatSession.findOne({ userId }).sort({ lastUpdated: -1 });
    return NextResponse.json(session?.messages || []);
  } catch (error) {
    console.error("HISTORY GET ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { userId, messages } = await req.json();

    const session = await ChatSession.findOneAndUpdate(
      { userId },
      { messages, lastUpdated: new Date() },
      { upsert: true, new: true }
    );

    console.log("Chat history updated for user:", userId);
    return NextResponse.json(session);
  } catch (error) {
    console.error("HISTORY POST ERROR:", error);
    return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
  }
}