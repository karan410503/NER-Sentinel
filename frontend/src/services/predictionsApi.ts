export interface EtaPrediction {
  predictedEta: string;
  standardEta: string;
  confidenceScore: number;
  factors: { name: string; impact: string; type: 'positive' | 'negative' }[];
}

export interface DisruptionForecast {
  id: string;
  type: string;
  location: string;
  probability: number;
  timeframe: string;
  recommendation: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const predictionsApi = {
  getEtaPrediction: async (origin: string, destination: string, vehicleType: string): Promise<EtaPrediction> => {
    try {
      const params = new URLSearchParams({
        origin,
        destination,
        vehicle_type: vehicleType
      });
      const response = await fetch(`${API_URL}/api/predictions/eta?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch ETA prediction');
      return await response.json();
    } catch (error) {
      console.error('Error fetching ETA:', error);
      throw error;
    }
  },

  getDisruptionForecasts: async (): Promise<DisruptionForecast[]> => {
    try {
      const response = await fetch(`${API_URL}/api/predictions/disruptions`);
      if (!response.ok) throw new Error('Failed to fetch disruptions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching disruptions:', error);
      throw error;
    }
  },

  uploadDataset: async (file: File): Promise<{ status: string; message: string; metrics: any }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/api/predictions/upload-dataset`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to upload dataset');
      
      return data;
    } catch (error) {
      console.error('Error uploading dataset:', error);
      throw error;
    }
  }
};
