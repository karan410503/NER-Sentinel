import { useAppStore } from '../../store';
import { Truck, MapPin, AlertCircle, Clock, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VehiclesPage() {
  const { vehicles, addVehicle, setSelectedVehicleId, updateVehicle } = useAppStore();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_number: '',
    type: 'Heavy Truck',
    driver: '',
    cargo: 'Normal (Essential Supplies)',
  });

  const handleAssign = () => {
    if (!newVehicle.vehicle_number || !newVehicle.driver) return;
    
    addVehicle({
      id: `v_${Date.now()}`,
      vehicle_number: newVehicle.vehicle_number,
      type: newVehicle.type,
      driver: newVehicle.driver,
      cargo: newVehicle.cargo,
      status: 'IDLE',
      location: [26.1445, 91.7362], // Default Guwahati
      destination: [25.5788, 91.8933], // Default Shillong
      speed: 0,
      eta: 'N/A',
      risk: 5,
      currentRoute: [[26.1445, 91.7362], [25.5788, 91.8933]],
      targetPointIndex: 1,
      progress: 0,
      isRerouted: false,
      isInitialized: false,
    });
    
    setShowModal(false);
    setNewVehicle({ vehicle_number: '', type: 'Heavy Truck', driver: '', cargo: 'Normal (Essential Supplies)' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Vehicles Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">Monitor active supply chain fleet and status</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-ner-primary text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#00b8d9] transition flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" /> Assign Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {vehicles.map(v => (
          <div key={v.id} className="glass-panel p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${v.status === 'MOVING' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{v.vehicle_number}</h3>
                  <p className="text-xs text-gray-400">{v.type} • Driver: {v.driver}</p>
                  <p className="text-xs text-ner-primary mt-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-ner-primary rounded-full mr-1.5"></span>
                    {v.cargo || 'Normal Cargo'}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                v.status === 'MOVING' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {v.status}
              </span>
            </div>

            <div className="space-y-3 mt-5">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center text-gray-400"><MapPin className="w-4 h-4 mr-2" /> Speed</span>
                <span className="font-mono text-white">{v.speed} km/h</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center text-gray-400"><Clock className="w-4 h-4 mr-2" /> ETA</span>
                <span className="font-mono text-white">{v.eta}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center text-gray-400"><AlertCircle className="w-4 h-4 mr-2" /> Route Risk</span>
                <span className={`font-mono ${v.risk > 50 ? 'text-red-400' : 'text-green-400'}`}>{v.risk}%</span>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
              <button 
                onClick={() => {
                  setSelectedVehicleId(v.id);
                  navigate('/map');
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white text-sm py-2 rounded transition"
              >
                View on Map
              </button>
              <button 
                onClick={() => {
                  updateVehicle(v.id, { 
                    isInitialized: false, // forces re-fetch of OSRM route
                    targetPointIndex: 1, 
                    isRerouted: true, 
                    status: 'MOVING' 
                  });
                  setSelectedVehicleId(v.id);
                  navigate('/map');
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white text-sm py-2 rounded transition"
              >
                Reroute
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0f1c] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Assign New Vehicle</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Vehicle Number</label>
                <input 
                  type="text" 
                  value={newVehicle.vehicle_number}
                  onChange={(e) => setNewVehicle({...newVehicle, vehicle_number: e.target.value})}
                  placeholder="e.g. AS-01-HC-1234" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-ner-primary" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Vehicle Type</label>
                <select 
                  value={newVehicle.type}
                  onChange={(e) => setNewVehicle({...newVehicle, type: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-ner-primary"
                >
                  <option>Heavy Truck</option>
                  <option>Medium Commercial</option>
                  <option>Light Delivery Van</option>
                  <option>Drone (Emergency)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Driver Name</label>
                <input 
                  type="text" 
                  value={newVehicle.driver}
                  onChange={(e) => setNewVehicle({...newVehicle, driver: e.target.value})}
                  placeholder="Enter driver name" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-ner-primary" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cargo Priority</label>
                <select 
                  value={newVehicle.cargo}
                  onChange={(e) => setNewVehicle({...newVehicle, cargo: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-ner-primary"
                >
                  <option>High (Medical/Emergency)</option>
                  <option>Normal (Essential Supplies)</option>
                  <option>Low (Standard Logistics)</option>
                </select>
              </div>
              
              <button 
                onClick={handleAssign}
                disabled={!newVehicle.vehicle_number || !newVehicle.driver}
                className="w-full bg-ner-primary text-black font-bold py-3 rounded-lg hover:bg-[#00b8d9] transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
