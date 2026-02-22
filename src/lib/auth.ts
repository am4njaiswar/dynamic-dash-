import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) return null;

    // Decode the token using your secret key to get the real user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      id: string; 
      email: string; 
      name: string 
    };
    
    return decoded;
  } catch (error) {
    console.error("Failed to verify session token:", error);
    return null;
  }
}