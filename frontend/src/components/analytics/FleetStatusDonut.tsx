import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from './ChartTheme';
import { analyticsApi } from '../../services/analyticsApi';

export default function FleetStatusDonut() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsApi.getFleetStatus().then(setData);
  }, []);

  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="glass-panel-glow p-5 h-[300px] flex flex-col relative">
      <h3 className="text-lg font-bold text-white tracking-widest mb-4">FLEET STATUS</h3>
      
      <div className="flex-1 w-full relative">
        {data.length > 0 ? (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
              <span className="text-3xl font-bold text-white">{total}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Total Vehicles</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={<CustomTooltip />}
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-cyan-400">LOADING DATA...</div>
        )}
      </div>
    </div>
  );
}
