// test-upload.ts
import fs from "fs";
import path from "path";

async function testUpload() {
  console.log("--- Testing CSV Upload ---");

  const filePath = path.join(process.cwd(), "data.csv");
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: "text/csv" });
  
  const formData = new FormData();
  formData.append("file", blob, "data.csv");

  const response = await fetch("http://localhost:3000/api/upload", {
    method: "POST",
    body: formData, // Fetch automatically sets content-type for FormData
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Upload Failed:", error);
    return;
  }

  const result = await response.json();
  console.log("Upload Status: Success");
  console.log("File Name:", result.fileName);
  console.log("Rows Found:", result.rowCount);
  console.log("Sample Data:", result.data[0]);
}

testUpload();