import { Polyline } from 'react-leaflet';
import { useAppStore } from '../../../store';

export default function RoadLayer() {
  const { selectedVehicleId, vehicles } = useAppStore();
  const selectedVehicle = selectedVehicleId ? vehicles.find(v => v.id === selectedVehicleId) : null;

  return (
    <>
      {/* Background routes if no vehicle is selected */}
      {!selectedVehicle && vehicles.map((vehicle, idx) => {
        const color = idx % 2 === 0 ? '#0ea5e9' : '#10b981'; // Alternate colors
        if (!vehicle.currentRoute) return null;
        return (
          <div key={`bg-route-${vehicle.id}`}>
            <Polyline positions={vehicle.currentRoute} pathOptions={{ color: color, weight: 8, opacity: 0.15 }} />
            <Polyline positions={vehicle.currentRoute} pathOptions={{ color: color, weight: 3, opacity: 0.8 }} />
          </div>
        );
      })}

      {/* Dynamic Route for Selected Vehicle */}
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
