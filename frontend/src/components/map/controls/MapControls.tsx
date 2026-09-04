import { Layers, Map as MapIcon, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../../store';

export default function MapControls({ activeLayers, toggleLayer }: any) {
  const { emergencyMode, incidents, addIncident, removeIncident } = useAppStore();

  const handleDisaster = () => {
    const disasterId = 'demo-disaster-1';
    const exists = incidents.find(i => i.id === disasterId);
    
    if (exists) {
      removeIncident(disasterId);
    } else {
      addIncident({
        id: disasterId,
        type: 'Bridge Collapse / Landslide',
        severity: 'CRITICAL',
        location: [25.80, 91.80], // On the red route
        reported_by: 'Automated Drone',
        status: 'ACTIVE',
        time: new Date().toLocaleTimeString(),
        glowSize: 1.6
      });
    }
  };

  const hasDisaster = incidents.some(i => i.id === 'demo-disaster-1');

  return (
    <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
      <div className={`p-4 rounded-xl border backdrop-blur-md shadow-xl ${
        emergencyMode ? 'bg-black/80 border-red-500/50' : 'bg-[#0a0f1c]/90 border-white/10'
      }`}>
        <h3 className="text-white text-sm font-bold flex items-center mb-3">
          <Layers className="w-4 h-4 mr-2" /> LAYERS
        </h3>
        <div className="space-y-2">
          {Object.entries(activeLayers).map(([key, isActive]) => (
            <label key={key} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive as boolean}
                onChange={() => toggleLayer(key)}
                className={`rounded border-gray-600 focus:ring-0 ${
                  emergencyMode ? 'text-red-500' : 'text-ner-primary'
                }`}
              />
              <span className="text-sm text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            </label>
          ))}
        </div>
      </div>
      
      <button 
        onClick={handleDisaster}
        className={`p-3 mt-2 rounded-xl border shadow-xl transition-all duration-300 flex items-center justify-center font-bold text-sm ${
          hasDisaster 
            ? 'bg-red-600/90 border-red-400 text-white animate-pulse' 
            : 'bg-yellow-500/90 border-yellow-400 text-slate-900 hover:bg-yellow-400'
        }`}
      >
        <AlertTriangle className="w-5 h-5 mr-2" />
        {hasDisaster ? 'Clear Disaster' : 'Trigger Disaster'}
      </button>
    </div>
  );
}
