import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dynamic Dash",
  description: "AI-Powered Data Intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white h-screen flex flex-col overflow-hidden`}>
        
        
        <div className="relative w-full flex items-center justify-center">
          <Navbar />
        </div>
        
        <main className="flex-1 w-full relative pt-24 pb-6 px-4 flex flex-col z-10">
          {children}
        </main>

      </body>
    </html>
  );
}