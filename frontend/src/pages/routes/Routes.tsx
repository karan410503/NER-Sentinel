import { Route as RouteIcon, Map, Search, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface RouteData {
  id: string;
  dist: string;
  eta: string;
  risk: number;
  status: string;
  recommend: boolean;
}

export default function RoutesPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [priority, setPriority] = useState('Normal (Essential Supplies)');
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteData[]>([]);

  const generateRoutes = async () => {
    if (!origin || !destination) return;
    
    setLoading(true);
    setRoutes([]);
    try {
      const response = await fetch(`http://localhost:8000/api/predictions/eta?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&vehicle_type=Truck`);
      const data = await response.json();
      
      const newRoutes: RouteData[] = [
        { 
          id: 'A (AI Optimal)', 
          dist: '184 km', 
          eta: data.predictedEta || '4h 20m', 
          risk: data.confidenceScore ? 100 - data.confidenceScore : 18, 
          status: 'SAFE', 
          recommend: true 
        },
        { 
          id: 'B (Alternate)', 
          dist: '210 km', 
          eta: data.standardEta || '4h 52m', 
          risk: 45, 
          status: 'MODERATE RISK', 
          recommend: false 
        },
        { 
          id: 'C (Fastest)', 
          dist: '175 km', 
          eta: '3h 50m', 
          risk: 82, 
          status: 'HIGH RISK', 
          recommend: false 
        },
      ];
      setRoutes(newRoutes);
    } catch (error) {
      console.error("Failed to generate routes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Smart Route Planner</h2>
        <p className="text-sm text-gray-400 mt-1">AI-optimized routing prioritizing safety and road accessibility</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 space-y-6">
          <h3 className="font-bold text-lg border-b border-white/10 pb-3">Plan Delivery</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Origin</label>
              <input 
                type="text" 
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Guwahati Warehouse" 
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-ner-primary" 
              />
            </div>
            <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-[#0a0f1c] p-1 rounded-full border border-white/10"><ArrowRight className="w-4 h-4 text-gray-500 rotate-90" /></div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Destination</label>
              <input 
                type="text" 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Select destination district" 
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-ner-primary" 
              />
            </div>
            
            <div className="pt-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Cargo Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white"
              >
                <option>High (Medical/Emergency)</option>
                <option>Normal (Essential Supplies)</option>
                <option>Low (Standard Logistics)</option>
              </select>
            </div>
            
            <button 
              onClick={generateRoutes}
              disabled={loading || !origin || !destination}
              className="w-full bg-ner-primary text-black font-bold py-3 rounded-lg hover:bg-[#00b8d9] transition flex items-center justify-center mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />} 
              {loading ? 'Analyzing...' : 'Generate AI Routes'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg mb-2">Candidate Routes</h3>
          
          {routes.length === 0 && !loading && (
            <div className="glass-panel p-10 flex flex-col items-center justify-center text-gray-400">
              <Map className="w-12 h-12 mb-4 opacity-20" />
              <p>Enter origin and destination to generate AI routes.</p>
            </div>
          )}

          {loading && (
            <div className="glass-panel p-10 flex flex-col items-center justify-center text-ner-primary">
              <Loader2 className="w-10 h-10 mb-4 animate-spin" />
              <p className="font-medium">Calculating optimal paths...</p>
            </div>
          )}

          {routes.map(route => (
            <div key={route.id} className={`glass-panel p-5 relative overflow-hidden transition cursor-pointer hover:border-ner-primary/50 ${route.recommend ? 'border-ner-primary shadow-[0_0_15px_rgba(0,212,255,0.1)]' : 'border-white/10'}`}>
              {route.recommend && (
                <div className="absolute top-0 right-0 bg-ner-primary text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                  AI RECOMMENDED
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-4 ${route.recommend ? 'bg-ner-primary/20 text-ner-primary' : 'bg-white/5 text-gray-400'}`}>
                    {route.id.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-lg">Route {route.id}</h4>
                    <div className="flex space-x-4 text-sm mt-1">
                      <span className="text-gray-400">Distance: <span className="text-white font-mono">{route.dist}</span></span>
                      <span className="text-gray-400">ETA: <span className="text-white font-mono">{route.eta}</span></span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold font-mono ${route.risk > 50 ? 'text-red-400' : 'text-green-400'}`}>
                    {route.risk}% <span className="text-sm font-normal text-gray-400">Risk</span>
                  </div>
                  <span className={`text-xs font-bold uppercase ${route.risk > 50 ? 'text-red-400' : 'text-green-400'}`}>
                    {route.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
