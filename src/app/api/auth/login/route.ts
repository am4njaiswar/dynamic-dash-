import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import {dbConnect} from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const tokenData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    const token = jwt.sign(tokenData, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", 
      maxAge: 7 * 24 * 60 * 60, 
      path: "/",
    });

    return NextResponse.json({ message: "Logged in successfully", user: tokenData });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}