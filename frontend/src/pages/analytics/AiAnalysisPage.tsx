import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Activity, Brain, ShieldAlert, Zap } from 'lucide-react';
import { useAppStore } from '../../store';

const accessibilityData = [
  { subject: 'Terrain', A: 85, fullMark: 100 },
  { subject: 'Weather', A: 90, fullMark: 100 },
  { subject: 'Infrastructure', A: 45, fullMark: 100 },
  { subject: 'Traffic', A: 60, fullMark: 100 },
  { subject: 'Distance', A: 75, fullMark: 100 },
];

const impactData = [
  { time: '08:00', withoutAI: 45, withAI: 20 },
  { time: '10:00', withoutAI: 55, withAI: 15 },
  { time: '12:00', withoutAI: 85, withAI: 25 },
  { time: '14:00', withoutAI: 120, withAI: 30 }, // Disaster strikes here
  { time: '16:00', withoutAI: 150, withAI: 35 },
  { time: '18:00', withoutAI: 110, withAI: 20 },
];

const factorData = [
  { name: 'Heavy Rain', impact: 85, fill: '#ef4444' },
  { name: 'Landslide', impact: 95, fill: '#ef4444' },
  { name: 'Traffic Jam', impact: 65, fill: '#f59e0b' },
  { name: 'Poor Road', impact: 45, fill: '#f59e0b' },
  { name: 'Vehicle Issue', impact: 15, fill: '#10b981' },
];

export default function AiAnalysisPage() {
  const { emergencyMode } = useAppStore();

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center">
            <Activity className="w-6 h-6 mr-3 text-ner-primary" />
            Active Fleet Intelligence
          </h2>
          <p className="text-sm text-gray-400 mt-1">Real-time AI analysis of route accessibility, mitigation impacts, and environmental factors.</p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center ${
          emergencyMode ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-green-500/10 border-green-500/30 text-green-400'
        }`}>
          {emergencyMode ? (
            <><ShieldAlert className="w-4 h-4 mr-2" /> CRITICAL CONDITIONS DETECTED</>
          ) : (
            <><Zap className="w-4 h-4 mr-2" /> NOMINAL CONDITIONS</>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        
        {/* Factor Influence (Bar Chart) */}
        <div className="glass-panel rounded-xl p-5 border border-white/10 xl:col-span-1">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-fuchsia-400" />
            Current Factor Influence
          </h3>
          <p className="text-xs text-gray-400 mb-6">Real-time severity of elements impacting the active fleet.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis type="number" stroke="#666" />
                <YAxis dataKey="name" type="category" stroke="#ccc" width={90} fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="impact" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Accessibility (Radar Chart) */}
        <div className="glass-panel rounded-xl p-5 border border-white/10 xl:col-span-1">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-cyan-400" />
            AI Accessibility Analysis
          </h3>
          <p className="text-xs text-gray-400 mb-6">Dynamic assessment of multi-dimensional routing constraints.</p>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={accessibilityData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#aaa', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Severity" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Impact Analysis (Area Chart) */}
        <div className="glass-panel rounded-xl p-5 border border-white/10 lg:col-span-2 xl:col-span-1">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            AI Mitigation Impact (Delays)
          </h3>
          <p className="text-xs text-gray-400 mb-6">Projected delivery delays (in mins) showing the impact of dynamic AI rerouting vs standard routing.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={impactData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWithout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="time" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                <Area type="monotone" dataKey="withoutAI" name="Without AI" stroke="#ef4444" fillOpacity={1} fill="url(#colorWithout)" />
                <Area type="monotone" dataKey="withAI" name="With AI Rerouting" stroke="#10b981" fillOpacity={1} fill="url(#colorWith)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
