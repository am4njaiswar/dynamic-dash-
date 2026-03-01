"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ConnectDBModal({ isOpen, onClose }) {
  const [connectionString, setConnectionString] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  const handleConnect = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("Verifying credentials...");

    try {
      // 1. Validate the Connection
      const res = await fetch("/api/validate-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionString }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Connection failed.");
      }

      // 2. If valid, scan the schema
      setMessage("Analyzing database structure...");
      const analysisRes = await fetch("/api/analyze-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionString }),
      });

      const analysisData = await analysisRes.json();

      if (!analysisRes.ok) {
        throw new Error("Could not map database structure.");
      }

      // 3. Success! Save both the string and the schema to the browser
      setStatus("success");
      setMessage("Database connected & analyzed!");
      sessionStorage.setItem("userLiveDB", connectionString);
      sessionStorage.setItem("userDBSchema", JSON.stringify(analysisData.schema));
      
      setTimeout(() => {
        onClose();
        setStatus("idle");
        setConnectionString("");
      }, 1500);

    } catch (error) {
      setStatus("error");
      setMessage(error.message || "A network error occurred.");
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
      setConnectionString("");
    }, 300); // Wait for exit animation
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-lg bg-[#09090b]/90 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                <Database className="w-5 h-5 text-zinc-400" />
                Connect Live Data
              </div>
              <button
                onClick={handleClose}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
  Enter your MongoDB URI to visualize your data. Your credentials are never saved to our servers and vanish when you close the tab.
</p>
              
              <form onSubmit={handleConnect}>
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Connection String
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                      placeholder="e.g., mongodb+srv://..."
                      value={connectionString}
                      onChange={(e) => setConnectionString(e.target.value)}
                      disabled={status === "loading" || status === "success"}
                    />
                  </div>
                </div>
                
                {/* Dynamic Status Message */}
                <AnimatePresence mode="wait">
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, mt: 0 }}
                      animate={{ opacity: 1, height: "auto", mt: -8, mb: 24 }}
                      exit={{ opacity: 0, height: 0, mt: 0, mb: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${
                        status === "error" 
                          ? "bg-red-500/10 border-red-500/20 text-red-400" 
                          : "bg-green-500/10 border-green-500/20 text-green-400"
                      }`}>
                        {status === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        {message}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer / Actions */}
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === "loading" || status === "success" || !connectionString}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] min-w-32.5"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Testing...
                      </>
                    ) : status === "success" ? (
                      "Connected"
                    ) : (
                      "Connect DB"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}