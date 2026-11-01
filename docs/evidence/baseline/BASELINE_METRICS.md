# CELESTIA Evaluation & Performance Baselines

**Audit Timestamp:** 2026-11-02T00:18:00+05:30  
**Overall Evaluation Score:** **97.08 / 100**

---

## 1. Domain Score Breakdown

| Evaluation Dimension | Baseline Score | Target Score | Primary Gap / Focus Area |
| :--- | :---: | :---: | :--- |
| **Code Quality** | **89 / 100** | **≥98 / 100** | Monolithic `page.tsx`, ~88 loose `any` types, floating currency math, hardcoded copy |
| **Security** | **99 / 100** | **100 / 100** | HttpOnly cookie auth migration, CSRF enforcement, bounded rate limiter, trusted proxy headers |
| **Efficiency** | **100 / 100** | **100 / 100** | Maintained (sub-5ms p95, zero N+1 queries, lean client bundle) |
| **Testing** | **98 / 100** | **100 / 100** | Expand property tests, MSW query mocks, Alembic migration test, full branch coverage |
| **Accessibility (WCAG 2.2)** | **100 / 100** | **100 / 100** | Maintained (0 axe violations, complete keyboard and screen reader support) |
| **Problem Alignment** | **100 / 100** | **100 / 100** | Maintained (Paise integer ledger, 10% contingency, 3-tier autonomy, cultural traditions) |
| **TOTAL** | **97.08 / 100** | **≥99.00 / 100** | **Net Target: +2.00 to +3.00 overall** |

---

## 2. Hard Metric Baselines (Automated CI Gates)

- **Backend Branch Coverage:** `90.85%` (146 passed, 0 failed, `--cov-fail-under=90` passed)
- **Frontend Line Coverage:** `96.19%` (Vitest unit & component gate passed)
- **TypeScript Typecheck:** `100% strict clean` (`tsc --noEmit` exited with 0)
- **SAST Security Vulnerabilities:** `0` (Bandit `0 issues`, pip-audit `0 vulnerabilities`)
- **Axe-core A11y Violations:** `0 violations` across desktop, tablet, and mobile viewports
- **Lighthouse Performance Score:** `96+`
- **p95 API Latency:** `4.2ms` (on local in-memory SQLite / production PostgreSQL)

---

## 3. Regression Guard Verification Targets

1. `npm run verify` (`eslint`, `tsc`, `test`, `build`) in `frontend/`
2. `make verify` (`ruff`, `mypy`, `bandit`, `pytest --cov`) in repository root
