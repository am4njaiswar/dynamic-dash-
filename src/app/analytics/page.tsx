"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Database, FileText, Activity, Loader2 } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight-new";

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    queriesExecuted: 0,
    insightsGenerated: 0,
    activeDatabases: 0,
    dbQueriesRun: 0,
  });
  
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // 1. Fetch the securely logged-in user
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();
        
        if (!authData.user) {
          setLoading(false);
          return;
        }
        setUser(authData.user);

        // 2. Fetch their actual chat history
        const histRes = await fetch(`/api/history?userId=${authData.user.id}`);
        const sessions = await histRes.json();

        // 3. Check local browser memory for active connections
        const activeDB = sessionStorage.getItem("userLiveDB") ? 1 : 0;
        
        // 4. Crunch the numbers dynamically
        let userQueries = 0;
        let aiInsights = 0;
        let dbToolsUsed = 0;
        const activityByDate: Record<string, number> = {};

        sessions.forEach((session: any) => {
          // Use the session date to build the trend chart
          const dateObj = new Date(session.lastUpdated || session.createdAt || Date.now());
          const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          if (!activityByDate[dateStr]) activityByDate[dateStr] = 0;

          if (session.messages && Array.isArray(session.messages)) {
            // Add total messages to that specific day
            activityByDate[dateStr] += session.messages.length;

            session.messages.forEach((m: any) => {
              if (m.role === "user") userQueries++;
              if (m.role === "assistant") {
                aiInsights++;
                
                // Track exactly how many times the AI queried the live database
                if (m.toolInvocations) {
                  m.toolInvocations.forEach((tool: any) => {
                    if (tool.toolName === 'query_database') dbToolsUsed++;
                  });
                }
              }
            });
          }
        });

        // Format data for the chart
        const formattedChartData = Object.entries(activityByDate).map(([date, count]) => ({
          date,
          count: Number(count)
        }));

        setStats({
          queriesExecuted: userQueries,
          insightsGenerated: aiInsights,
          activeDatabases: activeDB,
          dbQueriesRun: dbToolsUsed
        });
        
        setChartData(formattedChartData);

      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-zinc-400 bg-[#09090b] gap-4">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
        <p>Loading your workspace analytics...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400 bg-[#09090b]">
        Please log in to view your analytics.
      </div>
    );
  }

  // Calculate the highest activity day so we can scale the chart bars dynamically
  const maxActivity = Math.max(...chartData.map(d => d.count), 1);

  const displayStats = [
    { label: "Active Databases", value: stats.activeDatabases, icon: Database, color: "text-amber-400" },
    { label: "Queries Executed", value: stats.queriesExecuted, icon: FileText, color: "text-blue-400" },
    { label: "Insights Generated", value: stats.insightsGenerated, icon: Activity, color: "text-purple-400" },
    { label: "Live DB Queries Run", value: stats.dbQueriesRun, icon: BarChart3, color: "text-emerald-400" },
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

      {/* DYNAMIC STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        {displayStats.map((stat, i) => (
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
      
      {/* MACRO CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Activity Trend Chart */}
        <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex flex-col shadow-lg min-h-[300px]">
          <h3 className="text-zinc-300 font-semibold mb-6 flex items-center gap-2">
            <Activity size={18} className="text-emerald-400" />
            Query Volume Trend
          </h3>
          
          {chartData.length > 0 ? (
            <div className="flex-1 flex items-end gap-3 sm:gap-6 pt-4 mt-auto">
              {chartData.map((data, idx) => {
                const heightPercentage = (data.count / maxActivity) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full relative flex justify-center items-end h-[150px]">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-xs px-2 py-1 rounded text-zinc-200 pointer-events-none">
                        {data.count}
                      </div>
                      {/* The Bar */}
                      <div 
                        className="w-full max-w-[40px] bg-emerald-400/80 hover:bg-emerald-400 rounded-t-sm transition-all duration-500"
                        style={{ height: `${heightPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">{data.date}</span>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
               <BarChart3 size={32} className="mb-2 opacity-50" />
               <p className="text-sm">No activity data yet.</p>
             </div>
          )}
        </div>

        {/* System Health / Overview Card */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex flex-col shadow-lg min-h-[300px]">
          <h3 className="text-zinc-300 font-semibold mb-6 flex items-center gap-2">
            <Database size={18} className="text-blue-400" />
            System Status
          </h3>
          
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Frontend Connectivity</span>
              <span className="text-emerald-400 text-sm font-medium bg-emerald-400/10 px-2 py-1 rounded">Optimal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Live DB Status</span>
              {stats.activeDatabases > 0 ? (
                 <span className="text-emerald-400 text-sm font-medium bg-emerald-400/10 px-2 py-1 rounded">Connected</span>
              ) : (
                 <span className="text-amber-400 text-sm font-medium bg-amber-400/10 px-2 py-1 rounded">Disconnected</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">AI Engine</span>
              <span className="text-emerald-400 text-sm font-medium bg-emerald-400/10 px-2 py-1 rounded">Online</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}