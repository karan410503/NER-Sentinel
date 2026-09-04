from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.analytics import DailyMetric
from app.models.route import Route
from app.models.incident import Incident

router = APIRouter()

@router.get("/delivery-performance")
def get_delivery_performance(db: Session = Depends(get_db)):
    metrics = db.query(DailyMetric).order_by(DailyMetric.metric_date.asc()).limit(7).all()
    result = []
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for m in metrics:
        day_str = days[m.metric_date.weekday()]
        result.append({
            "day": day_str,
            "onTime": m.on_time_deliveries,
            "delayed": m.delayed_deliveries,
            "critical": m.critical_deliveries
        })
    return result

@router.get("/fleet-status")
def get_fleet_status_analytics(db: Session = Depends(get_db)):
    # We could aggregate live data, but for dashboard speed we use the latest daily metric
    latest = db.query(DailyMetric).order_by(DailyMetric.metric_date.desc()).first()
    if not latest:
        return []
    
    return [
        { "name": 'Moving', "value": latest.active_vehicles, "color": '#10b981' },
        { "name": 'Idle', "value": latest.idle_vehicles, "color": '#f59e0b' },
        { "name": 'Delayed', "value": int(latest.delayed_deliveries * 0.5), "color": '#f97316' },
        { "name": 'Emergency', "value": latest.critical_deliveries, "color": '#ef4444' },
    ]

@router.get("/incident-activity")
def get_incident_activity(db: Session = Depends(get_db)):
    metrics = db.query(DailyMetric).order_by(DailyMetric.metric_date.asc()).limit(7).all()
    result = []
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for m in metrics:
        day_str = days[m.metric_date.weekday()]
        # Using a simplistic mock distribution derived from total_incidents
        total = m.total_incidents
        result.append({
            "date": day_str,
            "landslide": int(total * 0.2),
            "flood": int(total * 0.1),
            "roadDamage": int(total * 0.3),
            "traffic": int(total * 0.4)
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
            "eta": f"{r.estimated_time_minutes // 60}h {r.estimated_time_minutes % 60}m",
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
