from fastapi import APIRouter, Query, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import List
import pandas as pd
import io
import uuid
import random
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.route import Route, RouteStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.services.ml_service import ml_service
from app.services.routing_service import routing_service
from app.api.ws import manager
from app.ml.train import train_from_dataframe

router = APIRouter()

class EtaPredictionResponse(BaseModel):
    predictedEta: str
    standardEta: str
    confidenceScore: int
    factors: list

class DisruptionForecastResponse(BaseModel):
    id: str
    type: str
    location: str
    probability: int
    timeframe: str
    recommendation: str

@router.get("/eta", response_model=EtaPredictionResponse)
def get_eta_prediction(
    origin: str = Query(..., description="Origin hub"),
    destination: str = Query(..., description="Destination location"),
    vehicle_type: str = Query(..., description="Vehicle type")
):
    """
    Get the AI predicted ETA using the XGBoost model.
    """
    return ml_service.predict_eta(origin, destination, vehicle_type)

@router.get("/disruptions", response_model=List[DisruptionForecastResponse])
def get_disruptions():
    """
    Get forecasted road disruptions using the XGBoost disruption model.
    """
    return ml_service.get_disruption_forecasts()

@router.post("/upload-dataset")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a CSV dataset to re-train the ETA and Disruption XGBoost models dynamically.
    Also extracts rows to populate the backend with real vehicles and routes.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Train models from the uploaded dataframe
        metrics = train_from_dataframe(df)
        ml_service.load_models()
        
        # Process rows to populate the database
        demo_rows = df.head(5).to_dict(orient='records')
        routes_created = 0
        
        for row in demo_rows:
            origin = str(row.get('origin', 'Guwahati, Assam'))
            destination = str(row.get('destination', 'Shillong, Meghalaya'))
            vehicle_type = str(row.get('vehicle_type', 'Heavy Truck (Medicine)'))
            
            orig_coords = routing_service.geocode(origin)
            dest_coords = routing_service.geocode(destination)
            
            if not orig_coords or not dest_coords:
                orig_coords = (26.1445 + random.uniform(-0.1, 0.1), 91.7362 + random.uniform(-0.1, 0.1))
                dest_coords = (25.5788 + random.uniform(-0.1, 0.1), 91.8933 + random.uniform(-0.1, 0.1))
            
            route_info = routing_service.get_route(orig_coords, dest_coords)
            
            distance = route_info["distance_km"] if route_info else float(row.get('base_distance_km', 100.0))
            duration = route_info["duration_minutes"] if route_info else float(row.get('actual_eta_minutes', 120.0))
            
            pred = await ml_service.predict_eta(origin, destination, vehicle_type, distance, duration, dest_coords)
            
            risk_score = pred["finalRiskScore"]
            risk_level = RouteStatus.HIGH_RISK if risk_score > 60 else RouteStatus.RESTRICTED if risk_score > 40 else RouteStatus.SAFE
            
            new_route = Route(
                route_name=f"Route: {origin} to {destination}",
                origin=origin,
                destination=destination,
                distance_km=distance,
                estimated_time_minutes=int(pred["predictedEtaMinutes"]),
                risk_score=risk_score,
                risk_level=risk_level,
                status=RouteStatus.OPEN,
                geometry=route_info["geometry"] if route_info else [[orig_coords[0], orig_coords[1]], [dest_coords[0], dest_coords[1]]],
                factors=pred["factors"]
            )
            db.add(new_route)
            db.commit()
            db.refresh(new_route)
            
            new_vehicle = Vehicle(
                vehicle_number=f"CSV-{random.randint(1000, 9999)}",
                registration_number=f"REG-{str(uuid.uuid4())[:8].upper()}",
                vehicle_type=vehicle_type,
                cargo_type='High (Medical/Emergency)' if risk_score > 50 else 'Normal Cargo',
                driver_name='Auto Assigned',
                status=VehicleStatus.MOVING,
                current_latitude=orig_coords[0],
                current_longitude=orig_coords[1],
                geometry=new_route.geometry, 
                speed=random.uniform(30.0, 60.0),
                current_route_id=new_route.id
            )
            db.add(new_vehicle)
            db.commit()
            routes_created += 1
            
        await manager.broadcast({"type": "DATASET_PROCESSED", "routes_created": routes_created})
        
        return {
            "status": "success",
            "message": f"Models re-trained and {routes_created} routes dynamically created from CSV.",
            "metrics": metrics,
            "routes_created": routes_created
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during training: {str(e)}")

@router.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """
    Simulated AI analysis of uploaded incident photo.
    Returns predicted incident type, severity, and confidence score.
    """
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        raise HTTPException(status_code=400, detail="Only images are allowed.")
    
    # Read first few bytes to pretend we're processing
    await file.read(1024)
    
    # In a real app, pass the image bytes to an ML model (like a CNN) 
    # For now, return a smart mock response
    import random
    
    incident_types = ['Landslide', 'Flood / Waterlogging', 'Bridge Damage', 'Road Blockage']
    severities = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW']
    
    # Randomly pick to simulate AI output
    detected_type = random.choice(incident_types)
    detected_severity = random.choice(severities)
    confidence = random.randint(75, 99)
    
    return {
        "status": "success",
        "analysis": {
            "type": detected_type,
            "severity": detected_severity,
            "confidence": confidence,
            "details": f"AI visual analysis detected patterns consistent with {detected_type.lower()}."
        }
    }

