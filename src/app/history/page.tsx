import { MessageSquare, Clock, Search, ChevronRight } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight-new";

async function fetchHistory(userId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/history?userId=${userId}`, {
      cache: "no-store",
    });
    
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}

export default async function HistoryPage() {
  // Replace this later with your actual logged-in user's ID
  const currentUserId = "user_123"; 
  
  // Fetch real messages from your database
  const messages = await fetchHistory(currentUserId);
  const totalInteractions = Array.isArray(messages) ? messages.length : 0;

  // Map the single DB session to your UI format
  const pastSessions = totalInteractions > 0 ? [
    { 
      id: 1, 
      title: "Current Database Chat Session", 
      date: "Recently Updated", 
      messages: totalInteractions, 
      file: "connected_db" 
    }
  ] : [];

  return (
    <div className="flex flex-col min-h-screen pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full relative">
      <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1]">
        <Spotlight />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <Clock className="text-emerald-400" size={32} />
            Chat History
          </h1>
          <p className="text-zinc-400 mt-2 text-sm sm:text-base">
            Review and resume your past data analysis sessions.
          </p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder="Search past chats..." 
            className="w-full bg-zinc-900/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      {/* HISTORY LIST */}
      <div className="space-y-3">
        {pastSessions.length > 0 ? (
          pastSessions.map((session) => (
            <div 
              key={session.id} 
              className="group flex items-center justify-between p-4 sm:p-5 bg-zinc-900/40 hover:bg-zinc-800/60 backdrop-blur-sm border border-white/5 rounded-2xl cursor-pointer transition-all duration-200 shadow-sm"
            >
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-10 h-10 rounded-full bg-[#09090b] border border-white/5 flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-emerald-400 transition-colors">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="text-zinc-200 font-medium text-sm sm:text-base mb-1">{session.title}</h3>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-500">
                    <span>{session.date}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                    <span>{session.messages} interactions</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700 hidden sm:block"></span>
                    <span className="hidden sm:inline font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                      {session.file}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-zinc-600 group-hover:text-zinc-300 transition-colors" size={20} />
            </div>
          ))
        ) : (
          <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
            No history found. Connect a database and start a chat!
          </div>
        )}
      </div>
    </div>
  );
}