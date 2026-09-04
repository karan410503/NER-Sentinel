import { useAppStore } from '../../../store';
import { X, Route as RouteIcon, MapPin, Navigation, Clock, AlertTriangle } from 'lucide-react';
import React from 'react';

export default function RouteDetailsPanel() {
  const { routes, selectedRouteId, setSelectedRouteId } = useAppStore();
  
  if (!selectedRouteId) return null;
  
  const route = routes.find(r => r.id === selectedRouteId);
  if (!route) return null;

  function getRiskColorClass(score: number) {
    if (score < 30) return 'text-emerald-400';
    if (score < 60) return 'text-yellow-400';
    if (score < 80) return 'text-orange-400';
    return 'text-red-500';
  }

  function getRiskBgClass(score: number) {
    if (score < 30) return 'bg-emerald-400/20';
    if (score < 60) return 'bg-yellow-400/20';
    if (score < 80) return 'bg-orange-400/20';
    return 'bg-red-500/20';
  }

  return (
    <div className="absolute top-24 left-4 z-[1000] w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-left-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-white font-bold text-lg flex items-center">
          <RouteIcon className="w-5 h-5 mr-2 text-cyan-400" />
          Route Details
        </h3>
        <button 
          onClick={() => setSelectedRouteId(null)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-800/50 p-3 rounded-lg">
          <div className="flex items-center text-gray-300 text-sm mb-2">
            <MapPin className="w-4 h-4 mr-2 text-cyan-400" />
            <span className="font-semibold">{route.origin}</span>
          </div>
          <div className="pl-2 border-l-2 border-slate-700 ml-1.5 h-4 my-1"></div>
          <div className="flex items-center text-gray-300 text-sm mt-2">
            <MapPin className="w-4 h-4 mr-2 text-emerald-400" />
            <span className="font-semibold">{route.destination}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1 flex items-center">
              <Navigation className="w-3 h-3 mr-1" /> Distance
            </div>
            <div className="text-white font-mono">{route.distance_km.toFixed(1)} km</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1 flex items-center">
              <Clock className="w-3 h-3 mr-1" /> Duration
            </div>
            <div className="text-white font-mono">
              {Math.floor(route.estimated_time_minutes / 60)}h {Math.floor(route.estimated_time_minutes % 60)}m
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-lg border ${getRiskColorClass(route.risk_score).replace('text-', 'border-')} ${getRiskBgClass(route.risk_score)}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" /> Risk Score
            </div>
            <div className={`font-mono font-bold text-xl ${getRiskColorClass(route.risk_score)}`}>
              {route.risk_score.toFixed(0)} <span className="text-sm">{route.risk_level}</span>
            </div>
          </div>
          
          <div className="space-y-1 mt-3">
            <div className="text-xs text-gray-400 mb-1">Risk Factors:</div>
            {Object.entries(route.factors || {}).map(([key, val]) => (
              <div key={key} className="flex justify-between text-xs text-gray-300">
                <span>{key}</span>
                <span className="font-mono text-white">{val}</span>
              </div>
            ))}
            {route.weather_risk > 0 && (
              <div className="flex justify-between text-xs text-gray-300">
                <span>Weather Risk</span>
                <span className="font-mono text-yellow-400">+{route.weather_risk.toFixed(1)}</span>
              </div>
            )}
            {route.news_risk > 0 && (
              <div className="flex justify-between text-xs text-gray-300">
                <span>News Disruptions</span>
                <span className="font-mono text-orange-400">+{route.news_risk.toFixed(1)}</span>
              </div>
            )}
            {route.disaster_risk > 0 && (
              <div className="flex justify-between text-xs text-gray-300">
                <span>Disaster Proximity</span>
                <span className="font-mono text-red-400">+{route.disaster_risk.toFixed(1)}</span>
              </div>
            )}
            {route.delay_minutes > 0 && (
              <div className="flex justify-between text-xs text-gray-300">
                <span>Delay</span>
                <span className="font-mono text-orange-400">{route.delay_minutes} min</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
