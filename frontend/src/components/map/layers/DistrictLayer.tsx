import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';

export default function DistrictLayer() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // In real app, fetch from /api/v1/gis/districts
    // For now, mock a bounding box for Assam
    const mockData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { district_name: "Kamrup", risk_score: 30 },
          geometry: {
            type: "Polygon",
            // GeoJSON coordinates are [lng, lat]
            coordinates: [[[91.0, 26.0], [92.0, 26.0], [92.0, 27.0], [91.0, 27.0], [91.0, 26.0]]]
          }
        }
      ]
    };
    setData(mockData);
  }, []);

  if (!data) return null;

  return (
    <GeoJSON 
      data={data} 
      style={(feature) => ({
        fillColor: (feature?.properties?.risk_score || 0) >= 70 ? '#ef4444' : '#3b82f6',
        fillOpacity: 0.1,
        color: '#ffffff',
        weight: 1,
        opacity: 0.5
      })}
    />
  );
}
