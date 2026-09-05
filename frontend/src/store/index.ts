import { create } from 'zustand';
import type { RouteData } from '../services/routeApi';

export type RoutePath = [number, number][];

export interface Vehicle {
  id: string | number;
  vehicle_number: string;
  type: string;
  driver: string;
  status: 'MOVING' | 'IDLE' | 'STOPPED' | 'EMERGENCY' | 'REROUTING';
  location: [number, number]; // [lat, lng]
  destination: [number, number]; // [lat, lng]
  destination_name?: string;
  origin_name?: string;
  distance?: number;
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
  routes: RouteData[];
  selectedRouteId: number | null;
  setRoutes: (routes: RouteData[]) => void;
  setSelectedRouteId: (id: number | null) => void;
  vehicles: Vehicle[];
  incidents: Incident[];
  emergencyMode: boolean;
  selectedVehicleId: string | number | null;
  focusLocation: [number, number] | null;
  setEmergencyMode: (active: boolean) => void;
  setSelectedVehicleId: (id: string | number | null) => void;
  setFocusLocation: (loc: [number, number] | null) => void;
  updateVehicleLocation: (id: string | number, location: [number, number]) => void;
  updateVehicle: (id: string | number, data: Partial<Vehicle>) => void;
  addVehicle: (vehicle: Vehicle) => void;
  addIncident: (incident: Incident) => void;
  removeIncident: (id: string) => void;
  fetchVehicles: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  routes: [],
  selectedRouteId: null,
  setRoutes: (routes) => set({ routes }),
  setSelectedRouteId: (id) => set({ selectedRouteId: id }),
  vehicles: [],
  incidents: [],
  emergencyMode: false,
  selectedVehicleId: null,
  focusLocation: null,
  setEmergencyMode: (active) => set({ emergencyMode: active }),
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setFocusLocation: (loc) => set({ focusLocation: loc }),
  updateVehicleLocation: (id, location) => set((state) => ({
    vehicles: state.vehicles.map(v => String(v.id) === String(id) ? { ...v, location } : v)
  })),
  updateVehicle: (id, data) => set((state) => ({
    vehicles: state.vehicles.map(v => String(v.id) === String(id) ? { ...v, ...data } : v)
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
  fetchVehicles: async () => {
    try {
      const res = await fetch('http://localhost:8000/api/vehicles/');
      const data = await res.json();
      
      const mappedVehicles = data.map((v: any) => ({
        id: v.id,
        vehicle_number: v.vehicle_number,
        type: v.vehicle_type || 'Truck',
        driver: v.driver_name || 'Unknown',
        status: v.status,
        location: [v.current_latitude, v.current_longitude],
        destination: v.geometry && v.geometry.length > 0 ? v.geometry[v.geometry.length - 1] : [0, 0],
        speed: v.speed || 0,
        eta: 'In transit',
        risk: 20, 
        cargo: v.cargo_type || 'Cargo',
        currentRoute: v.geometry || [],
        targetPointIndex: 1,
        progress: 0,
        isRerouted: false,
        isInitialized: true
      }));
      set({ vehicles: mappedVehicles });
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  }
}));
