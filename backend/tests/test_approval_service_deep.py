import uuid

import pytest
from fastapi import HTTPException

from app.models import Approval, Event, User
from app.services.approval_service import ApprovalService


@pytest.fixture
def test_setup(db_session):
    uid = uuid.uuid4().hex[:8]
    user = User(
        email=f"approval_lead_{uid}@celestia.ai",
        name="Approval Lead",
        password_hash="argon2_hash",
        role="planner"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    event = Event(
        user_id=user.id,
        title="Udaipur Royal Wedding",
        event_type="wedding",
        city="Udaipur",
        venue_type="Palace",
        guest_count=200,
        budget_minor=200000000,
        currency="INR",
        preparation_months=8
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)

    return user, event

def test_approval_service_action_validation_and_rejection(db_session, test_setup):
    _user, event = test_setup

    prop = Approval(
        event_id=event.id,
        title="Sample Generic Proposal",
        proposal_type="custom_task",
        summary="Add welcome fireworks at the dock",
        status="pending"
    )
    db_session.add(prop)
    db_session.commit()
    db_session.refresh(prop)

    # 1. Invalid action raises 400
    with pytest.raises(HTTPException) as exc:
        ApprovalService.execute_action(db_session, event, prop.id, "maybe")
    assert exc.value.status_code == 400
    assert "Invalid action" in exc.value.detail

    # 2. Reject proposal with comment
    rejected = ApprovalService.execute_action(
        db_session, event, prop.id, "reject", comment="Too loud for heritage guidelines"
    )
    assert rejected.status == "rejected"

    # 3. Double-action on already rejected proposal raises 409 Conflict
    with pytest.raises(HTTPException) as exc:
        ApprovalService.execute_action(db_session, event, prop.id, "reject")
    assert exc.value.status_code == 409
    assert "already rejected" in exc.value.detail

    # 4. Action on nonexistent proposal raises 404
    with pytest.raises(HTTPException) as exc:
        ApprovalService.execute_action(db_session, event, "nonexistent-id", "approve")
    assert exc.value.status_code == 404

def test_approval_service_guest_scaling_and_rollback(db_session, test_setup):
    _user, event = test_setup

    prop = Approval(
        event_id=event.id,
        title="Scale Guest Count to 300",
        proposal_type="guest_scaling",
        summary="Accommodate extra extended family",
        status="pending",
        proposed_changes_json={"new_guest_count": 300},
        diff_summary={"before": {"guest_count": 200}, "after": {"guest_count": 300}}
    )
    db_session.add(prop)
    db_session.commit()
    db_session.refresh(prop)

    # Cannot rollback a pending proposal (400)
    with pytest.raises(HTTPException) as exc:
        ApprovalService.rollback_action(db_session, event, prop.id)
    assert exc.value.status_code == 400
    assert "Cannot rollback proposal with status 'pending'" in exc.value.detail

    # Approve guest scaling
    approved = ApprovalService.execute_action(db_session, event, prop.id, "approve")
    assert approved.status == "approved"
    db_session.refresh(event)
    assert event.guest_count == 300

    # Rollback guest scaling
    rolled_back = ApprovalService.rollback_action(db_session, event, prop.id)
    assert rolled_back.status == "pending"
    db_session.refresh(event)
    assert event.guest_count == 200

def test_approval_service_budget_adjustment_and_rollback(db_session, test_setup):
    _user, event = test_setup

    prop = Approval(
        event_id=event.id,
        title="Expand Budget for Royal Drone Show",
        proposal_type="budget_adjustment",
        summary="Increase budget by ₹50,000",
        status="pending",
        proposed_changes_json={"new_budget_minor": 250000000},
        diff_summary={"before": {"budget_minor": 200000000}, "after": {"budget_minor": 250000000}}
    )
    db_session.add(prop)
    db_session.commit()
    db_session.refresh(prop)

    # Approve budget adjustment
    approved = ApprovalService.execute_action(db_session, event, prop.id, "approve")
    assert approved.status == "approved"
    db_session.refresh(event)
    assert event.budget_minor == 250000000

    # Rollback budget adjustment
    rolled_back = ApprovalService.rollback_action(db_session, event, prop.id)
    assert rolled_back.status == "pending"
    db_session.refresh(event)
    assert event.budget_minor == 200000000

    # Verify activity logs and list_approvals
    approvals_list = ApprovalService.list_approvals(db_session, event.id)
    assert len(approvals_list) >= 1

    logs = ApprovalService.get_activity_logs(db_session, event.id)
    assert len(logs) >= 2
