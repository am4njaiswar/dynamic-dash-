"use client";

import { useChat } from "@ai-sdk/react";
import { Paperclip, User, Command, RefreshCw, Plus, X, FileText } from "lucide-react";
import { useRef, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Spotlight } from "@/components/ui/spotlight-new";
import ChartDisplay from "@/components/ChartsDisplay";

// We extract the main UI into a separate component so we can wrap it in Suspense for Next.js
function ChatDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("sessionId");

  // Track the active MongoDB document ID
  const [activeSessionId, setActiveSessionId] = useState<string | null>(urlSessionId);
  const activeSessionIdRef = useRef(activeSessionId);

  const [fileContext, setFileContext] = useState<any>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const messagesRef = useRef<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep the Ref in sync with state so the async onFinish function can read it
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // --- AI CHAT SETUP ---
  const { messages, isLoading, setMessages, append, reload } = useChat({
    body: {
      userId: "user_123", // Using the same hardcoded user for solo development
      data: fileContext,
    },
    onFinish: async (message) => {
      const latestMessages = messagesRef.current;
      const fullHistory = [...latestMessages, message];

      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "user_123",
            sessionId: activeSessionIdRef.current, // Pass the active ID (null if brand new)
            messages: fullHistory, 
          }),
        });
        
        const savedSession = await res.json();

        // If this was a brand new chat, the DB just created an ID. 
        // Save it and put it in the URL so the next message stays in the same chat!
        if (!activeSessionIdRef.current && savedSession._id) {
          setActiveSessionId(savedSession._id);
          router.push(`/?sessionId=${savedSession._id}`, { scroll: false });
        }
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
  // This runs when the page loads or when the URL changes
  useEffect(() => {
    const loadHistory = async () => {
      if (urlSessionId) {
        try {
          // Fetch all sessions for the user
          const res = await fetch(`/api/history?userId=user_123`);
          const allSessions = await res.json();
          
          // Find the specific session that matches the URL
          const currentSession = allSessions.find((s: any) => s._id === urlSessionId);
          
          if (currentSession && currentSession.messages) {
            const safeMessages = currentSession.messages.map((msg: any, index: number) => ({
               ...msg,
               id: msg.id || msg._id || `history-${Date.now()}-${index}`,
            }));
            setMessages(safeMessages);
            setActiveSessionId(urlSessionId);
          }
        } catch (error) {
          console.error("Failed to load history:", error);
        }
      } else {
        // If there is no ID in the URL, clear the screen for a fresh chat
        setMessages([]);
        setActiveSessionId(null);
      }
    };
    
    loadHistory();
  }, [urlSessionId, setMessages]);

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
    // Clear the slate and wipe the URL clean
    setMessages([]);
    messagesRef.current = [];
    setFileContext(null);
    setFileName(null);
    setActiveSessionId(null);
    router.push("/"); 
  };

  const handleRemoveFile = () => {
    setFileContext(null);
    setFileName(null);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // We let `append` handle the AI state internally
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
    <div className="flex flex-col h-screen pt-24 sm:pt-32 md:pt-36 overflow-hidden max-w-5xl mx-auto w-full relative">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />

      {/* NEW CHAT BUTTON */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-10 z-50">
        <button 
          onClick={handleNewChat}
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 shadow-lg"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {messages.length === 0 && (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1]">
          <Spotlight />
        </div>
      )}

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto pb-4 px-3 sm:px-6 scroll-smooth no-scrollbar w-full">
        {messages.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center mt-[-5vh]">
             <div className="relative z-10 w-full flex flex-col items-center">
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-center tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-neutral-50 to-neutral-500">
                Dynamic Dash
              </h1>
              <p className="mt-4 sm:mt-6 font-medium text-[13px] sm:text-[15px] text-zinc-400 max-w-[90%] sm:max-w-lg text-center mx-auto leading-relaxed tracking-wide">
                Talk to your data. <br className="hidden sm:block" />
                Instantly query databases, visualize complex metrics, and
                uncover hidden anomalies in real-time.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto w-full pt-4 sm:pt-8">
            <AnimatePresence mode="popLayout">
              {messages.map((m, index) => (
                <motion.div
                  key={m.id || `msg-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 sm:gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#09090b] border border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <Command size={12} className="text-zinc-400" strokeWidth={2} />
                    </div>
                  )}
                  
                  <div className={`text-[15px] sm:text-[16px] leading-relaxed max-w-[92%] sm:max-w-[85%] md:max-w-[80%] overflow-hidden ${
                      m.role === "user"
                        ? "bg-zinc-800/80 text-zinc-100 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl rounded-tr-sm border border-white/5 shadow-md"
                        : "text-zinc-300 py-1"
                    }`}
                  >
                    {m.role === "user" ? (
                      <p className="wrap-break-word">{m.content}</p>
                    ) : (
                      <>
                        <ReactMarkdown
                          components={{
                            p: ({node, ...props}) => <p className="mb-4 sm:mb-5 last:mb-0 leading-relaxed wrap-break-word" {...props} />,
                            strong: ({node, ...props}) => <span className="font-semibold text-zinc-100" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 sm:pl-5 mb-4 sm:mb-5 space-y-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 sm:pl-5 mb-4 sm:mb-5 space-y-2" {...props} />,
                            li: ({node, ...props}) => <li className="marker:text-zinc-500 pl-1" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg sm:text-xl font-semibold text-zinc-100 mt-6 sm:mt-8 mb-3 sm:mb-4 tracking-tight" {...props} />,
                            h4: ({node, ...props}) => <h4 className="text-base sm:text-lg font-medium text-zinc-200 mt-5 sm:mt-6 mb-2 sm:mb-3" {...props} />,
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>

                        {m.toolInvocations && m.toolInvocations.map((toolInvocation: any) => {
                          const toolCallId = toolInvocation.toolCallId;
                          if (toolInvocation.toolName === 'render_chart') {
                            return (
                              <div key={toolCallId} className="w-full mt-4 sm:mt-6 overflow-x-auto no-scrollbar">
                                <div className="min-w-70 sm:min-w-100">
                                  <ChartDisplay 
                                    data={toolInvocation.args.data} 
                                    config={toolInvocation.args.config} 
                                  />
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <User size={12} className="text-zinc-400" strokeWidth={2} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 sm:gap-4 justify-start">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#09090b] border border-white/10 flex items-center justify-center shrink-0">
                     <Command size={12} className="text-zinc-400 animate-pulse" />
                  </div>
                  <div className="text-zinc-500 text-[13px] sm:text-sm py-1 animate-pulse">Analyzing data...</div>
               </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="shrink-0 pb-4 sm:pb-6 pt-2 sm:pt-4 px-3 sm:px-0 relative z-20 bg-[#09090b]">
        <div className="max-w-3xl mx-auto relative">
          
          <AnimatePresence>
            {fileName && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute -top-10 sm:-top-12 left-1 sm:left-14 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-zinc-800/90 backdrop-blur-md border border-zinc-700/50 rounded-lg text-[11px] sm:text-xs text-zinc-300 shadow-lg"
              >
                <FileText size={12} className="text-emerald-400 sm:w-3.5 sm:h-3.5" />
                <span className="max-w-30 sm:max-w-50 truncate font-medium">{fileName}</span>
                <button 
                  onClick={handleRemoveFile} 
                  className="hover:text-red-400 ml-1 transition-colors border-l border-zinc-700 pl-1.5 sm:pl-2"
                >
                  <X size={12} className="sm:w-3.5 sm:h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`h-10 w-10 sm:h-12 sm:w-12 shrink-0 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-all duration-200 shadow-sm border border-white/5 ${isUploading ? "animate-pulse cursor-wait" : ""}`}
            >
              <Paperclip size={18} className="sm:w-5 sm:h-5" strokeWidth={1.5} />
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
                className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-all duration-200 shadow-sm border border-white/5"
            >
                <RefreshCw size={16} className="sm:w-4.5 sm:h-4.5" strokeWidth={1.5} />
            </button>
          </div>
          
          <div className="flex justify-center mt-2 sm:mt-3 gap-3 sm:gap-4 text-[9px] sm:text-[11px] font-medium text-zinc-600 tracking-wider">
            <span>DYNAMIC DASH</span>
            <span className="text-zinc-800">•</span>
            <span>ENTERPRISE SECURE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Next.js requires any component using 'useSearchParams' to be wrapped in a Suspense boundary
export default function Dashboard() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#0d0d12] text-zinc-500">Loading Workspace...</div>}>
      <ChatDashboard />
    </Suspense>
  );
}