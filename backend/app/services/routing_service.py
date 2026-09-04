import httpx
from typing import Tuple, Dict, Any, Optional

class RoutingService:
    def __init__(self):
        self.nominatim_url = "https://nominatim.openstreetmap.org/search"
        self.osrm_url = "http://router.project-osrm.org/route/v1/driving"
        self.headers = {
            "User-Agent": "NERSentinelApp/1.0 (contact@example.com)"
        }

    def geocode(self, location_name: str) -> Optional[Tuple[float, float]]:
        """
        Convert a location name into (latitude, longitude) using Nominatim.
        """
        try:
            params = {
                "q": location_name,
                "format": "json",
                "limit": 1
            }
            # Adding a timeout for external API resilience
            with httpx.Client(timeout=10.0) as client:
                response = client.get(self.nominatim_url, params=params, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                
                if data and len(data) > 0:
                    # Nominatim returns strings for lat/lon
                    lat = float(data[0]["lat"])
                    lng = float(data[0]["lon"])
                    return (lat, lng)
            return None
        except Exception as e:
            print(f"Error geocoding '{location_name}': {str(e)}")
            return None

    def get_route(self, origin: Tuple[float, float], destination: Tuple[float, float]) -> Optional[Dict[str, Any]]:
        """
        Get route information from OSRM.
        origin and destination are tuples of (lat, lng).
        """
        try:
            # OSRM expects lng,lat
            origin_str = f"{origin[1]},{origin[0]}"
            dest_str = f"{destination[1]},{destination[0]}"
            
            url = f"{self.osrm_url}/{origin_str};{dest_str}"
            params = {
                "overview": "full",
                "geometries": "geojson",
                "alternatives": "false"
            }
            
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                    route = data["routes"][0]
                    # Convert coords from [lng, lat] to [lat, lng] for frontend simulation compatibility
                    raw_coords = route["geometry"]["coordinates"]
                    converted_coords = [[c[1], c[0]] for c in raw_coords]
                    
                    return {
                        "distance_km": route["distance"] / 1000.0,
                        "duration_minutes": route["duration"] / 60.0,
                        "geometry": converted_coords
                    }
            return None
        except Exception as e:
            print(f"Error fetching route from OSRM: {str(e)}")
            return None

routing_service = RoutingService()
