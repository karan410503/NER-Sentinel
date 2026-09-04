import React, { useEffect, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { COLORS, CustomTooltip } from './ChartTheme';
import { analyticsApi } from '../../services/analyticsApi';

export default function WeatherImpactScatter() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsApi.getWeatherImpact().then(setData);
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'Critical') return COLORS.critical;
    if (status === 'Warning') return COLORS.warning;
    return COLORS.blue;
  };

  return (
    <div className="glass-panel-glow p-5 h-[300px] flex flex-col">
      <h3 className="text-lg font-bold text-white tracking-widest mb-4">WEATHER IMPACT</h3>
      
      <div className="flex-1 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              <XAxis 
                type="number" 
                dataKey="rainfall" 
                name="Rainfall" 
                unit="mm" 
                stroke={COLORS.textMuted} 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                type="number" 
                dataKey="risk" 
                name="Risk" 
                unit="%" 
                stroke={COLORS.textMuted} 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <CustomTooltip 
                        active={active} 
                        title={`OBSERVATION`}
                        renderContent={() => (
                          <div className="space-y-1 min-w-[120px]">
                            <div className="text-cyan-400 font-bold mb-2">{data.route}</div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Rainfall:</span>
                              <span className="text-white">{data.rainfall} mm</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Risk:</span>
                              <span className="text-white">{data.risk}%</span>
                            </div>
                            <div className="mt-2 text-xs" style={{ color: getStatusColor(data.status) }}>
                              Status: {data.status}
                            </div>
                          </div>
                        )}
                      />
                    );
                  }
                  return null;
                }}
              />
              
              <Scatter name="Observations" data={data}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-cyan-400">LOADING DATA...</div>
        )}
      </div>
    </div>
  );
}
