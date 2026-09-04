import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useState } from 'react';
import { useAppStore } from '../../../store';
import { renderToStaticMarkup } from 'react-dom/server';

const IncidentIcon = ({ glowSize }: { glowSize: number }) => {
  return (
    <div style={{ position: 'relative', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle, rgba(239,68,68,0.7) 0%, rgba(239,68,68,0) 65%)',
        transform: `scale(${glowSize})`,
        borderRadius: '50%',
        animation: 'pulse 2s infinite'
      }}></div>
      <div style={{
        backgroundColor: '#0f172a',
        border: '2px solid #ef4444',
        width: '24px',
        height: '24px',
        transform: 'rotate(45deg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 0 10px rgba(239,68,68,0.8)'
      }}>
        <div style={{
          transform: 'rotate(-45deg)',
          color: '#facc15',
          fontSize: '12px',
          lineHeight: 1,
          marginTop: '-1px',
          marginLeft: '1px'
        }}>⚠️</div>
      </div>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(${glowSize}); opacity: 0.8; }
            50% { transform: scale(${glowSize * 1.5}); opacity: 0.4; }
            100% { transform: scale(${glowSize}); opacity: 0.8; }
          }
        `}
      </style>
    </div>
  );
};

const createDivIcon = (component: React.ReactElement, size: [number, number] = [48, 48]) => {
  return L.divIcon({
    html: renderToStaticMarkup(component),
    className: '', // Removes default Leaflet styling like backgrounds and borders
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2]
  });
};

export default function IncidentLayer() {
  const { incidents } = useAppStore();
  const [popupInfo, setPopupInfo] = useState<any>(null);

  return (
    <>
      {incidents.filter(i => i.status === 'ACTIVE').map((i) => (
        <Marker 
          key={i.id} 
          position={i.location} 
          icon={createDivIcon(<IncidentIcon glowSize={i.glowSize || 1.2} />, [48, 48])}
          eventHandlers={{
            click: () => setPopupInfo(i)
          }}
        >
          {popupInfo?.id === i.id && (
            <Popup 
              eventHandlers={{ remove: () => setPopupInfo(null) }}
              className="text-sm custom-popup"
            >
              <div className="p-1 min-w-[150px]">
                <strong className="text-base text-gray-800 block mb-1">{i.type}</strong>
                <div className="mt-1">Severity: <span className="text-red-600 font-bold">{i.severity}</span></div>
                <div>Reported by: {i.reported_by}</div>
                <div>Time: {i.time}</div>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </>
  );
}
