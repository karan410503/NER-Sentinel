import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../../store';
import DistrictLayer from './layers/DistrictLayer';
import RoadLayer from './layers/RoadLayer';
import VehicleLayer from './layers/VehicleLayer';
import IncidentLayer from './layers/IncidentLayer';
import RiskZoneLayer from './layers/RiskZoneLayer';
import MapControls from './controls/MapControls';
import MapLegend from './controls/MapLegend';
import RouteDetailsPanel from './controls/RouteDetailsPanel';
import { useVehicleSimulation } from '../../hooks/useVehicleSimulation';
import { useWebSocket } from '../../hooks/useWebSocket';

const NER_CENTER: [number, number] = [25.5, 92.3];
const NER_ZOOM = 8;

// MapController handles imperative map actions like flyTo
function MapController() {
  const map = useMap();
  const { emergencyMode, selectedVehicleId, focusLocation, vehicles } = useAppStore();

  useEffect(() => {
    if (focusLocation) {
      map.flyTo(focusLocation, 14, { duration: 1.5 });
    } else if (selectedVehicleId) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        map.flyTo(vehicle.location, 14, { duration: 1.5 });
      }
    } else if (emergencyMode) {
      // Potentially zoom into a specific emergency zone
    } else {
      map.flyTo(NER_CENTER, NER_ZOOM, { duration: 1.5 });
    }
  }, [emergencyMode, selectedVehicleId, focusLocation, vehicles, map]);

  return null;
}

export default function NERMap() {
  // Use the simulation for moving vehicles
  useVehicleSimulation();
  
  const { data: wsData } = useWebSocket('ws://localhost:8000/ws/map');
  const updateVehicleLocation = useAppStore(state => state.updateVehicleLocation);
  const setRoutes = useAppStore(state => state.setRoutes);
  
  useEffect(() => {
    // Fetch routes on mount
    import('../../services/routeApi').then(({ routeApi }) => {
      routeApi.getAllRoutes().then(setRoutes);
    });
  }, [setRoutes]);

  useEffect(() => {
    // If we receive real-time vehicle updates from the backend WS
    if (wsData && wsData.type === 'VEHICLE_UPDATE') {
      const { id, location } = wsData.payload;
      if (id && location) {
        updateVehicleLocation(id, location); // [lat, lng]
      }
    }
  }, [wsData, updateVehicleLocation]);

  const [activeLayers, setActiveLayers] = useState({
    districts: false,
    roads: true,
    vehicles: true,
    incidents: true,
    riskZones: false,
    weather: false
  });

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={NER_CENTER}
        zoom={NER_ZOOM}
        zoomControl={false} // Custom positioning
        style={{ width: '100%', height: '100%', backgroundColor: '#0a0a0a' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <ZoomControl position="bottomright" />
        <MapController />

        {activeLayers.districts && <DistrictLayer />}
        {activeLayers.riskZones && <RiskZoneLayer />}
        {activeLayers.roads && <RoadLayer />}
        {activeLayers.incidents && <IncidentLayer />}
        {activeLayers.vehicles && <VehicleLayer />}
      </MapContainer>

      {/* Custom Controls Overlays */}
      <MapControls activeLayers={activeLayers} toggleLayer={toggleLayer} />
      <MapLegend />
      <RouteDetailsPanel />
    </div>
  );
}
