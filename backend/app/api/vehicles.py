from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.route import Route, RouteStatus
from app.services.routing_service import routing_service
from app.services.ml_service import ml_service

router = APIRouter()

class VehicleAssignRequest(BaseModel):
    vehicle_number: str
    type: str
    driver: str
    cargo: str
    current_location_name: str
    destination_name: str
    departure_time: Optional[datetime] = None

class VehicleRerouteRequest(BaseModel):
    new_destination: str
    reason: str

@router.get("/")
def get_fleet_status(db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).all()
    return vehicles

@router.post("/assign")
async def assign_vehicle(req: VehicleAssignRequest, db: Session = Depends(get_db)):
    # Geocode locations
    origin_coords = routing_service.geocode(req.current_location_name)
    if not origin_coords:
        raise HTTPException(status_code=400, detail=f"Could not locate current location: {req.current_location_name}")
        
    dest_coords = routing_service.geocode(req.destination_name)
    if not dest_coords:
        raise HTTPException(status_code=400, detail=f"Could not locate destination: {req.destination_name}")
        
    # Get Route
    route_data = routing_service.get_route(origin_coords, dest_coords)
    if not route_data:
        raise HTTPException(status_code=400, detail="Could not calculate route between these locations.")
        
    distance_km = route_data["distance_km"]
    duration_minutes = route_data["duration_minutes"]
    
    # Calculate ETA & Risk using ML service
    eta_predictions = await ml_service.predict_eta(
        origin=req.current_location_name,
        destination=req.destination_name,
        vehicle_type=req.type,
        distance_km=distance_km,
        duration_minutes=duration_minutes,
        dest_coords=dest_coords
    )
    
    # Use timezone-aware UTC datetime
    dep_time = req.departure_time if req.departure_time else datetime.now(timezone.utc)
    # Ensure dep_time is timezone aware if provided naive
    if dep_time.tzinfo is None:
        dep_time = dep_time.replace(tzinfo=timezone.utc)
        
    predicted_minutes = eta_predictions.get("predictedEtaMinutes", duration_minutes)
    eta_datetime = dep_time + timedelta(minutes=predicted_minutes)
    
    # Find or Create Vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == req.vehicle_number).first()
    if not vehicle:
        vehicle = Vehicle(vehicle_number=req.vehicle_number)
        db.add(vehicle)
        
    vehicle.vehicle_type = req.type
    vehicle.driver_name = req.driver
    vehicle.cargo_type = req.cargo
    vehicle.status = VehicleStatus.MOVING
    vehicle.current_latitude = origin_coords[0]
    vehicle.current_longitude = origin_coords[1]
    # We store the route geometry so frontend can use it directly
    vehicle.geometry = route_data["geometry"] 
    # Optional: store destination coords, eta string, or risk in a JSON field if we can't alter schema
    # But vehicle model has limited fields. Let's just return it to frontend to use.
    
    # Find or Create Route in DB so map picks it up
    route = db.query(Route).filter(
        Route.origin == req.current_location_name, 
        Route.destination == req.destination_name
    ).first()
    
    final_risk = eta_predictions.get("finalRiskScore", 100 - eta_predictions["confidenceScore"])
    risk_level = RouteStatus.OPEN
    if final_risk > 30: risk_level = RouteStatus.RESTRICTED
    if final_risk > 60: risk_level = RouteStatus.HIGH_RISK
    
    if not route:
        route = Route(
            route_name=f"{req.current_location_name} - {req.destination_name}",
            origin=req.current_location_name,
            destination=req.destination_name,
            distance_km=distance_km,
            estimated_time_minutes=int(duration_minutes),
            risk_score=final_risk,
            risk_level=risk_level,
            status=RouteStatus.OPEN,
            geometry=route_data["geometry"],
            factors={"Base Risk": final_risk}
        )
        db.add(route)
    else:
        route.risk_score = final_risk
        route.risk_level = risk_level
        route.factors = {"Base Risk": final_risk}
        route.geometry = route_data["geometry"]
        route.distance_km = distance_km
        route.estimated_time_minutes = int(duration_minutes)

    db.commit()
    db.refresh(vehicle)
    if route: db.refresh(route)
    
    return {
        "vehicle_id": vehicle.id,
        "vehicle_number": vehicle.vehicle_number,
        "origin": req.current_location_name,
        "destination": req.destination_name,
        "origin_coords": origin_coords,
        "destination_coords": dest_coords,
        "distance_km": distance_km,
        "duration_minutes": duration_minutes,
        "eta": eta_datetime.isoformat(),
        "eta_formatted": eta_predictions["predictedEta"],
        "risk_score": eta_predictions.get("finalRiskScore", 100 - eta_predictions["confidenceScore"]),
        "route_geometry": route_data["geometry"],
        "status": vehicle.status.value
    }

@router.post("/{vehicle_id}/reroute")
async def reroute_vehicle(vehicle_id: int, req: VehicleRerouteRequest, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    if not vehicle.current_latitude or not vehicle.current_longitude:
        raise HTTPException(status_code=400, detail="Vehicle current location is unknown")
        
    origin_coords = (vehicle.current_latitude, vehicle.current_longitude)
    
    dest_coords = routing_service.geocode(req.new_destination)
    if not dest_coords:
        raise HTTPException(status_code=400, detail=f"Could not locate destination: {req.new_destination}")
        
    # Get Route
    route_data = routing_service.get_route(origin_coords, dest_coords)
    if not route_data:
        raise HTTPException(status_code=400, detail="Could not calculate new route.")
        
    distance_km = route_data["distance_km"]
    duration_minutes = route_data["duration_minutes"]
    
    # Calculate ETA & Risk using ML service
    eta_predictions = await ml_service.predict_eta(
        origin="Current Location",
        destination=req.new_destination,
        vehicle_type=vehicle.vehicle_type or "Heavy Truck",
        distance_km=distance_km,
        duration_minutes=duration_minutes,
        dest_coords=dest_coords
    )
    
    predicted_minutes = eta_predictions.get("predictedEtaMinutes", duration_minutes)
    eta_datetime = datetime.now(timezone.utc) + timedelta(minutes=predicted_minutes)
    
    vehicle.status = VehicleStatus.MOVING
    vehicle.geometry = route_data["geometry"]
    
    final_risk = eta_predictions.get("finalRiskScore", 100 - eta_predictions["confidenceScore"])
    risk_level = RouteStatus.OPEN
    if final_risk > 30: risk_level = RouteStatus.RESTRICTED
    if final_risk > 60: risk_level = RouteStatus.HIGH_RISK

    route = db.query(Route).filter(
        Route.origin == "Current Location", 
        Route.destination == req.new_destination
    ).first()
    
    if not route:
        route = Route(
            route_name=f"Reroute - {req.new_destination}",
            origin="Current Location",
            destination=req.new_destination,
            distance_km=distance_km,
            estimated_time_minutes=int(duration_minutes),
            risk_score=final_risk,
            risk_level=risk_level,
            status=RouteStatus.OPEN,
            geometry=route_data["geometry"],
            factors={"Base Risk": final_risk}
        )
        db.add(route)
    else:
        route.risk_score = final_risk
        route.risk_level = risk_level
        route.geometry = route_data["geometry"]
        route.distance_km = distance_km
        route.estimated_time_minutes = int(duration_minutes)
        route.factors = {"Base Risk": final_risk}

    db.commit()
    db.refresh(vehicle)
    
    return {
        "vehicle_id": vehicle.id,
        "vehicle_number": vehicle.vehicle_number,
        "new_destination": req.new_destination,
        "destination_coords": dest_coords,
        "distance_km": distance_km,
        "duration_minutes": duration_minutes,
        "eta": eta_datetime.isoformat(),
        "eta_formatted": eta_predictions["predictedEta"],
        "risk_score": eta_predictions.get("finalRiskScore", 100 - eta_predictions["confidenceScore"]),
        "route_geometry": route_data["geometry"],
        "status": vehicle.status.value,
        "reason": req.reason
    }
