from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import Event
from ..schemas import (
    RequirementExtractionRequest, ExtractedRequirement,
    PersonalizedIdeasResponse, PlanGenerationResponse
)
from ..dependencies import get_event_for_user
from ..engines.ai_service import AIService
from ..engines.celebration_intelligence import generate_personalized_ideas
from ..engines.ai_efficiency import AIEfficiencyService
from ..idempotency import check_idempotency, record_idempotency

router = APIRouter(prefix="", tags=["AI Intelligence"])

class ChatCommandRequest(BaseModel):
    command: str

@router.post("/ai/extract-requirements", response_model=ExtractedRequirement)
def extract_requirements(req: RequirementExtractionRequest):
    return AIService.extract_requirements_from_text(req.natural_language_prompt)

@router.get("/events/{event_id}/ai/ideas", response_model=PersonalizedIdeasResponse)
def get_ideas(
    event: Event = Depends(get_event_for_user)
):
    return generate_personalized_ideas(event, event.preference)

@router.post("/events/{event_id}/ai/generate-plan", response_model=PlanGenerationResponse)
def generate_event_plan(
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
):
    cached = check_idempotency(db, idempotency_key, event.user_id, f"generate_plan_{event.id}", {"event_id": event.id})
    if cached:
        return cached[1]

    res = AIService.generate_full_event_plan(db, event)
    res_data = res.model_dump(mode="json") if hasattr(res, "model_dump") else res
    record_idempotency(db, idempotency_key, event.user_id, f"generate_plan_{event.id}", {"event_id": event.id}, 200, res_data)
    return res

@router.post("/events/{event_id}/ai/command")
def execute_ai_command(
    cmd_in: ChatCommandRequest,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    return AIService.process_natural_language_command(db, event, cmd_in.command)

@router.get("/events/{event_id}/ai/stream-plan")
async def stream_event_plan(
    event: Event = Depends(get_event_for_user)
):
    return StreamingResponse(
        AIEfficiencyService.stream_plan_tokens(event, event.preference),
        media_type="text/event-stream"
    )

@router.post("/events/{event_id}/ai/generate-plan-parallel")
async def generate_plan_parallel_endpoint(
    event: Event = Depends(get_event_for_user),
    timeout_sec: float = 3.0
):
    return await AIEfficiencyService.generate_plan_parallel(event, event.preference, timeout_sec=timeout_sec)
