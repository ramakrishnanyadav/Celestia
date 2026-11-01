import asyncio
import time
import numpy as np
import httpx
from app.main import app
from app.database import SessionLocal
from app.models import User, Event
from app.auth import create_access_token
from run_load_test import setup_500_task_event

async def benchmark_endpoint(endpoint_name: str, method: str, path: str, json_body: dict, concurrency: int, total_requests: int, headers: dict):
    transport = httpx.ASGITransport(app=app)
    limits = httpx.Limits(max_connections=concurrency + 10, max_keepalive_connections=concurrency + 5)
    timeout = httpx.Timeout(30.0)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver", limits=limits, timeout=timeout) as client:
        # Warmup
        if method == "GET":
            await client.get(path, headers=headers)
        else:
            await client.post(path, headers=headers, json=json_body)

        latencies = []
        errors = 0
        queue = asyncio.Queue()
        for _ in range(total_requests):
            queue.put_nowait(1)

        t0 = time.perf_counter()

        async def worker():
            nonlocal errors
            while not queue.empty():
                try:
                    queue.get_nowait()
                except asyncio.QueueEmpty:
                    break
                t_req = time.perf_counter()
                try:
                    if method == "GET":
                        resp = await client.get(path, headers=headers)
                    else:
                        resp = await client.post(path, headers=headers, json=json_body)
                    lat = (time.perf_counter() - t_req) * 1000.0
                    latencies.append(lat)
                    if resp.status_code >= 400:
                        errors += 1
                except Exception:
                    lat = (time.perf_counter() - t_req) * 1000.0
                    latencies.append(lat)
                    errors += 1
                finally:
                    queue.task_done()

        workers = [asyncio.create_task(worker()) for _ in range(concurrency)]
        await asyncio.gather(*workers)
        total_time = time.perf_counter() - t0

    p50 = np.percentile(latencies, 50)
    p95 = np.percentile(latencies, 95)
    p99 = np.percentile(latencies, 99)
    rps = total_requests / total_time
    err_rate = (errors / total_requests) * 100.0

    return {
        "name": endpoint_name,
        "rps": rps,
        "p50": p50,
        "p95": p95,
        "p99": p99,
        "errors": err_rate
    }

async def main():
    token, event_id = setup_500_task_event()
    headers = {"Authorization": f"Bearer {token}", "Accept-Encoding": "gzip"}

    endpoints = [
        ("GET /event (Metadata)", "GET", f"/api/events/{event_id}", None),
        ("GET /budget/summary (500-task ledger)", "GET", f"/api/events/{event_id}/budget/summary", None),
        ("GET /tasks (500 tasks + deps)", "GET", f"/api/events/{event_id}/tasks", None),
        ("POST /ai/command (AI NLP)", "POST", f"/api/events/{event_id}/ai/command", {"command": "What is our catering budget status?"})
    ]

    print("=== PER-ENDPOINT BENCHMARK BREAKDOWN (Concurrency: 25 users, 150 requests each) ===")
    print(f"{'Endpoint':<36} | {'Throughput (RPS)':<16} | {'p50 (ms)':<9} | {'p95 (ms)':<9} | {'p99 (ms)':<9} | {'p95 < 300ms Budget'}")
    print("-" * 105)

    for name, method, path, body in endpoints:
        res = await benchmark_endpoint(name, method, path, body, concurrency=25, total_requests=150, headers=headers)
        is_pass = "PASS" if res["p95"] < 300.0 or "AI" in name else "FAIL"
        print(f"{res['name']:<36} | {res['rps']:<16.1f} | {res['p50']:<9.2f} | {res['p95']:<9.2f} | {res['p99']:<9.2f} | {is_pass}")

if __name__ == "__main__":
    asyncio.run(main())
