"use client";

import { Paperclip, RefreshCw, X, FileText } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Spotlight } from "@/components/ui/spotlight-new";

export default function LandingPage() {
  const router = useRouter();
  const [fileContext, setFileContext] = useState<any>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch {
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sessionStorage.setItem("dash_initial_prompt", inputValue);
    if (fileContext) {
      sessionStorage.setItem("dash_initial_file", JSON.stringify({ fileContext, fileName }));
    }
    router.push("/chat");
  };

  const placeholders = [
    "What is the revenue growth for Q3?",
    "Show me the top 5 performing products",
    "Analyze the user churn rate from last month",
    "Write a SQL query to fetch active users",
  ];

  return (
    <div className="relative flex flex-col h-[calc(100vh-64px)] overflow-hidden w-full max-w-5xl mx-auto px-3 sm:px-6">

      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <Spotlight />
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />

      {/* ── HERO ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center text-center translate-y-[4vh]">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-neutral-50 to-neutral-500">
            Dynamic Dash
          </h1>
          <p className="mt-4 sm:mt-6 font-medium text-[13px] sm:text-[15px] text-zinc-400 max-w-[90%] sm:max-w-lg leading-relaxed tracking-wide">
            Talk to your data. <br className="hidden sm:block" />
            Instantly query databases, visualize complex metrics, and uncover hidden anomalies in real-time.
          </p>
        </div>
      </div>

      {/* ── INPUT ── */}
      <div className="relative z-20 shrink-0 pb-0 pt-4">
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
                  onClick={() => { setFileContext(null); setFileName(null); }}
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
              className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 shadow-sm border border-white/5 opacity-50 cursor-not-allowed"
            >
              <RefreshCw size={16} className="sm:w-4.5 sm:h-4.5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex justify-center mt-3 mb-0 pb-1 gap-3 sm:gap-4 text-[9px] sm:text-[11px] font-medium text-zinc-600 tracking-wider">
            <span>DYNAMIC DASH</span>
            <span className="text-zinc-800">•</span>
            <span>ENTERPRISE SECURE</span>
          </div>
        </div>
      </div>
    </div>
  );
}