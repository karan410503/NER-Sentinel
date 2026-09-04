from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class VehicleStatus(str, enum.Enum):
    IDLE = "IDLE"
    MOVING = "MOVING"
    DELAYED = "DELAYED"
    STOPPED = "STOPPED"
    EMERGENCY = "EMERGENCY"
    OFFLINE = "OFFLINE"

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, index=True)
    registration_number = Column(String, unique=True)
    vehicle_type = Column(String)
    cargo_type = Column(String)
    priority = Column(String)
    driver_name = Column(String)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.IDLE)
    
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    geometry = Column(JSON, nullable=True)
    speed = Column(Float, default=0.0)
    heading = Column(Float, default=0.0)
    
    current_route_id = Column(Integer, nullable=True)
    current_delivery_id = Column(Integer, nullable=True)
    
    last_gps_update = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
