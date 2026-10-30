from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import User, Event, EventPreference
from ..schemas import (
    RequirementExtractionRequest, ExtractedRequirement,
    PersonalizedIdeasResponse, PlanGenerationResponse
)
from ..auth import get_current_user
from ..engines.ai_service import AIService
from ..engines.celebration_intelligence import generate_personalized_ideas

router = APIRouter(prefix="", tags=["AI Intelligence"])

class ChatCommandRequest(BaseModel):
    command: str

@router.post("/ai/extract-requirements", response_model=ExtractedRequirement)
def extract_requirements(req: RequirementExtractionRequest):
    return AIService.extract_requirements_from_text(req.natural_language_prompt)

@router.get("/events/{event_id}/ai/ideas", response_model=PersonalizedIdeasResponse)
def get_ideas(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    return generate_personalized_ideas(event, event.preference)

@router.post("/events/{event_id}/ai/generate-plan", response_model=PlanGenerationResponse)
def generate_event_plan(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    return AIService.generate_full_event_plan(db, event)

@router.post("/events/{event_id}/ai/command")
def execute_ai_command(
    event_id: str,
    cmd_in: ChatCommandRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    return AIService.process_natural_language_command(db, event, cmd_in.command)
