import { create } from 'zustand';

export type RoutePath = [number, number][];

export interface Vehicle {
  id: string;
  vehicle_number: string;
  type: string;
  driver: string;
  status: 'MOVING' | 'IDLE' | 'STOPPED' | 'EMERGENCY' | 'REROUTING';
  location: [number, number]; // [lat, lng]
  destination: [number, number]; // [lat, lng]
  speed: number;
  eta: string;
  risk: number;
  cargo?: string;
  
  // Simulation properties
  currentRoute: RoutePath;
  originalRoute?: RoutePath; // Add originalRoute to store blocked route
  targetPointIndex: number; // The next point in the route it's heading to
  progress: number; // 0 to 1 between current point and next point
  isRerouted: boolean;
  isInitialized: boolean; // Flag to check if real OSM route has been fetched
}

export interface Incident {
  id: string;
  type: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  location: [number, number]; // [lat, lng]
  reported_by: string;
  status: 'ACTIVE' | 'RESOLVED';
  time: string;
  glowSize: number;
}

interface AppState {
  vehicles: Vehicle[];
  incidents: Incident[];
  emergencyMode: boolean;
  selectedVehicleId: string | null;
  focusLocation: [number, number] | null;
  setEmergencyMode: (active: boolean) => void;
  setSelectedVehicleId: (id: string | null) => void;
  setFocusLocation: (loc: [number, number] | null) => void;
  updateVehicleLocation: (id: string, location: [number, number]) => void;
  updateVehicle: (id: string, data: Partial<Vehicle>) => void;
  addVehicle: (vehicle: Vehicle) => void;
  addIncident: (incident: Incident) => void;
  removeIncident: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  vehicles: [
    { 
      id: 'v1', vehicle_number: 'NE-12-AB-1234', type: 'Medicine Truck', driver: 'Rahul S.', 
      status: 'MOVING', location: [26.1445, 91.7362], destination: [24.8333, 92.7789], speed: 60, eta: 'Calculating...', risk: 18, cargo: 'High (Medical/Emergency)',
      currentRoute: [[26.1445, 91.7362], [24.8333, 92.7789]], targetPointIndex: 1, progress: 0, isRerouted: false, isInitialized: false
    },
    { 
      id: 'v2', vehicle_number: 'NE-01-XX-9876', type: 'Food Supply', driver: 'Amit B.', 
      status: 'MOVING', location: [26.1445, 91.7362], destination: [25.5788, 91.8933], speed: 45, eta: 'Calculating...', risk: 45, cargo: 'Normal (Essential Supplies)',
      currentRoute: [[26.1445, 91.7362], [25.5788, 91.8933]], targetPointIndex: 1, progress: 0, isRerouted: false, isInitialized: false
    },
  ],
  incidents: [],
  emergencyMode: false,
  selectedVehicleId: null,
  focusLocation: null,
  setEmergencyMode: (active) => set({ emergencyMode: active }),
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setFocusLocation: (loc) => set({ focusLocation: loc }),
  updateVehicleLocation: (id, location) => set((state) => ({
    vehicles: state.vehicles.map(v => v.id === id ? { ...v, location } : v)
  })),
  updateVehicle: (id, data) => set((state) => ({
    vehicles: state.vehicles.map(v => v.id === id ? { ...v, ...data } : v)
  })),
  addVehicle: (vehicle) => set((state) => ({
    vehicles: [vehicle, ...state.vehicles]
  })),
  addIncident: (incident) => set((state) => ({
    incidents: [incident, ...state.incidents]
  })),
  removeIncident: (id) => set((state) => ({
    incidents: state.incidents.filter(i => i.id !== id)
  })),
}));
