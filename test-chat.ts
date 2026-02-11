// test-integration.ts
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testIntegration() {
  console.log("--- Testing Chat with File Context ---");

  // 1. Read the CSV File (Simulating the upload step)
  // Ensure you have a 'data.csv' file in your project root
  const csvPath = path.join(process.cwd(), "data.csv");
  if (!fs.existsSync(csvPath)) {
      console.error("❌ data.csv not found! Please create it first.");
      return;
  }
  
  const csvText = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true });
  
  console.log(`📤 Sending ${parsed.data.length} rows to AI...`);

  // 2. Send to Chat API (Simulating the Frontend sending context)
  const response = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "What is the total amount in the uploaded file?" }],
      data: parsed.data, // <--- This is the key: we send the data payload
    }),
  });

  if (!response.ok) {
    console.error("Error:", await response.text());
    return;
  }

  // 3. Read Stream
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  console.log("\n🤖 AI Response:");
  while (true) {
    const { done, value } = await reader?.read() || {};
    if (done) break;
    process.stdout.write(decoder.decode(value));
  }
  console.log("\n\n✅ Integration Test Complete");
}

testIntegration();