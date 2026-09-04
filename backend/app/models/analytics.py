from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import date

class DailyMetric(Base):
    __tablename__ = "daily_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_date = Column(DateTime, default=date.today)
    
    # Pre-calculated aggregates for fast analytics
    on_time_deliveries = Column(Integer, default=0)
    delayed_deliveries = Column(Integer, default=0)
    critical_deliveries = Column(Integer, default=0)
    
    active_vehicles = Column(Integer, default=0)
    idle_vehicles = Column(Integer, default=0)
    
    total_incidents = Column(Integer, default=0)
    
    weather_risk_score = Column(Float, default=0.0)
    
    # Store dynamic AI factors as JSON string/dict
    ai_factors = Column(JSON, nullable=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
