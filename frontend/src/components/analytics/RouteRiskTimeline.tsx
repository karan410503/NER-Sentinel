import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import { COLORS, CustomTooltip } from './ChartTheme';
import { analyticsApi } from '../../services/analyticsApi';
import { AlertTriangle } from 'lucide-react';

export default function RouteRiskTimeline() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await analyticsApi.getRouteRiskForecast();
      setData(result);
    };
    fetchData();

    // Simulate live data updates
    const interval = setInterval(() => {
      setData(prev => {
        if (!prev.length) return prev;
        const newData = [...prev];
        // subtly change the 'Now' risk to simulate live updates
        newData[0] = { ...newData[0], risk: Math.max(10, Math.min(100, newData[0].risk + (Math.random() * 4 - 2))) };
        return newData;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const highRiskThreshold = 75;

  return (
    <div className="glass-panel-glow p-5 h-[350px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-widest flex items-center gap-2">
            ROUTE RISK FORECAST
          </h3>
          <p className="text-xs text-gray-400">AI-predicted risk percentage over the next 12 hours</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            LIVE MODEL
          </span>
        </div>
      </div>
      
      <div className="flex-1 w-full relative">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.risk} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.risk} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="time" stroke={COLORS.textMuted} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={COLORS.textMuted} fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
              
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <CustomTooltip 
                        active={active} 
                        title={`ROUTE RISK: ${label}`}
                        renderContent={() => (
                          <div className="min-w-[180px]">
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-300">Risk Score</span>
                              <span className="font-bold text-orange-400">{Math.round(data.risk)}% {data.riskLevel}</span>
                            </div>
                            <div className="border-t border-white/10 pt-2 mt-2 text-xs text-gray-400">
                              <p className="mb-1 text-cyan-400">Primary Factor:</p>
                              <p>{data.factor}</p>
                            </div>
                          </div>
                        )}
                      />
                    );
                  }
                  return null;
                }} 
              />
              
              <ReferenceLine y={highRiskThreshold} stroke={COLORS.critical} strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'HIGH RISK THRESHOLD', fill: COLORS.critical, fontSize: 10 }} />
              
              <Area type="monotone" dataKey="risk" stroke={COLORS.risk} strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" animationDuration={1000} />
              
              {data.map((entry, index) => (
                entry.risk >= highRiskThreshold ? (
                  <ReferenceDot key={index} x={entry.time} y={entry.risk} r={5} fill={COLORS.critical} stroke="white">
                     <svg x="-10" y="-10" width="20" height="20">
                      <title>Warning</title>
                     </svg>
                  </ReferenceDot>
                ) : null
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-cyan-400 animate-pulse">ANALYZING DATA...</div>
        )}
      </div>
    </div>
  );
}
