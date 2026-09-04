from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import predictions, deliveries, vehicles, analytics, alerts, admin, gis, ws, auth, driver, warehouses, routes
from app.services.ml_service import ml_service
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML models on startup
    ml_service.load_models()
    yield
    # Cleanup on shutdown if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Smart Logistics & Accessibility Intelligence Platform API",
    lifespan=lifespan,
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, modify in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}

# Include routers
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(deliveries.router, prefix="/api/deliveries", tags=["Deliveries"])
app.include_router(vehicles.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(routes.router, prefix="/api/routes", tags=["Routes"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(gis.router, prefix="/api/v1/gis", tags=["GIS"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(driver.router, prefix="/api/driver", tags=["Driver"])
app.include_router(warehouses.router, prefix="/api/warehouses", tags=["Warehouses"])
app.include_router(ws.router, tags=["WebSockets"])
