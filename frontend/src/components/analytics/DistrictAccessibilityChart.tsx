import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { COLORS, CustomTooltip } from './ChartTheme';
import { analyticsApi } from '../../services/analyticsApi';

export default function DistrictAccessibilityChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsApi.getDistrictAccessibility().then(setData);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return COLORS.safe;
      case 'warning': return COLORS.warning;
      case 'risk': return COLORS.risk;
      case 'critical': return COLORS.critical;
      default: return COLORS.blue;
    }
  };

  return (
    <div className="glass-panel-glow p-5 h-[300px] flex flex-col">
      <h3 className="text-lg font-bold text-white tracking-widest mb-4">DISTRICT ACCESSIBILITY</h3>
      
      <div className="flex-1 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} horizontal={false} />
              <XAxis type="number" stroke={COLORS.textMuted} fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <YAxis dataKey="district" type="category" stroke={COLORS.textMuted} fontSize={12} tickLine={false} axisLine={false} width={80} />
              
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <CustomTooltip 
                        active={active} 
                        title={`ACCESSIBILITY: ${data.district}`}
                        renderContent={() => (
                          <div>
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-gray-300">Score</span>
                              <span className="font-bold text-lg" style={{ color: getStatusColor(data.status) }}>{data.score}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                              Status: <span style={{ color: getStatusColor(data.status) }}>{data.status}</span>
                            </div>
                          </div>
                        )}
                      />
                    );
                  }
                  return null;
                }}
              />
              
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-cyan-400">LOADING DATA...</div>
        )}
      </div>
    </div>
  );
}
