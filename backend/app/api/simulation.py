from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import math
import random

from app.api.deps import get_db
from app.models.incident import Incident, IncidentType, RiskLevel
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.route import Route
from app.api.ws import manager
from app.services.routing_service import routing_service

router = APIRouter()

def haversine(lat1, lon1, lat2, lon2):
    R = 6371 # km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

class SimulateIncidentRequest(BaseModel):
    type: str
    latitude: float
    longitude: float
    radius_km: float = 50.0
    severity: str = 'CRITICAL'

@router.post("/incident")
async def simulate_incident(req: SimulateIncidentRequest, db: Session = Depends(get_db)):
    incident_type = IncidentType.WEATHER
    try:
        incident_type = IncidentType(req.type.upper())
    except ValueError:
        pass # fallback

    # 1. Create Incident
    incident = Incident(
        title=f"Simulated {req.type}",
        incident_type=incident_type,
        location=f"Lat {req.latitude}, Lng {req.longitude}",
        latitude=req.latitude,
        longitude=req.longitude,
        geometry={"radius_km": req.radius_km},
        risk_level=req.severity,
        description=f"Admin simulated {req.type} event.",
        is_active=True
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    
    # Broadcast incident
    await manager.broadcast({
        "type": "NEW_INCIDENT",
        "incident": {
            "id": f"SIM-{incident.id}",
            "type": incident.incident_type.value,
            "severity": incident.risk_level.value,
            "description": incident.description,
            "latitude": incident.latitude,
            "longitude": incident.longitude,
            "reported_by": "System Simulation"
        }
    })
    
    # 2. Find Affected Vehicles & Recalculate
    vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MOVING).all()
    affected_count = 0
    
    for v in vehicles:
        if not v.current_latitude or not v.geometry:
            continue
            
        is_affected = False
        for pt in v.geometry:
            if len(pt) == 2:
                dist = haversine(req.latitude, req.longitude, pt[0], pt[1])
                if dist <= req.radius_km:
                    is_affected = True
                    break
        
        if is_affected:
            affected_count += 1
            # Cap processing to 5 vehicles to keep API snappy for the dashboard
            if affected_count > 5:
                continue
                
            route = db.query(Route).filter(Route.id == v.current_route_id).first()
            if route:
                orig_coords = (v.current_latitude, v.current_longitude)
                
                # 3. Prefer existing coordinates to avoid geocoding
                dest_coords = None
                if route.geometry and len(route.geometry) > 0:
                    last_pt = route.geometry[-1]
                    if len(last_pt) >= 2:
                        dest_coords = (float(last_pt[0]), float(last_pt[1]))
                        
                if not dest_coords:
                    dest_coords = routing_service.geocode(route.destination)
                
                if not dest_coords:
                    print(f"Warning: Geocoding failed for {route.destination}. Using fallback coords.")
                    dest_coords = (orig_coords[0] + 0.5, orig_coords[1] + 0.5)
                    
                alt_route_info = routing_service.get_route(orig_coords, dest_coords)
                
                if alt_route_info:
                    geom = alt_route_info["geometry"]
                    if len(geom) > 4:
                        mid = len(geom) // 2
                        geom[mid] = [geom[mid][0] + 0.05, geom[mid][1] + 0.05]
                        
                    route.geometry = geom
                    route.distance_km = alt_route_info["distance_km"] * 1.1 
                    route.estimated_time_minutes = int(alt_route_info["duration_minutes"] * 1.2) 
                    v.geometry = geom
                    
                    db.commit()
                    
                    # Notify Driver
                    await manager.broadcast({
                        "type": "REROUTE_RECOMMENDED",
                        "vehicle_id": str(v.id),
                        "vehicle_number": v.vehicle_number,
                        "incident_id": incident.id,
                        "reason": f"{req.type} detected on current route.",
                        "new_eta": route.estimated_time_minutes,
                        "new_distance": route.distance_km,
                        "new_geometry": route.geometry
                    })

    return {"status": "success", "incident_id": incident.id, "affected_vehicles": affected_count}


@router.post("/tick")
async def simulate_tick(db: Session = Depends(get_db)):
    """Advances the simulation by moving all active vehicles along their routes."""
    vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MOVING).all()
    moved_count = 0
    
    for v in vehicles:
        if v.geometry and len(v.geometry) > 1:
            geom = list(v.geometry)
            if len(geom) > 1:
                # move up to 5 steps at a time so it goes faster
                steps = min(5, len(geom) - 1)
                for _ in range(steps):
                    geom.pop(0)
                    
                if len(geom) > 0:
                    next_pt = geom[0]
                    v.current_latitude = next_pt[0]
                    v.current_longitude = next_pt[1]
                    v.geometry = geom
                    
                    db.commit()
                    moved_count += 1
                    
                    await manager.broadcast({
                        "type": "DRIVER_LOCATION",
                        "vehicle_id": str(v.id),
                        "vehicle_number": v.vehicle_number,
                        "lat": v.current_latitude,
                        "lng": v.current_longitude,
                        "speed": v.speed,
                        "heading": v.heading
                    })
                else:
                    v.status = VehicleStatus.IDLE
                    db.commit()
            else:
                v.status = VehicleStatus.IDLE
                db.commit()
                
    return {"status": "success", "vehicles_moved": moved_count}
