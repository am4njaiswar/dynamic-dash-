"use client";

import { useChat } from "@ai-sdk/react";
import { Paperclip, User, Command, RefreshCw } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Spotlight } from "@/components/ui/spotlight-new";

const USER_ID = "demo-user-123";

export default function Dashboard() {
  const [fileContext, setFileContext] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // 1. LOCAL STATE FIX: We manage the input value ourselves to avoid library errors
  const [inputValue, setInputValue] = useState("");
  
  // 2. REF FOR HISTORY: Keeps track of messages instantly to avoid "stale state" bugs
  const messagesRef = useRef<any[]>([]);

  const {
    messages,
    // input, setInput, // REMOVED: We use local state instead
    isLoading,
    setMessages,
    append,
    reload 
  } = useChat({
    body: {
      userId: USER_ID,
      data: fileContext,
    },
    // On Finish, save the *complete* history from our Ref
    onFinish: async (message) => {
      const latestMessages = messagesRef.current;
      const fullHistory = [...latestMessages, message];

      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: USER_ID,
            messages: fullHistory, 
          }),
        });
        console.log("Chat history saved: " + fullHistory.length + " messages.");
      } catch (error) {
        console.error("Failed to save history:", error);
      }
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. SYNC REF: Keep our Ref updated whenever the AI adds a message
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 4. LOAD HISTORY: Fetch old chats on page load
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/history?userId=${USER_ID}`);
        const savedMessages = await res.json();
        
        if (Array.isArray(savedMessages) && savedMessages.length > 0) {
          // Ensure every message has a unique ID to prevent React Key errors
          const safeMessages = savedMessages.map((msg: any, index: number) => ({
             ...msg,
             id: msg.id || msg._id || `history-${Date.now()}-${index}`,
          }));
          setMessages(safeMessages);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
      }
    };
    loadHistory();
  }, [setMessages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // File Upload Logic
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.data) {
        setFileContext(data.data);
        alert(`File analyzed: ${data.fileName} (${data.rowCount} rows).`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaperclipClick = () => fileInputRef.current?.click();

  const placeholders = [
    "What is the revenue growth for Q3?",
    "Show me the top 5 performing products",
    "Analyze the user churn rate from last month",
    "Write a SQL query to fetch active users",
  ];

  // 5. INPUT HANDLING (Using Local State)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Immediately update Ref so onFinish sees this user message
    const newMessage = { role: "user", content: inputValue, id: Date.now().toString() };
    messagesRef.current = [...messages, newMessage];

    // Send to AI
    append({
      role: "user",
      content: inputValue,
    });

    // Clear Input
    setInputValue("");
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full relative">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />

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
              <h1 className="md:text-7xl text-5xl lg:text-8xl font-bold text-center tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-500">
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
            <AnimatePresence mode="popLayout">
              {messages.map((m, index) => (
                <motion.div
                  key={m.id || `msg-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-[#09090b] border border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <Command size={13} className="text-zinc-400" strokeWidth={2} />
                    </div>
                  )}
                  
                  <div className={`text-[14px] leading-relaxed max-w-[85%] ${
                      m.role === "user"
                        ? "bg-zinc-800/80 text-zinc-100 px-4 py-2.5 rounded-2xl rounded-tr-sm border border-white/5 shadow-md"
                        : "text-zinc-300 py-1"
                    }`}
                  >
                    {/* MARKDOWN RENDERER */}
                    {m.role === "user" ? (
                      m.content
                    ) : (
                      <ReactMarkdown
                        components={{
                          strong: ({node, ...props}) => <span className="font-bold text-white" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mt-2 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="marker:text-zinc-500" {...props} />,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <User size={13} className="text-zinc-400" strokeWidth={2} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* LOADING STATE */}
            {isLoading && (
               <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 justify-start"
               >
                  <div className="w-7 h-7 rounded-lg bg-[#09090b] border border-white/10 flex items-center justify-center shrink-0">
                     <Command size={13} className="text-zinc-400 animate-pulse" />
                  </div>
                  <div className="text-zinc-500 text-sm py-1 animate-pulse">Analyzing data...</div>
               </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="shrink-0 pb-6 px-4 sm:px-0 relative z-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 w-full">
            
            {/* FILE BUTTON */}
            <button
              type="button"
              onClick={handlePaperclipClick}
              disabled={isUploading}
              className={`h-12 w-12 shrink-0 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-all duration-200 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] ${isUploading ? "animate-pulse cursor-wait" : ""}`}
            >
              <Paperclip size={20} strokeWidth={1.5} />
            </button>

            {/* INPUT FIELD */}
            <div className="flex-1 min-w-0">
              <PlaceholdersAndVanishInput
                placeholders={placeholders}
                onChange={handleChange}
                onSubmit={onSubmit}
              />
            </div>
            
            {/* RELOAD BUTTON */}
            <button
                type="button"
                onClick={() => reload()}
                className="h-12 w-12 shrink-0 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-all duration-200"
                title="Regenerate response"
            >
                <RefreshCw size={18} strokeWidth={1.5} />
            </button>
            
          </div>
          
          <div className="flex justify-center mt-3 gap-4 text-[11px] font-medium text-zinc-600 tracking-wider">
            <span>DYNAMIC DASH</span>
            <span className="text-zinc-800">•</span>
            <span>ENTERPRISE SECURE</span>
          </div>
        </div>
      </div>
    </div>
  );
}