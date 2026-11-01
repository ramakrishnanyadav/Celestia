
import hashlib

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from sqlalchemy.orm import Session, joinedload, selectinload

from ..auth import get_current_user
from ..database import get_db
from ..engines.ai_service import AIService
from ..engines.budget_intelligence import calculate_budget_summary, paise_to_rupees, rupees_to_paise
from ..idempotency import check_idempotency, record_idempotency
from ..models import BudgetCategory, Event, EventPlan, EventPreference, Task, User
from ..schemas import (
    EventCreate,
    EventOverviewResponse,
    EventPreferenceCreate,
    EventPreferenceResponse,
    EventResponse,
    EventUpdate,
)

router = APIRouter(prefix="/events", tags=["Events"])

def enrich_event_response(event: Event) -> EventResponse:
    res = EventResponse.model_validate(event)
    res.budget_rupees = paise_to_rupees(event.budget_minor)
    return res

@router.get("", response_model=list[EventResponse])
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
    current_user: User = Depends(get_current_user),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key")
):
    cached = check_idempotency(db, idempotency_key, current_user.id, "create_event", event_in.model_dump())
    if cached:
        return cached[1]
    budget_minor = event_in.budget_minor
    if event_in.budget_rupees is not None:
        budget_minor = rupees_to_paise(event_in.budget_rupees)

    event = Event(
        user_id=current_user.id,
        title=event_in.title,
        event_type=event_in.event_type,
        city=event_in.city,
        venue_type=event_in.venue_type,
        guest_count=event_in.guest_count,
        budget_minor=budget_minor,
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
    res = enrich_event_response(event)
    record_idempotency(db, idempotency_key, current_user.id, "create_event", event_in.model_dump(), 200, res.model_dump(mode="json"))
    return res

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

def enrich_category_item(cat: BudgetCategory) -> dict[str, Any]:
    return {
        "id": cat.id,
        "event_id": cat.event_id,
        "name": cat.name,
        "allocation_percent": cat.allocation_percent,
        "allocation_basis_points": cat.allocation_basis_points,
        "allocated_amount_minor": cat.allocated_amount_minor,
        "allocated_rupees": paise_to_rupees(cat.allocated_amount_minor),
        "icon": cat.icon,
        "is_per_guest": cat.is_per_guest,
        "per_guest_minor": cat.per_guest_minor,
        "per_guest_rupees": paise_to_rupees(cat.per_guest_minor),
        "sort_order": cat.sort_order,
        "version": cat.version,
        "expenses": [
            {
                "id": exp.id,
                "category_id": exp.category_id,
                "name": exp.name,
                "planned_amount_minor": exp.planned_amount_minor,
                "planned_rupees": paise_to_rupees(exp.planned_amount_minor),
                "actual_amount_minor": exp.actual_amount_minor,
                "actual_rupees": paise_to_rupees(exp.actual_amount_minor),
                "provenance": exp.provenance,
                "notes": exp.notes,
                "version": exp.version,
            }
            for exp in cat.expenses
        ]
    }

def enrich_task_item(task: Task) -> dict[str, Any]:
    return {
        "id": task.id,
        "event_id": task.event_id,
        "title": task.title,
        "description": task.description,
        "category": task.category,
        "milestone_name": task.milestone_name,
        "days_before_event": task.days_before_event,
        "duration_days": task.duration_days,
        "priority": task.priority,
        "status": task.status,
        "assigned_to": task.assigned_to,
        "is_critical": task.is_critical,
        "early_start_day": task.early_start_day,
        "early_finish_day": task.early_finish_day,
        "late_start_day": task.late_start_day,
        "late_finish_day": task.late_finish_day,
        "total_slack": task.total_slack,
        "version": task.version,
        "created_at": task.created_at,
        "completed_at": task.completed_at,
        "depends_on_ids": [d.depends_on_task_id for d in task.dependencies]
    }

@router.get("/{event_id}/overview", response_model=EventOverviewResponse)
def get_event_overview(
    event_id: str,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    High-performance aggregated event overview endpoint.
    Eliminates 5-call client fan-out by eagerly fetching event, budget summary,
    next tasks, pending approvals, vendors count, and activity logs in <= 5 queries.
    Supports HTTP conditional caching with ETag and 304 Not Modified.
    """
    event = db.query(Event).options(
        joinedload(Event.preference),
        joinedload(Event.approvals),
        joinedload(Event.vendors),
        joinedload(Event.activity_logs),
        selectinload(Event.budget_categories).joinedload(BudgetCategory.expenses),
    ).filter(Event.id == event_id, Event.user_id == current_user.id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Fetch only the top 10 next operational tasks with dependencies (avoids loading full 500-task graph)
    next_tasks_db = db.query(Task).options(
        joinedload(Task.dependencies)
    ).filter(
        Task.event_id == event.id
    ).order_by(
        Task.days_before_event.desc()
    ).limit(10).all()

    etag_seed = f"{event.id}:{event.updated_at}:{len(next_tasks_db)}:{len(event.budget_categories)}:{len(event.approvals)}"
    etag = hashlib.sha256(etag_seed.encode("utf-8")).hexdigest()[:16]

    if_none_match = request.headers.get("If-None-Match")
    if if_none_match in (etag, f'"{etag}"'):
        return Response(
            status_code=304,
            headers={
                "ETag": f'"{etag}"',
                "Cache-Control": "private, must-revalidate, max-age=10"
            }
        )

    categories = sorted(event.budget_categories, key=lambda c: c.sort_order)
    budget_dict = calculate_budget_summary(event, categories)
    budget_dict["categories"] = [enrich_category_item(c) for c in categories]

    next_tasks = [enrich_task_item(t) for t in next_tasks_db]

    pending_approvals = [a for a in event.approvals if a.status == "pending"]
    recent_logs = sorted(event.activity_logs, key=lambda l: l.timestamp, reverse=True)[:5]

    response.headers["ETag"] = f'"{etag}"'
    response.headers["Cache-Control"] = "private, must-revalidate, max-age=10"

    return {
        "event": enrich_event_response(event),
        "budget": budget_dict,
        "next_tasks": next_tasks,
        "pending_approvals": pending_approvals,
        "vendors_count": len(event.vendors),
        "recent_activities": recent_logs
    }

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
    if current_user.is_demo:
        raise HTTPException(
            status_code=403,
            detail="Demonstration celebration workspace is read-only and events cannot be deleted."
        )

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
        AIService.generate_full_event_plan(db, event)
        plan = db.query(EventPlan).filter(EventPlan.event_id == event_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Event plan could not be generated")

    return {
        "id": plan.id,
        "title": plan.title,
        "summary": plan.summary,
        "blueprint_json": plan.blueprint_json,
        "created_at": plan.created_at
    }
