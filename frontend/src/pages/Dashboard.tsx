import { Truck, Package, AlertTriangle, Route as RouteIcon, Map, Bell } from 'lucide-react';
import NERMap from '../components/map/NERMap';

const stats = [
  { label: 'ACTIVE VEHICLES', value: '128', icon: Truck, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { label: 'ACTIVE DELIVERIES', value: '342', icon: Package, color: 'text-green-400', bg: 'bg-green-400/10' },
  { label: 'BLOCKED ROADS', value: '17', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10' },
  { label: 'HIGH-RISK ROUTES', value: '26', icon: RouteIcon, color: 'text-orange-400', bg: 'bg-orange-400/10' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Logistics Command Center</h2>
          <p className="text-sm text-gray-400 mt-1">Real-time overview of NER logistics and accessibility</p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Local Time</div>
          <div className="text-lg font-mono text-ner-primary">19:02:45 IST</div>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel p-5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full ${stat.bg} blur-2xl group-hover:bg-opacity-20 transition-all`}></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold text-gray-400 tracking-wider mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-lg bg-black/40 border border-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map Placeholder */}
        <div className="lg:col-span-2 glass-panel p-1 flex flex-col min-h-[400px]">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-medium">Live NER Map</h3>
            <div className="flex items-center space-x-2 text-xs">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Open</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span> Restricted</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-1"></span> High Risk</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Blocked</span>
            </div>
          </div>
          <div className="flex-1 bg-black/50 rounded-b-lg flex items-center justify-center relative overflow-hidden">
            <NERMap />
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <div className="glass-panel p-5">
            <h3 className="font-medium mb-4 flex items-center text-orange-400">
              <RouteIcon className="w-4 h-4 mr-2" /> High-Risk Corridors
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Corridor A (NH-37)', risk: 87, trend: 'up' },
                { name: 'Corridor B (NH-06)', risk: 74, trend: 'up' },
                { name: 'Corridor C (NH-29)', risk: 68, trend: 'down' },
              ].map((corridor, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{corridor.name}</span>
                    <span className="font-mono text-orange-400">{corridor.risk}% Risk</span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1.5 border border-white/5">
                    <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${corridor.risk}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="font-medium mb-4 flex items-center text-red-400">
              <Bell className="w-4 h-4 mr-2" /> Critical Alerts
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 mr-2 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-400">NH-102 BLOCKED</h4>
                    <p className="text-xs text-gray-400 mt-1">Landslide reported at 14:32. 4 vehicles affected.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 mr-2 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-orange-400">Heavy Rainfall Warning</h4>
                    <p className="text-xs text-gray-400 mt-1">Expected in East Siang district next 3 hours.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start">
                  <Package className="w-4 h-4 text-yellow-400 mt-0.5 mr-2 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-400">Delivery Delayed</h4>
                    <p className="text-xs text-gray-400 mt-1">Medicine delivery delayed by 46 minutes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
