"use client";

import { useChat } from "@ai-sdk/react";
import { Paperclip, User, Command, RefreshCw, X, FileText } from "lucide-react";
import { useRef, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import ChartDisplay from "@/components/ChartsDisplay";

function ActiveChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("sessionId");

  const [activeSessionId, setActiveSessionId] = useState<string | null>(urlSessionId);
  const activeSessionIdRef = useRef(activeSessionId);

  const [fileContext, setFileContext] = useState<any>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const messagesRef = useRef<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // --- AI CHAT SETUP ---
  const { messages, isLoading, setMessages, append, reload } = useChat({
    body: { userId: "user_123", data: fileContext },
    onFinish: async (message) => {
      let fullHistory = [...messagesRef.current];
      if (!fullHistory.find(m => m.id === message.id)) {
        fullHistory.push(message);
      } else {
        fullHistory = fullHistory.map(m => m.id === message.id ? message : m);
      }

      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "user_123",
            sessionId: activeSessionIdRef.current, 
            messages: fullHistory, 
          }),
        });
        
        const savedSession = await res.json();
        if (!activeSessionIdRef.current && savedSession._id) {
          setActiveSessionId(savedSession._id);
          router.replace(`/chat?sessionId=${savedSession._id}`, { scroll: false });
        }
      } catch (error) {
        console.error("Failed to save history:", error);
      }
    },
  });

  // --- CATCH THE HANDOFF FROM HOME PAGE ---
  useEffect(() => {
    const initialPrompt = sessionStorage.getItem("dash_initial_prompt");
    const initialFileStr = sessionStorage.getItem("dash_initial_file");

    if (initialFileStr) {
      const parsed = JSON.parse(initialFileStr);
      setFileContext(parsed.fileContext);
      setFileName(parsed.fileName);
      sessionStorage.removeItem("dash_initial_file");
    }

    if (initialPrompt && !urlSessionId) {
      sessionStorage.removeItem("dash_initial_prompt");
      setTimeout(() => {
        append({ role: "user", content: initialPrompt });
      }, 100);
    }
  }, [append, urlSessionId]);

  useEffect(() => {
    messagesRef.current = messages;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- HISTORY LOADER ---
  useEffect(() => {
    const loadHistory = async () => {
      if (urlSessionId) {
        try {
          const res = await fetch(`/api/history?userId=user_123`);
          const allSessions = await res.json();
          const currentSession = allSessions.find((s: any) => s._id === urlSessionId);
          
          if (currentSession && currentSession.messages) {
            setMessages(currentSession.messages);
            setActiveSessionId(urlSessionId);
          }
        } catch (error) {
          console.error("Failed to load history:", error);
        }
      }
    };
    loadHistory();
  }, [urlSessionId, setMessages]);

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
        setFileName(data.fileName || file.name);
      }
    } catch (error) {
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    append({ role: "user", content: inputValue });
    setInputValue("");
    setTimeout(() => { setFileContext(null); setFileName(null); }, 150);
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-64px)] overflow-hidden w-full max-w-5xl mx-auto px-3 sm:px-6">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />

      <div className="flex-1 overflow-y-auto mt-20 sm:mt-24 pt-4 pb-4 scroll-smooth no-scrollbar w-full">
        <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto w-full">
          <AnimatePresence mode="popLayout">
            {messages.map((m, index) => (
              <motion.div
                key={m.id || `msg-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                                <ChartDisplay data={toolInvocation.args.data} config={toolInvocation.args.config} />
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
      </div>

      {/* INPUT AREA */}
      <div className="relative z-20 shrink-0 pb-0 pt-4">
        <div className="max-w-3xl mx-auto relative">
          <AnimatePresence>
            {fileName && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="absolute -top-10 sm:-top-12 left-1 sm:left-14 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-zinc-800/90 backdrop-blur-md border border-zinc-700/50 rounded-lg text-[11px] sm:text-xs text-zinc-300 shadow-lg"
              >
                <FileText size={12} className="text-emerald-400 sm:w-3.5 sm:h-3.5" />
                <span className="max-w-30 sm:max-w-50 truncate font-medium">{fileName}</span>
                <button onClick={() => { setFileContext(null); setFileName(null); }} className="hover:text-red-400 ml-1 transition-colors border-l border-zinc-700 pl-1.5 sm:pl-2">
                  <X size={12} className="sm:w-3.5 sm:h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <button
              type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
              className={`h-10 w-10 sm:h-12 sm:w-12 shrink-0 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-all duration-200 shadow-sm border border-white/5 ${isUploading ? "animate-pulse cursor-wait" : ""}`}
            >
              <Paperclip size={18} className="sm:w-5 sm:h-5" strokeWidth={1.5} />
            </button>

            <div className="flex-1 min-w-0">
              <PlaceholdersAndVanishInput placeholders={["Ask a follow up question..."]} onChange={(e) => setInputValue(e.target.value)} onSubmit={onSubmit} />
            </div>
            
            <button type="button" onClick={() => reload()} className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-all duration-200 shadow-sm border border-white/5">
                <RefreshCw size={16} className="sm:w-4.5 sm:h-4.5" strokeWidth={1.5} />
            </button>
          </div>
          
          <div className="flex justify-center mt-3 mb-0 pb-1 gap-3 sm:gap-4 text-[9px] sm:text-[11px] font-medium text-zinc-600 tracking-wider">
            <span>DYNAMIC DASH</span><span className="text-zinc-800">•</span><span>ENTERPRISE SECURE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#0d0d12] text-zinc-500">Loading Workspace...</div>}>
      <ActiveChatInterface />
    </Suspense>
  );
}