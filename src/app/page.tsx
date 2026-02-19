"use client";

import { useChat } from "@ai-sdk/react";
import { Paperclip, User, Command, RefreshCw, Plus, X, FileText } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Spotlight } from "@/components/ui/spotlight-new";

export default function Dashboard() {
  const [sessionId, setSessionId] = useState<string>("");
  const [fileContext, setFileContext] = useState<any>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const messagesRef = useRef<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    let currentSession = localStorage.getItem("dynamic_dash_session");
    if (!currentSession) {
      currentSession = `session-${Date.now()}`;
      localStorage.setItem("dynamic_dash_session", currentSession);
    }
    setSessionId(currentSession);
  }, []);

  // --- AI CHAT SETUP ---
  const { messages, isLoading, setMessages, append, reload } = useChat({
    body: {
      userId: sessionId,
      data: fileContext,
    },
    onFinish: async (message) => {
      const latestMessages = messagesRef.current;
      const fullHistory = [...latestMessages, message];

      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: sessionId,
            messages: fullHistory, 
          }),
        });
      } catch (error) {
        console.error("Failed to save history:", error);
      }
    },
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- HISTORY LOADER ---
  useEffect(() => {
    if (!sessionId) return; 
    
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/history?userId=${sessionId}`);
        const savedMessages = await res.json();
        
        if (Array.isArray(savedMessages) && savedMessages.length > 0) {
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
  }, [sessionId, setMessages]);

  // --- FILE HANDLING ---
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
        const uploadedName = data.fileName || file.name;
        setFileContext(data.data);
        setFileName(uploadedName);
      }
    } catch (error) {
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- ACTIONS ---
  const handleNewChat = () => {
    const newSession = `session-${Date.now()}`;
    setSessionId(newSession);
    localStorage.setItem("dynamic_dash_session", newSession);
    
    setMessages([]);
    messagesRef.current = [];
    setFileContext(null);
    setFileName(null);
  };

  const handleRemoveFile = () => {
    setFileContext(null);
    setFileName(null);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage = { role: "user", content: inputValue, id: Date.now().toString() };
    messagesRef.current = [...messages, newMessage];

    append({ role: "user", content: inputValue });
    setInputValue("");

    setTimeout(() => {
      setFileContext(null);
      setFileName(null);
    }, 150);
  };

  const placeholders = [
    "What is the revenue growth for Q3?",
    "Show me the top 5 performing products",
    "Analyze the user churn rate from last month",
    "Write a SQL query to fetch active users",
  ];

  return (
    // UPDATED: Increased pt-28 to pt-36 to push the scroll ceiling lower down the screen
    <div className="flex flex-col h-screen pt-32 md:pt-36 overflow-hidden max-w-5xl mx-auto w-full relative">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />

      {/* UPDATED: Changed from absolute to fixed so it anchors to the true browser window corner */}
      <div className="fixed top-6 right-6 md:top-8 md:right-10 z-50">
        <button 
          onClick={handleNewChat}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 text-sm font-medium rounded-full transition-all duration-200 shadow-lg"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* BACKGROUND SPOTLIGHT */}
      {messages.length === 0 && (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1]">
          <Spotlight />
        </div>
      )}

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto pb-4 px-4 sm:px-6 scroll-smooth no-scrollbar w-full">
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
          // UPDATED: Added pt-8 so the first message isn't kissing the top edge of the scroll box
          <div className="space-y-8 max-w-4xl mx-auto w-full pt-8">
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

            {isLoading && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 justify-start">
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
      <div className="shrink-0 pb-6 pt-4 px-4 sm:px-0 relative z-20 bg-[#09090b]">
        <div className="max-w-3xl mx-auto relative">
          
          <AnimatePresence>
            {fileName && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute -top-12 left-2 sm:left-14 flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 backdrop-blur-md border border-zinc-700/50 rounded-lg text-xs text-zinc-300 shadow-lg"
              >
                <FileText size={14} className="text-emerald-400" />
                <span className="max-w-[150px] sm:max-w-[200px] truncate font-medium">{fileName}</span>
                <button 
                  onClick={handleRemoveFile} 
                  className="hover:text-red-400 ml-1 transition-colors border-l border-zinc-700 pl-2"
                  title="Remove file from context"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`h-12 w-12 shrink-0 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-all duration-200 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] ${isUploading ? "animate-pulse cursor-wait" : ""}`}
            >
              <Paperclip size={20} strokeWidth={1.5} />
            </button>

            <div className="flex-1 min-w-0">
              <PlaceholdersAndVanishInput
                placeholders={placeholders}
                onChange={(e) => setInputValue(e.target.value)}
                onSubmit={onSubmit}
              />
            </div>
            
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