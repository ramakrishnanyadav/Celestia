from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..models import Event, Approval, ActivityLog
from ..engines.budget_intelligence import seed_event_budget
from ..engines.planning_intelligence import run_cpm_calculation

class ApprovalService:
    """
    Pure domain service for managing proposals, human-in-the-loop approvals,
    double-approval prevention, transaction rollbacks, and activity auditing.
    """

    @staticmethod
    def list_approvals(db: Session, event_id: str) -> List[Approval]:
        return db.query(Approval).filter(
            Approval.event_id == event_id
        ).order_by(Approval.created_at.desc()).all()

    @staticmethod
    def execute_action(
        db: Session,
        event: Event,
        proposal_id: str,
        action: str,
        comment: Optional[str] = None
    ) -> Approval:
        action_clean = action.lower()
        if action_clean not in ["approve", "reject"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid action. Must be 'approve' or 'reject'."
            )

        new_status = "approved" if action_clean == "approve" else "rejected"
        now = datetime.now(timezone.utc)

        # Atomic UPDATE with row-count check in one transaction
        rows_updated = db.query(Approval).filter(
            Approval.id == proposal_id,
            Approval.event_id == event.id,
            Approval.status == "pending"
        ).update({
            Approval.status: new_status,
            Approval.reviewed_at: now
        }, synchronize_session=False)

        if rows_updated == 0:
            existing = db.query(Approval).filter(
                Approval.id == proposal_id,
                Approval.event_id == event.id
            ).first()
            if not existing:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Proposal not found"
                )
            # Double-approval prevention: returns 409 Conflict
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Proposal is already {existing.status}"
            )

        proposal = db.query(Approval).filter(Approval.id == proposal_id).first()

        try:
            if action_clean == "approve":
                changes = proposal.proposed_changes_json or {}
                if proposal.proposal_type == "guest_scaling" and "new_guest_count" in changes:
                    old_count = event.guest_count
                    new_count = int(changes["new_guest_count"])
                    event.guest_count = new_count
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

            elif action_clean == "reject":
                log = ActivityLog(
                    event_id=event.id,
                    actor="User",
                    action="Proposal Rejected",
                    details=f"Rejected proposal '{proposal.title}'. Comment: {comment or 'None'}."
                )
                db.add(log)

            db.commit()
            db.refresh(proposal)
            return proposal
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def rollback_action(
        db: Session,
        event: Event,
        proposal_id: str
    ) -> Approval:
        """
        Rolls back an approved proposal, restoring original parameters
        and reverting proposal status to 'pending' in a single transaction.
        """
        proposal = db.query(Approval).filter(
            Approval.id == proposal_id,
            Approval.event_id == event.id
        ).first()
        if not proposal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proposal not found"
            )
        if proposal.status != "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot rollback proposal with status '{proposal.status}'. Only 'approved' proposals can be rolled back."
            )

        try:
            diff = proposal.diff_summary or {}
            before_state = diff.get("before", {})

            if proposal.proposal_type == "guest_scaling":
                orig_guests = before_state.get("guest_count")
                if orig_guests:
                    event.guest_count = int(orig_guests)
                    seed_event_budget(db, event)
                    run_cpm_calculation(db, event.id)

            elif proposal.proposal_type == "budget_adjustment":
                orig_budget = before_state.get("budget_minor")
                if orig_budget:
                    event.budget_minor = int(orig_budget)
                    seed_event_budget(db, event)

            proposal.status = "pending"
            proposal.reviewed_at = None

            log = ActivityLog(
                event_id=event.id,
                actor="User",
                action="Proposal Rolled Back",
                details=f"Rolled back proposal '{proposal.title}' to pending state."
            )
            db.add(log)
            db.commit()
            db.refresh(proposal)
            return proposal
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def get_activity_logs(db: Session, event_id: str) -> List[ActivityLog]:
        return db.query(ActivityLog).filter(
            ActivityLog.event_id == event_id
        ).order_by(ActivityLog.timestamp.desc()).all()
