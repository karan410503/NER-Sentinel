import httpx
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class NewsService:
    def __init__(self):
        self.api_key = settings.NEWS_API_KEY
        self.base_url = "https://newsdata.io/api/1/news"
        
    async def get_regional_news_risk(self, region_name: str) -> dict:
        """
        Fetches recent news for a region and computes a disruption risk score.
        """
        if not self.api_key:
            logger.warning("NEWS_API_KEY not set. Using fallback simulated news data.")
            return self._simulate_news_risk(region_name)
            
        try:
            async with httpx.AsyncClient() as client:
                # Search for region name + keywords like flood, landslide, accident, blocked
                query = f"{region_name} AND (flood OR landslide OR accident OR blocked OR protest)"
                response = await client.get(self.base_url, params={
                    "apikey": self.api_key,
                    "q": query,
                    "language": "en"
                })
                
                if response.status_code != 200:
                    logger.error(f"NewsData API Error: {response.text}")
                    return self._simulate_news_risk(region_name)
                    
                data = response.json()
                return self._parse_news_risk(data)
                
        except Exception as e:
            logger.error(f"Failed to fetch news: {e}")
            return self._simulate_news_risk(region_name)
            
    def _parse_news_risk(self, data: dict) -> dict:
        results = data.get('results', [])
        if not results:
            return {"risk_score": 0.0, "headline": "No recent disruptions reported."}
            
        # If we have hits on our negative keywords, increment risk
        risk = min(len(results) * 15, 60.0) # Cap at 60
        top_headline = results[0].get('title', "Disruption reported in area")
        
        return {
            "risk_score": risk,
            "headline": top_headline
        }
        
    def _simulate_news_risk(self, region_name: str) -> dict:
        import random
        # Seed based on region string
        seed = sum(ord(c) for c in region_name)
        random.seed(seed)
        
        risk = random.choice([0, 0, 0, 20, 50])
        headline = "No recent disruptions reported."
        
        if risk == 20:
            headline = f"Minor traffic delays expected in {region_name} due to protests."
        elif risk == 50:
            headline = f"Reports of severe road damage near {region_name}."
            
        return {
            "risk_score": risk,
            "headline": headline
        }

news_service = NewsService()
