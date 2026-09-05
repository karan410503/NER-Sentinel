import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore } from '../../store/authStore';
import { Navigation, AlertTriangle, LogOut, Phone, ShieldAlert, Truck, MapPin, StopCircle, CheckCircle2, XCircle, Clock, Navigation2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import IncidentReportModal from './IncidentReportModal';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204981.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const destIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149059.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

function MapUpdater({ center, routeCoords }: { center: [number, number], routeCoords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    // If there's a route, bound it, else just center on driver
    if (routeCoords && routeCoords.length > 0) {
      const bounds = L.latLngBounds([center, ...routeCoords]);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else {
      map.setView(center, 15, { animate: true });
    }
  }, [center, map, routeCoords]);
  return null;
}

export default function DriverDashboard() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [gpsStatus, setGpsStatus] = useState<'DISCONNECTED' | 'CONNECTED' | 'DENIED'>('DISCONNECTED');
  
  const [vehicle, setVehicle] = useState<any>(null);
  const [trip, setTrip] = useState<any>(null);
  const [isTripActive, setIsTripActive] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distanceRemaining, setDistanceRemaining] = useState<string>('');
  const [eta, setEta] = useState<string>('');
  
  const [incidentAlert, setIncidentAlert] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const vehicleRef = useRef<any>(null);

  useEffect(() => {
    vehicleRef.current = vehicle;
  }, [vehicle]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const vRes = await fetch('http://localhost:8000/api/driver/me/vehicle', { headers });
        const vData = await vRes.json();
        if (vData.assigned) setVehicle(vData.vehicle);

        const tRes = await fetch('http://localhost:8000/api/driver/me/trip', { headers });
        const tData = await tRes.json();
        if (tData.has_trip) {
          setTrip(tData.trip);
          if (['IN_TRANSIT', 'EMERGENCY'].includes(tData.trip.status)) {
            setIsTripActive(true);
            startGpsTracking();
          }
        }
      } catch (err) {
        console.error('Error fetching driver data:', err);
      }
    };
    if (token) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Connect WebSocket
  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8000/ws/map');
    
    wsRef.current.onopen = () => console.log('Driver WS Connected');
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_INCIDENT') {
          setIncidentAlert(`Alert: ${data.incident.type} reported nearby!`);
          setTimeout(() => setIncidentAlert(null), 10000);
        } else if (data.type === 'REROUTE_RECOMMENDED' && String(data.vehicle_id) === String(vehicleRef.current?.id)) {
          if (window.confirm(`URGENT: ${data.reason}\nNew ETA: ${data.new_eta} mins.\nAccept alternative route?`)) {
            setRouteCoords(data.new_geometry);
          }
        } else if (data.type === 'DRIVER_LOCATION' && String(data.vehicle_id) === String(vehicleRef.current?.id)) {
          setLocation([data.lat, data.lng]);
          setSpeed(data.speed || 0);
          setGpsStatus('CONNECTED');
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };
    
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Fetch OSRM Route
  const fetchRoute = async (currentLat: number, currentLng: number, destLat: number, destLng: number) => {
    try {
      // OSRM requires lng,lat
      const res = await fetch(`http://router.project-osrm.org/route/v1/driving/${currentLng},${currentLat};${destLng},${destLat}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
        const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        setRouteCoords(coords);
        
        const distKm = (route.distance / 1000).toFixed(1);
        setDistanceRemaining(`${distKm} km`);
        
        const durationMin = Math.round(route.duration / 60);
        setEta(`${durationMin} min`);
      }
    } catch (err) {
      console.error('Error fetching OSRM route:', err);
    }
  };

  // Route polling if trip active
  useEffect(() => {
    if (isTripActive && location && trip?.destination_lat) {
      // Fetch route every 30 seconds to recalculate
      fetchRoute(location[0], location[1], trip.destination_lat, trip.destination_lng);
      const interval = setInterval(() => {
        fetchRoute(location[0], location[1], trip.destination_lat, trip.destination_lng);
      }, 30000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTripActive, trip]);

  const updateTripStatus = async (status: string) => {
    if (!trip || !location) return;
    try {
      const res = await fetch(`http://localhost:8000/api/driver/trip/${trip.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, lat: location[0], lng: location[1] })
      });
      if (res.ok) {
        const data = await res.json();
        setTrip({ ...trip, status: data.status });
        if (status === 'IN_TRANSIT') setIsTripActive(true);
        else setIsTripActive(false);
      }
    } catch (err) {
      console.error('Failed to update trip status:', err);
    }
  };

  const startGpsTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('DENIED');
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGpsStatus('CONNECTED');
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const currentSpeed = position.coords.speed || 0;
        const currentHeading = position.coords.heading || 0;
        const acc = position.coords.accuracy || 0;
        
        setLocation([lat, lng]);
        setSpeed(currentSpeed);
        setHeading(currentHeading);
        setAccuracy(acc);
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isTripActive) {
          wsRef.current.send(JSON.stringify({
            type: 'DRIVER_LOCATION',
            driver_id: user?.id,
            driver_name: user?.name,
            vehicle_id: vehicle?.id,
            trip_id: trip?.id,
            lat,
            lng,
            speed: currentSpeed,
            heading: currentHeading
          }));
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setGpsStatus('DENIED');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  }, [user, vehicle, trip, isTripActive]);

  const handleStartTrip = () => {
    if (!location) {
      // Just ask for location first
      startGpsTracking();
      setTimeout(() => updateTripStatus('IN_TRANSIT'), 1000); // Give it a sec to get loc
    } else {
      updateTripStatus('IN_TRANSIT');
    }
  };

  const handlePauseTrip = () => {
    updateTripStatus('DELAYED');
  };

  const handleEndTrip = () => {
    updateTripStatus('DELIVERED');
    setRouteCoords([]);
  };

  const handleCancelTrip = () => {
    updateTripStatus('CANCELLED');
    setRouteCoords([]);
  };

  const handleLogout = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    logout();
    navigate('/login');
  };

  const triggerSOS = async () => {
    if (!window.confirm("Are you sure you want to trigger SOS? This will notify Admin immediately.")) return;
    if (!location) return alert("Waiting for GPS location...");
    
    try {
      await fetch('http://localhost:8000/api/driver/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          lat: location[0],
          lng: location[1],
          vehicle_id: vehicle?.id
        })
      });
      alert("SOS Triggered! Admin has been notified.");
    } catch (err) {
      console.error(err);
      alert("Failed to send SOS. Please check connection.");
    }
  };

  const handleIncidentSubmit = async (data: any) => {
    if (!location) return;
    try {
      await fetch('http://localhost:8000/api/driver/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...data,
          lat: location[0],
          lng: location[1],
          vehicle_id: vehicle?.id
        })
      });
      setIsReportModalOpen(false);
      alert("Incident reported successfully.");
    } catch (err) {
      console.error(err);
    }
  };

  // If map needs a center before GPS kicks in
  const mapCenter = location || [26.1445, 91.7362];

  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col relative text-white overflow-hidden">
      
      {/* Top Bar - Profile & Alerts */}
      <div className="absolute top-0 w-full z-[1000] p-4 pointer-events-none flex flex-col gap-2">
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex gap-4 items-center">
            <div className="h-12 w-12 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/50">
              <Truck className="text-emerald-400 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-emerald-400">{user?.name}</h1>
              <p className="text-sm text-zinc-400 flex items-center gap-2">
                {vehicle ? (
                  <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 border border-white/5">
                    {vehicle.registration_number}
                  </span>
                ) : 'No Vehicle'}
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${gpsStatus === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  GPS: {gpsStatus}
                </span>
              </p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="bg-zinc-900/90 hover:bg-zinc-800 p-3 rounded-full border border-white/10 shadow-xl transition-colors">
            <LogOut className="w-5 h-5 text-red-400" />
          </button>
        </div>
        
        {incidentAlert && (
          <div className="bg-red-500/20 border border-red-500/50 backdrop-blur p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 pointer-events-auto shadow-2xl">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            <p className="text-red-200 font-medium">{incidentAlert}</p>
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer center={mapCenter as [number, number]} zoom={15} zoomControl={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapUpdater center={mapCenter as [number, number]} routeCoords={routeCoords} />
          
          {location && (
            <Marker position={location} icon={truckIcon}>
              <Popup className="dark-popup">
                <div className="font-semibold text-zinc-900">Driver: {user?.name}</div>
                <div className="text-zinc-600">Speed: {(speed * 3.6).toFixed(1)} km/h</div>
              </Popup>
            </Marker>
          )}

          {trip && trip.destination_lat && (
            <Marker position={[trip.destination_lat, trip.destination_lng]} icon={destIcon}>
              <Popup className="dark-popup">
                <div className="font-bold text-zinc-900">Destination</div>
                <div className="text-zinc-600">{trip.destination}</div>
              </Popup>
            </Marker>
          )}

          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} color="#10b981" weight={6} opacity={0.8} />
          )}
        </MapContainer>
      </div>

      {/* Bottom Panel - Trip Management & Metrics */}
      <div className="absolute bottom-0 w-full z-[1000] p-4 pointer-events-none">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl pointer-events-auto max-w-4xl mx-auto">
          
          {/* Trip Header if Active */}
          {trip && (
            <div className="mb-4 pb-4 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-emerald-400">Trip: {trip.delivery_number}</h3>
                <span className="text-xs bg-zinc-800 px-2 py-1 rounded-md text-zinc-300">{trip.status}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-zinc-400">
                <MapPin className="w-4 h-4" /> <span>{trip.origin}</span>
                <span className="text-zinc-600 mx-1">→</span>
                <span className="text-white">{trip.destination}</span>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-black/50 rounded-xl p-3 border border-white/5">
              <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1"><Navigation2 className="w-3 h-3"/> Speed</div>
              <div className="font-bold text-white text-lg">
                {(speed * 3.6).toFixed(1)} <span className="text-xs text-zinc-500 font-normal">km/h</span>
              </div>
            </div>
            
            <div className="bg-black/50 rounded-xl p-3 border border-white/5">
              <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Remaining</div>
              <div className="font-bold text-white text-lg">
                {distanceRemaining || '--'}
              </div>
            </div>

            <div className="bg-black/50 rounded-xl p-3 border border-white/5">
              <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> ETA</div>
              <div className="font-bold text-white text-lg text-emerald-400">
                {eta || '--'}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {!trip ? (
              <div className="bg-black/30 text-zinc-500 text-center py-4 rounded-xl border border-white/5">
                No active trip assigned to this vehicle.
              </div>
            ) : !isTripActive ? (
              <button 
                onClick={handleStartTrip}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
              >
                <Navigation className="w-5 h-5" />
                START TRIP
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={handlePauseTrip}
                  className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/50 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <StopCircle className="w-5 h-5" /> PAUSE
                </button>
                <button 
                  onClick={handleEndTrip}
                  className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" /> COMPLETE
                </button>
              </div>
            )}
            
            {/* SOS and Report Row */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 border border-white/5 transition-colors text-sm"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Report Incident
              </button>
              
              <button 
                onClick={triggerSOS}
                className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-red-500/50 transition-all text-sm"
              >
                <ShieldAlert className="w-4 h-4" />
                SOS EMERGENCY
              </button>
            </div>
            
            {trip && !isTripActive && trip.status !== 'DELIVERED' && trip.status !== 'CANCELLED' && (
              <button 
                onClick={handleCancelTrip}
                className="mt-2 text-zinc-500 hover:text-red-400 text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" /> Cancel Trip
              </button>
            )}
          </div>
        </div>
      </div>

      <IncidentReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleIncidentSubmit}
        currentLat={location?.[0] || 0}
        currentLng={location?.[1] || 0}
      />
    </div>
  );
}
