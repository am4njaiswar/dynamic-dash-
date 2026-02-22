"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Clock, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Chat", link: "/", icon: <MessageSquare className="h-4 w-4" /> },
  { name: "History", link: "/history", icon: <Clock className="h-4 w-4" /> },
  {
    name: "Analytics",
    link: "/analytics",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="pointer-events-auto relative flex items-center justify-between gap-6 px-6 py-3 rounded-full bg-[#09090b]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-85 sm:min-w-187.5"
      >
        {/* LEFT: LOGO (Acts as a subtle "Home / Start Over" button) */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-semibold text-zinc-100 tracking-tight hidden sm:block text-lg transition-colors hover:text-white">
            Dynamic Dash
          </span>
        </Link>

        {/* MIDDLE: MAIN NAVIGATION */}
        <div className="flex items-center gap-2">
          {navItems.map((item, idx) => {
            // "Chat" remains highlighted whether on the empty home screen or an active chat
            const isActive = 
              item.link === "/" 
                ? pathname === "/" || pathname.startsWith("/chat")
                : pathname.startsWith(item.link);

            return (
              <Link
                key={item.name}
                href={item.link}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                <span
                  className={cn(
                    "relative z-10 transition-colors duration-200 flex items-center gap-2",
                    isActive
                      ? "text-white"
                      : "text-zinc-400 hover:text-zinc-200",
                  )}
                >
                  <span className="sm:hidden">{item.icon}</span>
                  <span className="hidden sm:inline-block">{item.name}</span>
                </span>

                <AnimatePresence>
                  {hoveredIndex === idx && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-zinc-800/50 block z-0"
                      layoutId="hoverBackground"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.3,
                      }}
                    />
                  )}
                </AnimatePresence>

                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-zinc-800 border border-white/5 -z-10" />
                )}
              </Link>
            );
          })}
        </div>

        {/* RIGHT: ACTIONS */}
        <div>
          <button className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <span className="hidden sm:inline">Connect DB</span>
            <span className="sm:hidden">DB</span>
          </button>
        </div>
      </motion.nav>
    </div>
  );
}