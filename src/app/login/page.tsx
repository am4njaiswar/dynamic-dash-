"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight-new";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log in");
      }

      // Success! Secure cookie is set, send them to the workspace
      router.push("/");
      router.refresh(); // Forces Next.js to update the Navbar state
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden px-4 bg-[#09090b]">
      <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1]">
        <Spotlight />
      </div>

      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">Welcome back</h1>
          <p className="text-sm text-zinc-400">Log in to your Dynamic Dash workspace.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#09090b] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#09090b] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-semibold py-3 rounded-xl transition-all mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Log In"}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-zinc-200 hover:text-white font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}