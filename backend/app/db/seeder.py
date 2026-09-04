from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random

from app.core.database import SessionLocal, engine, Base
from app.models.user import User, RoleEnum
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.route import Route
from app.models.delivery import Delivery, DeliveryStatus
from app.models.incident import Incident, IncidentType, RiskLevel
from app.models.analytics import DailyMetric

def seed_db():
    db = SessionLocal()
    
    # Check if we already have data
    if db.query(Vehicle).first():
        print("Database already seeded. Skipping...")
        db.close()
        return

    print("Seeding database...")

    # 1. Users
    admin = User(
        email="admin@nerlogistics.com",
        name="admin",
        password_hash="hashed_password",
        role=RoleEnum.ADMIN,
        is_active=True
    )
    db.add(admin)
    
    # 2. Vehicles
    vehicles = [
        Vehicle(registration_number="AS-01-AB-1234", vehicle_number="V-1001", vehicle_type="Heavy Truck", driver_name="Amit Das", current_latitude=26.1445, current_longitude=91.7362, status=VehicleStatus.MOVING),
        Vehicle(registration_number="AS-02-XY-9876", vehicle_number="V-1002", vehicle_type="Medium Truck", driver_name="Rahul Singh", current_latitude=24.8333, current_longitude=92.7789, status=VehicleStatus.IDLE),
        Vehicle(registration_number="ML-05-KL-5521", vehicle_number="V-1003", vehicle_type="Light Vehicle", driver_name="John K", current_latitude=25.5788, current_longitude=91.8933, status=VehicleStatus.OFFLINE),
        Vehicle(registration_number="NL-01-ZZ-4491", vehicle_number="V-1004", vehicle_type="Heavy Truck", driver_name="Sam T", current_latitude=25.6701, current_longitude=94.1077, status=VehicleStatus.MOVING),
        Vehicle(registration_number="MZ-01-MM-1029", vehicle_number="V-1005", vehicle_type="Medium Truck", driver_name="Vijay R", current_latitude=23.7271, current_longitude=92.7176, status=VehicleStatus.DELAYED),
    ]
    for v in vehicles:
        db.add(v)
    db.commit()

    # 3. Routes
    routes = [
        Route(route_name="Guwahati - Shillong", origin="Guwahati", destination="Shillong", distance_km=100.5, estimated_time_minutes=150, risk_score=45.0),
        Route(route_name="Guwahati - Silchar", origin="Guwahati", destination="Silchar", distance_km=320.0, estimated_time_minutes=420, risk_score=75.0),
        Route(route_name="Dimapur - Kohima", origin="Dimapur", destination="Kohima", distance_km=74.0, estimated_time_minutes=120, risk_score=60.0),
    ]
    for r in routes:
        db.add(r)
    db.commit()

    # 4. Deliveries
    deliveries = [
        Delivery(
            delivery_number="DEL-9921", cargo_type="Medical Supplies", priority="EMERGENCY",
            origin="Guwahati Hub", destination="Shillong Medical Center",
            origin_lat=26.1445, origin_lng=91.7362, destination_lat=25.5788, destination_lng=91.8933,
            vehicle_id=vehicles[0].id, route_id=routes[0].id,
            status=DeliveryStatus.IN_TRANSIT, progress_percentage=68.0,
            estimated_arrival=datetime.utcnow() + timedelta(hours=1, minutes=15)
        ),
        Delivery(
            delivery_number="DEL-9922", cargo_type="Food Relief", priority="HIGH",
            origin="Guwahati Hub", destination="Silchar Depot",
            origin_lat=26.1445, origin_lng=91.7362, destination_lat=24.8333, destination_lng=92.7789,
            vehicle_id=vehicles[4].id, route_id=routes[1].id,
            status=DeliveryStatus.DELAYED, progress_percentage=42.0,
            estimated_arrival=datetime.utcnow() + timedelta(hours=4, minutes=30)
        ),
        Delivery(
            delivery_number="DEL-9923", cargo_type="Rescue Equipment", priority="EMERGENCY",
            origin="Dimapur", destination="Kohima",
            origin_lat=25.9060, origin_lng=93.7275, destination_lat=25.6701, destination_lng=94.1077,
            vehicle_id=vehicles[3].id, route_id=routes[2].id,
            status=DeliveryStatus.IN_TRANSIT, progress_percentage=15.0,
            estimated_arrival=datetime.utcnow() + timedelta(minutes=45)
        ),
        Delivery(
            delivery_number="DEL-9926", cargo_type="General Cargo", priority="NORMAL",
            origin="Agartala Central", destination="Dharmanagar",
            origin_lat=23.8315, origin_lng=91.2868, destination_lat=24.3705, destination_lng=92.1643,
            vehicle_id=vehicles[1].id, route_id=None,
            status=DeliveryStatus.DELIVERED, progress_percentage=100.0,
            actual_arrival=datetime.utcnow() - timedelta(hours=1)
        ),
    ]
    for d in deliveries:
        db.add(d)
        
    # 5. Incidents
    incidents = [
        Incident(
            title="NH-06 Blocked", incident_type=IncidentType.LANDSLIDE, location="Sonapur, Meghalaya",
            risk_level=RiskLevel.CRITICAL, description="Heavy landslide blocking both lanes.",
            probability=95, timeframe="Now", is_active=True
        ),
        Incident(
            title="Heavy Rainfall Warning", incident_type=IncidentType.WEATHER, location="Cachar District",
            risk_level=RiskLevel.HIGH, description="IMD red alert for extreme rainfall.",
            probability=85, timeframe="+2 Hours", is_active=True
        ),
        Incident(
            title="Bridge Maintenance", incident_type=IncidentType.ROAD_DAMAGE, location="Saraighat Bridge",
            risk_level=RiskLevel.MODERATE, description="Single lane traffic due to repair work.",
            probability=100, timeframe="+12 Hours", is_active=True
        )
    ]
    for i in incidents:
        db.add(i)
        
    # 6. Analytics (Last 7 Days)
    today = datetime.utcnow().date()
    for i in range(7):
        date = today - timedelta(days=6-i)
        metric = DailyMetric(
            metric_date=date,
            on_time_deliveries=random.randint(80, 150),
            delayed_deliveries=random.randint(10, 40),
            critical_deliveries=random.randint(0, 8),
            active_vehicles=random.randint(40, 70),
            idle_vehicles=random.randint(10, 30),
            total_incidents=random.randint(1, 15),
            weather_risk_score=random.uniform(20, 80),
            ai_factors={"Rainfall": random.randint(60, 95), "Terrain": 85, "Traffic": random.randint(30, 70)}
        )
        db.add(metric)
        
    db.commit()
    db.close()
    print("Database seeding complete!")

if __name__ == "__main__":
    seed_db()
