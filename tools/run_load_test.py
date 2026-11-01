import asyncio
import time
import uuid
import numpy as np
import httpx
from app.database import SessionLocal
from app.models import User, Event, Task, TaskDependency, BudgetCategory, Expense
from app.auth import hash_password, create_access_token
from app.main import app

BASE_URL = "http://127.0.0.1:8000"

def setup_500_task_event():
    db = SessionLocal()
    # Check if benchmark user exists
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

    # Check tasks count
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
                allocation_percent=25.0,
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
        else:
            resp = await client.post(url, headers=headers, json=json_body)
        latency = (time.perf_counter() - t0) * 1000.0
        is_success = (200 <= resp.status_code < 300)
        return latency, is_success, resp.status_code
    except Exception as e:
        latency = (time.perf_counter() - t0) * 1000.0
        return latency, False, 500

async def run_scenario(concurrency: int, total_requests: int, token: str, event_id: str):
    headers = {"Authorization": f"Bearer {token}", "Accept-Encoding": "gzip"}
    
    endpoints = [
        ("GET", f"/api/events/{event_id}", None),
        ("GET", f"/api/events/{event_id}/budget/summary", None),
        ("GET", f"/api/events/{event_id}/tasks", None),
        ("POST", f"/api/events/{event_id}/ai/command", {"command": "What is the status of our catering budget?"})
    ]

    limits = httpx.Limits(max_connections=concurrency + 10, max_keepalive_connections=concurrency + 5)
    timeout = httpx.Timeout(30.0, connect=10.0)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver", limits=limits, timeout=timeout) as client:
        # Warmup
        await client.get(f"/api/events/{event_id}", headers=headers)
        await client.get(f"/api/events/{event_id}/tasks", headers=headers)

        queue = asyncio.Queue()
        for i in range(total_requests):
            ep = endpoints[i % len(endpoints)]
            queue.put_nowait(ep)

        results = []
        start_time = time.perf_counter()

        async def worker():
            while not queue.empty():
                try:
                    method, path, body = queue.get_nowait()
                except asyncio.QueueEmpty:
                    break
                lat, success, status = await execute_request(client, method, path, headers, body)
                results.append((lat, success, status))
                queue.task_done()

        workers = [asyncio.create_task(worker()) for _ in range(concurrency)]
        await asyncio.gather(*workers)
        total_duration = time.perf_counter() - start_time

    latencies = [r[0] for r in results]
    successes = [r[1] for r in results]
    errors = [r for r in results if not r[1]]
    
    p50 = np.percentile(latencies, 50)
    p95 = np.percentile(latencies, 95)
    p99 = np.percentile(latencies, 99)
    rps = len(results) / total_duration
    error_rate = (len(errors) / len(results)) * 100.0

    return {
        "concurrency": concurrency,
        "total_requests": len(results),
        "duration_sec": total_duration,
        "rps": rps,
        "p50_ms": p50,
        "p95_ms": p95,
        "p99_ms": p99,
        "error_rate_pct": error_rate,
        "errors": len(errors)
    }

async def main():
    print("=== SEEDING 500-TASK EVENT IN DATABASE ===")
    token, event_id = setup_500_task_event()
    print(f"Target Event ID: {event_id}")

    test_runs = [
        (1, 100),
        (25, 250),
        (50, 300)
    ]

    metrics = []
    for conc, reqs in test_runs:
        print(f"\n--- Running Load Test with Concurrency={conc} ({reqs} requests across 4 flows) ---")
        res = await run_scenario(conc, reqs, token, event_id)
        metrics.append(res)
        print(f"Concurrency: {res['concurrency']} | Requests: {res['total_requests']} | Duration: {res['duration_sec']:.2f}s | RPS: {res['rps']:.1f}")
        print(f"p50: {res['p50_ms']:.2f} ms | p95: {res['p95_ms']:.2f} ms | p99: {res['p99_ms']:.2f} ms | Error Rate: {res['error_rate_pct']:.2f}%")

    print("\n" + "="*80)
    print("CONCURRENT LOAD TEST SUMMARY (500-TASK EVENT)")
    print("="*80)
    print(f"{'Concurrency':<12} | {'Throughput (RPS)':<18} | {'p50 (ms)':<10} | {'p95 (ms)':<10} | {'p99 (ms)':<10} | {'Error Rate':<10}")
    print("-" * 80)
    for m in metrics:
        print(f"{m['concurrency']:<12} | {m['rps']:<18.1f} | {m['p50_ms']:<10.2f} | {m['p95_ms']:<10.2f} | {m['p99_ms']:<10.2f} | {m['error_rate_pct']:.1f}%")
    print("="*80)

if __name__ == "__main__":
    asyncio.run(main())
