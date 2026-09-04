import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { COLORS, CustomTooltip } from './ChartTheme';
import { analyticsApi } from '../../services/analyticsApi';

export default function AIRiskFactorsRadar() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    analyticsApi.getAiRiskFactors().then(setData);
  }, []);

  return (
    <div className="glass-panel-glow p-5 h-[300px] flex flex-col">
      <h3 className="text-lg font-bold text-white tracking-widest mb-2 text-right">AI RISK FACTORS</h3>
      
      <div className="flex-1 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke={COLORS.grid} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: COLORS.textMuted, fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              
              <Tooltip 
                content={<CustomTooltip title="RISK FACTOR" />}
              />
              
              <Radar
                name="Risk %"
                dataKey="A"
                stroke={COLORS.cyan}
                fill={COLORS.darkCyan}
                fillOpacity={0.4}
                animationDuration={1500}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-cyan-400">ANALYZING FACTORS...</div>
        )}
      </div>
    </div>
  );
}
