const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface AssignVehiclePayload {
  vehicle_number: string;
  type: string;
  driver: string;
  cargo: string;
  current_location_name: string;
  destination_name: string;
  departure_time?: string;
}

export interface RerouteVehiclePayload {
  new_destination: string;
  reason: string;
}

export const vehicleApi = {
  getFleet: async () => {
    const res = await fetch(`${API_URL}/api/vehicles/`);
    if (!res.ok) throw new Error('Failed to fetch fleet');
    return res.json();
  },
  
  assignVehicle: async (payload: AssignVehiclePayload) => {
    const res = await fetch(`${API_URL}/api/vehicles/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to assign vehicle');
    }
    return res.json();
  },
  
  rerouteVehicle: async (vehicleId: string | number, payload: RerouteVehiclePayload) => {
    const res = await fetch(`${API_URL}/api/vehicles/${vehicleId}/reroute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to reroute vehicle');
    }
    return res.json();
  }
};
