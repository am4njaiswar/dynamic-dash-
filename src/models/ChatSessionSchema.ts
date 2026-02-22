import mongoose, { Document, Model } from "mongoose";

// 1. Tell TypeScript exactly what a Message looks like
export interface IMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  toolInvocations?: any[];
}

// 2. Tell TypeScript exactly what a ChatSession looks like
export interface IChatSession extends Document {
  userId: string;
  messages: IMessage[];
  lastUpdated?: Date;
}

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  toolInvocations: { type: Array, default: [] }, 
});

const ChatSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  messages: [MessageSchema],
  lastUpdated: { type: Date, default: Date.now },
});

// 3. Bind the interface to the Mongoose model so TS stops yelling
export const ChatSession = 
  (mongoose.models.ChatSession as Model<IChatSession>) || 
  mongoose.model<IChatSession>("ChatSession", ChatSessionSchema);