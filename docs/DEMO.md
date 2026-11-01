# CELESTIA — Judge & Stakeholder Demo Guide

**Demo Duration:** 3 Minutes  
**Audience:** Hackathon Judges, Enterprise Product Evaluators, Senior Technical Architects  
**Core Thesis:** *Where Cultural Grandeur Meets Deterministic Precision.* CELESTIA eliminates human cognitive overload in Indian celebrations by pairing natural-language AI intelligence with mathematically provable financial ledgers and DAG critical-path scheduling.

---

## ⚡ 30-Second Elevator Pitch

> *"Indian weddings and celebrations are complex, multi-day operations with millions of rupees at stake, strict cultural rituals, and hundreds of moving parts. Yet people plan them on chaotic spreadsheets where rounding errors bleed money and task bottlenecks go unnoticed until it's too late.*
>
> *CELESTIA is an enterprise celebration intelligence engine. In 10 seconds, it converts a plain-English vision into a zero-rounding integer paise ledger with an automated 10% contingency buffer, a Critical Path (CPM) schedule with cycle detection, and Indian cultural ritual calibration. With 3-tier autonomy, AI proposes changes—but humans retain total control with one-click signoff and instant rollback."*

---

## 🎯 3-Minute Demo Walkthrough Script

### Step 1: Landing Page & Instant Demo Workspace (0:00 – 0:30)
- **Action:** Open `http://localhost:3000`.
- **Observation:** Notice the bright, white, premium glassmorphic UI with zero clipped navigation elements. The hero headline reads: *"Where Cultural Grandeur Meets Deterministic Precision"*.
- **Click:** Click **"Explore Read-Only Demo Workspace (Anjali & Rahul Wedding)"**.
- **Expected Outcome:** Instantly logs in via secure demo token and routes to `/app/events`, displaying the seeded *"Anjali & Rahul's Royal Mumbai Wedding"* workspace.

### Step 2: The Overview Bento & Integer Paise Financials (0:30 – 1:15)
- **Action:** Click into the wedding event card to reach `/app/events/[id]`.
- **Observation:**
  - The single `<h1>Anjali & Rahul's Royal Mumbai Wedding Overview</h1>` is announced cleanly.
  - Four KPI cards summarize: Total Budget (**₹15.00 Lakh** in `en-IN` formatting), Guest Count (**300 guests** / ₹5,000 per guest avg), Contingency Buffer (**₹1.50 Lakh** / 10% safety reserve), and Timeline Tasks (**12 tasks**).
  - Hover over the quick navigation modules to inspect the 2px focus ring token and responsive layout.

### Step 3: What-If Scenario Simulation with 0ms Optimistic Feedback (1:15 – 2:00)
- **Action:** Navigate to **Budget & What-If** (`/app/events/[id]/budget`).
- **Observation:**
  - Slide the **Simulated Guests** slider from 300 to 450 guests.
  - Notice the instant client-side optimistic recalculation of per-guest and contingency costs.
  - At 250ms debounce, the backend recalculates feasibility. If budget is insufficient, the status changes to *"Tight / Over-Budget"* with an amber warning icon.
  - The debounced live region announces the status to screen readers without UI chatter.

### Step 4: Critical Path (CPM) Timeline & Cycle Detection (2:00 – 2:30)
- **Action:** Navigate to **Timeline & CPM** (`/app/events/[id]/timeline`).
- **Observation:**
  - Inspect the task sequence. Critical path bottleneck tasks (e.g. *"Sakhar Puda Ceremony"*, *"Mandap Floral Setup"*) display the bold **Critical Path (0d Slack)** badge with flame icon.
  - Non-critical tasks display positive slack days.
  - Click **"Recalculate CPM"** to trigger topological DAG sorting with cycle detection.

### Step 5: 3-Tier Human-in-the-Loop Approval & Blueprint Print (2:30 – 3:00)
- **Action:**
  - Navigate to **Approvals** (`/app/events/[id]/approvals`) to view AI-generated budget adjustments and vendor reallocations.
  - Click **"Approve"** on a proposal. An accessible confirmation toast confirms the execution and updates the ledger.
  - Navigate to **Blueprint** (`/app/events/[id]/blueprint`) to view the vendor-ready PDF export with host signature lines and zero navigation chrome.

---

## 📽️ 5-Slide Pitch Outline

- **Slide 1: Problem:** The chaos of Indian celebrations—₹15L–₹1Cr budgets tracked on fragile spreadsheets, delayed muhuratam schedules, vendor ambiguity, and catastrophic financial leaks.
- **Slide 2: Insight:** AI alone cannot be trusted with wedding budgets because LLMs hallucinate numbers. A celebration planner requires *deterministic engineering* (integer math + CPM DAGs) with an AI advisory wrapper.
- **Slide 3: Solution (CELESTIA):** Natural-language extraction into 64-bit integer paise ledgers, automated 10% contingency safety reserves, topological critical-path sequencing, and 3-tier autonomy.
- **Slide 4: Technology & Provable Quality:** Next.js 16 App Router + FastAPI; $\ge 90\%$ backend branch coverage, $\ge 95\%$ frontend coverage, 0 axe accessibility violations, and 100% mutation kill score.
- **Slide 5: Business Impact & Scalability:** Sub-300ms p95 latency at concurrency, enterprise multi-tenant isolation, and zero-downtime offline deterministic fallbacks.

---

## ❓ Judge FAQ (Frequently Asked Questions)

### Q1: How does CELESTIA prevent floating-point rounding errors in budgets?
> **Answer:** All currency amounts across database columns, API schemas, and calculation engines are stored strictly as 64-bit integers in minor units (paise: 1 INR = 100 paise). Floating-point arithmetic is forbidden across the codebase and verified via Hypothesis property testing over random minor units.

### Q2: What happens if the AI provider (Gemini / OpenAI) is down during an event?
> **Answer:** CELESTIA operates on a fail-safe offline fallback architecture. If external LLM calls time out or return errors, the system seamlessly activates deterministic heuristic templates calibrated by celebration type and city tier, ensuring zero downtime for the host.

### Q3: How is multi-tenant security guaranteed?
> **Answer:** All database queries enforce strict tenant boundary filters on `user_id`. Attempting to access another user's celebration returns a sanitized 404/403. Authentication uses HttpOnly, SameSite, Secure cookies with anti-CSRF token verification and sliding-window rate limiters.

### Q4: How is accessibility verified?
> **Answer:** CELESTIA is tested against the full WCAG 2.2 Level AA standard, plus Level AAA for primary body text contrast. The `@axe-core/playwright` test runner verifies zero violations across 16 combinations of viewports (375px to 1920px), light/dark themes, and reduced-motion states.
