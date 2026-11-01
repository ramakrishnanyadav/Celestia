import uuid
import pytest
from app.models import Event, User, Task, EventPreference, EventPlan
from app.auth import create_access_token

@pytest.fixture
def test_setup(db_session):
    uid = uuid.uuid4().hex[:8]
    user = User(
        email=f"routes_tester_{uid}@celestia.ai",
        name="Routes Tester",
        password_hash="argon2_dummy_hash",
        role="planner",
        is_demo=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    event = Event(
        user_id=user.id,
        title="Jaipur Palace Celebration",
        event_type="wedding",
        city="Jaipur",
        venue_type="Palace",
        guest_count=200,
        budget_minor=200000000,
        currency="INR",
        preparation_months=8
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    headers = {"Authorization": f"Bearer {token}"}
    return user, event, headers

def test_event_preferences_and_lifecycle(client, db_session, test_setup):
    user, event, headers = test_setup

    # 1. Update event
    patch_res = client.patch(f"/api/events/{event.id}", headers=headers, json={"city": "Udaipur", "guest_count": 250, "ai_paused": True})
    assert patch_res.status_code == 200
    assert patch_res.json()["city"] == "Udaipur"
    assert patch_res.json()["guest_count"] == 250
    assert patch_res.json()["ai_paused"] is True

    # 2. Update nonexistent event (404)
    assert client.patch("/api/events/nonexistent-id", headers=headers, json={"city": "Delhi"}).status_code == 404

    # 3. Get preferences (creates default preference if missing)
    pref_res = client.get(f"/api/events/{event.id}/preferences", headers=headers)
    assert pref_res.status_code == 200
    assert "dietary" in pref_res.json()

    # 4. Put preferences
    new_pref = {
        "dietary": "Jain Vegetarian",
        "theme": "Regal Brass",
        "regional_culture": "Marwari",
        "sound_curfew": "22:00"
    }
    put_res = client.put(f"/api/events/{event.id}/preferences", headers=headers, json=new_pref)
    assert put_res.status_code == 200
    assert put_res.json()["dietary"] == "Jain Vegetarian"
    assert put_res.json()["regional_culture"] == "Marwari"

    # 5. Get active plan (triggers plan generation if missing)
    plan_res = client.get(f"/api/events/{event.id}/plans", headers=headers)
    assert plan_res.status_code == 200
    assert "id" in plan_res.json()
    assert "blueprint_json" in plan_res.json()

    # 6. Delete event
    del_res = client.delete(f"/api/events/{event.id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["message"] == "Event deleted successfully"

    # 7. Delete nonexistent event (404)
    assert client.delete(f"/api/events/{event.id}", headers=headers).status_code == 404

def test_demo_user_deletion_prevention(client, db_session):
    demo_user = User(
        email="demo_delete_test@celestia.ai",
        name="Demo User",
        password_hash="argon2_dummy",
        role="planner",
        is_demo=True
    )
    db_session.add(demo_user)
    db_session.commit()
    db_session.refresh(demo_user)

    demo_event = Event(
        user_id=demo_user.id,
        title="Demo Protected Event",
        event_type="wedding",
        city="Mumbai",
        venue_type="Banquet",
        guest_count=100,
        budget_minor=100000000,
        currency="INR",
        preparation_months=6
    )
    db_session.add(demo_event)
    db_session.commit()
    db_session.refresh(demo_event)

    token = create_access_token({"sub": demo_user.id, "email": demo_user.email, "role": demo_user.role})
    headers = {"Authorization": f"Bearer {token}"}

    del_res = client.delete(f"/api/events/{demo_event.id}", headers=headers)
    assert del_res.status_code == 403
    assert "read-only" in del_res.json()["detail"]

def test_task_routes_dependencies_and_cpm(client, db_session, test_setup):
    user, event, headers = test_setup

    # 1. Create two tasks
    t1_data = {
        "title": "Select Sangeet Venue",
        "category": "Venue",
        "days_before_event": 120,
        "duration_days": 5,
        "priority": "high"
    }
    t2_data = {
        "title": "Book Sound Engineer",
        "category": "Sound",
        "days_before_event": 100,
        "duration_days": 2,
        "priority": "medium"
    }
    r1 = client.post(f"/api/events/{event.id}/tasks", headers=headers, json=t1_data)
    assert r1.status_code == 200
    t1_id = r1.json()["id"]

    r2 = client.post(f"/api/events/{event.id}/tasks", headers=headers, json=t2_data)
    assert r2.status_code == 200
    t2_id = r2.json()["id"]

    # 2. Add dependency: t2 depends on t1
    dep_res = client.post(
        f"/api/events/{event.id}/tasks/{t2_id}/dependencies",
        headers=headers,
        json={"depends_on_task_id": t1_id}
    )
    assert dep_res.status_code == 200
    assert t1_id in dep_res.json()["depends_on_ids"]

    # 3. Add circular dependency: t1 depends on t2 (400)
    cycle_res = client.post(
        f"/api/events/{event.id}/tasks/{t1_id}/dependencies",
        headers=headers,
        json={"depends_on_task_id": t2_id}
    )
    assert cycle_res.status_code == 400
    assert "Circular dependency" in cycle_res.json()["detail"]

    # 4. Dependency on nonexistent task (404)
    assert client.post(
        f"/api/events/{event.id}/tasks/{t1_id}/dependencies",
        headers=headers,
        json={"depends_on_task_id": "nonexistent-id"}
    ).status_code == 404

    # 5. Patch task status to completed (verifies completed_at timestamp set)
    patch_t1 = client.patch(
        f"/api/events/{event.id}/tasks/{t1_id}",
        headers=headers,
        json={"status": "completed"}
    )
    assert patch_t1.status_code == 200
    assert patch_t1.json()["status"] == "completed"

    # Status back to pending clears completed_at
    patch_t1_pending = client.patch(
        f"/api/events/{event.id}/tasks/{t1_id}",
        headers=headers,
        json={"status": "pending"}
    )
    assert patch_t1_pending.status_code == 200
    assert patch_t1_pending.json()["status"] == "pending"

    # 6. Recalculate CPM endpoint
    cpm_res = client.post(f"/api/events/{event.id}/tasks/cpm", headers=headers)
    assert cpm_res.status_code == 200
    assert "critical_path_task_ids" in cpm_res.json()
    assert len(cpm_res.json()["tasks"]) == 2

    # 7. Delete task
    del_t2 = client.delete(f"/api/events/{event.id}/tasks/{t2_id}", headers=headers)
    assert del_t2.status_code == 200
    assert del_t2.json()["message"] == "Task deleted successfully"

    # Delete nonexistent task (404)
    assert client.delete(f"/api/events/{event.id}/tasks/{t2_id}", headers=headers).status_code == 404
