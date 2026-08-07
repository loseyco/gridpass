# Gridpass Specialized Agent Team Roster

The Gridpass project equips 5 specialized expert subagents for automated planning, auditing, optimization, and persona testing:

---

### 1. `gm` (General Manager & Operations Supervisor)
* **Role**: Agent team orchestration, task delegation, and token-lean execution control.
* **Focus**: Manages subagent workflows, enforces prompt token optimization, prevents redundant multi-agent calls, and ensures strict adherence to project roadmaps and ground truths.

### 2. `architect` (Feature & Product Architect)
* **Role**: Feature planning, system specification, and domain modeling.
* **Focus**: Defines Firestore collection schemas, RBAC permission match rules, route paths, and modal specs before coding begins.

### 2. `aiseo_expert` (SEO & AI Search Optimization Specialist)
* **Role**: Traditional SEO + Generative Engine Optimization (GEO) auditor.
* **Focus**: Audits OpenGraph social cards, Twitter cards, Schema.org JSON-LD structured data (`ProfilePage`, `Vehicle`, `LocalBusiness`, `Event`), sitemaps, and AI search indexing (Perplexity, ChatGPT, Gemini).

### 3. `user_panel` (Persona User Testing Panel)
* **Role**: Simulates 7 core personas to evaluate user friction and monetization:
  1. **Marcus** (Car & Track Enthusiast)
  2. **Sarah** (Paddock Spectator)
  3. **Ranger Dave** (Track & Venue Owner)
  4. **Steve** (PEV / Onewheel / E-Bike Rider)
  5. **Tech-Illiterate Billy** (Simple, zero-jargon usability)
  6. **Cynical CFO Rich** (ROI, MRR, monetization funnel)
  7. **Growth Marketer Chloe** (Viral invitation loop & low friction)

### 4. `site_auditor` (UX & Design System Auditor)
* **Role**: Audits design system compliance and UI uniformity.
* **Focus**: Enforces solid white background (`#ffffff`), charcoal text (`#1c1c1e`), crimson accents (`#ff3b30`), touch targets (≥44px), mobile/widescreen responsiveness, zero fluff, and zero fake data.

### 5. `mobile_expert` (Apple Native Mobile & Touch UX Specialist)
* **Role**: Mobile touch experience & outdoor sunlight usability auditor.
* **Focus**: Enforces ≥44px touch targets, zero desktop-only hover dependencies, input zoom prevention (font-size ≥16px), outdoor sunlight high contrast, and smooth mobile bottom drawers.

### 6. `financial_expert` (Financial & Revenue Analytics Expert)
* **Role**: Cash flow, MRR/ARR calculation, B2B deal pipelines, LTV/CAC ratios, financial health, and platform acquisition due-diligence readiness.
* **Focus**: Calculates verified MRR, ARR, ARPU, subscription pricing models, and investor pitch deck metrics.

### 7. `traffic_expert` (Database Telemetry & Site Traffic Analytics Expert)
* **Role**: Real-time traffic flows to and through the site, user navigation journeys, physical QR scan velocity, device & viewport distributions, and UX friction signals.
* **Focus**: Analyzes page views, entry/exit paths, iPhone/Android vs iPad vs desktop distributions, and rage clicks.

### 8. `git_expert` (Git & GitHub Version Control Manager)
* **Role**: Git staging, clean conventional commits, branch management, release tagging, and GitHub repository synchronization (`origin main`).
* **Focus**: Ensures all codebase features, refactors, and updates are committed cleanly and safely pushed to GitHub.

### 9. `tester` (Automated E2E Playwright Auditor)
* **Role**: Runs Playwright E2E suites (`npm run test:headed`) in visual Chrome mode.
* **Focus**: Guarantees 100% test pass rate and session persistence (`tests/.auth/user.json`).
