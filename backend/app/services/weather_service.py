import httpx
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class WeatherService:
    def __init__(self):
        self.api_key = settings.WEATHER_API_KEY
        self.base_url = "https://api.openweathermap.org/data/2.5/weather"
        
    async def get_weather_risk(self, lat: float, lng: float) -> dict:
        """
        Fetches current weather for a location and computes a risk multiplier (0 to 100).
        """
        if not self.api_key:
            logger.warning("WEATHER_API_KEY not set. Using fallback simulated weather data.")
            return self._simulate_weather_risk(lat, lng)
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params={
                    "lat": lat,
                    "lon": lng,
                    "appid": self.api_key,
                    "units": "metric"
                })
                
                if response.status_code != 200:
                    logger.error(f"OpenWeather API Error: {response.text}")
                    return self._simulate_weather_risk(lat, lng)
                    
                data = response.json()
                return self._parse_weather_risk(data)
                
        except Exception as e:
            logger.error(f"Failed to fetch weather: {e}")
            return self._simulate_weather_risk(lat, lng)
            
    def _parse_weather_risk(self, data: dict) -> dict:
        weather_id = data['weather'][0]['id']
        description = data['weather'][0]['description']
        temp = data['main']['temp']
        wind_speed = data['wind']['speed']
        
        risk = 0.0
        
        # Weather Condition Codes (2xx: Thunderstorm, 3xx: Drizzle, 5xx: Rain, 6xx: Snow, 7xx: Atmosphere, 8xx: Clear/Clouds)
        if 200 <= weather_id < 300: # Thunderstorm
            risk += 40
        elif 500 <= weather_id < 600: # Rain
            risk += 30
        elif 600 <= weather_id < 700: # Snow
            risk += 50
        elif weather_id in [741, 701]: # Fog/Mist
            risk += 20
            
        if wind_speed > 15: # High winds
            risk += 20
            
        return {
            "risk_score": min(risk, 100.0),
            "condition": description,
            "temp": temp,
            "wind": wind_speed
        }
        
    def _simulate_weather_risk(self, lat: float, lng: float) -> dict:
        """Fallback simulation when API is unavailable"""
        import random
        # Create some random deterministic-ish weather based on lat/lng
        seed = int(lat * lng * 100)
        random.seed(seed)
        
        risk = random.choice([0, 10, 30, 60])
        condition = "Clear"
        if risk == 10: condition = "Cloudy"
        elif risk == 30: condition = "Moderate Rain"
        elif risk == 60: condition = "Heavy Thunderstorms"
        
        return {
            "risk_score": risk,
            "condition": condition,
            "temp": random.randint(20, 35),
            "wind": random.randint(5, 25)
        }

weather_service = WeatherService()
