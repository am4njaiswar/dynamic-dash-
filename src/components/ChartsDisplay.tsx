import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Download } from 'lucide-react';
import { useRef } from 'react';

export interface ChartProps {
  data: any[];
  config: {
    type: 'bar' | 'line' | 'area' | 'pie';
    xAxisKey: string;
    yAxisKey: string;
    title?: string;
  };
}

const COLORS = ['#34d399', '#3b82f6', '#f43f5e', '#fbbf24', '#a855f7', '#06b6d4'];

export default function ChartDisplay({ data, config }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700/50 p-3 rounded-lg shadow-xl z-50">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">
            {label || payload[0].name}
          </p>
          <p className="text-emerald-400 font-semibold text-lg">
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleDownload = () => {
    const chartNode = chartRef.current;
    if (!chartNode) return;

    const svgElement = chartNode.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const width = svgElement.clientWidth || 600;
    const height = svgElement.clientHeight || 300;

    canvas.width = width * 2;
    canvas.height = height * 2;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#09090b'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0, width, height);

        const a = document.createElement('a');
        const safeTitle = config.title ? config.title.replace(/\s+/g, '_').toLowerCase() : 'dynamic_dash_chart';
        a.download = `${safeTitle}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const renderChart = () => {
    switch (config.type) {
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey={config.xAxisKey} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value / 1000) + 'k' : value}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey={config.yAxisKey} stroke="#34d399" fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60} 
              outerRadius={100}
              paddingAngle={5}
              dataKey={config.yAxisKey}
              nameKey={config.xAxisKey}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
          </PieChart>
        );

      case 'line':
        return (
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey={config.xAxisKey} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value / 1000) + 'k' : value}`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey={config.yAxisKey} stroke="#34d399" strokeWidth={3} dot={{ fill: '#09090b', stroke: '#34d399', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#34d399', stroke: '#09090b' }} />
          </LineChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey={config.xAxisKey} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value / 1000) + 'k' : value}`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
            <Bar dataKey={config.yAxisKey} fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full bg-[#09090b] border border-white/5 rounded-2xl p-4 sm:p-6 shadow-md my-4 relative group">
      
      <div className="flex justify-between items-center mb-6">
        {config.title ? (
          <h3 className="text-zinc-100 font-medium text-sm md:text-base tracking-wide">
            {config.title}
          </h3>
        ) : <div />}

        <button
          onClick={handleDownload}
          className="p-2 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-600 focus:outline-none"
          title="Download chart as PNG"
        >
          <Download size={16} />
        </button>
      </div>

      <div ref={chartRef} className="w-full h-75">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}