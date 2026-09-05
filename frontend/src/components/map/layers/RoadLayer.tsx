import { Polyline, Popup } from 'react-leaflet';
import { useAppStore } from '../../../store';

function getRiskColor(riskScore: number): string {
  if (riskScore < 30) return '#10b981'; // Green (LOW)
  if (riskScore < 60) return '#eab308'; // Yellow (MODERATE)
  if (riskScore < 80) return '#f97316'; // Orange (HIGH)
  return '#ef4444'; // Red (CRITICAL)
}

export default function RoadLayer() {
  const { routes, selectedRouteId, setSelectedRouteId, selectedVehicleId, vehicles } = useAppStore();
  const selectedVehicle = selectedVehicleId ? vehicles.find(v => v.id === selectedVehicleId) : null;

  return (
    <>
      {/* 1. Render all active routes from backend */}
      {routes.map(route => {
        const isSelected = selectedRouteId === route.id;
        const color = getRiskColor(route.risk_score);
        
        // Ensure geometry is parsed properly (some DB returns [lat,lng][])
        const positions = route.geometry as [number, number][];
        if (!positions || positions.length === 0) return null;

        return (
          <div key={`db-route-${route.id}`}>
            {/* Wider transparent polyline for easier clicking */}
            <Polyline 
              positions={positions} 
              pathOptions={{ color: 'transparent', weight: 20 }}
            >
              <Popup className="text-sm text-gray-800 custom-popup">
                <div className="p-1 min-w-[200px] text-white">
                  <strong className="text-base font-bold text-white block mb-1">Route Details</strong>
                  <div className="text-gray-300 text-xs mb-2">{route.origin} → {route.destination}</div>
                  <div className="text-gray-300">Distance: {route.distance_km.toFixed(1)} km</div>
                  <div className="text-gray-300">ETA: {Math.floor(route.estimated_time_minutes / 60)}h {Math.floor(route.estimated_time_minutes % 60)}m</div>
                  <div className="mt-2 text-xs font-semibold text-gray-400">RISK SCORE: <span style={{ color }}>{route.risk_score.toFixed(0)} ({route.risk_level})</span></div>
                  {route.factors && Object.keys(route.factors).length > 0 && (
                    <div className="mt-1 text-[10px] text-gray-400">
                      {Object.entries(route.factors).map(([k,v]) => `${k}: ${v}`).join(' | ')}
                    </div>
                  )}
                </div>
              </Popup>
            </Polyline>
            {/* Outer Glow / Shadow */}
            <Polyline 
              positions={positions} 
              pathOptions={{ 
                color: color, 
                weight: isSelected ? 10 : 6, 
                opacity: isSelected ? 0.3 : 0.15 
              }} 
            />
            {/* Core Line */}
            <Polyline 
              positions={positions} 
              pathOptions={{ 
                color: color, 
                weight: isSelected ? 4 : 2, 
                opacity: isSelected ? 1 : 0.7 
              }} 
            />
          </div>
        );
      })}

      {/* 2. Dynamic Route for Selected Vehicle (Overrides base route coloring) */}
      {selectedVehicle && (
        <>
          {/* If the vehicle has an original route, show it as blocked/red */}
          {selectedVehicle.originalRoute && (
            <>
              <Polyline positions={selectedVehicle.originalRoute} pathOptions={{ color: '#ef4444', weight: 8, opacity: 0.2, dashArray: '10, 15' }} />
              <Polyline positions={selectedVehicle.originalRoute} pathOptions={{ color: '#ef4444', weight: 3, opacity: 1, dashArray: '5, 10' }} />
            </>
          )}

          {/* Show the current active route */}
          {selectedVehicle.currentRoute && (
            <>
              <Polyline 
                positions={selectedVehicle.currentRoute} 
                pathOptions={{ 
                  color: selectedVehicle.status === 'REROUTING' || selectedVehicle.isRerouted ? '#10b981' : '#0ea5e9', 
                  weight: 10, 
                  opacity: 0.3 
                }} 
              />
              <Polyline 
                positions={selectedVehicle.currentRoute} 
                pathOptions={{ 
                  color: selectedVehicle.status === 'REROUTING' || selectedVehicle.isRerouted ? '#10b981' : '#0ea5e9', 
                  weight: 4, 
                  opacity: 1,
                  dashArray: selectedVehicle.status === 'REROUTING' ? '5, 10' : undefined
                }} 
              />
            </>
          )}
        </>
      )}
    </>
  );
}
