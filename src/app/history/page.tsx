import { MessageSquare, Clock, Search, ChevronRight } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight-new";
import Link from "next/link"; 
import { getSessionUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { ChatSession } from "@/models/ChatSessionSchema";

export const dynamic = "force-dynamic";

async function getHistorySessions(userId: string) {
  try {
    await dbConnect();
    
    const sessions = await ChatSession.find({ userId })
      .sort({ lastUpdated: -1 })
      .lean();
    
    return sessions.map((session: any) => ({
      ...session,
      _id: session._id.toString(),
      messages: session.messages || [],
    }));
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export default async function HistoryPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400 bg-[#09090b]">
        Please log in to view your history.
      </div>
    );
  }

  const sessions = await getHistorySessions(user.id);

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
            Review and resume your past analysis sessions.
          </p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder="Search session..." 
            className="w-full bg-zinc-900/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-3">
        {sessions.length > 0 ? (
          sessions.map((session: any) => {
            const totalMessages = session.messages?.length || 0;
            
            const firstUserMsg = session.messages?.find((m: any) => m.role === "user")?.content;
            const title = firstUserMsg 
              ? (firstUserMsg.length > 60 ? firstUserMsg.substring(0, 60) + "..." : firstUserMsg)
              : "Empty Session";
              
            const dateStr = new Date(session.lastUpdated || Date.now()).toLocaleDateString();

            return (
              <Link href={`/chat/?sessionId=${session._id}`} key={session._id}>
                <div className="group flex items-center justify-between p-4 sm:p-5 bg-zinc-900/40 hover:bg-zinc-800/60 backdrop-blur-sm border border-white/5 rounded-2xl cursor-pointer transition-all duration-200 shadow-sm mb-3">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-10 h-10 rounded-full bg-[#09090b] border border-white/5 flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-emerald-400 transition-colors">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h3 className="text-zinc-200 font-medium text-sm sm:text-base mb-1">{title}</h3>
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-500">
                        <span>{dateStr}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                        <span>{totalMessages} messages</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-zinc-600 group-hover:text-zinc-300 transition-colors" size={20} />
                </div>
              </Link>
            );
          })
        ) : (
          <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
            No history found. Send a message to start analyzing!
          </div>
        )}
      </div>
    </div>
  );
}