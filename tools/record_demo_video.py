"""
CELESTIA - Winning Demo HD Screenrecording Video Engine.
Records a comprehensive, crystal-clear, impactful video walkthrough of all actual features:
1. Marketing Landing Page & Cultural Prompt Intake
2. Multi-Scenario Celebrations Gallery (Wedding 300 pax, Birthday 50 pax, Community 1000 pax)
3. 12-Column Executive Bento Grid Overview with Provenance Badges
4. Interactive 4 Magic Moments Guided Tour Walkthrough
5. Zero-Rounding Integer Budget & What-If Sensitivity Simulator (live slider scaling)
6. Cycle-Free Critical Path (CPM) Topological DAG Timeline & Recalculate
7. 3-Tier Human Governance & Approvals with Toast & Audit Trail
8. Multi-Vendor Quotation Intelligence
9. Executive Printable Master Blueprint with Signature Line
10. Command Palette (Cmd+K) Navigation & OKLCH Design System Showcase
"""

import os
import sys
import time
import shutil
import urllib.request
import json
from pathlib import Path

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("CELESTIA_FE_URL", "http://localhost:3000")
API_URL = os.environ.get("CELESTIA_BE_URL", "http://localhost:8000/api")
OUTPUT_DIR = Path("docs/evidence/demo_video")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FRAMES_DIR = OUTPUT_DIR / "frames"
FRAMES_DIR.mkdir(parents=True, exist_ok=True)
TEMP_VIDEO_DIR = OUTPUT_DIR / "temp_recordings"
TEMP_VIDEO_DIR.mkdir(parents=True, exist_ok=True)

TARGET_VIDEO_PATH = OUTPUT_DIR / "celestia_feature_demo_hd.webm"

def smooth_scroll(page, y_delta, steps=12, pause_ms=35):
    """Smooth human-like incremental scrolling."""
    for _ in range(steps):
        page.evaluate(f"window.scrollBy(0, {y_delta / steps})")
        page.wait_for_timeout(pause_ms)

def run():
    print("[CELESTIA RECORDER] Initializing HD Screen Recording Engine (1280x720)...", flush=True)

    # Pre-authenticate demo session via API to ensure cookies are 100% active
    auth_cookies = []
    try:
        req = urllib.request.Request(f"{API_URL}/auth/demo-login", data=b"", headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            auth_cookies = [
                {"name": "access_token", "value": data["access_token"], "domain": "localhost", "path": "/"},
                {"name": "csrf_token", "value": data["csrf_token"], "domain": "localhost", "path": "/"},
            ]
            print(f"     Pre-authenticated session for {data['user']['name']} ({data['user']['email']})", flush=True)
    except Exception as e:
        print(f"     [WARN] Could not pre-authenticate: {e}", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=1"]
        )

        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=str(TEMP_VIDEO_DIR),
            record_video_size={"width": 1280, "height": 720},
            color_scheme="light"
        )

        if auth_cookies:
            context.add_cookies(auth_cookies)

        page = context.new_page()

        try:
            # ==========================================
            # SCENE 1: MARKETING HERO & CULTURAL PROMPTS
            # ==========================================
            print("  >> Scene 1: Marketing Landing Page & Cultural Prompt Engine...", flush=True)
            page.goto(BASE_URL, wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(2000)

            # Smooth scroll to highlight the 4 architectural pillars
            smooth_scroll(page, 450, steps=14, pause_ms=35)
            page.wait_for_timeout(1400)

            # Cycle prompt chips to show reactive prompt loading
            chips = page.locator("button:has-text('Maharashtrian'), button:has-text('Gujarati'), button:has-text('Aarav'), button:has-text('Shivaji')")
            if chips.count() > 1:
                chips.nth(1).click()
                page.wait_for_timeout(900)
                chips.nth(2).click()
                page.wait_for_timeout(900)
                chips.nth(3).click()
                page.wait_for_timeout(900)

            smooth_scroll(page, -450, steps=10, pause_ms=25)
            page.wait_for_timeout(1000)
            page.screenshot(path=str(FRAMES_DIR / "01_landing_hero.png"))

            # Click Demo Workspace CTA
            demo_btn = page.locator("button:has-text('Explore Read-Only Demo Workspace')").first
            if demo_btn.is_visible():
                demo_btn.click()
                page.wait_for_timeout(2000)
            else:
                page.goto(f"{BASE_URL}/app/events", wait_until="domcontentloaded")

            # Ensure on events page
            if "/app/events" not in page.url:
                page.goto(f"{BASE_URL}/app/events", wait_until="domcontentloaded")

            page.wait_for_timeout(2000)

            # ==========================================
            # SCENE 2: CELEBRATIONS GALLERY (3 SCENARIOS)
            # ==========================================
            print("  >> Scene 2: Celebrations Gallery (3 Seeded Scenarios)...", flush=True)
            page.wait_for_selector("text=Your Celebrations", timeout=15000)
            page.wait_for_timeout(1500)

            # Check celebration cards
            event_cards = page.locator("a[href^='/app/events/']:not([href$='/new'])")
            card_count = event_cards.count()
            print(f"     Found {card_count} active celebration cards in gallery!", flush=True)

            smooth_scroll(page, 200, steps=8, pause_ms=30)
            page.wait_for_timeout(1500)
            page.screenshot(path=str(FRAMES_DIR / "02_celebrations_gallery.png"))
            smooth_scroll(page, -200, steps=8, pause_ms=25)
            page.wait_for_timeout(1000)

            # Open Anjali & Rahul's Royal Mumbai Wedding (first card)
            if card_count > 0:
                event_cards.first.click()
            else:
                page.goto(f"{BASE_URL}/app/events/3668c7ea-2e9f-4794-83be-9f4053fb94f7", wait_until="domcontentloaded")

            page.wait_for_timeout(2500)

            # Capture current event overview URL
            event_overview_url = page.url.split("?")[0]
            print(f"     Active Event URL: {event_overview_url}", flush=True)

            # ==========================================
            # SCENE 3: 12-COLUMN EXECUTIVE BENTO OVERVIEW
            # ==========================================
            print("  >> Scene 3: 12-Column Executive Bento Grid Overview...", flush=True)
            page.wait_for_timeout(1800)
            smooth_scroll(page, 320, steps=10, pause_ms=35)
            page.wait_for_timeout(1500)
            page.screenshot(path=str(FRAMES_DIR / "03_bento_overview.png"))
            smooth_scroll(page, -320, steps=10, pause_ms=25)
            page.wait_for_timeout(1000)

            # ==========================================
            # SCENE 4: 4 MAGIC MOMENTS GUIDED TOUR
            # ==========================================
            print("  >> Scene 4: Interactive 3-Minute Guided Tour (4 Magic Moments)...", flush=True)
            page.goto(f"{event_overview_url}?tour=1", wait_until="domcontentloaded")
            page.wait_for_timeout(2000)
            page.screenshot(path=str(FRAMES_DIR / "04_guided_tour_modal.png"))

            # Step through each of the 4 magic moments with clear pauses
            for step_idx in range(4):
                print(f"     Tour Modal Step {step_idx + 1}/4...", flush=True)
                page.wait_for_timeout(2000)
                next_tour_btn = page.locator("button:has-text('Next Magic Moment'), button:has-text('Done & Explore')").first
                if next_tour_btn.is_visible():
                    next_tour_btn.click()
                    page.wait_for_timeout(1000)

            page.wait_for_timeout(1500)

            # ==========================================
            # SCENE 5: BUDGET & WHAT-IF SENSITIVITY SIMULATOR
            # ==========================================
            print("  >> Scene 5: Zero-Rounding Integer Budget & What-If Simulator...", flush=True)
            page.goto(f"{event_overview_url}/budget", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)

            # Scroll down to the What-If Simulator section
            smooth_scroll(page, 440, steps=12, pause_ms=35)
            page.wait_for_timeout(1500)

            # Interact with the sensitivity slider
            slider = page.locator("input[type='range']").first
            if slider.is_visible():
                print("     Simulating Guest variations with optimistic live update...", flush=True)
                for target_val in [340, 380, 420, 450, 480, 420, 300]:
                    page.evaluate(f"""(val) => {{
                        const input = document.querySelector("input[type='range']");
                        if (input) {{
                            input.value = val;
                            input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                            input.dispatchEvent(new Event('change', {{ bubbles: true }}));
                        }}
                    }}""", target_val)
                    page.wait_for_timeout(500)

            page.wait_for_timeout(1800)
            page.screenshot(path=str(FRAMES_DIR / "05_what_if_simulator.png"))
            smooth_scroll(page, -440, steps=10, pause_ms=25)
            page.wait_for_timeout(1000)

            # ==========================================
            # SCENE 6: CPM TIMELINE & TOPOLOGICAL SCHEDULER
            # ==========================================
            print("  >> Scene 6: Cycle-Free Critical Path (CPM) DAG Timeline...", flush=True)
            page.goto(f"{event_overview_url}/timeline", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)

            smooth_scroll(page, 320, steps=10, pause_ms=35)
            page.wait_for_timeout(1500)
            page.screenshot(path=str(FRAMES_DIR / "06_cpm_timeline.png"))

            # Trigger CPM Recalculate if button exists
            recalc_btn = page.locator("button:has-text('Recalculate CPM')").first
            if recalc_btn.is_visible():
                recalc_btn.click()
                page.wait_for_timeout(1500)

            smooth_scroll(page, -320, steps=10, pause_ms=25)
            page.wait_for_timeout(1000)

            # ==========================================
            # SCENE 7: 3-TIER HUMAN GOVERNANCE & APPROVALS
            # ==========================================
            print("  >> Scene 7: 3-Tier Human Approvals & Audit Trail...", flush=True)
            page.goto(f"{event_overview_url}/approvals", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)
            page.screenshot(path=str(FRAMES_DIR / "07_approvals_governance.png"))

            # Click Approve on first proposal
            approve_btn = page.locator("button:has-text('Approve')").first
            if approve_btn.is_visible():
                print("     Approving AI proposal with accessible Sonner toast notification...", flush=True)
                approve_btn.click()
                page.wait_for_timeout(2000)

            smooth_scroll(page, 300, steps=8, pause_ms=35)
            page.wait_for_timeout(1500)
            smooth_scroll(page, -300, steps=8, pause_ms=25)
            page.wait_for_timeout(1000)

            # ==========================================
            # SCENE 8: VENDOR COMPARISON INTELLIGENCE
            # ==========================================
            print("  >> Scene 8: Vendor Quotations & Multi-Vendor Comparison...", flush=True)
            page.goto(f"{event_overview_url}/vendors", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)
            smooth_scroll(page, 300, steps=8, pause_ms=35)
            page.wait_for_timeout(1500)
            page.screenshot(path=str(FRAMES_DIR / "08_vendor_comparison.png"))
            smooth_scroll(page, -300, steps=8, pause_ms=25)
            page.wait_for_timeout(1000)

            # ==========================================
            # SCENE 9: EXECUTIVE PRINTABLE MASTER BLUEPRINT
            # ==========================================
            print("  >> Scene 9: Executive Printable Master Blueprint...", flush=True)
            page.goto(f"{event_overview_url}/blueprint", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)
            smooth_scroll(page, 450, steps=12, pause_ms=35)
            page.wait_for_timeout(1800)
            page.screenshot(path=str(FRAMES_DIR / "09_master_blueprint.png"))
            smooth_scroll(page, -450, steps=10, pause_ms=25)
            page.wait_for_timeout(1000)

            # ==========================================
            # SCENE 10: COMMAND PALETTE & DESIGN SYSTEM
            # ==========================================
            print("  >> Scene 10: Command Palette (Cmd+K) Navigation...", flush=True)
            page.keyboard.press("Control+k")
            page.wait_for_timeout(1200)

            cmd_input = page.locator("input[placeholder*='Type a command']").first
            if cmd_input.is_visible():
                cmd_input.type("Budget", delay=100)
                page.wait_for_timeout(1400)
                page.screenshot(path=str(FRAMES_DIR / "10_command_palette.png"))
            page.keyboard.press("Escape")
            page.wait_for_timeout(1000)

            # OKLCH Design System Showcase
            print("  >> Scene 10B: OKLCH Design System Showcase (/design)...", flush=True)
            page.goto(f"{BASE_URL}/design", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)

            smooth_scroll(page, 450, steps=12, pause_ms=35)
            page.wait_for_timeout(1500)
            page.screenshot(path=str(FRAMES_DIR / "11_design_system.png"))
            smooth_scroll(page, 450, steps=12, pause_ms=35)
            page.wait_for_timeout(1500)
            smooth_scroll(page, -900, steps=14, pause_ms=25)
            page.wait_for_timeout(1800)

            print("[CELESTIA RECORDER] Walkthrough sequence completed successfully!", flush=True)

        finally:
            print("  >> Flushing and finalizing HD video stream...", flush=True)
            context.close()
            browser.close()

    # Move recorded video file to final destination
    recorded_files = list(TEMP_VIDEO_DIR.glob("*.webm"))
    if recorded_files:
        latest_file = sorted(recorded_files, key=lambda f: f.stat().st_mtime)[-1]
        shutil.copy2(latest_file, TARGET_VIDEO_PATH)
        file_size_mb = TARGET_VIDEO_PATH.stat().st_size / (1024 * 1024)
        print(f"[SUCCESS] Winning Demo Video recorded: {TARGET_VIDEO_PATH} ({file_size_mb:.2f} MB)", flush=True)
        shutil.rmtree(TEMP_VIDEO_DIR, ignore_errors=True)
        return TARGET_VIDEO_PATH
    else:
        print("[ERROR] No video file found in recording directory.", flush=True)
        return None

if __name__ == "__main__":
    vid = run()
    if vid and vid.exists():
        sys.exit(0)
    else:
        sys.exit(1)
