from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.district import District
from app.models.road import Road
from app.models.risk_zone import RiskZone

router = APIRouter()

@router.get("/districts")
def get_districts(db: Session = Depends(get_db)):
    districts = db.query(District).all()
    # Construct GeoJSON FeatureCollection
    features = []
    for d in districts:
        features.append({
            "type": "Feature",
            "properties": {
                "district_id": d.district_id,
                "district_name": d.district_name,
                "state": d.state,
                "accessibility_score": d.accessibility_score,
                "risk_score": d.risk_score,
                "status": d.status
            },
            "geometry": d.geometry
        })
    return {"type": "FeatureCollection", "features": features}

@router.get("/roads")
def get_roads(db: Session = Depends(get_db)):
    roads = db.query(Road).all()
    features = []
    for r in roads:
        features.append({
            "type": "Feature",
            "properties": {
                "road_id": r.road_id,
                "road_name": r.road_name,
                "status": r.status,
                "risk_score": r.risk_score
            },
            "geometry": r.geometry
        })
    return {"type": "FeatureCollection", "features": features}

@router.get("/risk-zones")
def get_risk_zones(db: Session = Depends(get_db)):
    zones = db.query(RiskZone).all()
    features = []
    for z in zones:
        features.append({
            "type": "Feature",
            "properties": {
                "zone_name": z.zone_name,
                "risk_level": z.risk_level,
                "risk_score": z.risk_score,
                "reason": z.reason
            },
            "geometry": z.geometry
        })
    return {"type": "FeatureCollection", "features": features}
