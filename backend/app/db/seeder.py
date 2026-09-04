from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import httpx
import time

from app.core.database import SessionLocal, engine, Base
from app.models.user import User, RoleEnum
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.route import Route, RouteStatus
from app.models.delivery import Delivery, DeliveryStatus
from app.models.incident import Incident, IncidentType, RiskLevel
from app.models.analytics import DailyMetric
from app.models.warehouse import Warehouse, WarehouseStatus

CITIES = {
    "Mumbai": (19.0760, 72.8777),
    "Pune": (18.5204, 73.8567),
    "Nashik": (20.0110, 73.7903),
    "Surat": (21.1702, 72.8311),
    "Kolhapur": (16.7050, 74.2433),
    "Satara": (17.6805, 73.9928),
    "Chhatrapati Sambhajinagar": (19.8762, 75.3433),
    "Nagpur": (21.1458, 79.0882),
    "Hyderabad": (17.3850, 78.4867),
    "Indore": (22.7196, 75.8577),
    "Raipur": (21.2514, 81.6296),
    "Goa": (15.4909, 73.8278),
    "Belagavi": (15.8497, 74.4977),
    "Bengaluru": (12.9716, 77.5946),
    "Chennai": (13.0827, 80.2707),
    "Vijayawada": (16.5062, 80.6480),
    "Ahmedabad": (23.0225, 72.5714),
    "Delhi": (28.7041, 77.1025),
    "Jaipur": (26.9124, 75.7873),
    "Lucknow": (26.8467, 80.9462),
    "Kolkata": (22.5726, 88.3639),
    "Bhubaneswar": (20.2961, 85.8245),
    "Guwahati": (26.1445, 91.7362),
    "Shillong": (25.5788, 91.8933),
    "Siliguri": (26.7271, 88.3953),
    "Jowai": (25.4475, 92.2010)
}

ROUTE_PAIRS = [
    ("Mumbai", "Pune"), ("Mumbai", "Nashik"), ("Mumbai", "Surat"),
    ("Pune", "Kolhapur"), ("Pune", "Satara"), ("Pune", "Chhatrapati Sambhajinagar"),
    ("Nashik", "Chhatrapati Sambhajinagar"),
    ("Nagpur", "Hyderabad"), ("Nagpur", "Indore"), ("Nagpur", "Raipur"),
    ("Kolhapur", "Goa"), ("Kolhapur", "Belagavi"),
    ("Bengaluru", "Hyderabad"), ("Bengaluru", "Chennai"), ("Bengaluru", "Pune"),
    ("Hyderabad", "Vijayawada"),
    ("Ahmedabad", "Surat"), ("Ahmedabad", "Indore"),
    ("Delhi", "Jaipur"), ("Delhi", "Ahmedabad"), ("Delhi", "Lucknow"),
    ("Kolkata", "Bhubaneswar"),
    ("Guwahati", "Shillong"), ("Guwahati", "Siliguri"),
    ("Shillong", "Jowai")
]

def fetch_osrm_route(start_coords, end_coords):
    url = f"http://router.project-osrm.org/route/v1/driving/{start_coords[1]},{start_coords[0]};{end_coords[1]},{end_coords[0]}?overview=full&geometries=geojson"
    try:
        resp = httpx.get(url, timeout=10.0)
        if resp.status_code == 200:
            data = resp.json()
            if data["code"] == "Ok":
                route = data["routes"][0]
                coords = [[c[1], c[0]] for c in route["geometry"]["coordinates"]]
                return {
                    "geometry": coords,
                    "distance_km": route["distance"] / 1000.0,
                    "duration_minutes": route["duration"] / 60.0
                }
    except Exception as e:
        print(f"Error fetching route: {e}")
    
    # Fallback pseudo-straight line
    return {
        "geometry": [start_coords, end_coords],
        "distance_km": 150.0,
        "duration_minutes": 120.0
    }

def seed_db():
    db = SessionLocal()
    
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

    # 4. Realistic Expanded Routes
    print("Fetching realistic route geometries from OSRM... This may take a minute.")
    db_routes = []
    for origin, dest in ROUTE_PAIRS:
        origin_coords = CITIES[origin]
        dest_coords = CITIES[dest]
        
        r_data = fetch_osrm_route(origin_coords, dest_coords)
        time.sleep(0.5) # OSRM rate limit
        
        # Simulate some baseline risk 
        base_risk = random.randint(10, 45)
        risk_level = RouteStatus.OPEN
        if base_risk > 30: risk_level = RouteStatus.RESTRICTED
        if base_risk > 60: risk_level = RouteStatus.HIGH_RISK
        
        route = Route(
            route_name=f"{origin} - {dest}",
            origin=origin,
            destination=dest,
            distance_km=r_data["distance_km"],
            estimated_time_minutes=int(r_data["duration_minutes"]),
            risk_score=float(base_risk),
            risk_level=risk_level,
            weather_risk=random.randint(0, 15),
            news_risk=0,
            disaster_risk=0,
            status=RouteStatus.OPEN,
            geometry=r_data["geometry"],
            factors={"Base Risk": base_risk}
        )
        db_routes.append(route)
        db.add(route)
    
    db.commit()

    # 5. Deliveries
    deliveries = [
        Delivery(
            delivery_number="DEL-9921", cargo_type="Medical Supplies", priority="EMERGENCY",
            origin="Mumbai", destination="Pune",
            origin_lat=19.0760, origin_lng=72.8777, destination_lat=18.5204, destination_lng=73.8567,
            vehicle_id=vehicles[0].id, route_id=db_routes[0].id,
            status=DeliveryStatus.IN_TRANSIT, progress_percentage=68.0,
            estimated_arrival=datetime.utcnow() + timedelta(hours=1, minutes=15)
        ),
        Delivery(
            delivery_number="DEL-9922", cargo_type="Food Relief", priority="HIGH",
            origin="Mumbai", destination="Nashik",
            origin_lat=19.0760, origin_lng=72.8777, destination_lat=20.0110, destination_lng=73.7903,
            vehicle_id=vehicles[4].id, route_id=db_routes[1].id,
            status=DeliveryStatus.DELAYED, progress_percentage=42.0,
            estimated_arrival=datetime.utcnow() + timedelta(hours=4, minutes=30)
        )
    ]
    for d in deliveries:
        db.add(d)
        
    # 6. Incidents
    incidents = [
        Incident(
            title="NH-48 Waterlogging", incident_type=IncidentType.FLOOD, location="Navi Mumbai",
            risk_level=RiskLevel.HIGH, description="Severe waterlogging causing slow traffic.",
            probability=85, timeframe="Now", is_active=True,
            latitude=19.0330, longitude=73.0297, geometry={"radius_km": 30.0}
        ),
        Incident(
            title="Expressway Blocked", incident_type=IncidentType.ROAD_DAMAGE, location="Khandala",
            risk_level=RiskLevel.CRITICAL, description="Landslide blocking lanes.",
            probability=95, timeframe="Now", is_active=True,
            latitude=18.7562, longitude=73.3768, geometry={"radius_km": 15.0}
        )
    ]
    for i in incidents:
        db.add(i)
        
    # 7. Analytics
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
