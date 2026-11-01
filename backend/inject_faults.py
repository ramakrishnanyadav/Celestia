import asyncio
import time
import uuid
import httpx
from app.database import SessionLocal
from app.models import User, Event, Approval
from app.auth import hash_password, create_access_token

BASE_URL = "http://127.0.0.1:8000"

def get_auth_context():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "loadtest_500@celestia.ai").first()
    event = db.query(Event).filter(Event.user_id == user.id).first()
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    db.close()
    return token, event.id

def test_fault_duplicate_submit(token: str, event_id: str):
    print("\n--- FAULT INJECTION 1: Duplicate Submit (Idempotency & Concurrent Conflict) ---")
    headers = {"Authorization": f"Bearer {token}", "Idempotency-Key": f"fault-test-{uuid.uuid4().hex[:8]}"}
    payload = {
        "title": "Fault Test Decor Setup",
        "category": "Decor",
        "milestone_name": "Month 1",
        "days_before_event": 30,
        "duration_days": 2
    }

    # First Submit
    with httpx.Client(base_url=BASE_URL) as client:
        r1 = client.post(f"/api/events/{event_id}/tasks", json=payload, headers=headers)
        print(f"1st Submit Status: {r1.status_code} | Raw text: {repr(r1.text)[:120]}")
        print(f"Body ID: {r1.json().get('id') if r1.status_code == 200 else 'N/A'}")

        # Duplicate Submit with exact same key
        r2 = client.post(f"/api/events/{event_id}/tasks", json=payload, headers=headers)
        print(f"2nd Submit Status: {r2.status_code} | Body ID: {r2.json().get('id')} (Cached Idempotent Response)")
        assert r1.json()["id"] == r2.json()["id"], "Idempotency failed to return cached object"

        # Tampered Submit with same key but altered payload
        tampered = {**payload, "title": "Tampered Payload Title"}
        r3 = client.post(f"/api/events/{event_id}/tasks", json=tampered, headers=headers)
        print(f"Tampered Submit Status: {r3.status_code} | Detail: {r3.json().get('detail')}")
        assert r3.status_code == 422, "Tampered payload did not return 422"

def test_fault_provider_timeout(token: str, event_id: str):
    print("\n--- FAULT INJECTION 2: AI Provider Timeout & Fast Fallback ---")
    headers = {"Authorization": f"Bearer {token}"}
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        # Request with timeout_sec=0.10s (extremely aggressive timeout to simulate provider hang)
        t0 = time.perf_counter()
        resp = client.post(f"/api/events/{event_id}/ai/generate-plan-parallel?timeout_sec=0.10", headers=headers)
        latency = (time.perf_counter() - t0) * 1000.0
        print(f"Response Status: {resp.status_code} | Execution Time: {latency:.2f} ms")
        data = resp.json()
        print(f"Plan Title: {data.get('plan_title')}")
        print(f"Fallback Sections Present: {list(data.get('sections', {}).keys())}")
        assert resp.status_code == 200, "Provider timeout caused request crash instead of graceful fallback"

def test_fault_database_down():
    print("\n--- FAULT INJECTION 3: Simulated Database Disconnect / Bad Connection ---")
    # Simulate DB down by querying with invalid DB session or broken engine
    from sqlalchemy import create_engine
    from sqlalchemy.exc import OperationalError
    
    broken_engine = create_engine("sqlite:///nonexistent_dir/unwritable_celestia.db")
    try:
        with broken_engine.connect() as conn:
            conn.execute("SELECT 1")
    except OperationalError as e:
        print(f"Real Behavior when DB is unreachable: Caught OperationalError -> {type(e).__name__}")
        print(f"Message: {str(e)[:120]}...")

def test_traceback_in_500_leak(token: str):
    print("\n--- FAULT INJECTION 4: Verify 'Traceback in 500' Claim with Real Request ---")
    with httpx.Client(base_url=BASE_URL) as client:
        # Send real request triggering an unhandled ZeroDivisionError on the server
        resp = client.get("/api/test-fault/unhandled-error")
        print(f"Status Code: {resp.status_code}")
        print(f"Content-Type: {resp.headers.get('content-type')}")
        print(f"Response Body: {resp.text[:200]}")
        has_traceback = "traceback" in resp.text.lower() or "line " in resp.text.lower() or "file " in resp.text.lower()
        print(f"Leaking Internal Python Traceback to Client: {has_traceback}")

if __name__ == "__main__":
    token, event_id = get_auth_context()
    test_fault_duplicate_submit(token, event_id)
    test_fault_provider_timeout(token, event_id)
    test_fault_database_down()
    test_traceback_in_500_leak(token)
