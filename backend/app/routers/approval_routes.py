from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Event, Approval, ActivityLog
from ..schemas import ApprovalAction, ApprovalResponse, ActivityLogResponse
from ..auth import get_current_user
from ..engines.budget_intelligence import seed_event_budget
from ..engines.planning_intelligence import run_cpm_calculation

router = APIRouter(prefix="/events/{event_id}", tags=["Approvals & Autonomy"])

@router.get("/approvals", response_model=List[ApprovalResponse])
def list_approvals(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    approvals = db.query(Approval).filter(Approval.event_id == event_id).order_by(Approval.created_at.desc()).all()
    return approvals

@router.post("/approvals/{proposal_id}/action", response_model=ApprovalResponse)
def execute_proposal_action(
    event_id: str,
    proposal_id: str,
    action_in: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    action = action_in.action.lower()
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'approve' or 'reject'.")
        
    new_status = "approved" if action == "approve" else "rejected"
    now = datetime.now(timezone.utc)

    # Atomic UPDATE with row-count check in one transaction
    rows_updated = db.query(Approval).filter(
        Approval.id == proposal_id,
        Approval.event_id == event_id,
        Approval.status == "pending"
    ).update({
        Approval.status: new_status,
        Approval.reviewed_at: now
    }, synchronize_session=False)

    if rows_updated == 0:
        existing = db.query(Approval).filter(
            Approval.id == proposal_id,
            Approval.event_id == event_id
        ).first()
        if not existing:
            raise HTTPException(status_code=404, detail="Proposal not found")
        raise HTTPException(status_code=409, detail=f"Proposal is already {existing.status}")

    proposal = db.query(Approval).filter(Approval.id == proposal_id).first()
    
    if action == "approve":
        
        # Apply proposed changes deterministically
        changes = proposal.proposed_changes_json or {}
        if proposal.proposal_type == "guest_scaling" and "new_guest_count" in changes:
            old_count = event.guest_count
            new_count = int(changes["new_guest_count"])
            event.guest_count = new_count
            
            # Rebalance budget to reflect new per-head allocations
            seed_event_budget(db, event)
            run_cpm_calculation(db, event.id)
            
            log = ActivityLog(
                event_id=event.id,
                actor="User",
                action="Proposal Approved",
                details=f"Approved guest scaling from {old_count} to {new_count} guests. Budget and per-head numbers updated."
            )
            db.add(log)
            
        elif proposal.proposal_type == "budget_adjustment" and "new_budget_minor" in changes:
            new_minor = int(changes["new_budget_minor"])
            event.budget_minor = new_minor
            seed_event_budget(db, event)
            
            log = ActivityLog(
                event_id=event.id,
                actor="User",
                action="Proposal Approved",
                details=f"Approved budget adjustment to {new_minor // 100} INR."
            )
            db.add(log)
        else:
            log = ActivityLog(
                event_id=event.id,
                actor="User",
                action="Proposal Approved",
                details=f"Approved proposal '{proposal.title}'."
            )
            db.add(log)
            
    elif action == "reject":
        proposal.status = "rejected"
        proposal.reviewed_at = now
        
        log = ActivityLog(
            event_id=event.id,
            actor="User",
            action="Proposal Rejected",
            details=f"Rejected proposal '{proposal.title}'. Comment: {action_in.comment or 'None'}."
        )
        db.add(log)
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'approve' or 'reject'.")
        
    db.commit()
    db.refresh(proposal)
    return proposal

@router.get("/activity-logs", response_model=List[ActivityLogResponse])
def get_activity_logs(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    logs = db.query(ActivityLog).filter(ActivityLog.event_id == event_id).order_by(ActivityLog.timestamp.desc()).all()
    return logs
