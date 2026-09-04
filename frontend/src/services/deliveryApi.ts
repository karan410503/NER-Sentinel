const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Delivery {
  id: string;
  origin: string;
  destination: string;
  status: 'EN_ROUTE' | 'DELAYED' | 'CRITICAL' | 'DELIVERED';
  progress: number;
  eta: string;
  priority: 'NORMAL' | 'HIGH' | 'EMERGENCY';
  assignedVehicle: string;
  type: string;
  lastUpdated: string;
}

export const deliveryApi = {
  getActiveDeliveries: async (): Promise<Delivery[]> => {
    try {
      const response = await fetch(`${API_URL}/api/deliveries/`);
      if (!response.ok) throw new Error('Failed to fetch deliveries');
      return await response.json();
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      // Return empty array as fallback
      return [];
    }
  }
};
