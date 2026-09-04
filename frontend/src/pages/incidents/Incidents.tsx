import { useAppStore } from '../../store';
import { AlertTriangle, MapPin, Clock, FileWarning, Camera, LocateFixed, Activity, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictionsApi, type DisruptionForecast } from '../../services/predictionsApi';

export default function IncidentsPage() {
  const { incidents, addIncident, setFocusLocation, setSelectedVehicleId } = useAppStore();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDetails, setAiDetails] = useState('');
  const [forecasts, setForecasts] = useState<DisruptionForecast[]>([]);
  const [isLoadingForecasts, setIsLoadingForecasts] = useState(true);

  useEffect(() => {
    const loadForecasts = async () => {
      try {
        const data = await predictionsApi.getDisruptionForecasts();
        setForecasts(data);
      } catch (err) {
        console.error("Failed to load forecasts", err);
      } finally {
        setIsLoadingForecasts(false);
      }
    };
    loadForecasts();
  }, []);

  const [formData, setFormData] = useState({
    type: 'Landslide',
    severity: 'CRITICAL',
    location: '24.8170, 93.9368',
    radius: 50,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAiDetails('');
    
    try {
      const form = new FormData();
      form.append('file', file);
      
      const res = await fetch('http://localhost:8000/api/predictions/analyze-image', {
        method: 'POST',
        body: form,
      });
      
      if (res.ok) {
        const data = await res.json();
        const analysis = data.analysis;
        
        setFormData(prev => ({
          ...prev,
          type: analysis.type,
          severity: analysis.severity,
        }));
        setAiDetails(`Confidence: ${analysis.confidence}% - ${analysis.details}`);
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
      setAiDetails("AI Analysis failed. Please manually enter details.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.location) return;
    
    // Parse location
    const parts = formData.location.split(',').map(s => parseFloat(s.trim()));
    const loc: [number, number] = parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) 
      ? [parts[0], parts[1]] 
      : [93.9368, 24.8170]; // fallback
      
    const payload = {
      type: formData.type,
      severity: formData.severity === 'CRITICAL' ? 'Critical' : formData.severity === 'HIGH' ? 'High' : formData.severity === 'MODERATE' ? 'Medium' : 'Low',
      description: `${formData.type} reported by field user.`,
      latitude: loc[0],
      longitude: loc[1],
      radius_km: formData.radius,
      reported_by: 'Current User'
    };
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/alerts/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        addIncident({
          id: `i_${Date.now()}`,
          type: formData.type,
          severity: formData.severity as 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW',
          location: loc,
          reported_by: 'Current User',
          status: 'ACTIVE',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          glowSize: 1.2
        });
        
        setShowForm(false);
        setFormData({ type: 'Landslide', severity: 'CRITICAL', location: '24.8170, 93.9368', radius: 50 });
        setAiDetails('');
      } else {
        alert("Failed to report incident to backend.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reporting incident.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Incident Reports</h2>
          <p className="text-sm text-gray-400 mt-1">Field intelligence and road blockage reports</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-red-500/20 text-red-400 border border-red-500/50 font-semibold px-4 py-2 rounded-lg hover:bg-red-500/30 transition flex items-center"
        >
          <FileWarning className="w-4 h-4 mr-2" />
          Report Incident
        </button>
      </div>

      {showForm && (
        <div className="glass-panel p-6 border-l-4 border-red-500 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-bold mb-4">New Field Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Incident Type</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                >
                  <option>Landslide</option>
                  <option>Flood / Waterlogging</option>
                  <option>Bridge Damage</option>
                  <option>Road Blockage</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Severity</label>
                <select 
                  value={formData.severity}
                  onChange={e => setFormData({...formData, severity: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="CRITICAL">Critical (Road Blocked)</option>
                  <option value="HIGH">High (Major Delays)</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">GPS Location</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Lat, Lng" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500" 
                  />
                  <button 
                    onClick={() => {
                      setFocusLocation(null); // Clear to fallback to NER Center
                      setSelectedVehicleId(null);
                      navigate('/map');
                    }}
                    title="Select on Northeast Region Map"
                    className="bg-white/10 p-2.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </button>
                  <button 
                    onClick={() => {
                      if ("geolocation" in navigator) {
                        navigator.geolocation.getCurrentPosition((position) => {
                          const lat = position.coords.latitude;
                          const lng = position.coords.longitude;
                          setFormData({...formData, location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`});
                          setFocusLocation([lat, lng]);
                          setSelectedVehicleId(null);
                          navigate('/map');
                        }, (error) => {
                          console.error("Error getting location:", error);
                          alert("Could not get your current location.");
                        });
                      } else {
                        alert("Geolocation is not supported by your browser.");
                      }
                    }}
                    title="Use Current Location & View on Map"
                    className="bg-white/10 p-2.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <LocateFixed className="w-5 h-5 text-green-400" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Impact Radius (km)</label>
                <div className="flex space-x-2 items-center">
                  <input 
                    type="range" 
                    min="1" max="200" 
                    value={formData.radius}
                    onChange={e => setFormData({...formData, radius: parseInt(e.target.value)})}
                    className="w-full accent-red-500" 
                  />
                  <span className="text-white font-mono text-sm w-12 text-right">{formData.radius}km</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Photo Evidence</label>
                <label className="w-full border-2 border-dashed border-white/20 rounded-lg p-3 text-gray-400 hover:border-ner-primary/50 hover:text-ner-primary transition flex items-center justify-center bg-black/30 cursor-pointer relative overflow-hidden">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={isAnalyzing}
                  />
                  {isAnalyzing ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ner-primary mr-2"></div>
                      AI Analyzing Image...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Camera className="w-5 h-5 mr-2" /> Upload Image for AI Analysis
                    </span>
                  )}
                </label>
                {aiDetails && (
                  <p className="text-xs text-ner-primary mt-2 flex items-start">
                    <AlertTriangle className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                    {aiDetails}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 transition">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm bg-red-500 hover:bg-red-600 text-white transition font-medium">Submit Report</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {incidents.map(inc => (
          <div key={inc.id} className="glass-panel p-5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-lg bg-red-500/20 text-red-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{inc.type}</h3>
                  <p className="text-xs text-gray-400">Reported by: {inc.reported_by}</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-500 border border-red-500/30">
                {inc.severity}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center text-gray-400"><Clock className="w-4 h-4 mr-2" /> Time</span>
                <span className="text-white">{inc.time}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center text-gray-400"><MapPin className="w-4 h-4 mr-2" /> Location</span>
                <span className="font-mono text-white">{inc.location[0].toFixed(4)}, {inc.location[1].toFixed(4)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center">
              <Activity className="w-6 h-6 mr-3 text-purple-500" />
              AI Predictive Incident Analytics
            </h2>
            <p className="text-sm text-gray-400 mt-1">Live disruption forecasts generated from the API</p>
          </div>
        </div>

        {isLoadingForecasts ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forecasts.map(forecast => (
              <div key={forecast.id} className="bg-gradient-to-br from-black/80 to-purple-900/20 border border-purple-500/30 rounded-2xl p-5 hover:border-purple-500/60 transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-md">{forecast.type}</h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{forecast.location}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-400 mb-1">Probability</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${
                      forecast.probability > 75 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      forecast.probability > 50 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}>
                      {forecast.probability}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Timeframe</span>
                    <span className="text-purple-300 font-medium">{forecast.timeframe}</span>
                  </div>
                  <div className="bg-purple-900/30 p-3 rounded-lg border border-purple-500/20 mt-3">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      <span className="font-bold text-purple-400 block mb-1">Recommendation:</span>
                      {forecast.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
