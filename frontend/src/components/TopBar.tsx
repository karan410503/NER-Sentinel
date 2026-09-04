import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, Activity, AlertTriangle, Truck, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';

export default function TopBar() {
  const { emergencyMode, setEmergencyMode, vehicles, incidents } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = [
    ...vehicles.filter(v => 
      v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.type.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(v => ({ type: 'vehicle', id: v.id, label: `${v.vehicle_number} (${v.type})`, status: v.status })),
    
    ...incidents.filter(i => 
      i.type.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(i => ({ type: 'incident', id: i.id, label: i.type, status: i.severity }))
  ];

  return (
    <header className={`h-16 backdrop-blur-md border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 transition-colors duration-500 ${
      emergencyMode ? 'bg-[#1a0505]/90 border-red-500/50 shadow-[0_4px_20px_rgba(239,68,68,0.2)]' : 'bg-[#0a0f1c]/80 border-white/10'
    }`}>
      <div className="flex items-center flex-1">
        <button className={`md:hidden p-2 -ml-2 rounded-lg transition-colors mr-2 ${emergencyMode ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative w-full max-w-md hidden md:block" ref={searchRef}>
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${emergencyMode ? 'text-red-400/70' : 'text-gray-500'}`} />
          <input 
            type="text" 
            placeholder="Search vehicles, routes, incidents..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearch(true);
            }}
            onFocus={() => setShowSearch(true)}
            className={`w-full border rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none transition-all ${
              emergencyMode 
                ? 'bg-black/60 border-red-500/30 text-red-100 placeholder-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                : 'bg-black/50 border-white/10 text-white placeholder-gray-500 focus:border-ner-primary/50 focus:ring-1 focus:ring-ner-primary/50'
            }`}
          />
          
          {/* Search Dropdown */}
          {showSearch && searchQuery.trim() !== '' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto">
              {searchResults.length > 0 ? (
                <ul className="py-2">
                  {searchResults.map((res, idx) => (
                    <li key={idx} className="px-4 py-2 hover:bg-white/5 cursor-pointer flex items-center">
                      {res.type === 'vehicle' ? <Truck className="w-4 h-4 mr-3 text-ner-primary" /> : <AlertTriangle className="w-4 h-4 mr-3 text-red-500" />}
                      <span className="text-sm text-gray-200">{res.label}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                        res.type === 'incident' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>{res.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => setEmergencyMode(!emergencyMode)}
          className="transition-transform hover:scale-105 active:scale-95"
        >
          {emergencyMode ? (
            <div className="flex items-center px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full hidden sm:flex animate-pulse cursor-pointer">
              <AlertTriangle className="w-3 h-3 text-red-400 mr-2" />
              <span className="text-xs font-bold text-red-400 tracking-wider">CRITICAL EMERGENCY</span>
            </div>
          ) : (
            <div className="flex items-center px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full hidden sm:flex cursor-pointer hover:bg-green-500/20 transition-colors">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
              <span className="text-xs font-medium text-green-400">System Online</span>
            </div>
          )}
        </button>
        
        <Link to="/admin/ai-analysis" className="relative p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
          <Activity className="w-5 h-5" />
        </Link>
        
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {incidents.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#0a0f1c] animate-pulse"></span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-sm text-white">Notifications</h3>
                <span className="text-xs text-gray-400">{incidents.length} new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {incidents.length > 0 ? (
                  incidents.map(inc => (
                    <div key={inc.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer flex items-start">
                      <div className="mt-0.5 mr-3 bg-red-500/20 p-1.5 rounded-full">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{inc.type}</p>
                        <p className="text-xs text-gray-400 mt-1">Severity: {inc.severity} • {inc.reported_by}</p>
                        <p className="text-xs text-gray-500 mt-1">{inc.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm flex flex-col items-center">
                    <Bell className="w-8 h-8 mb-2 opacity-20" />
                    <p>All caught up!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
