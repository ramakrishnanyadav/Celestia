
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_event_for_user
from ..models import Event
from ..schemas import ActivityLogResponse, ApprovalAction, ApprovalResponse
from ..services.approval_service import ApprovalService

router = APIRouter(prefix="/events/{event_id}", tags=["Approvals & Autonomy"])

@router.get("/approvals", response_model=list[ApprovalResponse])
def list_approvals(
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    return ApprovalService.list_approvals(db, event.id)

@router.post("/approvals/{proposal_id}/action", response_model=ApprovalResponse)
def execute_proposal_action(
    proposal_id: str,
    action_in: ApprovalAction,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    return ApprovalService.execute_action(
        db=db,
        event=event,
        proposal_id=proposal_id,
        action=action_in.action,
        comment=action_in.comment
    )

@router.get("/activity-logs", response_model=list[ActivityLogResponse])
def get_activity_logs(
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    return ApprovalService.get_activity_logs(db, event.id)
