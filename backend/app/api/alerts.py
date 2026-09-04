from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.incident import Incident, IncidentType, RiskLevel
from pydantic import BaseModel
from app.api.ws import manager

router = APIRouter()

class IncidentReport(BaseModel):
    type: str
    severity: str
    description: str
    latitude: float
    longitude: float
    reported_by: str | None = None

@router.get("/")
def get_alerts(db: Session = Depends(get_db)):
    incidents = db.query(Incident).filter(Incident.is_active == True).all()
    result = []
    
    # Map DB Incident model to the frontend Alert format
    for i in incidents:
        alert_type = i.risk_level.value if hasattr(i.risk_level, 'value') else str(i.risk_level)
        if alert_type in ["LOW", "MODERATE"]:
            severity = "INFO"
        elif alert_type == "ELEVATED":
            severity = "WARNING"
        else:
            severity = "CRITICAL"
            
        result.append({
            "id": f"ALT-{i.id}",
            "timestamp": i.reported_at.isoformat() if i.reported_at else "Just now",
            "severity": severity,
            "source": i.incident_type.value if hasattr(i.incident_type, 'value') else str(i.incident_type),
            "message": i.title,
            "resolved": not i.is_active,
            "latitude": i.latitude,
            "longitude": i.longitude,
            "type": i.incident_type.value if hasattr(i.incident_type, 'value') else str(i.incident_type),
        })
    return result

@router.post("/report")
async def report_incident(report: IncidentReport, db: Session = Depends(get_db)):
    # Simple mapping of frontend string to backend enum
    type_mapping = {
        "Landslide": IncidentType.LANDSLIDE,
        "Flood": IncidentType.FLOOD,
        "Road Block": IncidentType.ROAD_BLOCK,
        "Accident": IncidentType.ACCIDENT
    }
    
    severity_mapping = {
        "Low": RiskLevel.LOW,
        "Medium": RiskLevel.MODERATE,
        "High": RiskLevel.ELEVATED,
        "Critical": RiskLevel.CRITICAL
    }
    
    incident = Incident(
        title=report.description[:50],
        description=report.description,
        incident_type=type_mapping.get(report.type, IncidentType.ROAD_BLOCK),
        risk_level=severity_mapping.get(report.severity, RiskLevel.MODERATE),
        latitude=report.latitude,
        longitude=report.longitude,
        reported_by=report.reported_by,
        is_active=True
    )
    
    db.add(incident)
    db.commit()
    db.refresh(incident)
    
    # Broadcast to all clients (Admins and Drivers)
    await manager.broadcast({
        "type": "NEW_INCIDENT",
        "incident": {
            "id": f"ALT-{incident.id}",
            "type": report.type,
            "severity": report.severity,
            "description": report.description,
            "latitude": report.latitude,
            "longitude": report.longitude,
            "reported_by": report.reported_by
        }
    })
    
    # In a full production system, here we would query active vehicles, 
    # check if their route intersects this location, and send a REROUTE_COMMAND.
    # For now, the simulation on the frontend handles the rerouting logic.
    
    return {"status": "success", "incident_id": incident.id}

