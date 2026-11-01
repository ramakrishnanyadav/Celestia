from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .models import User, Event, EventPreference
from .auth import hash_password, get_or_create_demo_user
from .routers import (
    auth_routes, event_routes, budget_routes,
    task_routes, vendor_routes, approval_routes, ai_routes
)
from .engines.ai_service import AIService

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="CELESTIA AI Event Planning Assistant — Deterministic Budgeting, CPM Timeline, Cultural Intelligence & Autonomy"
)

from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request
import uuid
import logging

logger = logging.getLogger("celestia")

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

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable Gzip compression for responses > 1000 bytes
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include Routers
app.include_router(auth_routes.router, prefix="/api")
app.include_router(event_routes.router, prefix="/api")
app.include_router(budget_routes.router, prefix="/api")
app.include_router(task_routes.router, prefix="/api")
app.include_router(vendor_routes.router, prefix="/api")
app.include_router(approval_routes.router, prefix="/api")
app.include_router(ai_routes.router, prefix="/api")

@app.get("/api/test-fault/unhandled-error")
def trigger_unhandled_error_for_audit():
    """Diagnostic fault injection endpoint to verify sanitization of 500 errors."""
    return 1 / 0

@app.on_event("startup")
def bootstrap_primary_demonstration_scenario():
    """
    Seeds the primary demonstration scenario if the database is fresh:
    - User: Anjali & Rahul
    - Event: Traditional Maharashtrian Wedding in Mumbai
    - 300 Guests, ₹15,00,000 Budget (150,000,000 paise)
    - Pure Vegetarian Catering
    - Royal Marigold Theme
    - Deterministic budget categories, CPM tasks, and vendor quotations.
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
                budget_minor=150000000, # ₹15,00,000 in paise
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
            
            # Generate complete plan, budget, tasks with CPM, and quotations
            AIService.generate_full_event_plan(db, wedding_event)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "celestia-backend"}
