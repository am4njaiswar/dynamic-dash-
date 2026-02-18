"use client";

import { useChat } from "ai/react";
import { Paperclip, User, Command } from "lucide-react";
import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Spotlight } from "@/components/ui/spotlight-new";

export default function Dashboard() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const placeholders = [
    "What is the revenue growth for Q3?",
    "Show me the top 5 performing products",
    "Analyze the user churn rate from last month",
    "Write a SQL query to fetch active users",
    "How do I optimize my database indexing?",
  ];

  // 2. Custom change handler to bridge the Aceternity component with Vercel AI SDK
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
  };

  // 3. Custom submit handler
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full relative">
      
      {/* BACKGROUND SPOTLIGHT */}
      {messages.length === 0 && (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1]">
          <Spotlight />
        </div>
      )}

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 mb-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center mt-[-5vh]">
            <div className="relative z-10 w-full flex flex-col items-center">
              <h1 className="md:text-7xl text-5xl lg:text-8xl font-bold text-center tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-neutral-50 to-neutral-500">
                Dynamic Dash
              </h1>
              <p className="mt-6 font-medium text-[15px] text-zinc-400 max-w-lg text-center mx-auto leading-relaxed tracking-wide">
                Talk to your data. <br className="hidden sm:block" />
                Instantly query databases, visualize complex metrics, and
                uncover hidden anomalies in real-time.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 pb-10 max-w-4xl mx-auto w-full">
            <AnimatePresence>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-[#09090b] border border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <Command size={13} className="text-zinc-400" strokeWidth={2} />
                    </div>
                  )}
                  <div
                    className={`text-[14px] leading-relaxed max-w-[85%] ${
                      m.role === "user"
                        ? "bg-zinc-800/80 text-zinc-100 px-4 py-2.5 rounded-2xl rounded-tr-sm border border-white/5 shadow-md"
                        : "text-zinc-300 py-1"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <User size={13} className="text-zinc-400" strokeWidth={2} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="shrink-0 pb-6 px-4 sm:px-0 relative z-20">
        <div className="max-w-3xl mx-auto">
          
          <div className="flex items-center gap-3 w-full">
            
            <button
              type="button"
              className="h-12 w-12 shrink-0 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-all duration-200 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
            >
              <Paperclip size={20} strokeWidth={1.5} />
            </button>

            <div className="flex-1 min-w-0">
              <PlaceholdersAndVanishInput
                placeholders={placeholders}
                onChange={handleChange}
                onSubmit={onSubmit}
              />
            </div>

            <div className="w-12 shrink-0" aria-hidden="true" />

          </div>
          
          <div className="flex justify-center mt-3 text-[11px] font-medium text-zinc-600 tracking-wider">
            <span>DYNAMIC DASH</span>
          </div>
        </div>
      </div>
    </div>
  );
}