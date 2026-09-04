from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, ConfigDict

from app.core.database import get_db
from app.models.user import User, RoleEnum

router = APIRouter()

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None = None
    role: str
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)

class RoleUpdateRequest(BaseModel):
    role: str

class StatusUpdateRequest(BaseModel):
    is_active: bool

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role.value if hasattr(u.role, 'value') else str(u.role),
            "is_active": u.is_active
        })
    return result

@router.patch("/users/{user_id}/role")
def update_user_role(user_id: int, request: RoleUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        new_role = RoleEnum(request.role)
        user.role = new_role
        db.commit()
        return {"status": "success", "message": f"User role updated to {new_role.value}"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role specified")

@router.patch("/users/{user_id}/status")
def update_user_status(user_id: int, request: StatusUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = request.is_active
    db.commit()
    return {"status": "success", "message": f"User status updated to {'active' if request.is_active else 'inactive'}"}
