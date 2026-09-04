import NERMap from '../../components/map/NERMap';

export default function MapPage() {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="mb-4 shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-white">Command Center Map</h2>
        <p className="text-sm text-gray-400 mt-1">Real-time GPS tracking and AI risk intelligence using Leaflet</p>
      </div>
      
      <div className="flex-1 glass-panel overflow-hidden relative rounded-xl border border-white/10">
        <NERMap />
      </div>
    </div>
  );
}
