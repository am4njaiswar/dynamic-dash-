import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  toolInvocations: { type: Array, default: [] }, // To save chart data
});

const ChatSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  messages: [MessageSchema],
  lastUpdated: { type: Date, default: Date.now },
});

export const ChatSession = mongoose.models.ChatSession || mongoose.model("ChatSession", ChatSessionSchema);