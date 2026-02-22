"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Clock, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in when the Navbar loads
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [pathname]); // Re-run when the route changes to keep UI in sync

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    router.push("/login");
  };

  // Base navigation always available
  const navItems = [
    { name: "Chat", link: "/", icon: <MessageSquare className="h-4 w-4" /> },
  ];

  // Add protected navigation if logged in
  if (isAuthenticated) {
    navItems.push(
      { name: "History", link: "/history", icon: <Clock className="h-4 w-4" /> },
      { name: "Analytics", link: "/analytics", icon: <LayoutDashboard className="h-4 w-4" /> }
    );
  }

  // Don't render the navbar on login/register pages
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <div className="fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none">
      
      {/* CENTER PILL */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="pointer-events-auto relative flex items-center justify-between gap-6 px-6 py-3 rounded-full bg-[#09090b]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-85 sm:min-w-187.5"
      >
        {/* LEFT: LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-semibold text-zinc-100 tracking-tight hidden sm:block text-lg transition-colors hover:text-white">
            Dynamic Dash
          </span>
        </Link>

        {/* MIDDLE: LINKS */}
        <div className="flex items-center gap-2">
          {navItems.map((item, idx) => {
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
                <span className={cn("relative z-10 transition-colors duration-200 flex items-center gap-2", isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200")}>
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
                      transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>
                {isActive && <span className="absolute inset-0 rounded-full bg-zinc-800 border border-white/5 -z-10" />}
              </Link>
            );
          })}
        </div>

        {/* RIGHT: CONNECT DB OR LOGIN/SIGNUP */}
        <div className="flex items-center gap-3">
          {!isLoading && (
            isAuthenticated ? (
              <button className="hidden sm:flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-5 py-2 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                Connect DB
              </button>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors px-3 py-2">
                  Log in
                </Link>
                <Link href="/register" className="text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors shadow-lg">
                  Sign Up
                </Link>
              </>
            )
          )}
        </div>
      </motion.nav>

      {/* FLOATING LOGOUT BUTTON (Top Right) */}
      <AnimatePresence>
        {!isLoading && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-6 md:right-10 pointer-events-auto flex items-center"
          >
            <button 
              onClick={handleLogout}
              // THE FIX: Exact same glassmorphism as the main nav, with a subtle, premium red hover effect
              className="flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:py-2.5 bg-[#09090b]/80 backdrop-blur-xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-zinc-400 hover:text-red-400 text-xs sm:text-sm font-medium rounded-full transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}