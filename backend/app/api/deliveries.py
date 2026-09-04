from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from app.core.database import get_db
from app.models.delivery import Delivery
from app.models.vehicle import Vehicle

router = APIRouter()

def format_eta(dt_future, dt_past):
    if not dt_future or not dt_past:
        return "Unknown"
    diff = dt_future - dt_past
    total_seconds = diff.total_seconds()
    if total_seconds < 0:
        return "Delayed"
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"

@router.get("/")
def get_active_deliveries(db: Session = Depends(get_db)):
    deliveries = db.query(Delivery).filter(Delivery.status != "CANCELLED").all()
    result = []
    
    # We need to compute an ETA format and fetch the assigned vehicle
    for d in deliveries:
        vehicle = db.query(Vehicle).filter(Vehicle.id == d.vehicle_id).first()
        v_name = vehicle.registration_number if vehicle else "Unassigned"
        
        eta_str = format_eta(d.estimated_arrival, d.created_at) if d.estimated_arrival else "Unknown"
        if d.status == "DELIVERED":
            eta_str = "Arrived"
            
        result.append({
            "id": d.delivery_number,
            "origin": d.origin,
            "destination": d.destination,
            "status": d.status.value if hasattr(d.status, 'value') else str(d.status),
            "progress": int(d.progress_percentage),
            "eta": eta_str,
            "priority": d.priority,
            "assignedVehicle": v_name,
            "type": d.cargo_type,
            "lastUpdated": "Just now" # In a real app we'd calculate time since d.updated_at
        })
    return result
