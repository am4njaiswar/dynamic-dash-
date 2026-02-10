import mongoose, { Schema, Document } from "mongoose";

export interface ISale extends Document {
  productName: string;
  amount: number;
  category: string;
  date: Date;
}

const SaleSchema = new Schema<ISale>({
  productName: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true }, // e.g., "Electronics", "Clothing"
  date: { type: Date, default: Date.now },
});

export const Sale = mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);