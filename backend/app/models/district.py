from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class DistrictStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESTRICTED = "RESTRICTED"
    HIGH_RISK = "HIGH_RISK"
    EMERGENCY = "EMERGENCY"

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(String, unique=True, index=True)
    district_name = Column(String, index=True)
    state = Column(String, index=True)
    accessibility_score = Column(Float, default=100.0)
    risk_score = Column(Float, default=0.0)
    status = Column(Enum(DistrictStatus), default=DistrictStatus.OPEN)
    
    # Store GeoJSON polygon as JSON
    geometry = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
