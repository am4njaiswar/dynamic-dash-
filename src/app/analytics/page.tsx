import { BarChart3, TrendingUp, Database, FileText, Activity } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight-new";

// Helper function to hit your API route
async function fetchAnalytics(type: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
      cache: "no-store", // Ensures fresh data
    });
    
    if (!res.ok) throw new Error("Failed to fetch");
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    return null;
  }
}

export default async function AnalyticsPage() {
  // Fetch real data from the backend
  const [kpiSummary, topProducts] = await Promise.all([
    fetchAnalytics("kpi_summary"),
    fetchAnalytics("top_products"),
  ]);

  // Extract the data from the aggregation arrays
  const kpis = kpiSummary?.[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
  const topProduct = topProducts?.[0]?._id || "None yet";

  // Map the real data to your UI cards
  const stats = [
    { label: "Total Revenue", value: `$${kpis.totalRevenue.toLocaleString()}`, icon: FileText, color: "text-blue-400" },
    { label: "Total Orders", value: kpis.totalOrders.toLocaleString(), icon: Database, color: "text-emerald-400" },
    { label: "Avg Order Value", value: `$${Math.round(kpis.avgOrderValue).toLocaleString()}`, icon: Activity, color: "text-purple-400" },
    { label: "Top Product", value: topProduct, icon: BarChart3, color: "text-amber-400" },
  ];

  return (
    <div className="flex flex-col min-h-screen pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full relative">
      <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1]">
        <Spotlight />
      </div>

      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
          <TrendingUp className="text-emerald-400" size={32} />
          Workspace Analytics
        </h1>
        <p className="text-zinc-400 mt-2 text-sm sm:text-base">
          Monitor your actual database sales, order volume, and AI interactions.
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
            <p className="text-2xl sm:text-3xl font-bold text-zinc-100 truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* PLACEHOLDER FOR MACRO CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl h-[400px] flex flex-col justify-center items-center text-zinc-500 shadow-lg">
          <BarChart3 size={48} className="mb-4 opacity-20" />
          <p>Query Volume Trend (Connect Chart library to view daily_trend)</p>
        </div>
        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl h-[400px] flex flex-col justify-center items-center text-zinc-500 shadow-lg">
          <Activity size={48} className="mb-4 opacity-20" />
          <p>Data Sources Overview</p>
        </div>
      </div>
    </div>
  );
}