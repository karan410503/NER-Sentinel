import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useState } from 'react';
import { useAppStore } from '../../../store';
import { renderToStaticMarkup } from 'react-dom/server';

const NodeIcon = ({ text, glowColor, borderColor, dot }: any) => {
  const glow = glowColor ? `0 0 15px ${glowColor}` : '0 0 10px rgba(255,255,255,0.3)';
  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#0f172a',
      color: 'white',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '12px',
      border: `2px solid ${borderColor}`,
      boxShadow: glow
    }}>
      {text}
      {dot && (
        <div style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '8px',
          height: '8px',
          background: '#ef4444',
          borderRadius: '50%',
          boxShadow: '0 0 5px #ef4444'
        }}></div>
      )}
    </div>
  );
};

const HubIcon = () => (
  <div style={{
    backgroundColor: '#7dd3fc',
    borderRadius: '6px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #fff',
    boxShadow: '0 0 15px #38bdf8',
    fontSize: '16px'
  }}>
    🏠
  </div>
);

const HospitalIcon = () => (
  <div style={{
    backgroundColor: '#ef4444',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #f87171',
    boxShadow: '0 0 15px #ef4444',
    fontSize: '16px'
  }}>
    🏥
  </div>
);

const VehicleIcon = ({ status }: { status: string }) => {
  const isRerouting = status === 'REROUTING';
  const isDelayed = status === 'DELAYED';
  const color = isRerouting ? '#eab308' : isDelayed ? '#ef4444' : '#10b981';
  
  return (
    <div style={{
      backgroundColor: '#0f172a',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `2px solid ${color}`,
      boxShadow: `0 0 15px ${color}`,
      fontSize: '18px',
      cursor: 'pointer'
    }}>
      {isRerouting ? '🔄' : '🚚'}
    </div>
  );
};

// Helper to create Leaflet divIcon from React component
const createDivIcon = (component: React.ReactElement, size: [number, number] = [32, 32]) => {
  return L.divIcon({
    html: renderToStaticMarkup(component),
    className: '', // Removes default Leaflet styling like backgrounds and borders
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2]
  });
};

export default function VehicleLayer() {
  const { vehicles, routes } = useAppStore();
  const [popupInfo, setPopupInfo] = useState<any>(null);

  // Dynamically extract hubs (source/destination) from active routes
  const dynamicHubs: any[] = [];
  const seenNodes = new Set<string>();

  routes.forEach(route => {
    if (route.geometry && route.geometry.length > 0) {
      const start = route.geometry[0];
      const end = route.geometry[route.geometry.length - 1];
      
      const startKey = `${start[0]},${start[1]}`;
      const endKey = `${end[0]},${end[1]}`;
      
      if (!seenNodes.has(startKey)) {
        seenNodes.add(startKey);
        dynamicHubs.push({ 
          pos: start, 
          icon: <HubIcon />, 
          title: route.origin || 'Source' 
        });
      }
      
      if (!seenNodes.has(endKey)) {
        seenNodes.add(endKey);
        dynamicHubs.push({ 
          pos: end, 
          icon: <HospitalIcon />, 
          title: route.destination || 'Destination' 
        });
      }
    }
  });

  const hubsToRender = dynamicHubs.length > 0 ? dynamicHubs : [
    { pos: [26.1445, 91.7362] as [number, number], icon: <HubIcon />, title: 'Guwahati Hub' },
    { pos: [25.5788, 91.8933] as [number, number], icon: <HospitalIcon />, title: 'Shillong Hub' }
  ];

  return (
    <>
      {hubsToRender.map((n, i) => (
        <Marker 
          key={'hub-'+i} 
          position={n.pos} 
          icon={createDivIcon(n.icon)}
        >
          <Popup className="custom-popup">
            <div className="font-semibold">{n.title}</div>
          </Popup>
        </Marker>
      ))}

      {vehicles.map((v) => (
        <Marker 
          key={v.id} 
          position={v.location} 
          icon={createDivIcon(<VehicleIcon status={v.status} />, [36, 36])}
          eventHandlers={{
            click: () => setPopupInfo(v)
          }}
        >
          {popupInfo?.id === v.id && (
            <Popup 
              eventHandlers={{ remove: () => setPopupInfo(null) }}
              className="text-sm text-gray-800 custom-popup"
            >
              <div className="p-1 min-w-[150px] text-white">
                <strong className="text-base font-bold text-white block mb-1">{v.vehicle_number}</strong>
                <span className="text-gray-300 block">{v.type}</span>
                <div className="mt-1">
                  Status: <span className="font-bold" style={{color: v.status === 'REROUTING' ? '#fbbf24' : '#34d399'}}>{v.status}</span>
                </div>
                <div>Speed: {v.speed.toFixed(1)} km/h</div>
                {v.cargo && <div>Cargo: {v.cargo}</div>}
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </>
  );
}
