import { BarChart3, TrendingUp, Database, FileText, Activity } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight-new";
import { getSessionUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { ChatSession } from "@/models/ChatSessionSchema"; // Make sure this path matches your project!

export const dynamic = "force-dynamic";

// 1. Talk DIRECTLY to the database instead of using fetch()
async function getWorkspaceStats(userId: string) {
  try {
    await dbConnect();
    
    // Fetch ALL sessions strictly belonging to the authenticated user
    const sessions = await ChatSession.find({ userId: userId });

    let userQueries = 0;
    let aiInsights = 0;

    sessions.forEach(session => {
      if (session.messages && Array.isArray(session.messages)) {
        userQueries += session.messages.filter((m: any) => m.role === "user").length;
        aiInsights += session.messages.filter((m: any) => m.role === "assistant").length;
      }
    });

    return {
      totalFiles: 0,
      queriesExecuted: userQueries,
      insightsGenerated: aiInsights,
      activeDatabases: 0
    };
  } catch (error) {
    console.error("Database Error:", error);
    return { totalFiles: 0, queriesExecuted: 0, insightsGenerated: 0, activeDatabases: 0 };
  }
}

export default async function AnalyticsPage() {
  // 2. Get the currently logged-in user securely
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400 bg-[#09090b]">
        Please log in to view your analytics.
      </div>
    );
  }

  // 3. Fetch stats bypassing the HTTP layer entirely
  const data = await getWorkspaceStats(user.id);

  const stats = [
    { label: "Active Files Analyzed", value: data.totalFiles, icon: FileText, color: "text-blue-400" },
    { label: "Queries Executed", value: data.queriesExecuted, icon: Database, color: "text-emerald-400" },
    { label: "Insights Generated", value: data.insightsGenerated, icon: Activity, color: "text-purple-400" },
    { label: "Active Databases", value: data.activeDatabases, icon: BarChart3, color: "text-amber-400" },
  ];

  return (
    <div className="flex flex-col min-h-screen pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full relative">
      <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1]">
        <Spotlight />
      </div>

      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
          <TrendingUp className="text-emerald-400" size={32} />
          {user.name}&apos;s Workspace Analytics
        </h1>
        <p className="text-zinc-400 mt-2 text-sm sm:text-base">
          Monitor your data usage and AI interactions in real-time.
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-lg hover:bg-zinc-800/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-[#09090b] border border-white/5 shadow-inner ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <h3 className="text-zinc-400 text-sm font-medium tracking-wide mb-1">{stat.label}</h3>
            <p className="text-3xl font-bold text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </div>
      
      {/* MACRO CHARTS PLACEHOLDER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl h-100 flex flex-col justify-center items-center text-zinc-500 shadow-lg">
          <BarChart3 size={48} className="mb-4 opacity-20" />
          <p>Query Volume Trend (Data connected)</p>
        </div>
        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl h-100 flex flex-col justify-center items-center text-zinc-500 shadow-lg">
          <Activity size={48} className="mb-4 opacity-20" />
          <p>Data Sources Overview</p>
        </div>
      </div>
    </div>
  );
}