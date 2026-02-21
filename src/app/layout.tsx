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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Restored the font classes here along with the layout classes */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen w-full flex flex-col overflow-hidden bg-[#0d0d12] text-white`}>
        
        {/* Your Navbar is now actually rendered here */}
        <header className="flex-none w-full border-b border-gray-800">
           <Navbar /> 
        </header>

        {/* The Content Area */}
        <main className="flex-1 w-full overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>

      </body>
    </html>
  );
}