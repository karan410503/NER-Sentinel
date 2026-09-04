import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, Bell, Info, Activity, Radio, CheckCircle, Shield } from 'lucide-react';
import { alertsApi, type SystemAlert } from '../../services/alertsApi';
import { useAppStore } from '../../store';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const { emergencyMode, setEmergencyMode } = useAppStore();

  useEffect(() => {
    // Initial fetch
    alertsApi.getInitialAlerts().then(setAlerts);

    // Simulate websocket pushing new alerts every 10-15 seconds
    const interval = setInterval(() => {
      const newAlert = alertsApi.generateRandomAlert();
      setAlerts(prev => [newAlert, ...prev]);
    }, Math.random() * 5000 + 10000);

    return () => clearInterval(interval);
  }, []);

  const handleResolve = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  const activeCritical = alerts.filter(a => !a.resolved && a.severity === 'CRITICAL').length;
  const activeWarnings = alerts.filter(a => !a.resolved && a.severity === 'WARNING').length;

  const getAlertStyle = (severity: string, resolved: boolean) => {
    if (resolved) return 'border-gray-500/30 bg-gray-500/5 text-gray-500 opacity-60';
    switch (severity) {
      case 'CRITICAL': return 'border-red-500/50 bg-red-500/10 text-red-400 shadow-[inset_4px_0_0_rgba(239,68,68,1)]';
      case 'WARNING': return 'border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-[inset_4px_0_0_rgba(249,115,22,1)]';
      case 'INFO': return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[inset_4px_0_0_rgba(34,211,238,1)]';
      default: return 'border-white/10 bg-white/5 text-gray-300';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <ShieldAlert className="w-5 h-5" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5" />;
      case 'INFO': return <Info className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            SYSTEM ALERTS
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              WS: CONNECTED
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1 tracking-wide">
            Real-time infrastructure, ML, and telemetry event stream
          </p>
        </div>
        
        {/* Global Emergency Toggle */}
        <button
          onClick={() => setEmergencyMode(!emergencyMode)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold tracking-widest text-sm transition-all border ${
            emergencyMode 
              ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' 
              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          {emergencyMode ? 'EMERGENCY PROTOCOL ACTIVE' : 'ACTIVATE EMERGENCY PROTOCOL'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`glass-panel-glow p-5 flex items-center justify-between ${activeCritical > 0 ? '!border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''}`}>
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">CRITICAL ALERTS</p>
            <h3 className={`text-3xl font-bold ${activeCritical > 0 ? 'text-red-400 animate-pulse' : 'text-gray-500'}`}>{activeCritical}</h3>
          </div>
          <div className={`p-3 rounded-lg border ${activeCritical > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-gray-500/10 border-gray-500/20 text-gray-500'}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
        
        <div className="glass-panel-glow p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">ACTIVE WARNINGS</p>
            <h3 className="text-3xl font-bold text-orange-400">{activeWarnings}</h3>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
        
        <div className="glass-panel-glow p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">SYSTEM STATUS</p>
            <h3 className={`text-xl font-bold mt-1 ${activeCritical > 0 ? 'text-orange-400' : 'text-green-400'}`}>
              {activeCritical > 0 ? 'DEGRADED' : 'HEALTHY'}
            </h3>
          </div>
          <div className={`p-3 rounded-lg border ${activeCritical > 0 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Live Event Stream */}
      <div className="glass-panel overflow-hidden flex flex-col h-[600px]">
        <div className="bg-black/60 p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white tracking-widest">LIVE EVENT STREAM</h3>
          </div>
          <span className="text-[10px] text-gray-500 font-mono tracking-widest">AUTO-REFRESHING</span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${getAlertStyle(alert.severity, alert.resolved)}`}
            >
              <div className="flex gap-4 items-start sm:items-center w-full">
                <div className={`mt-1 sm:mt-0 p-2 rounded-full bg-black/40 ${alert.resolved ? 'text-gray-500' : ''}`}>
                  {getAlertIcon(alert.severity)}
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold opacity-80">{alert.id}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-75">{alert.source}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <span className="text-[10px] font-mono text-gray-400">{formatTime(alert.timestamp)}</span>
                  </div>
                  <p className={`text-sm ${alert.resolved ? 'line-through opacity-70' : 'text-white'}`}>
                    {alert.message}
                  </p>
                </div>
              </div>

              {!alert.resolved && (
                <button 
                  onClick={() => handleResolve(alert.id)}
                  className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider bg-black/40 hover:bg-white/10 border border-white/10 text-white transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  ACKNOWLEDGE
                </button>
              )}
              {alert.resolved && (
                <div className="shrink-0 text-xs font-bold tracking-wider text-gray-500 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> RESOLVED
                </div>
              )}
            </div>
          ))}

          {alerts.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No alerts in the system.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
