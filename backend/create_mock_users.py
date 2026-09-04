import sys
import os

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, RoleEnum
from app.core import security
from sqlalchemy.exc import IntegrityError

db = SessionLocal()

users_to_create = [
    {
        "name": "Admin User",
        "email": "admin@example.com",
        "phone": "1111111111",
        "password": "password123",
        "role": RoleEnum.ADMIN
    },
    {
        "name": "Driver User",
        "email": "driver@example.com",
        "phone": "2222222222",
        "password": "password123",
        "role": RoleEnum.DRIVER
    },
    {
        "name": "Field Officer User",
        "email": "officer@example.com",
        "phone": "3333333333",
        "password": "password123",
        "role": RoleEnum.FIELD_OFFICER
    }
]

created_users = []

for u in users_to_create:
    user = User(
        name=u["name"],
        email=u["email"],
        phone=u["phone"],
        password_hash=security.get_password_hash(u["password"]),
        role=u["role"],
        is_active=True
    )
    db.add(user)
    try:
        db.commit()
        created_users.append(u)
    except IntegrityError:
        db.rollback()
        print(f"User {u['email']} already exists.")

print("\n--- CREDENTIALS ---")
for u in users_to_create:
    print(f"Role: {u['role'].value}")
    print(f"Email: {u['email']}")
    print(f"Password: {u['password']}")
    print("-------------------")
