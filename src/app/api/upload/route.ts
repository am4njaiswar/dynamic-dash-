import { NextResponse } from "next/server";
import Papa from "papaparse";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    
    // Convert CSV to JSON
    const parsedData = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    console.log("File parsed successfully:", file.name);

    return NextResponse.json({
      fileName: file.name,
      rowCount: parsedData.data.length,
      data: parsedData.data,
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Failed to process CSV" }, { status: 500 });
  }
}