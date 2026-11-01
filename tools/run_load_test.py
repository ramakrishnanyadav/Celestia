"""
CELESTIA Concurrent Load Test & Endpoint Breakdown Benchmark.
Tests:
  - Core Reads (target: p95 < 200ms at 50 RPS / concurrency 25-50):
      * GET /api/v1/events/{id}/overview (Aggregated overview with eager loading & ETag)
      * GET /api/events/{id} (Metadata)
      * GET /api/events/{id}/budget/summary (Integer ledger)
      * GET /api/events/{id}/tasks (500-task CPM critical path calculation)
  - Core Writes (target: p95 < 500ms at 50 RPS):
      * POST /api/events/{id}/tasks (Task creation + dependency ordering)
      * POST /api/events/{id}/budget/categories (Category creation + basis points validation)
Exports full telemetry to docs/evidence/perf/load_test_results.json.
"""
import sys
import os
import asyncio
import time
import uuid
import json
from pathlib import Path
import numpy as np
import httpx

# Ensure backend package is in path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

from app.database import SessionLocal, Base, engine
from app.models import User, Event, Task, TaskDependency, BudgetCategory, Expense
from app.auth import hash_password, create_access_token
from app.main import app

def setup_500_task_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check or create benchmark user
    user = db.query(User).filter(User.email == "loadtest_500@celestia.ai").first()
    if not user:
        user = User(
            email="loadtest_500@celestia.ai",
            name="Load Test Runner",
            password_hash=hash_password("password123"),
            role="planner"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    event = db.query(Event).filter(Event.user_id == user.id, Event.title == "Grand 500-Task Royal Wedding").first()
    if not event:
        event = Event(
            user_id=user.id,
            title="Grand 500-Task Royal Wedding",
            event_type="wedding",
            city="Mumbai",
            venue_type="Palace & Banquet",
            guest_count=500,
            budget_minor=500000000,
            currency="INR",
            timezone="Asia/Kolkata",
            preparation_months=12
        )
        db.add(event)
        db.commit()
        db.refresh(event)

    # Ensure 500 tasks
    task_count = db.query(Task).filter(Task.event_id == event.id).count()
    if task_count < 500:
        db.query(Task).filter(Task.event_id == event.id).delete()
        db.commit()
        
        categories = ["Venue", "Catering", "Decor", "Photography", "Attire", "Logistics", "Ceremonies", "Favors"]
        tasks = []
        for i in range(500):
            cat = categories[i % len(categories)]
            t = Task(
                event_id=event.id,
                title=f"Milestone Task #{i+1:03d}: Execute {cat} coordination",
                description=f"Detailed specifications for operational step #{i+1} in high-capacity wedding planning.",
                category=cat,
                milestone_name=f"Month {12 - (i // 50)}",
                days_before_event=max(0, 360 - i),
                duration_days=max(1, (i % 7) + 1),
                priority="critical" if i % 10 == 0 else ("high" if i % 3 == 0 else "medium"),
                status="pending",
                assigned_to="Host Committee"
            )
            tasks.append(t)
        db.add_all(tasks)
        db.flush()

        # Add 400 dependencies across tasks
        deps = []
        for i in range(1, 400):
            deps.append(TaskDependency(task_id=tasks[i].id, depends_on_task_id=tasks[i-1].id))
        db.add_all(deps)
        db.commit()

    # Ensure budget categories exist
    cat_count = db.query(BudgetCategory).filter(BudgetCategory.event_id == event.id).count()
    if cat_count == 0:
        for i, cname in enumerate(["Catering & Banqueting", "Venue & Infrastructure", "Decor & Florals", "Photography & Film"]):
            bc = BudgetCategory(
                event_id=event.id,
                name=cname,
                allocation_basis_points=2500,
                allocated_amount_minor=125000000,
                icon="DollarSign",
                sort_order=i
            )
            db.add(bc)
            db.flush()
            for k in range(3):
                exp = Expense(
                    category_id=bc.id,
                    name=f"{cname} Package #{k+1}",
                    planned_amount_minor=40000000,
                    actual_amount_minor=0,
                    provenance="calculated"
                )
                db.add(exp)
        db.commit()

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    event_id = event.id
    db.close()
    return token, event_id

async def execute_request(client: httpx.AsyncClient, method: str, url: str, headers: dict, json_body: dict = None) -> tuple[float, bool, int]:
    t0 = time.perf_counter()
    try:
        if method == "GET":
            resp = await client.get(url, headers=headers)
        elif method == "POST":
            resp = await client.post(url, headers=headers, json=json_body)
        elif method == "PATCH":
            resp = await client.patch(url, headers=headers, json=json_body)
        else:
            resp = await client.request(method, url, headers=headers, json=json_body)
        latency = (time.perf_counter() - t0) * 1000.0
        is_success = (200 <= resp.status_code < 400)
        return latency, is_success, resp.status_code
    except Exception as e:
        latency = (time.perf_counter() - t0) * 1000.0
        return latency, False, 500

async def benchmark_endpoint(client: httpx.AsyncClient, name: str, method: str, path_factory, body_factory, concurrency: int, total_requests: int, headers: dict, target_p95: float):
    queue = asyncio.Queue()
    for i in range(total_requests):
        queue.put_nowait(i)

    latencies = []
    errors = 0
    t0 = time.perf_counter()

    async def worker():
        nonlocal errors
        while not queue.empty():
            try:
                idx = queue.get_nowait()
            except asyncio.QueueEmpty:
                break
            
            path = path_factory(idx) if callable(path_factory) else path_factory
            body = body_factory(idx) if callable(body_factory) else body_factory
            lat, success, status = await execute_request(client, method, path, headers, body)
            latencies.append(lat)
            if not success:
                errors += 1
            queue.task_done()

    workers = [asyncio.create_task(worker()) for _ in range(concurrency)]
    await asyncio.gather(*workers)
    total_time = time.perf_counter() - t0

    p50 = float(np.percentile(latencies, 50))
    p95 = float(np.percentile(latencies, 95))
    p99 = float(np.percentile(latencies, 99))
    rps = float(len(latencies) / total_time)
    err_rate = float((errors / len(latencies)) * 100.0)
    passed = p95 <= target_p95 and err_rate == 0.0

    return {
        "endpoint": name,
        "method": method,
        "concurrency": concurrency,
        "total_requests": len(latencies),
        "duration_sec": round(total_time, 2),
        "rps": round(rps, 1),
        "p50_ms": round(p50, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "target_p95_ms": target_p95,
        "error_rate_pct": round(err_rate, 2),
        "status": "PASS" if passed else "FAIL"
    }

async def main():
    print("=" * 80)
    print("CELESTIA ENDPOINT CONCURRENCY & LATENCY BENCHMARK")
    print("=" * 80)
    print("Seeding database with 500 tasks, 400 dependencies, and multi-tier budget ledger...")
    token, event_id = setup_500_task_event()
    print(f"Target Event ID: {event_id}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept-Encoding": "gzip",
        "Content-Type": "application/json"
    }

    transport = httpx.ASGITransport(app=app)
    limits = httpx.Limits(max_connections=60, max_keepalive_connections=50)
    timeout = httpx.Timeout(30.0, connect=10.0)

    results = []

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver", limits=limits, timeout=timeout) as client:
        # Warmup
        await client.get(f"/api/v1/events/{event_id}/overview", headers=headers)
        await client.get(f"/api/events/{event_id}/tasks", headers=headers)

        endpoints_to_test = [
            # 1. Aggregated Overview (N+1 eliminated, eager loading, 4 queries total)
            {
                "name": "GET /api/v1/events/{id}/overview (Aggregated)",
                "method": "GET",
                "path": f"/api/v1/events/{event_id}/overview",
                "body": None,
                "target_p95": 200.0,
                "concurrency": 25,
                "requests": 150
            },
            # 2. Event Metadata
            {
                "name": "GET /api/events/{id} (Metadata)",
                "method": "GET",
                "path": f"/api/events/{event_id}",
                "body": None,
                "target_p95": 200.0,
                "concurrency": 25,
                "requests": 150
            },
            # 3. Budget Summary Ledger
            {
                "name": "GET /api/events/{id}/budget/summary",
                "method": "GET",
                "path": f"/api/events/{event_id}/budget/summary",
                "body": None,
                "target_p95": 200.0,
                "concurrency": 25,
                "requests": 150
            },
            # 4. 500-Task CPM Graph Critical Path
            {
                "name": "GET /api/events/{id}/tasks (500-Task CPM)",
                "method": "GET",
                "path": f"/api/events/{event_id}/tasks",
                "body": None,
                "target_p95": 200.0,
                "concurrency": 25,
                "requests": 150
            },
            # 5. Core Write: Create Task
            {
                "name": "POST /api/events/{id}/tasks (Write)",
                "method": "POST",
                "path": f"/api/events/{event_id}/tasks",
                "body": lambda idx: {
                    "title": f"Load Benchmark Task #{idx}_{uuid.uuid4().hex[:6]}",
                    "category": "Decor",
                    "days_before_event": 60,
                    "duration_days": 2,
                    "priority": "medium"
                },
                "target_p95": 500.0,
                "concurrency": 25,
                "requests": 100
            },
            # 6. Core Write: Create Budget Category
            {
                "name": "POST /api/events/{id}/budget/categories (Write)",
                "method": "POST",
                "path": f"/api/events/{event_id}/budget/categories",
                "body": lambda idx: {
                    "name": f"Load Category #{idx}_{uuid.uuid4().hex[:6]}",
                    "allocation_basis_points": 500,
                    "allocated_amount_minor": 25000000,
                    "icon": "Package"
                },
                "target_p95": 500.0,
                "concurrency": 25,
                "requests": 100
            },
            # 7. Stress test at 50 Concurrency on Aggregated Overview
            {
                "name": "GET /api/v1/events/{id}/overview (50 Concurrent Users)",
                "method": "GET",
                "path": f"/api/v1/events/{event_id}/overview",
                "body": None,
                "target_p95": 200.0,
                "concurrency": 50,
                "requests": 250
            }
        ]

        print(f"\n{'Endpoint':<45} | {'Conc':<5} | {'RPS':<8} | {'p50 (ms)':<9} | {'p95 (ms)':<9} | {'p99 (ms)':<9} | {'Target':<9} | {'Status'}")
        print("-" * 115)

        for ep in endpoints_to_test:
            res = await benchmark_endpoint(
                client=client,
                name=ep["name"],
                method=ep["method"],
                path_factory=ep["path"],
                body_factory=ep["body"],
                concurrency=ep["concurrency"],
                total_requests=ep["requests"],
                headers=headers,
                target_p95=ep["target_p95"]
            )
            results.append(res)
            print(f"{res['endpoint']:<45} | {res['concurrency']:<5} | {res['rps']:<8.1f} | {res['p50_ms']:<9.2f} | {res['p95_ms']:<9.2f} | {res['p99_ms']:<9.2f} | <{res['target_p95_ms']}ms | {res['status']}")

    print("=" * 115)
    all_passed = all(r["status"] == "PASS" for r in results)
    print(f"OVERALL BENCHMARK VERDICT: {'ALL BUDGETS SATISFIED (PASS)' if all_passed else 'SOME BUDGETS EXCEEDED (FAIL)'}")

    # Export to docs/evidence/perf/load_test_results.json
    out_dir = REPO_ROOT / "docs" / "evidence" / "perf"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "load_test_results.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump({
            "all_passed": all_passed,
            "target_budget_reads_p95_ms": 200.0,
            "target_budget_writes_p95_ms": 500.0,
            "benchmarks": results
        }, f, indent=2)
    print(f"Results saved to {out_file}")

if __name__ == "__main__":
    asyncio.run(main())
