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
from app.models.warehouse import Warehouse, WarehouseStatus

def seed_db():
    db = SessionLocal()
    
    # Check if we already have data
    # Drop and recreate all tables for a fresh dynamic seed
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)

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
    
    # 2. Warehouses (Realistic Hubs)
    warehouses = [
        Warehouse(warehouse_id="WH-MUM", name="Mumbai Central Hub", city="Mumbai", state="Maharashtra", latitude=19.0760, longitude=72.8777, capacity=10000, current_inventory=8500, utilization=85.0),
        Warehouse(warehouse_id="WH-PUN", name="Pune Distribution", city="Pune", state="Maharashtra", latitude=18.5204, longitude=73.8567, capacity=5000, current_inventory=3000, utilization=60.0),
        Warehouse(warehouse_id="WH-NSK", name="Nashik Depot", city="Nashik", state="Maharashtra", latitude=20.0110, longitude=73.7903, capacity=3000, current_inventory=2500, utilization=83.3),
        Warehouse(warehouse_id="WH-NGP", name="Nagpur Logistics", city="Nagpur", state="Maharashtra", latitude=21.1458, longitude=79.0882, capacity=7000, current_inventory=4000, utilization=57.1),
        Warehouse(warehouse_id="WH-BLR", name="Bengaluru Gateway", city="Bengaluru", state="Karnataka", latitude=12.9716, longitude=77.5946, capacity=12000, current_inventory=11000, utilization=91.6),
        Warehouse(warehouse_id="WH-GUW", name="Guwahati Northeast Hub", city="Guwahati", state="Assam", latitude=26.1445, longitude=91.7362, capacity=8000, current_inventory=7200, utilization=90.0),
        Warehouse(warehouse_id="WH-SHL", name="Shillong Medical Center", city="Shillong", state="Meghalaya", latitude=25.5788, longitude=91.8933, capacity=2000, current_inventory=1800, utilization=90.0),
    ]
    for w in warehouses:
        db.add(w)
    db.commit()

    # 3. Vehicles
    vehicles = [
        Vehicle(registration_number="MH-01-AB-1234", vehicle_number="V-1001", vehicle_type="Heavy Truck", driver_name="Amit Das", current_latitude=19.0760, current_longitude=72.8777, status=VehicleStatus.MOVING),
        Vehicle(registration_number="MH-12-XY-9876", vehicle_number="V-1002", vehicle_type="Medium Truck", driver_name="Rahul Singh", current_latitude=18.5204, current_longitude=73.8567, status=VehicleStatus.IDLE),
        Vehicle(registration_number="KA-05-KL-5521", vehicle_number="V-1003", vehicle_type="Light Vehicle", driver_name="John K", current_latitude=12.9716, current_longitude=77.5946, status=VehicleStatus.OFFLINE),
        Vehicle(registration_number="MH-15-ZZ-4491", vehicle_number="V-1004", vehicle_type="Heavy Truck", driver_name="Sam T", current_latitude=20.0110, current_longitude=73.7903, status=VehicleStatus.MOVING),
        Vehicle(registration_number="MH-31-MM-1029", vehicle_number="V-1005", vehicle_type="Medium Truck", driver_name="Vijay R", current_latitude=21.1458, current_longitude=79.0882, status=VehicleStatus.DELAYED),
    ]
    for v in vehicles:
        db.add(v)
    db.commit()

    # 4. Routes
    routes = [
        Route(route_name="Mumbai - Pune", origin="Mumbai Central Hub", destination="Pune Distribution", distance_km=150.0, estimated_time_minutes=180, risk_score=25.0),
        Route(route_name="Mumbai - Nashik", origin="Mumbai Central Hub", destination="Nashik Depot", distance_km=165.0, estimated_time_minutes=200, risk_score=30.0),
        Route(route_name="Pune - Bengaluru", origin="Pune Distribution", destination="Bengaluru Gateway", distance_km=840.0, estimated_time_minutes=850, risk_score=45.0),
    ]
    for r in routes:
        db.add(r)
    db.commit()

    # 5. Deliveries
    deliveries = [
        Delivery(
            delivery_number="DEL-9921", cargo_type="Medical Supplies", priority="EMERGENCY",
            origin="Mumbai Central Hub", destination="Pune Distribution",
            origin_lat=19.0760, origin_lng=72.8777, destination_lat=18.5204, destination_lng=73.8567,
            vehicle_id=vehicles[0].id, route_id=routes[0].id,
            status=DeliveryStatus.IN_TRANSIT, progress_percentage=68.0,
            estimated_arrival=datetime.utcnow() + timedelta(hours=1, minutes=15)
        ),
        Delivery(
            delivery_number="DEL-9922", cargo_type="Food Relief", priority="HIGH",
            origin="Mumbai Central Hub", destination="Nashik Depot",
            origin_lat=19.0760, origin_lng=72.8777, destination_lat=20.0110, destination_lng=73.7903,
            vehicle_id=vehicles[4].id, route_id=routes[1].id,
            status=DeliveryStatus.DELAYED, progress_percentage=42.0,
            estimated_arrival=datetime.utcnow() + timedelta(hours=4, minutes=30)
        ),
        Delivery(
            delivery_number="DEL-9923", cargo_type="Electronics", priority="NORMAL",
            origin="Pune Distribution", destination="Bengaluru Gateway",
            origin_lat=18.5204, origin_lng=73.8567, destination_lat=12.9716, destination_lng=77.5946,
            vehicle_id=vehicles[3].id, route_id=routes[2].id,
            status=DeliveryStatus.IN_TRANSIT, progress_percentage=15.0,
            estimated_arrival=datetime.utcnow() + timedelta(hours=12)
        ),
        Delivery(
            delivery_number="DEL-9926", cargo_type="General Cargo", priority="NORMAL",
            origin="Nagpur Logistics", destination="Pune Distribution",
            origin_lat=21.1458, origin_lng=79.0882, destination_lat=18.5204, destination_lng=73.8567,
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
