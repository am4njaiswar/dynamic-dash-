// app/api/analytics/route.ts
import { NextResponse } from "next/server";
import { getSalesData } from "@/lib/data"; // Re-using your DB connection
import mongoose from "mongoose";

// This is just to ensure we can use Mongoose models directly
const SaleSchema = new mongoose.Schema({
  product: String,
  amount: Number,
  date: Date,
});
// Prevent overwriting the model if it exists
const Sale = mongoose.models.Sale || mongoose.model("Sale", SaleSchema);

export async function POST(req: Request) {
  try {
    const { type } = await req.json();
    console.log(`📊 Analytics Requested: ${type}`);

    let data;

    // 1. KPI Summary (Total Revenue, Avg Order, Total Orders)
    if (type === "kpi_summary") {
      data = await Sale.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            avgOrderValue: { $avg: "$amount" },
            totalOrders: { $sum: 1 },
            minSale: { $min: "$amount" },
            maxSale: { $max: "$amount" }
          }
        }
      ]);
    } 
    
    // 2. Top Selling Products
    else if (type === "top_products") {
      data = await Sale.aggregate([
        {
          $group: {
            _id: "$product",
            revenue: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]);
    } 
    
    // 3. Daily Sales Trend (for Line Charts)
    else if (type === "daily_trend") {
      data = await Sale.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            dailyRevenue: { $sum: "$amount" }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    }

    return NextResponse.json({ type, data: data || [] });

  } catch (error) {
    console.error("ANALYTICS ERROR:", error);
    return NextResponse.json({ error: "Failed to calculate analytics" }, { status: 500 });
  }
}