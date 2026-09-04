from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.analytics import DailyMetric
from app.models.route import Route
from app.models.incident import Incident, IncidentType
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.delivery import Delivery, DeliveryStatus

router = APIRouter()

@router.get("/delivery-performance")
def get_delivery_performance(db: Session = Depends(get_db)):
    # Calculate dynamically from Deliveries
    # For a real app, you group by date. For now, we simulate the past 7 days 
    # based on active deliveries to show dynamic changes
    result = []
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    today = datetime.utcnow()
    
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        day_str = days[target_date.weekday()]
        
        # If it's today, compute from real data, otherwise use some historical data
        if i == 0:
            on_time = db.query(Delivery).filter(Delivery.status == DeliveryStatus.DELIVERED).count() + db.query(Delivery).filter(Delivery.status == DeliveryStatus.IN_TRANSIT).count()
            delayed = db.query(Delivery).filter(Delivery.status == DeliveryStatus.DELAYED).count()
            critical = db.query(Delivery).filter(Delivery.priority == "EMERGENCY").count()
            result.append({
                "day": day_str,
                "onTime": on_time,
                "delayed": delayed,
                "critical": critical
            })
        else:
            # Fallback to DailyMetric for historical
            m = db.query(DailyMetric).filter(func.date(DailyMetric.metric_date) == target_date.date()).first()
            if m:
                result.append({
                    "day": day_str,
                    "onTime": m.on_time_deliveries,
                    "delayed": m.delayed_deliveries,
                    "critical": m.critical_deliveries
                })
            else:
                result.append({
                    "day": day_str,
                    "onTime": 0, "delayed": 0, "critical": 0
                })
                
    return result

@router.get("/fleet-status")
def get_fleet_status_analytics(db: Session = Depends(get_db)):
    # Compute live from Vehicles table
    moving = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MOVING).count()
    idle = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.IDLE).count()
    delayed = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.DELAYED).count()
    emergency = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.EMERGENCY).count()
    
    return [
        { "name": 'Moving', "value": moving, "color": '#10b981' },
        { "name": 'Idle', "value": idle, "color": '#f59e0b' },
        { "name": 'Delayed', "value": delayed, "color": '#f97316' },
        { "name": 'Emergency', "value": emergency, "color": '#ef4444' },
    ]

@router.get("/incident-activity")
def get_incident_activity(db: Session = Depends(get_db)):
    # Compute live from Incident table
    landslide = db.query(Incident).filter(Incident.incident_type == IncidentType.LANDSLIDE).count()
    flood = db.query(Incident).filter(Incident.incident_type == IncidentType.FLOOD).count()
    roadDamage = db.query(Incident).filter(Incident.incident_type == IncidentType.ROAD_DAMAGE).count()
    traffic = db.query(Incident).filter(Incident.incident_type == IncidentType.TRAFFIC).count()
    weather = db.query(Incident).filter(Incident.incident_type == IncidentType.WEATHER).count()
    
    # We return a single today entry for the chart (or we could span it out)
    # The frontend expects a list of days.
    result = []
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    today = datetime.utcnow()
    
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        day_str = days[target_date.weekday()]
        
        if i == 0:
            result.append({
                "date": day_str,
                "landslide": landslide,
                "flood": flood,
                "roadDamage": roadDamage,
                "traffic": traffic,
                "weather": weather
            })
        else:
            m = db.query(DailyMetric).filter(func.date(DailyMetric.metric_date) == target_date.date()).first()
            if m:
                total = m.total_incidents
                result.append({
                    "date": day_str,
                    "landslide": int(total * 0.2),
                    "flood": int(total * 0.1),
                    "roadDamage": int(total * 0.3),
                    "traffic": int(total * 0.4),
                    "weather": 0
                })
            else:
                result.append({
                    "date": day_str,
                    "landslide": 0, "flood": 0, "roadDamage": 0, "traffic": 0, "weather": 0
                })
                
    return result

@router.get("/ai-risk-factors")
def get_ai_risk_factors(db: Session = Depends(get_db)):
    latest = db.query(DailyMetric).order_by(DailyMetric.metric_date.desc()).first()
    factors = latest.ai_factors if latest and latest.ai_factors else {"Rainfall": 82, "Terrain": 73, "Road": 61, "Traffic": 54, "Incidents": 68}
    result = []
    for k, v in factors.items():
        result.append({
            "subject": k,
            "A": v,
            "fullMark": 100
        })
    return result

@router.get("/weather-impact")
def get_weather_impact(db: Session = Depends(get_db)):
    # In a real app we'd fetch actual weather impacts. Returning mock structure.
    import random
    data = []
    for i in range(40):
        rainfall = random.randint(0, 200)
        baseRisk = (rainfall / 200) * 80
        risk = min(100, max(0, baseRisk + (random.uniform(-20, 20))))
        data.append({
            "rainfall": rainfall,
            "risk": round(risk),
            "route": f"Route {chr(65 + (i % 5))}",
            "status": 'Critical' if risk > 75 else 'Warning' if risk > 50 else 'Normal'
        })
    return data

@router.get("/route-comparison")
def get_route_comparison(db: Session = Depends(get_db)):
    routes = db.query(Route).limit(3).all()
    result = []
    for idx, r in enumerate(routes):
        result.append({
            "route": r.route_name,
            "distance": r.distance_km,
            "eta": f"{int(r.estimated_time_minutes) // 60}h {int(r.estimated_time_minutes) % 60}m" if r.estimated_time_minutes else "N/A",
            "risk": int(r.risk_score),
            "recommended": idx == 0
        })
    return result

@router.get("/district-accessibility")
def get_district_accessibility():
    return [
      { "district": 'District A', "score": 92, "status": 'safe' },
      { "district": 'District B', "score": 81, "status": 'safe' },
      { "district": 'District C', "score": 68, "status": 'warning' },
      { "district": 'District D', "score": 41, "status": 'risk' },
      { "district": 'District E', "score": 23, "status": 'critical' },
    ]

@router.get("/route-risk-forecast")
def get_route_risk_forecast():
    return [
      { "time": 'Now', "risk": 18, "riskLevel": 'LOW', "factor": 'Normal conditions' },
      { "time": '+1h', "risk": 31, "riskLevel": 'MODERATE', "factor": 'Increasing traffic' },
      { "time": '+2h', "risk": 49, "riskLevel": 'MODERATE', "factor": 'Rainfall expected' },
      { "time": '+3h', "risk": 82, "riskLevel": 'HIGH', "factor": 'Heavy rainfall + landslide probability' },
      { "time": '+6h', "risk": 67, "riskLevel": 'ELEVATED', "factor": 'Rain subsiding, wet roads' },
      { "time": '+12h', "risk": 24, "riskLevel": 'LOW', "factor": 'Conditions normalized' },
    ]
