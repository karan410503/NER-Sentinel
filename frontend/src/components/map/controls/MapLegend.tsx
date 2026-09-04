export default function MapLegend() {
  return (
    <div className="absolute bottom-6 left-6 z-[400] pointer-events-none">
      <div className="p-3 rounded-xl border border-white/10 bg-[#0a0f1c]/90 backdrop-blur-md shadow-xl flex gap-6 pointer-events-auto">
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-400 font-bold tracking-wider">ROADS</div>
          <div className="flex items-center gap-2"><div className="w-4 h-1 bg-[#10b981]"></div><span className="text-xs text-gray-300">Open</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-1 bg-[#f59e0b]"></div><span className="text-xs text-gray-300">High Risk</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-1 bg-[#ef4444]"></div><span className="text-xs text-gray-300">Blocked</span></div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-400 font-bold tracking-wider">INCIDENTS</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-white bg-[#ef4444]"></div><span className="text-xs text-gray-300">Critical</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-white bg-[#f97316]"></div><span className="text-xs text-gray-300">High</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-white bg-[#eab308]"></div><span className="text-xs text-gray-300">Moderate</span></div>
        </div>
      </div>
    </div>
  );
}
