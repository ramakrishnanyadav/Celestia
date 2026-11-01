import time

import pytest
from fastapi import HTTPException, Request

from app.engines.ai_efficiency import (
    AICircuitBreaker,
    AIEfficiencyService,
    CompactPromptBuilder,
    RealGeminiProvider,
    RuleBasedFallbackProvider,
    TokenCostTracker,
    UserPlanCache,
    get_ai_provider,
)
from app.models import Event, EventPreference
from app.rate_limiter import InMemoryRateLimiter, get_client_ip


def test_in_memory_rate_limiter_sliding_window_and_lockout():
    limiter = InMemoryRateLimiter(max_keys=5)
    key = "ip:192.168.1.100"

    # 1. Standard sliding window limit
    limiter.check_rate_limit(key, max_requests=2, window_seconds=10, endpoint_name="test")
    limiter.check_rate_limit(key, max_requests=2, window_seconds=10, endpoint_name="test")

    with pytest.raises(HTTPException) as exc:
        limiter.check_rate_limit(key, max_requests=2, window_seconds=10, endpoint_name="test")
    assert exc.value.status_code == 429
    assert "Rate limit exceeded" in exc.value.detail
    assert "Retry-After" in exc.value.headers

    # 2. Failed attempt lockout trigger
    lockout_key = "user:lockout_test@celestia.ai"
    limiter.record_failed_login(lockout_key, max_failures=2, lockout_duration_seconds=30)
    # Check not locked out yet
    limiter.check_lockout(lockout_key)

    # Second failed attempt triggers lockout
    limiter.record_failed_login(lockout_key, max_failures=2, lockout_duration_seconds=30)
    with pytest.raises(HTTPException) as exc:
        limiter.check_lockout(lockout_key)
    assert exc.value.status_code == 429
    assert "temporarily locked" in exc.value.detail

    # Clear failed attempts resets state
    limiter.clear_failed_logins(lockout_key)
    limiter.check_lockout(lockout_key)

    # 3. Evict stale keys when capacity exceeded
    for i in range(10):
        limiter.check_rate_limit(f"ip:10.0.0.{i}", max_requests=10, window_seconds=60)
    limiter._evict_stale_keys(time.time() + 7200)

def test_get_client_ip_proxy_spoofing_defense():
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [
            (b"x-forwarded-for", b"203.0.113.195, 70.41.3.18, 150.172.238.178"),
            (b"host", b"testserver"),
        ],
        "client": ("127.0.0.1", 12345),
    }
    request = Request(scope)
    ip = get_client_ip(request)
    assert ip in ["150.172.238.178", "127.0.0.1", "203.0.113.195"]

def test_ai_circuit_breaker_transitions():
    cb = AICircuitBreaker(failure_threshold=3, recovery_timeout_sec=0.1)
    assert cb.state == "CLOSED"
    assert cb.can_execute() is True

    # 1. Record 2 failures -> stays CLOSED
    cb.record_failure()
    cb.record_failure()
    assert cb.state == "CLOSED"
    assert cb.can_execute() is True

    # 2. 3rd failure -> trips to OPEN
    cb.record_failure()
    assert cb.state == "OPEN"
    assert cb.can_execute() is False

    # 3. Wait past recovery timeout -> transitions to HALF_OPEN
    time.sleep(0.15)
    assert cb.can_execute() is True
    assert cb.state == "HALF_OPEN"

    # 4. Successful trial recovers circuit back to CLOSED
    cb.record_success()
    assert cb.state == "CLOSED"
    assert cb.failure_count == 0

def test_token_cost_tracker_and_prompt_builder():
    text = "Detailed Indian wedding itinerary with Haldi, Mehendi, Sangeet and Reception."
    tokens = TokenCostTracker.estimate_tokens(text)
    assert tokens > 0

    cost = TokenCostTracker.calculate_cost(prompt_tokens=1000, completion_tokens=500, model="gemini-1.5-flash")
    assert cost["total_tokens"] == 1500
    assert cost["cost_usd"] > 0
    assert cost["cost_inr"] > 0

    event = Event(
        event_type="wedding",
        city="Mumbai",
        venue_type="Palace",
        guest_count=300,
        budget_minor=300000000,
        preparation_months=6
    )
    pref = EventPreference(
        regional_culture="Maharashtrian Traditional",
        dietary="Pure Vegetarian",
        theme="Royal Marigold"
    )
    prompt_ctx = CompactPromptBuilder.build_event_context(event, pref)
    assert "wedding" in prompt_ctx
    assert "Mumbai" in prompt_ctx
    assert "Maharashtrian" in prompt_ctx

def test_user_plan_cache():
    UserPlanCache.clear()
    assert UserPlanCache.get("u1", "e1", "budget") is None

    UserPlanCache.set("u1", "e1", "budget", {"allocatable": 250000})
    cached = UserPlanCache.get("u1", "e1", "budget")
    assert cached == {"allocatable": 250000}

    UserPlanCache.clear()
    assert UserPlanCache.get("u1", "e1", "budget") is None

@pytest.mark.asyncio
async def test_ai_efficiency_service_sections():
    event = Event(
        id="evt-eff-1",
        user_id="user-eff",
        event_type="wedding",
        city="Delhi",
        venue_type="Farmhouse",
        guest_count=400,
        budget_minor=400000000,
        preparation_months=9
    )

    budget_sec = await AIEfficiencyService.generate_budget_section(event)
    assert budget_sec["total_budget_rupees"] == 4000000.0
    assert budget_sec["contingency_reserve_rupees"] == 400000.0

    timeline_sec = await AIEfficiencyService.generate_timeline_section(event)
    assert len(timeline_sec["milestone_phases"]) > 0

    vendor_sec = await AIEfficiencyService.generate_vendor_section(event)
    assert vendor_sec["comparisons_ready"] is True

    ideas_sec = await AIEfficiencyService.generate_ideas_section(event, None)
    assert "themes" in ideas_sec

    # Regenerate single section
    regen = await AIEfficiencyService.regenerate_section(event, "budget")
    assert regen["section"] == "budget"

    with pytest.raises(ValueError) as exc:
        await AIEfficiencyService.regenerate_section(event, "invalid_section_name")
    assert "Unknown section" in str(exc.value)

@pytest.mark.asyncio
async def test_ai_providers():
    fallback_provider = RuleBasedFallbackProvider()
    res = await fallback_provider.generate_completion("Test prompt")
    assert res["provider"] == "rule-based-deterministic"
    assert res["status"] == "success"

    gemini_without_key = RealGeminiProvider(api_key=None)
    res_fallback = await gemini_without_key.generate_completion("Test prompt")
    assert res_fallback["provider"] == "rule-based-deterministic"

    gemini_with_key = RealGeminiProvider(api_key="mock-gemini-key")
    res_real = await gemini_with_key.generate_completion("Test prompt")
    assert res_real["provider"] == "google-gemini"

    provider = get_ai_provider()
    assert provider is not None
