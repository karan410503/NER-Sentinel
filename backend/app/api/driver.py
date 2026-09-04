from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, RoleEnum
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.delivery import Delivery, DeliveryStatus
from app.models.incident import Incident, IncidentType, RiskLevel
from app.api.ws import manager

router = APIRouter()

# Dependency to ensure only drivers can access these endpoints
def get_current_driver(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.DRIVER:
        raise HTTPException(status_code=403, detail="Not enough permissions. Driver role required.")
    return current_user

class StatusUpdate(BaseModel):
    status: str
    lat: float
    lng: float

class IncidentReport(BaseModel):
    incident_type: str
    severity: str
    description: str
    lat: float
    lng: float
    vehicle_id: Optional[int] = None

class SOSAlert(BaseModel):
    lat: float
    lng: float
    vehicle_id: Optional[int] = None

@router.get("/me/vehicle")
def get_my_vehicle(
    db: Session = Depends(get_db),
    current_driver: User = Depends(get_current_driver)
):
    """Get the vehicle assigned to the current driver."""
    vehicle = db.query(Vehicle).filter(Vehicle.driver_id == current_driver.id).first()
    if not vehicle:
        return {"assigned": False, "vehicle": None}
    
    return {
        "assigned": True,
        "vehicle": {
            "id": vehicle.id,
            "vehicle_number": vehicle.vehicle_number,
            "registration_number": vehicle.registration_number,
            "vehicle_type": vehicle.vehicle_type,
            "status": vehicle.status.value,
        }
    }

@router.get("/me/trip")
def get_my_active_trip(
    db: Session = Depends(get_db),
    current_driver: User = Depends(get_current_driver)
):
    """Get the active delivery (trip) assigned to the driver's vehicle."""
    vehicle = db.query(Vehicle).filter(Vehicle.driver_id == current_driver.id).first()
    if not vehicle:
        return {"has_trip": False, "trip": None}
    
    # Find active delivery for this vehicle
    delivery = db.query(Delivery).filter(
        Delivery.vehicle_id == vehicle.id,
        Delivery.status.in_([DeliveryStatus.ASSIGNED, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELAYED, DeliveryStatus.EMERGENCY])
    ).first()
    
    if not delivery:
        return {"has_trip": False, "trip": None}
        
    return {
        "has_trip": True,
        "trip": {
            "id": delivery.id,
            "delivery_number": delivery.delivery_number,
            "origin": delivery.origin,
            "destination": delivery.destination,
            "origin_lat": delivery.origin_lat,
            "origin_lng": delivery.origin_lng,
            "destination_lat": delivery.destination_lat,
            "destination_lng": delivery.destination_lng,
            "status": delivery.status.value,
            "cargo_type": delivery.cargo_type,
            "estimated_arrival": delivery.estimated_arrival.isoformat() if delivery.estimated_arrival else None
        }
    }

@router.put("/trip/{delivery_id}/status")
def update_trip_status(
    delivery_id: int,
    status_update: StatusUpdate,
    db: Session = Depends(get_db),
    current_driver: User = Depends(get_current_driver)
):
    """Update the status of a trip (Start, Pause, End, Cancel)."""
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    vehicle = db.query(Vehicle).filter(Vehicle.id == delivery.vehicle_id).first()
    if not vehicle or vehicle.driver_id != current_driver.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this trip")

    # Map frontend status to DB Enum
    status_map = {
        "IN_TRANSIT": DeliveryStatus.IN_TRANSIT,
        "DELAYED": DeliveryStatus.DELAYED,  # Used for paused
        "DELIVERED": DeliveryStatus.DELIVERED,
        "CANCELLED": DeliveryStatus.CANCELLED
    }
    
    if status_update.status in status_map:
        delivery.status = status_map[status_update.status]
        
        # Also update vehicle status
        if status_update.status == "IN_TRANSIT":
            vehicle.status = VehicleStatus.MOVING
        elif status_update.status == "DELIVERED" or status_update.status == "CANCELLED":
            vehicle.status = VehicleStatus.IDLE
            if status_update.status == "DELIVERED":
                from datetime import timezone
                delivery.actual_arrival = datetime.now(timezone.utc)
        elif status_update.status == "DELAYED":
            vehicle.status = VehicleStatus.STOPPED
            
        vehicle.current_latitude = status_update.lat
        vehicle.current_longitude = status_update.lng
        
        db.commit()
        return {"success": True, "status": delivery.status.value}
    
    raise HTTPException(status_code=400, detail="Invalid status")

@router.post("/incident")
async def report_incident(
    report: IncidentReport,
    db: Session = Depends(get_db),
    current_driver: User = Depends(get_current_driver)
):
    """Report an incident from the driver app."""
    try:
        incident_type = IncidentType(report.incident_type)
    except ValueError:
        incident_type = IncidentType.TRAFFIC # Default
        
    try:
        risk_level = RiskLevel(report.severity)
    except ValueError:
        risk_level = RiskLevel.MODERATE

    new_incident = Incident(
        title=f"Reported by Driver {current_driver.name}",
        incident_type=incident_type,
        risk_level=risk_level,
        description=report.description,
        latitude=report.lat,
        longitude=report.lng,
        is_active=True
    )
    
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    
    # Broadcast to admin
    await manager.broadcast({
        "type": "NEW_INCIDENT",
        "incident_id": new_incident.id,
        "incident_type": new_incident.incident_type.value,
        "risk_level": new_incident.risk_level.value,
        "lat": new_incident.latitude,
        "lng": new_incident.longitude,
        "driver_name": current_driver.name
    })
    
    return {"success": True, "incident_id": new_incident.id}

@router.post("/sos")
async def trigger_sos(
    sos: SOSAlert,
    db: Session = Depends(get_db),
    current_driver: User = Depends(get_current_driver)
):
    """Trigger an SOS emergency."""
    # If the driver has a vehicle, mark it as emergency
    vehicle = db.query(Vehicle).filter(Vehicle.id == sos.vehicle_id).first()
    if vehicle:
        vehicle.status = VehicleStatus.EMERGENCY
        
        # Mark active delivery as emergency too
        delivery = db.query(Delivery).filter(
            Delivery.vehicle_id == vehicle.id,
            Delivery.status.in_([DeliveryStatus.ASSIGNED, DeliveryStatus.IN_TRANSIT])
        ).first()
        if delivery:
            delivery.status = DeliveryStatus.EMERGENCY
            
        db.commit()

    # Broadcast massive alert
    await manager.broadcast({
        "type": "SOS_ALERT",
        "driver_id": current_driver.id,
        "driver_name": current_driver.name,
        "vehicle_id": sos.vehicle_id,
        "lat": sos.lat,
        "lng": sos.lng,
        "timestamp": datetime.now().isoformat()
    })
    
    return {"success": True, "message": "SOS Broadcasted"}
