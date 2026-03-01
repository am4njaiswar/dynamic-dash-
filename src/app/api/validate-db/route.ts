import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse the connection string from the frontend
    const { connectionString } = await request.json();

    if (!connectionString) {
      return NextResponse.json(
        { success: false, message: 'Connection string is required.' }, 
        { status: 400 }
      );
    }

    // Attempt a temporary connection with a 5-second timeout
    const tempConnection = await mongoose.createConnection(connectionString, {
      serverSelectionTimeoutMS: 5000, 
    }).asPromise();

    // If it connects successfully, close it immediately to save resources
    await tempConnection.close();

    return NextResponse.json(
      { success: true, message: 'Database connected successfully!' }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("User DB Connection Error:", error.message);
    return NextResponse.json(
      { success: false, message: 'Connection failed. Please check your credentials and network access.' }, 
      { status: 500 }
    );
  }
}