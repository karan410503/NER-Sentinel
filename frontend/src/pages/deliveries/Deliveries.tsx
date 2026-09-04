import React, { useEffect, useState } from 'react';
import { Package, Truck, AlertTriangle, Search, Filter, Clock, CheckCircle2 } from 'lucide-react';
import { deliveryApi, type Delivery } from '../../services/deliveryApi';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    deliveryApi.getActiveDeliveries().then(setDeliveries);
  }, []);

  const filteredDeliveries = deliveries.filter(d => {
    const matchesStatus = filterStatus === 'ALL' || d.status === filterStatus;
    const matchesSearch = d.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.origin.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeCount = deliveries.filter(d => d.status !== 'DELIVERED').length;
  const delayedCount = deliveries.filter(d => d.status === 'DELAYED').length;
  const criticalCount = deliveries.filter(d => d.status === 'CRITICAL').length;
  const deliveredCount = deliveries.filter(d => d.status === 'DELIVERED').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_ROUTE': return 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10';
      case 'DELAYED': return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
      case 'CRITICAL': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'DELIVERED': return 'text-green-400 border-green-400/30 bg-green-400/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'EN_ROUTE': return 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]';
      case 'DELAYED': return 'bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]';
      case 'CRITICAL': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse';
      case 'DELIVERED': return 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            DELIVERY TRACKING
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              LIVE
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1 tracking-wide">
            Real-time supply chain monitoring and logistics status
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel-glow p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">ACTIVE DELIVERIES</p>
            <h3 className="text-3xl font-bold text-white">{activeCount}</h3>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Package className="w-6 h-6" />
          </div>
        </div>
        <div className="glass-panel-glow p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">DELAYED</p>
            <h3 className="text-3xl font-bold text-orange-400">{delayedCount}</h3>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="glass-panel-glow p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">CRITICAL RISK</p>
            <h3 className="text-3xl font-bold text-red-400">{criticalCount}</h3>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
        <div className="glass-panel-glow p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">COMPLETED TODAY</p>
            <h3 className="text-3xl font-bold text-green-400">{deliveredCount}</h3>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by ID, Origin, or Destination..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 custom-scrollbar">
          <Filter className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          {['ALL', 'EN_ROUTE', 'DELAYED', 'CRITICAL'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider whitespace-nowrap transition-all ${
                filterStatus === status 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 border shadow-[0_0_10px_rgba(0,212,255,0.1)]' 
                  : 'bg-white/5 border-transparent text-gray-400 border hover:bg-white/10 hover:text-white'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Data Grid */}
      <div className="space-y-3">
        {filteredDeliveries.map(delivery => (
          <div key={delivery.id} className="glass-panel-glow p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer hover:bg-white/[0.02]">
            
            {/* ID and Type */}
            <div className="w-full lg:w-48 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-white font-bold">{delivery.id}</span>
                {delivery.priority === 'EMERGENCY' && (
                  <span className="px-1.5 py-0.5 text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 rounded font-bold tracking-wider animate-pulse">EMERGENCY</span>
                )}
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Package className="w-3 h-3" /> {delivery.type}
              </p>
            </div>

            {/* Route Info */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{delivery.origin}</span>
                <span>{delivery.destination}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full relative mb-2">
                <div 
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${getProgressBarColor(delivery.status)}`}
                  style={{ width: `${delivery.progress}%` }}
                ></div>
                {delivery.status === 'EN_ROUTE' && (
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] transition-all duration-1000 z-10"
                    style={{ left: `calc(${delivery.progress}% - 6px)` }}
                  >
                    <div className="w-full h-full rounded-full animate-ping bg-cyan-400 opacity-50"></div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-500">{delivery.progress}% Completed</span>
                <span className={delivery.status === 'DELAYED' ? 'text-orange-400' : 'text-cyan-400'}>ETA: {delivery.eta}</span>
              </div>
            </div>

            {/* Status and Vehicle */}
            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:w-48 shrink-0 gap-2">
              <div className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded border ${getStatusColor(delivery.status)}`}>
                {delivery.status.replace('_', ' ')}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-300 flex items-center justify-end gap-1.5">
                  <Truck className="w-3 h-3 text-gray-500" /> {delivery.assignedVehicle}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Updated {delivery.lastUpdated}</div>
              </div>
            </div>

          </div>
        ))}

        {filteredDeliveries.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-300">No deliveries found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

    </div>
  );
}
