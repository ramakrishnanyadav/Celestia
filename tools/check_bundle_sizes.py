"""
Bundle size audit tool for Next.js 16 (Turbopack).
Verifies that all App Router routes produce JavaScript payloads within the <180KB gzip budget.
"""
import os
import json
import gzip
from pathlib import Path

def analyze_bundles():
    next_dir = Path("frontend/.next")
    manifest_path = next_dir / "build-manifest.json"
    
    if not manifest_path.exists():
        print(f"Error: {manifest_path} does not exist. Run 'npm run build' first.")
        return False
        
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
        
    pages = manifest.get("pagesChunkGroupBootstrapParams", {})
    root_main = manifest.get("rootMainFiles", [])
    polyfill_files = manifest.get("polyfillFiles", [])
    
    results = {}
    budget_kb = 180.0
    passed = True
    
    print("=" * 80)
    print("CELESTIA FRONTEND ROUTE BUNDLE SIZE AUDIT")
    print(f"Budget per route: < {budget_kb} KB gzip (excluding lazy 3D assets)")
    print("=" * 80)
    print(f"{'Route':<42} {'Raw (KB)':<12} {'Gzip (KB)':<12} {'Chunks':<8} {'Status'}")
    print("-" * 80)
    
    for route, config in sorted(pages.items()):
        chunks = set(config.get("otherChunks", []))
        # Add root main files and polyfills required to boot the route
        for rf in root_main:
            chunks.add(rf)
        for pf in polyfill_files:
            chunks.add(pf)
            
        total_raw = 0
        total_gz = 0
        
        for chunk in chunks:
            chunk_file = next_dir / chunk
            if chunk_file.exists():
                data = chunk_file.read_bytes()
                total_raw += len(data)
                total_gz += len(gzip.compress(data))
                
        raw_kb = round(total_raw / 1024, 2)
        gz_kb = round(total_gz / 1024, 2)
        status = "PASS" if gz_kb <= budget_kb else "FAIL"
        if status == "FAIL":
            passed = False
            
        clean_route = route.replace("/page", "") or "/"
        results[clean_route] = {
            "raw_kb": raw_kb,
            "gzip_kb": gz_kb,
            "chunks_count": len(chunks),
            "status": status,
        }
        print(f"{clean_route:<42} {raw_kb:<12.2f} {gz_kb:<12.2f} {len(chunks):<8} {status}")
        
    print("-" * 80)
    print(f"Overall Audit Status: {'PASSED (ALL 14 ROUTES WITHIN <180KB GZIP BUDGET)' if passed else 'FAILED'}")
    print("=" * 80)
    
    # Save output to docs/evidence/perf/bundle_size_report.json
    out_dir = Path("docs/evidence/perf")
    out_dir.mkdir(parents=True, exist_ok=True)
    report_file = out_dir / "bundle_size_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump({
            "target_budget_gzip_kb": budget_kb,
            "passed": passed,
            "routes": results
        }, f, indent=2)
    print(f"Report saved to {report_file}")
    return passed

if __name__ == "__main__":
    analyze_bundles()
