import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore } from '../../store/authStore';
import { LogOut, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const incidentIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png', // Temporary alert icon
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function FieldOfficerDashboard() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [incidentType, setIncidentType] = useState('Landslide');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      alert("Please select a location on the map first");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/alerts/report', {
        type: incidentType,
        severity: severity,
        description: description,
        latitude: selectedLocation[0],
        longitude: selectedLocation[1],
        reported_by: user?.name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMsg("Incident reported and broadcasted successfully!");
      setSelectedLocation(null);
      setDescription('');
      
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to report incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col relative text-white md:flex-row">
      {/* Sidebar Panel */}
      <div className="w-full md:w-96 bg-zinc-900 border-r border-white/10 flex flex-col z-[1000] relative">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-amber-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Field Officer
            </h1>
            <p className="text-sm text-zinc-400">{user?.name}</p>
          </div>
          <button onClick={handleLogout} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
            <LogOut className="w-4 h-4 text-zinc-300" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Report New Incident</h2>
          
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm p-3 rounded-lg mb-6">
            Step 1: Tap on the map to pinpoint the exact location of the incident.
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-zinc-300">Incident Type</label>
              <select 
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="mt-1 block w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Landslide">Landslide</option>
                <option value="Flood">Flood</option>
                <option value="Road Block">Road Block</option>
                <option value="Accident">Accident</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300">Severity</label>
              <select 
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="mt-1 block w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300">Location Coordinates</label>
              <input 
                type="text" 
                readOnly 
                value={selectedLocation ? `${selectedLocation[0].toFixed(5)}, ${selectedLocation[1].toFixed(5)}` : 'No location selected'}
                className="mt-1 block w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-3 text-zinc-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300">Description</label>
              <textarea 
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the incident..."
                className="mt-1 block w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {successMsg && (
              <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 p-3 rounded-lg text-sm text-center">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !selectedLocation}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-black bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Report Incident</>}
            </button>
          </form>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0 h-full min-h-[50vh]">
        <MapContainer 
          center={[26.1445, 91.7362]} // Default Guwahati
          zoom={10} 
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          <MapClickHandler onLocationSelect={(lat, lng) => setSelectedLocation([lat, lng])} />
          
          {selectedLocation && (
            <Marker position={selectedLocation} icon={incidentIcon}>
              <Popup className="dark-popup">
                <div className="font-semibold text-amber-500">Selected Location</div>
                <div>{incidentType} ({severity})</div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
