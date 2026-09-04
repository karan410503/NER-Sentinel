from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.vehicle import Vehicle

router = APIRouter()

@router.get("/")
def get_fleet_status(db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).all()
    # If UI needs a list of vehicles, return it here.
    return vehicles
