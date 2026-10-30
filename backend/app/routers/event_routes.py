from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Event, EventPreference, EventPlan, ActivityLog
from ..schemas import (
    EventCreate, EventUpdate, EventResponse, 
    EventPreferenceCreate, EventPreferenceResponse
)
from ..auth import get_current_user
from ..engines.budget_intelligence import paise_to_rupees
from ..engines.ai_service import AIService

router = APIRouter(prefix="/events", tags=["Events"])

def enrich_event_response(event: Event) -> EventResponse:
    res = EventResponse.model_validate(event)
    res.budget_rupees = paise_to_rupees(event.budget_minor)
    return res

@router.get("", response_model=List[EventResponse])
def list_user_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    events = db.query(Event).filter(Event.user_id == current_user.id).order_by(Event.created_at.desc()).all()
    return [enrich_event_response(e) for e in events]

@router.post("", response_model=EventResponse)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = Event(
        user_id=current_user.id,
        title=event_in.title,
        event_type=event_in.event_type,
        city=event_in.city,
        venue_type=event_in.venue_type,
        guest_count=event_in.guest_count,
        budget_minor=event_in.budget_minor,
        currency=event_in.currency,
        timezone=event_in.timezone,
        preparation_months=event_in.preparation_months,
        target_date=event_in.target_date,
        autonomy_mode=event_in.autonomy_mode
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Initialize preferences
    prefs = event_in.preferences
    pref = EventPreference(
        event_id=event.id,
        dietary=prefs.dietary if prefs else "Pure Vegetarian",
        theme=prefs.theme if prefs else "Royal Marigold & Polished Brass",
        regional_culture=prefs.regional_culture if prefs else "Maharashtrian Traditional",
        cultural_traditions=prefs.cultural_traditions if prefs else ["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"],
        music_entertainment=prefs.music_entertainment if prefs else "Traditional Shehnai & Dhol-Tasha + Modern Sangeet DJ",
        color_palette=prefs.color_palette if prefs else ["#D97706", "#B45309", "#0B132B", "#FAF7F2", "#0D9488"],
        special_requirements=prefs.special_requirements if prefs else "Wheelchair accessible entrance, priority elderly seating, eco-friendly return gifts."
    )
    db.add(pref)

    # Seed baseline plan, budget, tasks, and vendors
    AIService.generate_full_event_plan(db, event)
    
    db.commit()
    db.refresh(event)
    return enrich_event_response(event)

@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return enrich_event_response(event)

@router.patch("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    update_data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(event, key, val)

    db.commit()
    db.refresh(event)
    return enrich_event_response(event)

@router.delete("/{event_id}")
def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}

@router.get("/{event_id}/preferences", response_model=EventPreferenceResponse)
def get_preferences(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event.preference:
        pref = EventPreference(event_id=event.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
        return pref
    return event.preference

@router.put("/{event_id}/preferences", response_model=EventPreferenceResponse)
def update_preferences(
    event_id: str,
    pref_in: EventPreferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    pref = event.preference
    if not pref:
        pref = EventPreference(event_id=event.id)
        db.add(pref)
        
    for k, v in pref_in.model_dump().items():
        setattr(pref, k, v)
        
    db.commit()
    db.refresh(pref)
    return pref

@router.get("/{event_id}/plans")
def get_active_plan(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    plan = db.query(EventPlan).filter(
        EventPlan.event_id == event_id,
        EventPlan.status == "active"
    ).order_by(EventPlan.created_at.desc()).first()
    
    if not plan:
        res = AIService.generate_full_event_plan(db, event)
        plan = db.query(EventPlan).filter(EventPlan.event_id == event_id).first()
        
    return {
        "id": plan.id,
        "title": plan.title,
        "summary": plan.summary,
        "blueprint_json": plan.blueprint_json,
        "created_at": plan.created_at
    }
