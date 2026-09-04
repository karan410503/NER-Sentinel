from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class RoadStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESTRICTED = "RESTRICTED"
    HIGH_RISK = "HIGH_RISK"
    BLOCKED = "BLOCKED"

class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)
    road_id = Column(String, unique=True, index=True)
    road_name = Column(String, index=True)
    road_number = Column(String)
    status = Column(Enum(RoadStatus), default=RoadStatus.OPEN)
    risk_score = Column(Float, default=0.0)
    road_condition = Column(String, default="Good")
    
    # Store GeoJSON linestring as JSON
    geometry = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
