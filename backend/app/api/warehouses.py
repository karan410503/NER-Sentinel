from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, ConfigDict

from app.core.database import get_db
from app.models.warehouse import Warehouse

router = APIRouter()

class WarehouseResponse(BaseModel):
    id: int
    warehouse_id: str
    name: str
    city: str
    state: str
    latitude: float
    longitude: float
    capacity: int
    current_inventory: int
    utilization: float
    status: str
    risk_score: float

    model_config = ConfigDict(from_attributes=True)

@router.get("/", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)):
    warehouses = db.query(Warehouse).all()
    return warehouses

@router.get("/{id}", response_model=WarehouseResponse)
def get_warehouse(id: int, db: Session = Depends(get_db)):
    warehouse = db.query(Warehouse).filter(Warehouse.id == id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return warehouse
