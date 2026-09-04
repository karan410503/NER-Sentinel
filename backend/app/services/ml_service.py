import os
import xgboost as xgb
import random
import logging
from app.services.weather_service import weather_service
from app.services.news_service import news_service
from app.core.database import SessionLocal
from app.models.incident import Incident
from sqlalchemy.orm import Session
from sqlalchemy import func

logger = logging.getLogger(__name__)

class MLService:
    def __init__(self):
        self.eta_model = None
        self.disruption_model = None
        
        # Vehicle mapping
        self.vehicle_map = {
            'Heavy Truck (Medicine)': 0,
            'Medium Truck (Food Supply)': 1,
            'Light Vehicle (Fast Relief)': 2
        }

    def load_models(self):
        models_dir = os.path.join(os.path.dirname(__file__), '..', 'ml', 'saved_models')
        eta_model_path = os.path.join(models_dir, 'eta_xgboost.json')
        disruption_model_path = os.path.join(models_dir, 'disruption_xgboost.json')
        
        if os.path.exists(eta_model_path):
            self.eta_model = xgb.Booster()
            self.eta_model.load_model(eta_model_path)
            print("Loaded ETA Model.")
            
        if os.path.exists(disruption_model_path):
            self.disruption_model = xgb.Booster()
            self.disruption_model.load_model(disruption_model_path)
            print("Loaded Disruption Model.")

    async def predict_eta(self, origin: str, destination: str, vehicle_type: str, distance_km: float, duration_minutes: float, dest_coords: tuple = None):
        """
        Calculates Comprehensive Risk and ETA.
        Risk = Base Route + Weather + News + Disasters
        """
        base_distance = distance_km
        
        # 1. Fetch Weather Risk
        weather_risk_val = 0
        weather_desc = "Clear"
        if dest_coords:
            weather_data = await weather_service.get_weather_risk(dest_coords[0], dest_coords[1])
            weather_risk_val = weather_data.get("risk_score", 0)
            weather_desc = weather_data.get("condition", "Clear")
            
        weather_severity = weather_risk_val / 10.0 # scale 0-10 for ML Model
            
        # 2. Fetch News Risk
        news_data = await news_service.get_regional_news_risk(destination.split(',')[0])
        news_risk_val = news_data.get("risk_score", 0)
        news_desc = news_data.get("headline", "")
        
        # 3. Fetch Disaster Risk (from DB incidents in the area)
        disaster_risk_val = 0
        disaster_desc = ""
        db: Session = SessionLocal()
        try:
            active_incidents = db.query(Incident).filter(Incident.is_active == True).all()
            if dest_coords:
                import math
                def haversine(lat1, lon1, lat2, lon2):
                    R = 6371 # Earth radius in km
                    dLat = math.radians(lat2 - lat1)
                    dLon = math.radians(lon2 - lon1)
                    a = math.sin(dLat/2) * math.sin(dLat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2) * math.sin(dLon/2)
                    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                    return R * c

                for inc in active_incidents:
                    if inc.latitude and inc.longitude:
                        dist = haversine(dest_coords[0], dest_coords[1], inc.latitude, inc.longitude)
                        # Default radius if geometry doesn't exist
                        radius = 50.0
                        if inc.geometry and isinstance(inc.geometry, dict):
                            radius = float(inc.geometry.get("radius_km", 50.0))
                            
                        if dist <= radius:
                            penalty = 40 if inc.risk_level == 'CRITICAL' else 20 if inc.risk_level == 'ELEVATED' else 10
                            disaster_risk_val = min(disaster_risk_val + penalty, 50)
                            disaster_desc = f"Proximity to {inc.title} ({dist:.1f}km away)"
        finally:
            db.close()
            
        terrain_complexity = 5.0
        if "Shillong" in destination or "Tawang" in destination or "Kohima" in destination:
            terrain_complexity = 8.0
            
        vehicle_encoded = self.vehicle_map.get(vehicle_type, 1)
        
        features = [[vehicle_encoded, base_distance, weather_severity, terrain_complexity]]
        feature_names = ['vehicle_type_encoded', 'base_distance_km', 'weather_severity', 'terrain_complexity']
        
        dmatrix = xgb.DMatrix(features, feature_names=feature_names)
        
        predicted_eta_minutes = duration_minutes
        
        if self.eta_model:
            predicted_eta_minutes = self.eta_model.predict(dmatrix)[0]
            
        # Comprehensive Risk Calculation (0-100)
        # Base terrain risk (up to 30) + Weather (up to 30) + News (up to 20) + Disaster (up to 20)
        base_risk = (terrain_complexity / 10.0) * 30
        comp_risk = base_risk + (weather_risk_val * 0.3) + (news_risk_val * 0.2) + disaster_risk_val
        final_risk = min(100.0, max(0.0, comp_risk))
        
        # Also, check if ETA is severely delayed vs standard
        delay_ratio = predicted_eta_minutes / (duration_minutes if duration_minutes > 0 else 1)
        if delay_ratio > 1.5:
            final_risk = min(100.0, final_risk + 20) # Add delay risk penalty
        
        confidence = 100 - final_risk
        
        # Trigger alert if risk is critical (>60)
        if final_risk > 60:
            self._trigger_risk_alert(origin, destination, final_risk, [weather_desc, news_desc], dest_coords)
        
        factors = [
            {"name": "Terrain Difficulty", "impact": f"+{int(terrain_complexity * 2)}m", "type": "negative" if terrain_complexity > 5 else "positive"},
            {"name": "Weather Condition", "impact": f"{weather_desc} ({int(weather_risk_val)}% risk)", "type": "negative" if weather_risk_val > 40 else "positive"},
            {"name": "Regional News", "impact": news_desc, "type": "negative" if news_risk_val > 20 else "positive"}
        ]
        
        if disaster_desc:
            factors.append({
                "name": "Disaster Proximity", 
                "impact": disaster_desc, 
                "type": "negative"
            })
            
        return {
            "predictedEta": f"{int(predicted_eta_minutes // 60)}h {int(predicted_eta_minutes % 60)}m",
            "predictedEtaMinutes": int(predicted_eta_minutes),
            "standardEta": f"{int(duration_minutes // 60)}h {int(duration_minutes % 60)}m",
            "confidenceScore": confidence,
            "finalRiskScore": final_risk,
            "factors": factors
        }

    def get_disruption_forecasts(self):
        forecasts = []
        locations = [
            ("NH-37, near Kaziranga", 8.0, 4.0),
            ("Silchar Lowlands", 9.0, 5.0),
            ("Dimapur-Kohima Highway", 5.0, 8.0)
        ]
        feature_names = ['vehicle_type_encoded', 'base_distance_km', 'weather_severity', 'terrain_complexity']
        
        for idx, (loc, weather, terrain) in enumerate(locations):
            features = [[0, 100, weather, terrain]]
            dmatrix = xgb.DMatrix(features, feature_names=feature_names)
            
            probability = 50
            if self.disruption_model:
                prob = self.disruption_model.predict(dmatrix)[0]
                probability = int(prob * 100)
            
            if probability > 30:
                forecasts.append({
                    "id": f"DF-{idx+1:03d}",
                    "type": "Severe Weather Risk" if weather > 7 else "Road Collapse Risk",
                    "location": loc,
                    "probability": probability,
                    "timeframe": "+6 Hours",
                    "recommendation": "Reroute critical supplies immediately" if probability > 70 else "Monitor situation"
                })
        
        return forecasts
        
    def _trigger_risk_alert(self, origin: str, destination: str, risk: float, factors: list, dest_coords: tuple):
        """Creates a high-risk alert incident if one doesn't already exist for this location today."""
        db: Session = SessionLocal()
        try:
            from app.api.ws import manager
            import asyncio
            from datetime import datetime, timezone, timedelta
            
            # Deduplication: check if similar alert exists in last 12 hours
            twelve_hours_ago = datetime.now(timezone.utc) - timedelta(hours=12)
            existing = db.query(Incident).filter(
                Incident.incident_type == IncidentType.WEATHER, 
                Incident.location.like(f"%{destination}%"),
                Incident.reported_at >= twelve_hours_ago
            ).first()
            
            if not existing:
                incident = Incident(
                    title=f"High Risk Route Detected: to {destination}",
                    description=f"Automated risk engine flagged this route with a score of {risk:.1f}/100. Factors: {', '.join(f for f in factors if f)}",
                    incident_type=IncidentType.WEATHER, # Or a new type like SYSTEM_ALERT
                    risk_level='CRITICAL' if risk > 80 else 'HIGH',
                    location=destination,
                    latitude=dest_coords[0] if dest_coords else None,
                    longitude=dest_coords[1] if dest_coords else None,
                    is_active=True
                )
                db.add(incident)
                db.commit()
                
                # Broadcast asynchronously using asyncio.create_task if we are in an event loop
                alert_payload = {
                    "type": "NEW_INCIDENT",
                    "incident": {
                        "id": f"ALT-{incident.id}",
                        "type": "System Alert",
                        "severity": incident.risk_level,
                        "description": incident.description,
                        "latitude": incident.latitude,
                        "longitude": incident.longitude,
                        "reported_by": "Risk Engine"
                    }
                }
                
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(manager.broadcast(alert_payload))
                except RuntimeError:
                    # Not in an event loop (e.g. running sync)
                    pass
        except Exception as e:
            logger.error(f"Error triggering risk alert: {e}")
        finally:
            db.close()

ml_service = MLService()
