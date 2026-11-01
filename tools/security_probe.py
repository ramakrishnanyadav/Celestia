import httpx
import json
import base64
import time

BASE_URL = "http://127.0.0.1:8000/api"

def run_security_probe():
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)
    findings = []
    
    print("=== CELESTIA COMPREHENSIVE SECURITY PROBE ===")
    
    # ---------------------------------------------------------
    # 1. AUTHENTICATION & DEMO FALLBACK BYPASS
    # ---------------------------------------------------------
    print("\n[Probe 1] Testing Unauthenticated Access & Demo User Fallback...")
    res = client.get("/events")
    if res.status_code == 200:
        events = res.json()
        findings.append({
            "probe": "Unauthenticated Access Bypass",
            "severity": "High",
            "evidence": f"GET /api/events with NO auth header returned HTTP 200 with {len(events)} events",
            "vulnerability": "get_current_user automatically logs in anonymous requests as demo@celestia.ai"
        })
        print(f"  [FAIL] Unauthenticated GET /events returned HTTP 200! Count: {len(events)}")
    else:
        print(f"  [PASS] Unauthenticated request rejected with HTTP {res.status_code}")
        
    # ---------------------------------------------------------
    # 2. TOKEN SIGNATURE TAMPERING & ALG=NONE
    # ---------------------------------------------------------
    print("\n[Probe 2] Testing Token Signature Tampering...")
    # Register two users
    email_a = f"alice_{int(time.time())}@example.com"
    email_b = f"bob_{int(time.time())}@example.com"
    
    res_a = client.post("/auth/register", json={"email": email_a, "name": "Alice", "password": "Password123!"})
    token_a = res_a.json().get("access_token")
    user_a = res_a.json().get("user")
    
    res_b = client.post("/auth/register", json={"email": email_b, "name": "Bob", "password": "Password123!"})
    token_b = res_b.json().get("access_token")
    user_b = res_b.json().get("user")
    
    # Tamper token A signature
    parts = token_a.split(".")
    if len(parts) == 2:
        # custom payload.signature
        tampered_token = f"{parts[0]}.invalid_signature_hex"
        res_tampered = client.get("/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
        data = res_tampered.json()
        if data.get("email") == "demo@celestia.ai":
            findings.append({
                "probe": "Tampered Token Fallback",
                "severity": "High",
                "evidence": f"GET /auth/me with invalid signature fell back to demo user (HTTP {res_tampered.status_code})",
                "vulnerability": "Invalid token does not return 401; it returns demo user identity"
            })
            print(f"  [FAIL] Tampered token returned HTTP {res_tampered.status_code} and demo user identity!")
        elif res_tampered.status_code == 401:
            print(f"  [PASS] Tampered token rejected with 401.")
        else:
            print(f"  [STATUS] Tampered token returned {res_tampered.status_code}: {data}")

    # ---------------------------------------------------------
    # 3. IDOR / BOLA CROSS-TENANT ACCESS
    # ---------------------------------------------------------
    print("\n[Probe 3] Testing IDOR / BOLA Cross-Tenant Access...")
    # Alice creates an event
    event_payload = {
        "title": "Alice Private Wedding",
        "event_type": "wedding",
        "city": "Mumbai",
        "event_date": "2027-02-14T00:00:00Z",
        "guest_count": 250,
        "budget_minor": 150000000,
        "currency": "INR",
        "timezone": "Asia/Kolkata",
        "preparation_months": 6,
        "status": "planning",
        "autonomy_mode": "Draft"
    }
    res_ev_a = client.post("/events", json=event_payload, headers={"Authorization": f"Bearer {token_a}"})
    alice_event_id = res_ev_a.json().get("id")
    
    # Bob tries to access Alice's event
    res_bob_get = client.get(f"/events/{alice_event_id}", headers={"Authorization": f"Bearer {token_b}"})
    if res_bob_get.status_code in [403, 404]:
        print(f"  [PASS] Bob GET Alice's event blocked with HTTP {res_bob_get.status_code}")
    else:
        findings.append({
            "probe": "IDOR GET Event",
            "severity": "Critical",
            "evidence": f"Bob accessed Alice's event ({alice_event_id}) with HTTP {res_bob_get.status_code}",
            "vulnerability": "Broken Object Level Authorization (BOLA)"
        })
        print(f"  [FAIL] Bob accessed Alice's event! HTTP {res_bob_get.status_code}")

    # Bob tries to delete Alice's event
    res_bob_del = client.delete(f"/events/{alice_event_id}", headers={"Authorization": f"Bearer {token_b}"})
    if res_bob_del.status_code in [403, 404]:
        print(f"  [PASS] Bob DELETE Alice's event blocked with HTTP {res_bob_del.status_code}")
    else:
        findings.append({
            "probe": "IDOR DELETE Event",
            "severity": "Critical",
            "evidence": f"Bob deleted Alice's event with HTTP {res_bob_del.status_code}",
            "vulnerability": "BOLA on DELETE"
        })
        print(f"  [FAIL] Bob deleted Alice's event! HTTP {res_bob_del.status_code}")

    # ---------------------------------------------------------
    # 4. MASS ASSIGNMENT (PRIVILEGE ESCALATION)
    # ---------------------------------------------------------
    print("\n[Probe 4] Testing Mass Assignment on Registration...")
    res_admin = client.post("/auth/register", json={
        "email": f"attacker_{int(time.time())}@example.com",
        "name": "Attacker",
        "password": "Password123!",
        "role": "admin",
        "is_superuser": True
    })
    registered_role = res_admin.json().get("user", {}).get("role")
    if registered_role == "admin":
        findings.append({
            "probe": "Mass Assignment Role Escalation",
            "severity": "High",
            "evidence": "User created with role='admin' by supplying extra JSON key",
            "vulnerability": "Pydantic schema accepts arbitrary role strings from client"
        })
        print("  [FAIL] Role was set to admin via registration payload!")
    else:
        print(f"  [PASS] Role defaulted to: {registered_role}")

    # ---------------------------------------------------------
    # 5. SQL INJECTION PROBING
    # ---------------------------------------------------------
    print("\n[Probe 5] Testing SQL Injection in Parameters...")
    sqli_payload = "'; DROP TABLE events; --"
    res_sqli = client.get(f"/events/{sqli_payload}", headers={"Authorization": f"Bearer {token_a}"})
    if res_sqli.status_code in [404, 422]:
        print(f"  [PASS] SQL injection payload safely rejected with HTTP {res_sqli.status_code}")
    elif res_sqli.status_code == 500:
        findings.append({
            "probe": "SQL Injection / Unhandled DB Exception",
            "severity": "High",
            "evidence": f"Payload '{sqli_payload}' caused HTTP 500: {res_sqli.text[:100]}",
            "vulnerability": "Database error exposed or unhandled syntax error"
        })
        print(f"  [FAIL] SQL injection payload caused HTTP 500: {res_sqli.text[:80]}")

    # ---------------------------------------------------------
    # 6. STORED XSS PROBING
    # ---------------------------------------------------------
    print("\n[Probe 6] Testing Stored XSS in Event Title...")
    xss_payload = "<script>alert('XSS')</script>"
    res_xss = client.post("/events", json={
        "title": xss_payload,
        "event_type": "wedding",
        "city": "Mumbai",
        "event_date": "2027-02-14T00:00:00Z",
        "guest_count": 100,
        "budget_minor": 10000000,
        "currency": "INR",
        "timezone": "Asia/Kolkata",
        "preparation_months": 3,
        "status": "planning",
        "autonomy_mode": "Draft"
    }, headers={"Authorization": f"Bearer {token_a}"})
    stored_title = res_xss.json().get("title")
    if stored_title == xss_payload:
        findings.append({
            "probe": "Stored XSS in Event Fields",
            "severity": "Medium",
            "evidence": f"Server stored raw HTML script tag: {stored_title}",
            "vulnerability": "Input sanitization missing on text fields; relies entirely on React DOM escaping"
        })
        print(f"  [WARN] Server stored raw script tag without HTML entity encoding: {stored_title}")
    else:
        print(f"  [PASS] Title sanitized: {stored_title}")

    # ---------------------------------------------------------
    # 7. SECURITY HEADERS & CORS
    # ---------------------------------------------------------
    print("\n[Probe 7] Checking Security Headers & CORS...")
    headers = client.get("/").headers
    cors_origin = headers.get("access-control-allow-origin")
    csp = headers.get("content-security-policy")
    hsts = headers.get("strict-transport-security")
    xcto = headers.get("x-content-type-options")
    xfo = headers.get("x-frame-options")
    
    missing_headers = []
    if not csp: missing_headers.append("Content-Security-Policy")
    if not hsts: missing_headers.append("Strict-Transport-Security")
    if not xcto: missing_headers.append("X-Content-Type-Options")
    if not xfo: missing_headers.append("X-Frame-Options")
    
    if missing_headers:
        findings.append({
            "probe": "Missing HTTP Security Headers",
            "severity": "Medium",
            "evidence": f"Missing headers: {', '.join(missing_headers)}",
            "vulnerability": "Defense in depth headers missing from FastAPI root/api responses"
        })
        print(f"  [WARN] Missing security headers: {missing_headers}")
    else:
        print(f"  [PASS] Security headers present.")

    # ---------------------------------------------------------
    # 8. RATE LIMITING (BRUTE FORCE)
    # ---------------------------------------------------------
    print("\n[Probe 8] Testing Rate Limiting on Login...")
    login_attempts = []
    for _ in range(15):
        r = client.post("/auth/login", json={"email": "nonexistent@celestia.ai", "password": "wrongpassword"})
        login_attempts.append(r.status_code)
    
    if 429 in login_attempts:
        print(f"  [PASS] Rate limiting triggered: HTTP 429 received.")
    else:
        findings.append({
            "probe": "No Rate Limiting on Auth Routes",
            "severity": "High",
            "evidence": f"15 consecutive failed login requests returned status codes: {login_attempts[:5]}... (no 429)",
            "vulnerability": "Susceptible to credential stuffing and brute force password attacks"
        })
        print(f"  [FAIL] No HTTP 429 rate limit response observed after 15 rapid login attempts.")

    # Save probe results
    with open("docs/evidence/security_probe_results.json", "w", encoding="utf-8") as fp:
        json.dump(findings, fp, indent=2)

    print(f"\nTotal Vulnerabilities Found by Probe: {len(findings)}")

if __name__ == "__main__":
    run_security_probe()
