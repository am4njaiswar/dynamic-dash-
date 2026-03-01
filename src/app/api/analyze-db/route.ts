import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { connectionString } = await request.json();

    if (!connectionString) {
      return NextResponse.json(
        { success: false, message: 'No connection string provided' }, 
        { status: 400 }
      );
    }

    // 1. Establish temporary connection
    const conn = await mongoose.createConnection(connectionString, {
      serverSelectionTimeoutMS: 5000,
    }).asPromise();

    const db = conn.db;
    if (!db) throw new Error("Could not initialize database connection.");

    // 2. Get all collection names
    const collections = await db.listCollections().toArray();
    const schemaSummary = [];

    // 3. Scan each collection to map its fields
    for (const col of collections) {
      const name = col.name;
      
      // Skip internal MongoDB system collections
      if (name.startsWith('system.')) continue;

      const sampleDoc = await db.collection(name).findOne({});

      if (sampleDoc) {
        const fields = Object.keys(sampleDoc).map(key => ({
          name: key,
          type: typeof sampleDoc[key]
        }));

        schemaSummary.push({
          collectionName: name,
          fields: fields,
        });
      }
    }

    // 4. Close the connection
    await conn.close();

    // 5. Return the database blueprint
    return NextResponse.json({ success: true, schema: schemaSummary }, { status: 200 });

  } catch (error: any) {
    console.error("Schema Analysis Error:", error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to analyze database structure.' }, 
      { status: 500 }
    );
  }
}