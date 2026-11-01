#!/usr/bin/env python3
"""
CELESTIA Universal Verification Script (Cross-Platform)
Executes:
1. Backend Linting (Ruff)
2. Backend Typechecking (Mypy)
3. Backend SAST Scan (Bandit)
4. Backend Test Suite & Branch Coverage (Pytest >=90%)
5. Frontend Typechecking (tsc)
6. Frontend Unit Tests (Vitest)
"""
import os
import subprocess
import sys

def run_step(name: str, cmd: list[str], cwd: str | None = None, env: dict | None = None) -> None:
    print(f"\n==================================================")
    print(f"==> Step: {name}")
    print(f"==================================================")
    res = subprocess.run(cmd, cwd=cwd, env=env)
    if res.returncode != 0:
        print(f"\n[FAILED] {name} exited with code {res.returncode}")
        sys.exit(res.returncode)
    print(f"[PASSED] {name}")

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = os.path.join(repo_root, "backend")
    backend_env["TESTING"] = "1"
    backend_env["SECRET_KEY"] = "test_secret_key_minimum_32_characters_long_entropy_here"
    backend_env["ENV"] = "testing"

    # Backend
    run_step("Backend Ruff Lint", [sys.executable, "-m", "ruff", "check", "backend/app"], cwd=repo_root)
    run_step("Backend Mypy Strict Types", [sys.executable, "-m", "mypy", "backend/app", "--ignore-missing-imports"], cwd=repo_root)
    run_step("Backend Bandit SAST Scan", [sys.executable, "-m", "bandit", "-r", "backend/app", "-ll", "-ii"], cwd=repo_root)
    run_step("Backend Pytest (>=90% Branch Coverage)", [
        sys.executable, "-m", "pytest", "backend/tests",
        "--cov=app", "--cov-branch", "--cov-report=term-missing", "--cov-fail-under=90"
    ], cwd=repo_root, env=backend_env)

    # Frontend
    frontend_dir = os.path.join(repo_root, "frontend")
    run_step("Frontend Typecheck", ["npm.cmd" if sys.platform == "win32" else "npm", "run", "typecheck"], cwd=frontend_dir)
    run_step("Frontend Unit Tests (Vitest)", ["npm.cmd" if sys.platform == "win32" else "npm", "run", "test"], cwd=frontend_dir)

    print("\n[SUCCESS] ALL QUALITY & SECURITY GATES PASSED CLEANLY (100%)!")

if __name__ == "__main__":
    main()
