import os
import uuid
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import settings
from .database import engine, Base, SessionLocal, get_db
from .models import User, Event, EventPreference
from .auth import hash_password, get_or_create_demo_user
from .routers import (
    auth_routes, event_routes, budget_routes,
    task_routes, vendor_routes, approval_routes, ai_routes
)
from .engines.ai_service import AIService

logger = logging.getLogger("celestia")

# Validate environment configuration before booting
settings.validate_production_config()

# Initialize tables
Base.metadata.create_all(bind=engine)

def bootstrap_primary_demonstration_scenario():
    """
    Seeds the primary demonstration scenario if database is fresh:
    - User: Anjali & Rahul
    - Event: Traditional Maharashtrian Wedding in Mumbai
    - 300 Guests, ₹15,00,000 Budget (150,000,000 paise)
    - Pure Vegetarian Catering
    - Royal Marigold Theme
    """
    db = SessionLocal()
    try:
        demo_user = get_or_create_demo_user(db)
        existing_event = db.query(Event).filter(Event.user_id == demo_user.id).first()
        if not existing_event:
            wedding_event = Event(
                user_id=demo_user.id,
                title="Anjali & Rahul's Royal Mumbai Wedding",
                event_type="wedding",
                city="Mumbai",
                venue_type="Grand Banquet Hall",
                guest_count=300,
                budget_minor=150000000,
                currency="INR",
                timezone="Asia/Kolkata",
                preparation_months=6,
                status="planning",
                autonomy_mode="Draft"
            )
            db.add(wedding_event)
            db.commit()
            db.refresh(wedding_event)
            
            pref = EventPreference(
                event_id=wedding_event.id,
                dietary="Pure Vegetarian",
                theme="Royal Marigold & Polished Brass",
                regional_culture="Maharashtrian Traditional",
                cultural_traditions=["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"],
                music_entertainment="Traditional Shehnai & Dhol-Tasha + Modern Sangeet DJ",
                color_palette=["#D97706", "#B45309", "#0B132B", "#FAF7F2", "#0D9488"],
                special_requirements="Wheelchair accessible entrance, priority elderly seating, eco-friendly return gifts."
            )
            db.add(pref)
            db.commit()
            
            AIService.generate_full_event_plan(db, wedding_event)
    except Exception as e:
        db.rollback()
        logger.error(f"Error bootstrapping scenario: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    bootstrap_primary_demonstration_scenario()
    yield

# In production, disable documentation and OpenAPI schema endpoints
is_prod = (settings.ENV == "production")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="CELESTIA AI Event Planning Assistant — Deterministic Budgeting, CPM Timeline, Cultural Intelligence & Autonomy",
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json",
    lifespan=lifespan
)

@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    err_id = str(uuid.uuid4())
    logger.error(f"[Unhandled Error {err_id}] Path: {request.url.path} | Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected server error occurred. Please try again.",
            "request_id": err_id
        }
    )

# Strict CORS Allowlist
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Gzip compression for responses > 1000 bytes
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' http://localhost:3000 http://localhost:8000; "
        "frame-ancestors 'none';"
    )
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    # Explicitly ensure X-XSS-Protection is absent (deprecated and insecure)
    if "X-XSS-Protection" in response.headers:
        del response.headers["X-XSS-Protection"]
    return response

# Include Routers
app.include_router(auth_routes.router, prefix="/api")
app.include_router(event_routes.router, prefix="/api")
app.include_router(budget_routes.router, prefix="/api")
app.include_router(task_routes.router, prefix="/api")
app.include_router(vendor_routes.router, prefix="/api")
app.include_router(approval_routes.router, prefix="/api")
app.include_router(ai_routes.router, prefix="/api")

# Mount fault-injection diagnostic endpoint strictly in non-production
if settings.ENV != "production":
    @app.get("/api/test-fault/unhandled-error")
    def trigger_unhandled_error_for_audit():
        """Diagnostic fault injection endpoint to verify sanitization of 500 errors."""
        return 1 / 0

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": None if is_prod else "/docs"
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Active health check verifying application and database connectivity.
    Returns HTTP 200 if database responds, HTTP 503 if database is unreachable.
    """
    try:
        t0 = time.perf_counter()
        db.execute(text("SELECT 1"))
        db_latency = round((time.perf_counter() - t0) * 1000.0, 2)
        return {
            "status": "healthy",
            "service": "celestia-backend",
            "database": {
                "status": "connected",
                "latency_ms": db_latency,
                "dialect": engine.dialect.name
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": "celestia-backend",
                "database": {
                    "status": "disconnected",
                    "error": type(e).__name__
                }
            }
        )
