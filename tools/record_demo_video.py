"""
CELESTIA - Production Automated HD Demo Video Recorder.
Records a high-definition (1280x720) walkthrough of all core CELESTIA features:
1. Marketing Landing & Cultural Prompt Engine
2. Multi-Celebration Gallery (Wedding, Birthday, Community)
3. 12-Column Executive Bento Grid Overview
4. 4 Magic Moments Interactive Guided Tour
5. Zero-Rounding Integer Budget & What-If Sensitivity Simulator
6. Cycle-Free Critical Path (CPM) Topological DAG Timeline
7. 3-Tier Human Approvals with Sonner Toast & Audit Trail
8. Vendor Quotation Comparison Intelligence
9. Executive Printable Master Blueprint with Host Signature Block
10. Command Palette (Cmd+K) & OKLCH Design System Showcase
"""

import os
import sys
import time
import shutil
from pathlib import Path

# Ensure stdout handles UTF-8 on Windows cp1252 consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("CELESTIA_FE_URL", "http://localhost:3000")
OUTPUT_DIR = Path("docs/evidence/demo_video")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FRAMES_DIR = OUTPUT_DIR / "frames"
FRAMES_DIR.mkdir(parents=True, exist_ok=True)
TEMP_VIDEO_DIR = OUTPUT_DIR / "temp_recordings"
TEMP_VIDEO_DIR.mkdir(parents=True, exist_ok=True)

TARGET_VIDEO_PATH = OUTPUT_DIR / "celestia_feature_demo_hd.webm"

def smooth_scroll(page, y_delta, steps=10, pause_ms=40):
    """Performs smooth scrolling with small incremental steps."""
    for _ in range(steps):
        page.evaluate(f"window.scrollBy(0, {y_delta / steps})")
        page.wait_for_timeout(pause_ms)

def run():
    print("[CELESTIA RECORDER] Starting Playwright engine in HD (1280x720)...", flush=True)
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
        page = context.new_page()

        try:
            # ==========================================
            # SCENE 1: MARKETING LANDING & PROMPT DISCOVERY
            # ==========================================
            print("  >> Scene 1: Marketing Landing Page & Cultural Prompt Engine...", flush=True)
            page.goto(BASE_URL, wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(1800)

            # Smooth scroll down to highlight value propositions
            smooth_scroll(page, 400, steps=12, pause_ms=35)
            page.wait_for_timeout(1200)

            # Cycle prompt chips
            chips = page.locator("button:has-text('Maharashtrian'), button:has-text('Gujarati'), button:has-text('Aarav'), button:has-text('Shivaji')")
            if chips.count() > 1:
                chips.nth(1).click()
                page.wait_for_timeout(800)
                chips.nth(2).click()
                page.wait_for_timeout(800)

            # Scroll back to hero
            smooth_scroll(page, -400, steps=10, pause_ms=25)
            page.wait_for_timeout(800)
            page.screenshot(path=str(FRAMES_DIR / "01_landing_hero.png"))

            # Click Demo Workspace CTA
            demo_btn = page.locator("button:has-text('Explore Read-Only Demo Workspace')").first
            if demo_btn.is_visible():
                demo_btn.click()
            else:
                page.goto(f"{BASE_URL}/app/events", wait_until="domcontentloaded")

            page.wait_for_timeout(2500)

            # ==========================================
            # SCENE 2: PRE-SEEDED CELEBRATIONS GALLERY
            # ==========================================
            print("  >> Scene 2: Celebrations Gallery (3 Seeded Scenarios)...", flush=True)
            page.wait_for_selector("text=Your Celebrations", timeout=15000)

            # Wait for celebration cards to mount via React Query
            try:
                page.wait_for_selector("a[href^='/app/events/']:not([href$='/new'])", timeout=8000)
            except Exception:
                pass

            page.wait_for_timeout(1500)
            page.screenshot(path=str(FRAMES_DIR / "02_celebrations_gallery.png"))

            # Locate the event cards (excluding "new")
            event_cards = page.locator("a[href^='/app/events/']:not([href$='/new'])")
            card_count = event_cards.count()
            print(f"     Found {card_count} active celebration cards", flush=True)

            if card_count > 0:
                event_cards.first.click()
            else:
                page.goto(f"{BASE_URL}/app/events/1", wait_until="domcontentloaded")

            page.wait_for_timeout(2500)

            # Save the current event overview URL
            event_overview_url = page.url.split("?")[0]
            print(f"     Current Event Overview URL: {event_overview_url}", flush=True)

            # ==========================================
            # SCENE 3: 12-COL BENTO GRID OVERVIEW
            # ==========================================
            print("  >> Scene 3: 12-Column Executive Bento Grid Overview...", flush=True)
            page.wait_for_timeout(1500)
            smooth_scroll(page, 320, steps=10, pause_ms=35)
            page.wait_for_timeout(1200)
            page.screenshot(path=str(FRAMES_DIR / "03_bento_overview.png"))
            smooth_scroll(page, -320, steps=10, pause_ms=25)
            page.wait_for_timeout(800)

            # Launch Guided Tour via query param
            print("  >> Scene 3B: Interactive 3-Minute Guided Tour (4 Magic Moments)...", flush=True)
            page.goto(f"{event_overview_url}?tour=1", wait_until="domcontentloaded")
            page.wait_for_timeout(2000)
            page.screenshot(path=str(FRAMES_DIR / "04_guided_tour_modal.png"))

            # Step through the 4 Magic Moments in Tour Modal
            for step_idx in range(4):
                print(f"     Tour Modal Step {step_idx + 1}/4...", flush=True)
                page.wait_for_timeout(1600)
                next_tour_btn = page.locator("button:has-text('Next Magic Moment'), button:has-text('Done & Explore')").first
                if next_tour_btn.is_visible():
                    next_tour_btn.click()
                    page.wait_for_timeout(800)

            page.wait_for_timeout(1200)

            # ==========================================
            # SCENE 4: BUDGET & WHAT-IF SENSITIVITY SIMULATOR
            # ==========================================
            print("  >> Scene 4: Zero-Rounding Integer Budget & What-If Simulator...", flush=True)
            page.goto(f"{event_overview_url}/budget", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)

            # Smooth scroll down to the What-If Simulator
            smooth_scroll(page, 420, steps=12, pause_ms=35)
            page.wait_for_timeout(1500)

            # Drag the guest slider smoothly
            slider = page.locator("input[type='range']").first
            if slider.is_visible():
                print("     Simulating Guest variations with optimistic live update...", flush=True)
                for target_val in [340, 390, 450, 480, 420, 300]:
                    page.evaluate(f"""(val) => {{
                        const input = document.querySelector("input[type='range']");
                        if (input) {{
                            input.value = val;
                            input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                            input.dispatchEvent(new Event('change', {{ bubbles: true }}));
                        }}
                    }}""", target_val)
                    page.wait_for_timeout(400)

            page.wait_for_timeout(1500)
            page.screenshot(path=str(FRAMES_DIR / "05_what_if_simulator.png"))
            smooth_scroll(page, -420, steps=10, pause_ms=25)
            page.wait_for_timeout(800)

            # ==========================================
            # SCENE 5: CPM TIMELINE & TOPOLOGICAL SCHEDULER
            # ==========================================
            print("  >> Scene 5: Cycle-Free Critical Path (CPM) DAG Timeline...", flush=True)
            page.goto(f"{event_overview_url}/timeline", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)

            # Scroll through timeline tasks
            smooth_scroll(page, 320, steps=10, pause_ms=35)
            page.wait_for_timeout(1500)
            page.screenshot(path=str(FRAMES_DIR / "06_cpm_timeline.png"))

            # Trigger CPM Recalculate if button exists
            recalc_btn = page.locator("button:has-text('Recalculate CPM')").first
            if recalc_btn.is_visible():
                recalc_btn.click()
                page.wait_for_timeout(1200)

            smooth_scroll(page, -320, steps=10, pause_ms=25)
            page.wait_for_timeout(800)

            # ==========================================
            # SCENE 6: 3-TIER HUMAN GOVERNANCE & APPROVALS
            # ==========================================
            print("  >> Scene 6: 3-Tier Human Approvals & Audit Trail...", flush=True)
            page.goto(f"{event_overview_url}/approvals", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)
            page.screenshot(path=str(FRAMES_DIR / "07_approvals_governance.png"))

            # Click Approve on first proposal
            approve_btn = page.locator("button:has-text('Approve')").first
            if approve_btn.is_visible():
                print("     Approving AI proposal with Sonner toast notification...", flush=True)
                approve_btn.click()
                page.wait_for_timeout(1800)

            # Scroll down to immutable audit log
            smooth_scroll(page, 300, steps=8, pause_ms=35)
            page.wait_for_timeout(1200)
            smooth_scroll(page, -300, steps=8, pause_ms=25)
            page.wait_for_timeout(800)

            # ==========================================
            # SCENE 7: VENDOR COMPARISON INTELLIGENCE
            # ==========================================
            print("  >> Scene 7: Vendor Quotations & Multi-Vendor Comparison...", flush=True)
            page.goto(f"{event_overview_url}/vendors", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)
            smooth_scroll(page, 300, steps=8, pause_ms=35)
            page.wait_for_timeout(1200)
            page.screenshot(path=str(FRAMES_DIR / "08_vendor_comparison.png"))
            smooth_scroll(page, -300, steps=8, pause_ms=25)
            page.wait_for_timeout(800)

            # ==========================================
            # SCENE 8: EXECUTIVE PRINTABLE MASTER BLUEPRINT
            # ==========================================
            print("  >> Scene 8: Executive Printable Master Blueprint...", flush=True)
            page.goto(f"{event_overview_url}/blueprint", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)
            smooth_scroll(page, 450, steps=12, pause_ms=35)
            page.wait_for_timeout(1500)
            page.screenshot(path=str(FRAMES_DIR / "09_master_blueprint.png"))
            smooth_scroll(page, -450, steps=10, pause_ms=25)
            page.wait_for_timeout(800)

            # ==========================================
            # SCENE 9: COMMAND PALETTE (Cmd+K) NAVIGATION
            # ==========================================
            print("  >> Scene 9: Command Palette (Cmd+K) Fuzzy Search...", flush=True)
            page.keyboard.press("Control+k")
            page.wait_for_timeout(1000)

            cmd_input = page.locator("input[placeholder*='Type a command']").first
            if cmd_input.is_visible():
                cmd_input.type("Budget", delay=100)
                page.wait_for_timeout(1200)
                page.screenshot(path=str(FRAMES_DIR / "10_command_palette.png"))
            page.keyboard.press("Escape")
            page.wait_for_timeout(800)

            # ==========================================
            # SCENE 10: OKLCH DESIGN SYSTEM SHOWCASE
            # ==========================================
            print("  >> Scene 10: OKLCH Design System Showcase (/design)...", flush=True)
            page.goto(f"{BASE_URL}/design", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)

            smooth_scroll(page, 450, steps=12, pause_ms=35)
            page.wait_for_timeout(1500)
            page.screenshot(path=str(FRAMES_DIR / "11_design_system.png"))
            smooth_scroll(page, 450, steps=12, pause_ms=35)
            page.wait_for_timeout(1500)
            smooth_scroll(page, -900, steps=14, pause_ms=25)
            page.wait_for_timeout(1500)

            print("[CELESTIA RECORDER] Walkthrough sequence completed successfully!", flush=True)

        finally:
            print("  >> Flushing and finalizing HD video stream...", flush=True)
            context.close()
            browser.close()

    # Find the recorded video file and move it to final destination
    recorded_files = list(TEMP_VIDEO_DIR.glob("*.webm"))
    if recorded_files:
        latest_file = sorted(recorded_files, key=lambda f: f.stat().st_mtime)[-1]
        shutil.copy2(latest_file, TARGET_VIDEO_PATH)
        file_size_mb = TARGET_VIDEO_PATH.stat().st_size / (1024 * 1024)
        print(f"[SUCCESS] High-Definition Video recorded and saved to: {TARGET_VIDEO_PATH} ({file_size_mb:.2f} MB)", flush=True)
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
