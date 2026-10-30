import time
import statistics
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def benchmark_endpoint(method, url, headers=None, data=None, n=30):
    latencies = []
    response_sizes = []
    status_codes = []
    
    for _ in range(n):
        t0 = time.perf_counter()
        if method == "GET":
            res = requests.get(url, headers=headers)
        elif method == "POST":
            res = requests.post(url, headers=headers, json=data)
        t1 = time.perf_counter()
        latencies.append((t1 - t0) * 1000.0)
        response_sizes.append(len(res.content))
        status_codes.append(res.status_code)
    
    latencies.sort()
    p50 = statistics.median(latencies)
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]
    avg_size = statistics.mean(response_sizes)
    
    return {
        "p50_ms": round(p50, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "avg_size_bytes": round(avg_size, 1),
        "status": status_codes[0]
    }

# 1. Login to get token
login_res = requests.post(f"{BASE_URL}/api/auth/token", data={"username": "anjali@example.com", "password": "password123"})
token = ""
headers = {}
if login_res.status_code == 200:
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

# Get demo event ID
events_res = requests.get(f"{BASE_URL}/api/events/", headers=headers)
event_id = None
if events_res.status_code == 200 and len(events_res.json()) > 0:
    event_id = events_res.json()[0]["id"]

results = {}
results["GET /health"] = benchmark_endpoint("GET", f"{BASE_URL}/health")
results["GET /api/events/"] = benchmark_endpoint("GET", f"{BASE_URL}/api/events/", headers=headers)

if event_id:
    results["GET /api/events/{id}/budget/summary"] = benchmark_endpoint("GET", f"{BASE_URL}/api/events/{event_id}/budget/summary", headers=headers)
    results["GET /api/events/{id}/tasks/"] = benchmark_endpoint("GET", f"{BASE_URL}/api/events/{event_id}/tasks/", headers=headers)
    results["GET /api/events/{id}/vendors"] = benchmark_endpoint("GET", f"{BASE_URL}/api/events/{event_id}/vendors", headers=headers)
    results["GET /api/events/{id}/approvals"] = benchmark_endpoint("GET", f"{BASE_URL}/api/events/{event_id}/approvals", headers=headers)

print(json.dumps(results, indent=2))
with open("endpoint_benchmark_results.json", "w") as f:
    json.dump(results, f, indent=2)
