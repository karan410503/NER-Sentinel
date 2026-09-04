from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class WarehouseStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    MAINTENANCE = "MAINTENANCE"
    OVERLOADED = "OVERLOADED"
    OFFLINE = "OFFLINE"

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(String, unique=True, index=True)
    name = Column(String)
    city = Column(String)
    state = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    
    capacity = Column(Integer, default=0)
    current_inventory = Column(Integer, default=0)
    utilization = Column(Float, default=0.0) # Percentage
    
    status = Column(Enum(WarehouseStatus), default=WarehouseStatus.ACTIVE)
    risk_score = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
