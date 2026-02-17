"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, LayoutDashboard, Database } from "lucide-react";
import { motion } from "framer-motion";

// Define our navigation links here so we can map through them
const navItems = [
  { name: "Chat", href: "/", icon: <MessageSquare size={16} /> },
  { name: "Analytics", href: "/analytics", icon: <LayoutDashboard size={16} /> },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
      className="fixed top-6 inset-x-0 max-w-2xl mx-auto z-50 px-4"
    >
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-2xl border border-white/[0.08] rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 pl-3 relative group">
          <div className="absolute inset-0 bg-blue-600 blur-md opacity-40 group-hover:opacity-80 transition-opacity duration-500 rounded-full"></div>
          <div className="w-5 h-5 rounded-full bg-blue-600 relative z-10 border border-blue-400/50"></div>
          <span className="font-bold text-zinc-100 tracking-wide text-sm hidden sm:block relative z-10">
            Dynamic<span className="text-blue-500">Dash</span>
          </span>
        </Link>

        {/* Links with Sliding Pill Animation */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-4 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${
                  isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {/* This is the Aceternity Magic: 
                  Framer Motion's layoutId ensures this background pill slides smoothly between active tabs 
                */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-white/[0.08] border border-white/[0.1] rounded-full z-[-1]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                {item.icon}
                <span className="hidden sm:block">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Aceternity Style Connect DB Button */}
        <button className="relative group flex items-center gap-2 text-xs font-semibold bg-transparent text-white border border-white/[0.1] px-5 py-2.5 rounded-full overflow-hidden transition-all hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]">
          {/* Animated Gradient Background on Hover */}
          <div className="absolute inset-0 bg-linear-to-r from-blue-600/40 to-cyan-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <Database size={14} className="relative z-10 group-hover:text-cyan-300 transition-colors" />
          <span className="relative z-10">Connect DB</span>
        </button>

      </div>
    </motion.nav>
  );
}