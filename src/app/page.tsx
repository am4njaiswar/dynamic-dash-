"use client";

import { useChat } from "ai/react";
import { Send, Paperclip, Bot, User, BarChart3, TrendingUp, Sparkles } from "lucide-react";
import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full relative">
      
      {/* CHAT DISPLAY AREA */}
      <div className="flex-1 overflow-y-auto p-6 mb-4 custom-scrollbar">
        {messages.length === 0 ? (
          // --- ACETERNITY STYLE EMPTY STATE ---
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full flex flex-col items-center justify-center text-center space-y-8"
          >
            <div className="relative flex items-center justify-center">
              {/* Glowing animated orb behind the bot icon */}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-32 h-32 bg-blue-600/30 blur-3xl rounded-full"
              />
              <div className="relative p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm">
                <Bot size={40} className="text-blue-400" />
              </div>
            </div>
            
            <div className="space-y-2 relative z-10">
              <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
                Intelligence Engine Ready
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto text-sm">
                Connect your database or upload a CSV to generate instant, real-time analytics.
              </p>
            </div>

            {/* Suggested Prompts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl mt-8">
              <SuggestionCard icon={<BarChart3 size={18} className="text-blue-400" />} title="Generate KPI Summary" />
              <SuggestionCard icon={<TrendingUp size={18} className="text-emerald-400" />} title="Graph Top Products" />
              <SuggestionCard icon={<Sparkles size={18} className="text-purple-400" />} title="Predict Sales Trends" />
              <SuggestionCard icon={<Database size={18} className="text-orange-400" />} title="Inspect Database" />
            </div>
          </motion.div>
        ) : (
          // --- FRAMER MOTION MESSAGE HISTORY ---
          <div className="space-y-6">
            <AnimatePresence>
              {messages.map((m) => (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-blue-900/50 to-transparent border border-blue-800/50 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(37,99,235,0.2)]">
                      <Bot size={16} className="text-blue-400" />
                    </div>
                  )}
                  
                  <div className={`px-5 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed backdrop-blur-md ${
                    m.role === "user" 
                      ? "bg-blue-600/90 text-white rounded-br-sm border border-blue-500" 
                      : "bg-zinc-900/80 border border-zinc-800 text-zinc-200 rounded-bl-sm shadow-xl"
                  }`}>
                    {m.content}
                  </div>

                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-1">
                      <User size={16} className="text-zinc-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ACETERNITY STYLE GLOWING INPUT */}
      <div className="shrink-0 pb-4">
        <div className="relative max-w-3xl mx-auto group">
          
          {/* Animated Gradient Border Behind the Input */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-2xl opacity-30 group-focus-within:opacity-100 blur-sm transition-opacity duration-500 animate-pulse"></div>
          
          <form 
            onSubmit={handleSubmit} 
            className="relative flex items-center bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl transition-all"
          >
            <button type="button" className="p-4 text-zinc-500 hover:text-blue-400 transition-colors">
              <Paperclip size={20} />
            </button>

            <input
              className="flex-1 bg-transparent border-none py-4 px-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
              placeholder="Ask the Intelligence Engine..."
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
            />

            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="p-2.5 m-2 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-30 transition-all font-medium flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

// Reusable component for the Empty State chips with hover effects
function SuggestionCard({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, backgroundColor: "rgba(39, 39, 42, 0.8)" }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 cursor-pointer transition-colors backdrop-blur-sm"
    >
      <div className="p-2 rounded-lg bg-black border border-zinc-800 shadow-inner">
        {icon}
      </div>
      <div className="text-sm font-medium text-zinc-300">{title}</div>
    </motion.div>
  );
}

// Temporary Lucide Icon to prevent crash until we import it
function Database({ className, size }: { className?: string; size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}