const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface RouteData {
  id: number;
  route_name: string;
  origin: string;
  destination: string;
  distance_km: number;
  estimated_time_minutes: number;
  risk_score: number;
  risk_level: string;
  delay_minutes: number;
  weather_risk: number;
  news_risk: number;
  disaster_risk: number;
  status: string;
  geometry: [number, number][]; // Array of [lat, lng]
  factors: Record<string, number>;
}

export const routeApi = {
  getAllRoutes: async (): Promise<RouteData[]> => {
    try {
      const response = await fetch(`${API_URL}/api/routes/`);
      if (!response.ok) throw new Error('Failed to fetch routes');
      return await response.json();
    } catch (error) {
      console.error('Error fetching routes:', error);
      return [];
    }
  },
  
  getRouteDetails: async (id: number): Promise<RouteData | null> => {
    try {
      const response = await fetch(`${API_URL}/api/routes/${id}`);
      if (!response.ok) throw new Error('Failed to fetch route details');
      return await response.json();
    } catch (error) {
      console.error('Error fetching route details:', error);
      return null;
    }
  }
};
