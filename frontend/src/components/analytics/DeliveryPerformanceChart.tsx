import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS, CustomTooltip } from './ChartTheme';
import { analyticsApi } from '../../services/analyticsApi';

export default function DeliveryPerformanceChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsApi.getDeliveryPerformance().then(setData);
  }, []);

  return (
    <div className="glass-panel-glow p-5 h-[300px] flex flex-col">
      <h3 className="text-lg font-bold text-white tracking-widest mb-4">DELIVERY PERFORMANCE</h3>
      
      <div className="flex-1 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOnTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.safe} stopOpacity={0.5}/>
                  <stop offset="95%" stopColor={COLORS.safe} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDelayed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.risk} stopOpacity={0.5}/>
                  <stop offset="95%" stopColor={COLORS.risk} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="day" stroke={COLORS.textMuted} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={COLORS.textMuted} fontSize={12} tickLine={false} axisLine={false} />
              
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const total = payload.reduce((acc, curr) => acc + (curr.value as number), 0);
                    return (
                      <CustomTooltip 
                        active={active} 
                        title={`PERFORMANCE: ${label}`}
                        renderContent={() => (
                          <div className="min-w-[150px]">
                            <div className="text-xs text-gray-400 mb-2 border-b border-white/10 pb-2">
                              Total Deliveries: <span className="text-white font-bold">{total}</span>
                            </div>
                            {payload.map((entry, index) => (
                              <div key={index} className="flex justify-between items-center mt-1">
                                <span className="text-gray-300 text-xs">{entry.name}</span>
                                <span className="font-bold text-sm" style={{ color: entry.color }}>{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                    );
                  }
                  return null;
                }} 
              />
              
              <Area type="monotone" dataKey="onTime" name="On Time" stroke={COLORS.safe} fillOpacity={1} fill="url(#colorOnTime)" />
              <Area type="monotone" dataKey="delayed" name="Delayed" stroke={COLORS.risk} fillOpacity={1} fill="url(#colorDelayed)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-cyan-400">LOADING DATA...</div>
        )}
      </div>
    </div>
  );
}
