import React from 'react';

export const COLORS = {
  safe: '#10b981', // green-500
  warning: '#f59e0b', // yellow-500
  risk: '#f97316', // orange-500
  critical: '#ef4444', // red-500
  cyan: '#00d4ff',
  darkCyan: '#06b6d4', // cyan-500
  blue: '#3b82f6', // blue-500
  purple: '#8b5cf6', // violet-500
  text: '#e5e7eb', // gray-200
  textMuted: '#9ca3af', // gray-400
  grid: 'rgba(255,255,255,0.05)',
  panelBg: 'rgba(0,0,0,0.6)',
  border: 'rgba(255,255,255,0.1)'
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  title?: string;
  renderContent?: (payload: any[], label: string) => React.ReactNode;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, title, renderContent }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0f1c]/90 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-4 shadow-[0_0_20px_rgba(0,212,255,0.2)] text-sm">
        {title && <div className="text-cyan-400 font-bold mb-2 tracking-wider text-xs border-b border-cyan-500/20 pb-2">{title}</div>}
        {label && !title && <div className="text-cyan-400 font-bold mb-2 tracking-wider text-xs border-b border-cyan-500/20 pb-2">{label}</div>}
        {renderContent ? (
          renderContent(payload, label || '')
        ) : (
          <div className="space-y-1 mt-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex justify-between items-center gap-4">
                <span className="text-gray-300">{entry.name}</span>
                <span className="font-mono font-bold" style={{ color: entry.color || COLORS.text }}>
                  {entry.value}{entry.unit || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};
