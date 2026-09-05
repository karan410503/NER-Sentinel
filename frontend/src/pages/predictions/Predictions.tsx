import React, { useEffect, useState } from 'react';
import { BrainCircuit, Target, AlertTriangle, Play, ChevronRight, Activity, Zap, CheckCircle2, UploadCloud } from 'lucide-react';
import { predictionsApi, type EtaPrediction, type DisruptionForecast } from '../../services/predictionsApi';
import DatasetUploadModal from '../../components/DatasetUploadModal';

export default function PredictionsPage() {
  const [disruptions, setDisruptions] = useState<DisruptionForecast[]>([]);
  const [etaOrigin, setEtaOrigin] = useState('Guwahati Hub');
  const [etaDestination, setEtaDestination] = useState('Shillong Medical Center');
  const [etaVehicle, setEtaVehicle] = useState('Heavy Truck (Medicine)');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<EtaPrediction | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    predictionsApi.getDisruptionForecasts().then(setDisruptions);
  }, []);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setPrediction(null);
    try {
      const result = await predictionsApi.getEtaPrediction(etaOrigin, etaDestination, etaVehicle);
      setPrediction(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getProbabilityColor = (prob: number) => {
    if (prob > 75) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]';
    if (prob > 50) return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]';
    return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            AI PREDICTIONS
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30 text-purple-400 bg-purple-500/10 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
              MODELS ONLINE
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1 tracking-wide">
            Machine Learning ETA calculation and infrastructure disruption forecasting
          </p>
        </div>
        
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-purple-500/30 text-white rounded-lg flex items-center gap-2 transition"
        >
          <UploadCloud className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">Upload Training Data</span>
        </button>
      </div>

      <DatasetUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel-glow p-5 flex items-center justify-between !border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">ACTIVE ML MODELS</p>
            <h3 className="text-3xl font-bold text-purple-400">4 <span className="text-sm text-gray-500 font-normal">Engines</span></h3>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <BrainCircuit className="w-6 h-6" />
          </div>
        </div>
        
        <div className="glass-panel-glow p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">GLOBAL MODEL ACCURACY</p>
            <h3 className="text-3xl font-bold text-cyan-400">92.4%</h3>
          </div>
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Target className="w-6 h-6" />
          </div>
        </div>
        
        <div className="glass-panel-glow p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">PREDICTED DISRUPTIONS</p>
            <h3 className="text-3xl font-bold text-orange-400">3 <span className="text-sm text-gray-500 font-normal">Next 48h</span></h3>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ETA Prediction Engine */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
            <Zap className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white tracking-widest">ETA PREDICTION ENGINE</h3>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2">ORIGIN</label>
              <select 
                value={etaOrigin}
                onChange={(e) => setEtaOrigin(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              >
                <option>Guwahati Hub</option>
                <option>Shillong Medical Center</option>
                <option>Tezpur Base</option>
                <option>Imphal Station</option>
                <option>Aizawl Depot</option>
                <option>Dimapur Outpost</option>
                <option>Kohima Hub</option>
                <option>Tawang Base</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2">DESTINATION</label>
              <select 
                value={etaDestination}
                onChange={(e) => setEtaDestination(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              >
                <option>Guwahati Hub</option>
                <option>Shillong Medical Center</option>
                <option>Tezpur Base</option>
                <option>Imphal Station</option>
                <option>Aizawl Depot</option>
                <option>Dimapur Outpost</option>
                <option>Kohima Hub</option>
                <option>Tawang Base</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2">VEHICLE PROFILE</label>
              <select 
                value={etaVehicle}
                onChange={(e) => setEtaVehicle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              >
                <option>Heavy Truck (Medicine)</option>
                <option>Medium Truck (Food Supply)</option>
                <option>Light Vehicle (Fast Relief)</option>
              </select>
            </div>
          </div>
          
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600/80 to-cyan-600/80 hover:from-purple-500 hover:to-cyan-500 text-white font-bold tracking-widest text-sm flex items-center justify-center transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin" /> ANALYZING NEURAL NETWORKS...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4" /> GENERATE PREDICTION
              </span>
            )}
          </button>

          {/* Prediction Results Area */}
          <div className={`mt-6 transition-all duration-500 ${prediction ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}>
            {prediction && (
              <div className="bg-black/60 rounded-xl border border-purple-500/30 p-5 shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">AI PREDICTED ETA</p>
                    <h4 className="text-4xl font-bold text-white">{prediction.predictedEta}</h4>
                    <p className="text-xs text-gray-500 mt-1">Standard routing ETA: {prediction.standardEta}</p>
                  </div>
                  <div className="text-right">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-700" />
                        <circle 
                          cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                          strokeDasharray={28 * 2 * Math.PI} 
                          strokeDashoffset={(28 * 2 * Math.PI) - ((prediction.confidenceScore / 100) * (28 * 2 * Math.PI))}
                          className="text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" 
                        />
                      </svg>
                      <span className="absolute text-sm font-bold text-white">{prediction.confidenceScore}%</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-1">CONFIDENCE</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-3 border-b border-white/5 pb-2">AI INFLUENCING FACTORS</p>
                  <div className="space-y-2">
                    {prediction.factors.map((factor, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300 flex items-center gap-2">
                          {factor.type === 'positive' ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-orange-400" />
                          )}
                          {factor.name}
                        </span>
                        <span className={`font-mono font-bold ${factor.type === 'positive' ? 'text-green-400' : 'text-orange-400'}`}>
                          {factor.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Disruption Forecasts */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-bold text-white tracking-widest">ROAD DISRUPTION FORECAST</h3>
          </div>

          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1">
            {disruptions.map(disruption => (
              <div key={disruption.id} className="bg-black/40 rounded-xl border border-white/10 p-4 hover:border-orange-500/30 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-orange-400 font-bold">{disruption.type}</h4>
                    <p className="text-xs text-gray-400 mt-1">{disruption.location}</p>
                  </div>
                  <span className="px-2 py-1 text-[10px] font-bold tracking-widest bg-white/5 border border-white/10 rounded text-gray-300">
                    {disruption.timeframe}
                  </span>
                </div>
                
                <div className="my-4">
                  <div className="flex justify-between text-[10px] font-bold tracking-widest mb-1">
                    <span className="text-gray-400">PROBABILITY</span>
                    <span className="text-white">{disruption.probability}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full relative overflow-hidden">
                    <div 
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${getProbabilityColor(disruption.probability)}`}
                      style={{ width: `${disruption.probability}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5">
                  <p className="text-[10px] font-bold text-cyan-400 tracking-widest mb-1">AI RECOMMENDATION</p>
                  <p className="text-sm text-gray-300 flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                    {disruption.recommendation}
                  </p>
                </div>
              </div>
            ))}

            {disruptions.length === 0 && (
              <div className="text-center py-12">
                <Activity className="w-8 h-8 text-cyan-500 mx-auto mb-3 animate-pulse" />
                <p className="text-gray-400 text-sm">Monitoring geospatial sensors...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
