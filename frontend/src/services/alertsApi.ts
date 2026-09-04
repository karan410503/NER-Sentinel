const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface SystemAlert {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  source: string;
  message: string;
  resolved: boolean;
}

export const alertsApi = {
  getInitialAlerts: async (): Promise<SystemAlert[]> => {
    try {
      const response = await fetch(`${API_URL}/api/alerts/`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return await response.json();
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  },
  
  generateRandomAlert: (): SystemAlert => {
    const severities: ('INFO' | 'WARNING' | 'CRITICAL')[] = ['INFO', 'INFO', 'WARNING', 'CRITICAL'];
    const sources = ['Disruption ML', 'Fleet Telemetry', 'Weather API', 'Delivery Core', 'System Health'];
    const messages = [
      'Minor traffic congestion detected on approach to Guwahati Hub.',
      'Vehicle telemetry signal lost for NE-04-TR-5521 in remote sector.',
      'Temperature anomaly detected in cold-chain medical shipment.',
      'System latency spike detected in primary routing engine.',
      'Unauthorized access attempt blocked at Silchar Depot gateway.'
    ];

    return {
      id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      severity: severities[Math.floor(Math.random() * severities.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      resolved: false
    };
  }
};
