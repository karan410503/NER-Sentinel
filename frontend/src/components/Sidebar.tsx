import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Map, Truck, Route, Package, 
  AlertTriangle, BrainCircuit, BarChart3, Bell, ShieldAlert, Settings 
} from 'lucide-react';
import { useAppStore } from '../store';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/map', label: 'Live Map', icon: Map },
  { path: '/vehicles', label: 'Vehicles', icon: Truck },
  { path: '/routes', label: 'Routes', icon: Route },
  { path: '/deliveries', label: 'Deliveries', icon: Package },
  { path: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { path: '/predictions', label: 'Predictions', icon: BrainCircuit },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/emergency', label: 'Emergency Mode', icon: ShieldAlert, color: 'text-red-400' },
  { path: '/administration', label: 'Administration', icon: Settings, divider: true },
];

export default function Sidebar() {
  const { emergencyMode } = useAppStore();

  return (
    <aside className={`w-64 border-r flex flex-col h-full shrink-0 shadow-xl hidden md:flex z-10 relative transition-colors duration-500 ${
      emergencyMode ? 'bg-[#1a0505] border-red-500/30' : 'bg-[#0a0f1c] border-white/10'
    }`}>
      <div className={`h-16 flex items-center px-6 border-b relative overflow-hidden transition-colors duration-500 ${emergencyMode ? 'border-red-500/30' : 'border-white/10'}`}>
        <div className={`absolute inset-0 blur-xl rounded-full transition-colors duration-500 ${emergencyMode ? 'bg-red-500/20' : 'bg-ner-primary/10'}`}></div>
        <BrainCircuit className={`w-6 h-6 mr-3 relative z-10 transition-colors duration-500 ${emergencyMode ? 'text-red-500' : 'text-ner-primary'}`} />
        <h1 className="font-bold text-lg tracking-tight relative z-10">
          <span className="text-white">NER</span> <span className={`transition-colors duration-500 ${emergencyMode ? 'text-red-500' : 'text-ner-primary'}`}>SMART</span>
        </h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => (
          <div key={item.path}>
            {item.divider && <div className="h-px bg-white/10 my-4 mx-3" />}
            <NavLink
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? (emergencyMode ? 'bg-red-500/15 text-red-400 shadow-[inset_2px_0_0_0_#ef4444]' : 'bg-ner-primary/15 text-ner-primary shadow-[inset_2px_0_0_0_#00d4ff]') 
                  : (emergencyMode ? 'text-red-200/50 hover:bg-red-500/10 hover:text-red-100' : 'text-gray-400 hover:bg-white/5 hover:text-white')}
              `}
            >
              <item.icon className={`w-5 h-5 mr-3 ${item.color || ''} opacity-80`} />
              <span className={item.color}>{item.label}</span>
            </NavLink>
          </div>
        ))}
      </nav>
      
      <div className={`p-4 border-t bg-white/[0.02] transition-colors duration-500 ${emergencyMode ? 'border-red-500/30' : 'border-white/10'}`}>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-colors duration-500 ${
            emergencyMode 
              ? 'bg-gradient-to-tr from-red-600 to-orange-500 shadow-red-500/20' 
              : 'bg-gradient-to-tr from-ner-primary to-ner-secondary shadow-ner-primary/20'
          }`}>
            A
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium leading-none transition-colors duration-500 ${emergencyMode ? 'text-red-100' : 'text-white'}`}>Admin User</p>
            <p className="text-xs text-gray-500 mt-1">Government</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
