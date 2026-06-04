## 2026-05-25T23:31:52Z

You are a teamwork_preview_worker. Your working directory is c:\_Projects\Gridpass-v4\.agents\worker_live_simplification.
Your role is: 'Worker Live Simplification'.

Your mission is to implement Milestone M6 (Gridpass Live Simplification & Jargon Strip-Out) according to the specifications:

### 1. Remove /adventure (Voyage AI) completely:
- Locate `tests/gridpass.spec.ts` and modify the test case for `Page 5: Voyage Hub` to skip it (e.g. `test.skip('Page 5: Voyage Hub', ...)` or `test.describe.skip(...)` depending on how it is written).
- Ensure there are no links or copywriting references to `/adventure` or the "Voyage" feature/hub in `src/app/Navbar.tsx`, `src/app/Footer.tsx`, or any other visible visitor/landing pages.

### 2. Remove Any Mention of "AI" Jargon:
- Replace all occurrences of "AI" jargon (e.g. "AI Swarm", "AI staff", "AI developer", "AI systems", etc.) across the codebase with jargon-free terms to keep the copy clean and focused.
- Particularly focus on:
  - `src/app/features/page.tsx`
  - `src/app/feedback/page.tsx`
  - `src/app/team/page.tsx`
  - `src/app/interlock/page.tsx`
  - `src/app/dash/page.tsx`
  - `src/app/v/[id]/page.tsx`
  - `src/app/page.tsx`
  - `src/app/pricing/page.tsx`
- Replace them with clean, grounded alternatives such as:
  - "AI Swarm" -> "automated dashboard" or "network operations"
  - "AI staff" -> "system automation" or "digital operations support"
  - "AI developer" -> "development team"
  - "AI-driven" -> "automated" or "intelligent"
  - "AI" -> "automated" / "system" / "diagnostic" / "operational"
  - Ensure the copywriting is natural, professional, and fits perfectly.

### 3. Event Gate / Dealership Portal is "Coming Soon":
- In `src/app/pricing/page.tsx`, look for the pricing card corresponding to `b2b_free_portal` (which should currently be showing "$0.00").
- The card name MUST be `Dealership & Track Gate Portal` to match E2E assertions exactly.
- Display "Coming Soon" in the pricing/amount slot instead of "$0.00" (or "$0").
- Change the period label to "Priority Waitlist Active" (or similar appropriate description matching the waitlist context).
- Retain the elegant `alert()` priority waitlist sign-up feedback when clicking the card's button (the button text should be "Join Waitlist").

### 4. Verification and Compilation:
- Ensure all pages compile flawlessly: run Next.js compilation (`npm run build`).
- Verify there are no ESLint issues: run `npx eslint --quiet` (or `npm run lint`).
- Verify all E2E Playwright tests pass: run `node run-tests.js`. Ensure 100% success rate on the remaining skipped/bypassed E2E tests.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please document all your code changes in `changes.md` and your final verification results in `handoff.md` inside your working directory (`c:\_Projects\Gridpass-v4\.agents\worker_live_simplification`).
Once finished, send a message back to the parent conversation 5a45960c-cd69-44ee-ba0f-b5ffce02593b.
