import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';

export default function RiskZoneLayer() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const mockData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { risk_level: "HIGH" },
          geometry: {
            type: "Polygon",
            // GeoJSON expects [lng, lat]
            coordinates: [[[93.0, 25.0], [94.0, 25.0], [94.0, 26.0], [93.0, 26.0], [93.0, 25.0]]]
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
      style={{
        fillColor: '#f97316',
        fillOpacity: 0.3,
        stroke: false
      }}
    />
  );
}
