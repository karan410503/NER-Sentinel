from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.models.route import Route

router = APIRouter()

@router.get("/")
def get_all_routes(db: Session = Depends(get_db)):
    """Fetch all active logistics routes with their geometries and dynamic risk scores."""
    routes = db.query(Route).all()
    return routes

@router.get("/{route_id}")
def get_route_details(route_id: int, db: Session = Depends(get_db)):
    """Fetch details of a specific route."""
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route
