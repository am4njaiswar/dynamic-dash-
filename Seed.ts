import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// This forces the script to look for .env.local in the current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is missing in .env.local");
  process.exit(1);
}

const products = [
  { name: "iPhone 15", price: 999, category: "Electronics" },
  { name: "Samsung S24", price: 899, category: "Electronics" },
  { name: "Lava Blaze", price: 200, category: "Electronics" },
  { name: "Sony Headphones", price: 150, category: "Accessories" },
  { name: "MacBook Air", price: 1200, category: "Electronics" },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Define Schema inline for the script
    const SaleSchema = new mongoose.Schema({
      productName: String,
      amount: Number,
      category: String,
      date: Date,
    });
    const Sale = mongoose.models.Sale || mongoose.model("Sale", SaleSchema);

    // Clear existing data
    await Sale.deleteMany({});
    console.log("Cleared existing sales");

    // Generate 100 fake sales
    const sales = [];
    for (let i = 0; i < 100; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const randomDaysAgo = Math.floor(Math.random() * 30); // Sales from last 30 days
      const date = new Date();
      date.setDate(date.getDate() - randomDaysAgo);

      sales.push({
        productName: product.name,
        amount: product.price,
        category: product.category,
        date: date,
      });
    }

    await Sale.insertMany(sales);
    console.log(`Successfully added ${sales.length} sales records!`);

    process.exit();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();