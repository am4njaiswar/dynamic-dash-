// lib/data.ts
import { Sale } from "@/models/Sale";
import {dbConnect} from "@/lib/db";

export async function getSalesData(query: string) {
  try {
    await dbConnect();
    
    // Simple logic: Fetch all sales (limit to 100 for safety)
    const sales = await Sale.find().sort({ date: -1 }).limit(100);

    console.log(`Fetched ${sales.length} sales records from database.`);

    // We return a simplified version of the data to save tokens
    return sales.map((sale) => ({
      product: sale.productName,
      amount: sale.amount,
      date: sale.date.toISOString().split("T")[0], // YYYY-MM-DD format
    }));
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return [];
  }
}