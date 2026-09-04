from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Boolean, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class IncidentType(str, enum.Enum):
    LANDSLIDE = "LANDSLIDE"
    FLOOD = "FLOOD"
    ROAD_DAMAGE = "ROAD_DAMAGE"
    TRAFFIC = "TRAFFIC"
    WEATHER = "WEATHER"

class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    ELEVATED = "ELEVATED"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    incident_type = Column(Enum(IncidentType))
    location = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    geometry = Column(JSON, nullable=True)
    
    risk_level = Column(Enum(RiskLevel))
    description = Column(String)
    
    is_active = Column(Boolean, default=True)
    probability = Column(Integer, default=100) # 0-100 for predictive alerts
    timeframe = Column(String) # e.g. "+3 Hours"
    recommendation = Column(String)
    
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
