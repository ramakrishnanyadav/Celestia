import logging
import os
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from .auth import get_or_create_demo_user
from .config import settings
from .database import Base, SessionLocal, engine, get_db
from .engines.ai_service import AIService
from .models import Event, EventPreference
from .routers import (
    ai_routes,
    approval_routes,
    auth_routes,
    budget_routes,
    event_routes,
    task_routes,
    vendor_routes,
)

logger = logging.getLogger("celestia")

# Validate environment configuration before booting
settings.validate_production_config()

# Initialize tables only in test environment; production/staging uses Alembic migrations
if os.environ.get("TESTING") == "1" or settings.ENV == "testing":
    Base.metadata.create_all(bind=engine)

def bootstrap_primary_demonstration_scenario():
    """
    Seeds the three primary demonstration scenarios for evaluation:
    1. Wedding: Maharashtrian Traditional in Mumbai (300 guests, ₹15,00,000, pure veg)
    2. Birthday: Aarav's 1st Birthday Pastel Carnival in Pune (50 guests, ₹1,50,000)
    3. Community: Shivaji Park Diwali Community Utsav in Mumbai (1000 guests, ₹8,00,000, pure veg)
    """
    if not settings.DEMO_ACCOUNT_ENABLED or settings.ENV == "production":
        return
    db = SessionLocal()
    try:
        demo_user = get_or_create_demo_user(db)
        
        # 1. Wedding (Maharashtrian, 300 pax, 15L, Pure Veg)
        existing_wedding = db.query(Event).filter(
            Event.user_id == demo_user.id,
            Event.event_type == "wedding"
        ).first()
        if not existing_wedding:
            wedding_event = Event(
                user_id=demo_user.id,
                title="Anjali & Rahul's Royal Mumbai Wedding",
                event_type="wedding",
                city="Mumbai",
                venue_type="Grand Banquet Hall",
                guest_count=300,
                budget_minor=150000000,  # ₹15,00,000
                currency="INR",
                timezone="Asia/Kolkata",
                preparation_months=6,
                status="planning",
                autonomy_mode="Draft"
            )
            db.add(wedding_event)
            db.commit()
            db.refresh(wedding_event)

            pref_wedding = EventPreference(
                event_id=wedding_event.id,
                dietary="Pure Vegetarian",
                theme="Royal Marigold & Polished Brass",
                regional_culture="Maharashtrian Traditional",
                cultural_traditions=["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"],
                music_entertainment="Traditional Shehnai & Dhol-Tasha + Modern Sangeet DJ",
                color_palette=["#D97706", "#B45309", "#0B132B", "#FAF7F2", "#0D9488"],
                special_requirements="Wheelchair accessible entrance, priority elderly seating, eco-friendly return gifts."
            )
            db.add(pref_wedding)
            db.commit()
            AIService.generate_full_event_plan(db, wedding_event)

        # 2. Birthday (Aarav's 1st Birthday Carnival, 50 pax, 1.5L)
        existing_birthday = db.query(Event).filter(
            Event.user_id == demo_user.id,
            Event.event_type == "birthday"
        ).first()
        if not existing_birthday:
            birthday_event = Event(
                user_id=demo_user.id,
                title="Aarav's 1st Birthday Pastel Carnival",
                event_type="birthday",
                city="Pune",
                venue_type="Garden Lawn & Gazebo",
                guest_count=50,
                budget_minor=15000000,  # ₹1,50,000
                currency="INR",
                timezone="Asia/Kolkata",
                preparation_months=2,
                status="planning",
                autonomy_mode="Draft"
            )
            db.add(birthday_event)
            db.commit()
            db.refresh(birthday_event)

            pref_birthday = EventPreference(
                event_id=birthday_event.id,
                dietary="Vegetarian & Kids Fun Station",
                theme="Whimsical Pastel Balloon Carnival",
                regional_culture="Contemporary Indian",
                cultural_traditions=["Cake Cutting Ceremony", "Annaprashan Blessing", "Return Gift Distribution"],
                music_entertainment="Acoustic Folk & Children's Interactive DJ",
                color_palette=["#38BDF8", "#F472B6", "#FDE047", "#FFFFFF", "#0D9488"],
                special_requirements="Allergen-free kids cupcakes, stroller parking bay, balloon twisting artist."
            )
            db.add(pref_birthday)
            db.commit()
            AIService.generate_full_event_plan(db, birthday_event)

        # 3. Community Festival (Diwali Utsav, 1000 pax, 8L)
        existing_community = db.query(Event).filter(
            Event.user_id == demo_user.id,
            Event.event_type == "community"
        ).first()
        if not existing_community:
            community_event = Event(
                user_id=demo_user.id,
                title="Shivaji Park Diwali Community Utsav",
                event_type="community",
                city="Mumbai",
                venue_type="Public Community Amphitheatre",
                guest_count=1000,
                budget_minor=80000000,  # ₹8,00,000
                currency="INR",
                timezone="Asia/Kolkata",
                preparation_months=3,
                status="planning",
                autonomy_mode="Draft"
            )
            db.add(community_event)
            db.commit()
            db.refresh(community_event)

            pref_community = EventPreference(
                event_id=community_event.id,
                dietary="Pure Vegetarian Community Maha-Prasad",
                theme="Traditional Deepotsav & Brass Diyas",
                regional_culture="Maharashtrian Utsav",
                cultural_traditions=["Deepotsav Lighting", "Cultural Natak & Lavani Folk", "Community Prasad Distribution", "Maha Aarti"],
                music_entertainment="Live Classical Lezim & Dhol Troupe",
                color_palette=["#EA580C", "#F59E0B", "#7C2D12", "#FFFBEB", "#0D9488"],
                special_requirements="Crowd management barricades, municipal fire clearance, emergency first-aid station."
            )
            db.add(pref_community)
            db.commit()
            AIService.generate_full_event_plan(db, community_event)

    except Exception as e:
        db.rollback()
        logger.error(f"Error bootstrapping scenarios: {e}")
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
    logger.error(f"[Unhandled Error {err_id}] Path: {request.url.path} | Exception: {exc!s}", exc_info=True)
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
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token", "Idempotency-Key", "Accept", "X-Requested-With"],
    expose_headers=["X-Request-ID"]
)

# Gzip compression for responses > 1000 bytes
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Request ID & Structured Logging Middleware
@app.middleware("http")
async def request_id_and_logging_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = req_id
    t0 = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - t0) * 1000.0, 2)
    response.headers["X-Request-ID"] = req_id
    logger.info("request_completed path=%s method=%s status=%d duration_ms=%.2f request_id=%s",
                request.url.path, request.method, response.status_code, duration_ms, req_id)
    return response

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

# Include Routers (/api and /api/v1 prefix)
app.include_router(auth_routes.router, prefix="/api")
app.include_router(event_routes.router, prefix="/api")
app.include_router(event_routes.router, prefix="/api/v1")
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

@app.get("/healthz")
def liveness():
    return {"status": "ok", "service": "celestia-backend"}

@app.get("/readyz")
def readiness(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "service": "celestia-backend", "database": "connected"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "not_ready", "error": type(e).__name__})

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
