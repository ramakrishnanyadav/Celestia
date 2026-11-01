import time
import statistics
import httpx

BASE_URL = "http://127.0.0.1:8000"

def benchmark_endpoint(client, url, n=50):
    latencies = []
    for _ in range(n):
        t0 = time.perf_counter()
        res = client.get(url)
        t1 = time.perf_counter()
        if res.status_code == 200:
            latencies.append((t1 - t0) * 1000.0) # in ms
        else:
            print(f"Error {res.status_code} on {url}")
            break
            
    if not latencies:
        return None
        
    latencies.sort()
    p50 = statistics.median(latencies)
    p95 = latencies[int(len(latencies) * 0.95)]
    mean_val = statistics.mean(latencies)
    return {
        "n": len(latencies),
        "min_ms": round(min(latencies), 2),
        "mean_ms": round(mean_val, 2),
        "p50_ms": round(p50, 2),
        "p95_ms": round(p95, 2),
        "max_ms": round(max(latencies), 2)
    }

def main():
    print("=== CELESTIA LATENCY & PERFORMANCE BENCHMARK ===")
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)
    
    # 1. Health check
    stats_health = benchmark_endpoint(client, "/health", 100)
    print(f"GET /health: {stats_health}")
    
    # 2. Events list
    res_events = client.get("/api/events").json()
    event_id = res_events[0]["id"]
    stats_events = benchmark_endpoint(client, "/api/events", 50)
    print(f"GET /api/events: {stats_events}")
    
    # 3. Budget Summary
    stats_budget = benchmark_endpoint(client, f"/api/events/{event_id}/budget/summary", 50)
    print(f"GET /api/events/{{id}}/budget/summary: {stats_budget}")
    
    # 4. Tasks list
    stats_tasks = benchmark_endpoint(client, f"/api/events/{event_id}/tasks", 50)
    print(f"GET /api/events/{{id}}/tasks: {stats_tasks}")
    
    # 5. Vendor Comparison
    stats_vendors = benchmark_endpoint(client, f"/api/events/{event_id}/vendors/compare?category=Catering", 50)
    print(f"GET /api/events/{{id}}/vendors/compare: {stats_vendors}")

if __name__ == "__main__":
    main()
