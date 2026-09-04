const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const analyticsApi = {
  getRouteRiskForecast: async () => {
    const res = await fetch(`${API_URL}/api/analytics/route-risk-forecast`);
    return await res.json();
  },

  getDistrictAccessibility: async () => {
    const res = await fetch(`${API_URL}/api/analytics/district-accessibility`);
    return await res.json();
  },

  getDeliveryPerformance: async () => {
    const res = await fetch(`${API_URL}/api/analytics/delivery-performance`);
    return await res.json();
  },

  getFleetStatus: async () => {
    const res = await fetch(`${API_URL}/api/analytics/fleet-status`);
    return await res.json();
  },

  getWeatherImpact: async () => {
    const res = await fetch(`${API_URL}/api/analytics/weather-impact`);
    return await res.json();
  },

  getIncidentActivity: async () => {
    const res = await fetch(`${API_URL}/api/analytics/incident-activity`);
    return await res.json();
  },

  getAiRiskFactors: async () => {
    const res = await fetch(`${API_URL}/api/analytics/ai-risk-factors`);
    return await res.json();
  },
  
  getRouteComparison: async () => {
    const res = await fetch(`${API_URL}/api/analytics/route-comparison`);
    return await res.json();
  }
};
