// test-analytics.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testAnalytics() {
  const baseUrl = "http://localhost:3000/api/analytics";

  console.log("--- 1. Testing KPI Summary ---");
  const kpiRes = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "kpi_summary" }),
  });
  const kpiData = await kpiRes.json();
  console.log("KPIs:", kpiData.data[0] || "No Data Found");

  console.log("\n--- 2. Testing Top Products ---");
  const topRes = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "top_products" }),
  });
  const topData = await topRes.json();
  console.log("Top Products:", topData.data);
}

testAnalytics();