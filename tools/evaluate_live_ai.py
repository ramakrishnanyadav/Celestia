"""
Live AI Model Evaluation Script for CELESTIA.
Runs evaluation against the fixed 20-scenario rubric and records dated benchmark results.
DO NOT RUN IN CI. Requires valid GEMINI_API_KEY for live LLM scoring.
Usage:
    python backend/scripts/evaluate_live_ai.py
"""
import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime, timezone

# Add backend to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.engines.ai_service import AIService
from app.engines.feasibility_engine import check_event_feasibility

REPORTS_DIR = backend_dir / "reports" / "ai_eval_results"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

SCENARIOS_FILE = backend_dir / "app" / "data" / "scenarios_v1.json"

def run_live_ai_evaluation():
    with open(SCENARIOS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        scenarios = data.get("scenarios", [])

    results = []
    total_score = 0.0
    passed_cases = 0

    print(f"=== Starting Live AI Evaluation ({len(scenarios)} Scenarios) ===")
    print(f"Provider: {'Live Gemini' if settings.GEMINI_API_KEY else 'Rule-Based Fallback'}")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}\n")

    for sc in scenarios:
        case_id = sc["id"]
        prompt = sc["prompt"]
        t0 = time.perf_counter()

        # Run extraction
        extracted = AIService.extract_requirements_from_text(prompt)
        elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 2)

        type_match = (extracted.event_type == sc["expected_type"])
        city_match = (extracted.city.lower() == sc["expected_city"].lower())
        guest_match = (extracted.guest_count == sc["expected_guests"])
        budget_match = (extracted.budget_rupees >= sc["expected_budget_min"])

        passed = type_match and city_match and guest_match and budget_match
        if passed:
            passed_cases += 1
            total_score += 1.0

        results.append({
            "id": case_id,
            "name": sc["name"],
            "elapsed_ms": elapsed_ms,
            "passed": passed,
            "checks": {
                "event_type": {"expected": sc["expected_type"], "actual": extracted.event_type, "ok": type_match},
                "city": {"expected": sc["expected_city"], "actual": extracted.city, "ok": city_match},
                "guest_count": {"expected": sc["expected_guests"], "actual": extracted.guest_count, "ok": guest_match},
                "budget_rupees": {"expected_min": sc["expected_budget_min"], "actual": extracted.budget_rupees, "ok": budget_match}
            }
        })
        status_icon = "PASS" if passed else "FAIL"
        print(f"[{case_id}] {sc['name'][:40]:<40} | {status_icon} ({elapsed_ms} ms)")

    accuracy_pct = round((passed_cases / len(scenarios)) * 100.0, 2)
    dated_filename = f"eval_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    report_path = REPORTS_DIR / dated_filename

    summary = {
        "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
        "total_scenarios": len(scenarios),
        "passed_scenarios": passed_cases,
        "accuracy_percent": accuracy_pct,
        "results": results
    }

    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"\n=== Evaluation Complete: {passed_cases}/{len(scenarios)} Passed ({accuracy_pct}%) ===")
    print(f"Results archived to: {dated_filename}")
    return summary

if __name__ == "__main__":
    run_live_ai_evaluation()
