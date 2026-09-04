from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class RouteStatus(str, enum.Enum):
    SAFE = "SAFE"
    OPEN = "OPEN"
    RESTRICTED = "RESTRICTED"
    HIGH_RISK = "HIGH_RISK"
    BLOCKED = "BLOCKED"

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    route_name = Column(String, index=True)
    origin = Column(String)
    destination = Column(String)
    
    distance_km = Column(Float)
    estimated_time_minutes = Column(Integer)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(Enum(RouteStatus), default=RouteStatus.OPEN)
    
    # Extended dynamic risk metrics
    delay_minutes = Column(Integer, default=0)
    weather_risk = Column(Float, default=0.0)
    news_risk = Column(Float, default=0.0)
    disaster_risk = Column(Float, default=0.0)
    
    # Store dynamic risk factors as JSON
    factors = Column(JSON, nullable=True)
    
    status = Column(Enum(RouteStatus), default=RouteStatus.OPEN)
    
    # Store GeoJSON as standard JSON for SQLite
    geometry = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
