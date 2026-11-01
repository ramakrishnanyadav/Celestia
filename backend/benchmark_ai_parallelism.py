import asyncio
import time
from app.database import SessionLocal
from app.models import User, Event, EventPreference
from app.engines.ai_efficiency import AIEfficiencyService, TokenCostTracker, CompactPromptBuilder
from app.auth import hash_password

async def run_ai_benchmark():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "loadtest_500@celestia.ai").first()
    event = db.query(Event).filter(Event.user_id == user.id).first()
    pref = event.preference
    
    print("=== AI EFFICIENCY & PARALLELISM BENCHMARK ===")
    print(f"Target Event: {event.title} (Guests: {event.guest_count})")
    
    # 1. Measure Prompt Optimization
    verbose_prompt = (
        f"You are a professional Indian wedding planner. Please analyze the following detailed event specifications. "
        f"The client has scheduled a {event.event_type} in {event.city} with an approved budget of ₹{event.budget_minor // 100} "
        f"for {event.guest_count} guests over a preparation timeframe of {event.preparation_months} months. "
        f"Ensure you provide comprehensive recommendations for dietary catering, decor concepts, themes, timelines, and vendors."
    )
    compact_prompt = CompactPromptBuilder.build_event_context(event, pref)
    verbose_tokens = TokenCostTracker.estimate_tokens(verbose_prompt)
    compact_tokens = TokenCostTracker.estimate_tokens(compact_prompt)
    token_reduction = ((verbose_tokens - compact_tokens) / verbose_tokens) * 100.0

    print(f"\n1. PROMPT COMPACTION:")
    print(f"   - Standard Verbose Prompt: {verbose_tokens} tokens")
    print(f"   - Minimized JSON Prompt:   {compact_tokens} tokens ({token_reduction:.1f}% token reduction)")

    # 2. Benchmark with Fake Slow Provider (Simulated 500ms API latency per section across 4 sections)
    delay_per_section = 0.50 # 500 ms simulated network/LLM latency
    print(f"\n2. LATENCY BENCHMARK (Simulated slow LLM provider delay: {delay_per_section*1000:.0f} ms per section, 4 sections):")
    
    # Serial Execution
    serial_res = await AIEfficiencyService.generate_plan_serial(event, pref, fake_delay=delay_per_section)
    print(f"   - Serial Plan Generation:   {serial_res['latency_ms']:.2f} ms")

    # Parallel Execution
    parallel_res = await AIEfficiencyService.generate_plan_parallel(event, pref, timeout_sec=3.0, fake_delay=delay_per_section)
    print(f"   - Parallel Plan Generation: {parallel_res['latency_ms']:.2f} ms")
    
    speedup = serial_res['latency_ms'] / parallel_res['latency_ms']
    pct_reduction = ((serial_res['latency_ms'] - parallel_res['latency_ms']) / serial_res['latency_ms']) * 100.0
    print(f"   - Speedup:                  {speedup:.2f}x ({pct_reduction:.1f}% latency reduction)")

    # 3. Test Per-Call Timeout & Fast Fallback
    print(f"\n3. FAULT TOLERANCE & TIMEOUT FALLBACK:")
    timeout_threshold = 0.15 # 150 ms timeout
    slow_provider_delay = 1.0 # 1000 ms provider hang
    fallback_res = await AIEfficiencyService.generate_plan_parallel(
        event, pref,
        timeout_sec=timeout_threshold,
        fake_delay=slow_provider_delay
    )
    print(f"   - Provider Delay: {slow_provider_delay*1000:.0f} ms | Timeout Guard: {timeout_threshold*1000:.0f} ms")
    print(f"   - Fallback Triggered In: {fallback_res['latency_ms']:.2f} ms")
    print(f"   - Fallback Returned Sections: {list(fallback_res['sections'].keys())}")
    
    # 4. Token & Cost Tracking
    print(f"\n4. TOKEN & COST TRACKING:")
    metrics = parallel_res["efficiency_metrics"]
    print(f"   - Model:             {metrics['model']}")
    print(f"   - Prompt Tokens:     {metrics['prompt_tokens']}")
    print(f"   - Completion Tokens: {metrics['completion_tokens']}")
    print(f"   - Total Tokens:      {metrics['total_tokens']}")
    print(f"   - Estimated Cost:    ${metrics['cost_usd']:.6f} USD (~Rs. {metrics['cost_inr']:.4f} INR)")

    db.close()

if __name__ == "__main__":
    asyncio.run(run_ai_benchmark())
