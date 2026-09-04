import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS, CustomTooltip } from './ChartTheme';
import { analyticsApi } from '../../services/analyticsApi';

export default function IncidentActivityChart() {
  const [data, setData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    analyticsApi.getIncidentActivity().then(setData);
  }, [timeRange]);

  return (
    <div className="glass-panel-glow p-5 h-[300px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white tracking-widest">INCIDENT ACTIVITY</h3>
        <div className="flex gap-2">
          {['Today', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                timeRange === range
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                  : 'border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="date" stroke={COLORS.textMuted} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={COLORS.textMuted} fontSize={12} tickLine={false} axisLine={false} />
              
              <Tooltip content={<CustomTooltip title="INCIDENTS" />} />
              
              <Area type="monotone" dataKey="traffic" stackId="1" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.4} />
              <Area type="monotone" dataKey="roadDamage" stackId="1" stroke={COLORS.warning} fill={COLORS.warning} fillOpacity={0.5} />
              <Area type="monotone" dataKey="flood" stackId="1" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.6} />
              <Area type="monotone" dataKey="landslide" stackId="1" stroke={COLORS.critical} fill={COLORS.critical} fillOpacity={0.7} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-cyan-400">LOADING DATA...</div>
        )}
      </div>
    </div>
  );
}
