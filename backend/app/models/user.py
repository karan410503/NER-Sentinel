from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    GOVERNMENT = "GOVERNMENT"
    LOGISTICS_OPERATOR = "LOGISTICS_OPERATOR"
    FIELD_OFFICER = "FIELD_OFFICER"
    EMERGENCY_RESPONSE = "EMERGENCY_RESPONSE"
    DRIVER = "DRIVER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.FIELD_OFFICER)
    language = Column(String, default="en")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
