import json
import time
from playwright.sync_api import sync_playwright
from axe_playwright_python.sync_playwright import Axe

def run_axe_scan():
    results = {}
    
    tabs = [
        ("Dashboard", "//button[contains(., 'Dashboard')]"),
        ("Ideas", "//button[contains(., 'Celebration Ideas')]"),
        ("Budget", "//button[contains(., 'Budget & What-If')]"),
        ("Timeline", "//button[contains(., 'Timeline & CPM')]"),
        ("Vendors", "//button[contains(., 'Vendors & Quotes')]"),
        ("Approvals", "//button[contains(., 'Approvals')]"),
        ("Settings", "//button[contains(., 'Settings')]")
    ]
    
    viewports = [
        ("desktop_1280", {"width": 1280, "height": 800}),
        ("mobile_360", {"width": 360, "height": 740})
    ]
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        for vp_name, vp_size in viewports:
            context = browser.new_context(viewport=vp_size)
            page = context.new_page()
            
            # Go to app
            page.goto("http://localhost:3000", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(2000)
            
            for tab_name, tab_xpath in tabs:
                key = f"{tab_name}_{vp_name}"
                try:
                    # Click tab if not Dashboard
                    if tab_name != "Dashboard":
                        btn = page.locator(tab_xpath).first
                        if btn.is_visible():
                            btn.click()
                            page.wait_for_timeout(1500)
                    
                    axe = Axe()
                    axe_res = axe.run(page)
                    
                    violations = axe_res.response.get("violations", [])
                    simplified_violations = []
                    for v in violations:
                        simplified_violations.append({
                            "id": v.get("id"),
                            "impact": v.get("impact"),
                            "description": v.get("description"),
                            "help": v.get("help"),
                            "helpUrl": v.get("helpUrl"),
                            "nodes_count": len(v.get("nodes", [])),
                            "targets": [n.get("target", []) for n in v.get("nodes", [])[:3]]
                        })
                    
                    results[key] = {
                        "tab": tab_name,
                        "viewport": vp_name,
                        "violation_count": len(violations),
                        "total_nodes_affected": sum(len(v.get("nodes", [])) for v in violations),
                        "violations": simplified_violations
                    }
                    print(f"Scanned {key}: {len(violations)} violations ({results[key]['total_nodes_affected']} nodes affected)")
                except Exception as e:
                    print(f"Error on {key}: {e}")
                    results[key] = {"error": str(e)}
            
            context.close()
            
        browser.close()

    with open("axe_scan_summary.json", "w", encoding="utf-8") as fp:
        json.dump(results, fp, indent=2)

    print("Scan complete. Saved to axe_scan_summary.json")

if __name__ == "__main__":
    run_axe_scan()
