import React from 'react';
import { Truck, Package, AlertTriangle, Route as RouteIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface KpiProps {
  label: string;
  value: string;
  trendDir: 'up' | 'down';
  trendVal: string;
  icon: any;
  color: string;
  bg: string;
  sparklineData: number[];
}

const KpiCard: React.FC<KpiProps> = ({ label, value, trendDir, trendVal, icon: Icon, color, bg, sparklineData }) => {
  const chartData = sparklineData.map((val, i) => ({ i, val }));
  const TrendIcon = trendDir === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trendDir === 'up' ? 'text-green-400' : 'text-red-400';

  return (
    <div className="glass-panel-glow p-5 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full ${bg} blur-2xl group-hover:bg-opacity-30 transition-all duration-500`}></div>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white">{value}</h3>
            <span className={`flex items-center text-xs font-bold ${trendColor}`}>
              <TrendIcon className="w-3 h-3 mr-1" />
              {trendVal}
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-lg bg-black/40 border border-white/5 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {/* Mini Sparkline */}
      <div className="h-8 mt-4 w-full relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="val" stroke={color.replace('text-', '').replace('-400', '') === 'blue' ? '#3b82f6' : color.replace('text-', '').replace('-400', '') === 'green' ? '#10b981' : color.replace('text-', '').replace('-400', '') === 'red' ? '#ef4444' : color.replace('text-', '').replace('-400', '') === 'orange' ? '#f97316' : '#00d4ff'} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function KpiCards() {
  const kpis = [
    { 
      label: 'ACTIVE VEHICLES', 
      value: '102', 
      trendDir: 'up' as const, 
      trendVal: '8%', 
      icon: Truck, 
      color: 'text-blue-400', 
      bg: 'bg-blue-400/20',
      sparklineData: [40, 45, 60, 50, 80, 90, 102]
    },
    { 
      label: 'ACTIVE DELIVERIES', 
      value: '47', 
      trendDir: 'up' as const, 
      trendVal: '12%', 
      icon: Package, 
      color: 'text-green-400', 
      bg: 'bg-green-400/20',
      sparklineData: [20, 22, 30, 28, 35, 40, 47]
    },
    { 
      label: 'BLOCKED ROADS', 
      value: '08', 
      trendDir: 'down' as const, 
      trendVal: '2', 
      icon: AlertTriangle, 
      color: 'text-red-400', 
      bg: 'bg-red-400/20',
      sparklineData: [15, 12, 10, 11, 9, 8, 8]
    },
    { 
      label: 'HIGH-RISK ROUTES', 
      value: '14', 
      trendDir: 'up' as const, 
      trendVal: '5', 
      icon: RouteIcon, 
      color: 'text-orange-400', 
      bg: 'bg-orange-400/20',
      sparklineData: [5, 6, 8, 10, 9, 12, 14]
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => (
        <KpiCard key={idx} {...kpi} />
      ))}
    </div>
  );
}
