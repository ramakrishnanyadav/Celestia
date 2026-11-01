from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_event_for_user
from ..engines.ai_efficiency import AIEfficiencyService
from ..engines.ai_gateway import ai_gateway
from ..engines.ai_service import AIService
from ..engines.celebration_intelligence import generate_personalized_ideas
from ..idempotency import check_idempotency, record_idempotency
from ..models import Event
from ..rate_limiter import rate_limit_ai
from ..schemas import (
    ChatCommandRequest,
    ExtractedRequirement,
    PersonalizedIdeasResponse,
    PlanGenerationResponse,
    RequirementExtractionRequest,
)

router = APIRouter(prefix="", tags=["AI Intelligence"])

@router.post("/ai/extract-requirements", response_model=ExtractedRequirement, dependencies=[Depends(rate_limit_ai)])
def extract_requirements(req: RequirementExtractionRequest):
    ai_gateway.check_pause_switch()
    sanitized_prompt = ai_gateway.sanitize_untrusted_input(req.natural_language_prompt, "prompt")
    return AIService.extract_requirements_from_text(sanitized_prompt)

@router.get("/events/{event_id}/ai/ideas", response_model=PersonalizedIdeasResponse, dependencies=[Depends(rate_limit_ai)])
def get_ideas(
    event: Event = Depends(get_event_for_user)
):
    ai_gateway.check_pause_switch(event.ai_paused)
    ai_gateway.check_user_budget(event.user_id)
    return generate_personalized_ideas(event, event.preference)

@router.post("/events/{event_id}/ai/generate-plan", response_model=PlanGenerationResponse, dependencies=[Depends(rate_limit_ai)])
def generate_event_plan(
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key")
):
    ai_gateway.check_pause_switch(event.ai_paused)
    ai_gateway.check_user_budget(event.user_id)

    cached = check_idempotency(db, idempotency_key, event.user_id, f"generate_plan_{event.id}", {"event_id": event.id})
    if cached:
        return cached[1]

    res = AIService.generate_full_event_plan(db, event)
    res_data = res.model_dump(mode="json") if hasattr(res, "model_dump") else res
    record_idempotency(db, idempotency_key, event.user_id, f"generate_plan_{event.id}", {"event_id": event.id}, 200, res_data)
    return res

@router.post("/events/{event_id}/ai/command", dependencies=[Depends(rate_limit_ai)])
def execute_ai_command(
    cmd_in: ChatCommandRequest,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    ai_gateway.check_pause_switch(event.ai_paused)
    ai_gateway.check_user_budget(event.user_id)
    sanitized_cmd = ai_gateway.sanitize_untrusted_input(cmd_in.command, "command")
    return AIService.process_natural_language_command(db, event, sanitized_cmd)

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
