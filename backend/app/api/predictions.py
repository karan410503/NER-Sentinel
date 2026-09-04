from fastapi import APIRouter, Query, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import io

from app.services.ml_service import ml_service
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
async def upload_dataset(file: UploadFile = File(...)):
    """
    Upload a CSV dataset to re-train the ETA and Disruption XGBoost models dynamically.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Train models from the uploaded dataframe
        metrics = train_from_dataframe(df)
        
        # Reload models in the service so new predictions use them
        ml_service.load_models()
        
        return {
            "status": "success",
            "message": "Models successfully re-trained with uploaded dataset.",
            "metrics": metrics
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

