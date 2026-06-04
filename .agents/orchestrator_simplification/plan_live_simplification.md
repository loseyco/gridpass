# Plan: Live Simplification Launch & AI Strip-Out

This plan outlines the specific changes required to simplify the live launch of Gridpass: removing AI jargon, marking the Event/Dealer portal as Coming Soon, and completely unlinking the legacy Voyage AI `/adventure` pages and tests.

## 1. Scope and Requirements
1. **Remove `/adventure` (Voyage AI) completely**:
   - Skip or bypass the `Page 5: Voyage Hub` Playwright E2E browser tests in `tests/gridpass.spec.ts`.
   - Ensure no pages, copywriting, or navigation bars link to `/adventure` or mention the "Voyage" feature/hub.
2. **Strip out "AI" Jargon**:
   - Replace all occurrences of "AI Swarm", "AI staff", "AI developer", etc. with completely jargon-free terms (e.g. "automated", "operational", "system", "development team", "dashboard diagnostics") across all visible pages:
     - `src/app/features/page.tsx`
     - `src/app/feedback/page.tsx`
     - `src/app/team/page.tsx`
     - `src/app/interlock/page.tsx`
     - `src/app/dash/page.tsx`
     - `src/app/v/[id]/page.tsx`
3. **Coming Soon Dealership Portal**:
   - Update `src/app/pricing/page.tsx` to display "Coming Soon" in the pricing slot for the `b2b_free_portal` card instead of "$0.00", and label its period as "Priority Waitlist Active".
   - Ensure card name is `Dealership & Track Gate Portal` to align perfectly with E2E Playwright test assertions.
   - Retain the elegant `alert()` waitlist feedback.

## 2. Execution Plan
1. **Step 1: Test Suite Update**:
   - Modify `tests/gridpass.spec.ts` to skip the `Page 5: Voyage Hub` test case (`test.skip(...)`).
2. **Step 2: AI Jargon Removal**:
   - Replace all occurrences of "AI" with jargon-free terms in features, feedback, team, interlock, dashboard, and vehicle dynamic profile pages.
3. **Step 3: Coming Soon Pricing**:
   - Modify `src/app/pricing/page.tsx` to implement the "Coming Soon" price display layout for the Dealership portal.
4. **Step 4: Build & Test Verification**:
   - Run production compilation (`npm run build`) and ESLint (`npx eslint --quiet`).
   - Run E2E test runner (`node run-tests.js`) to verify all remaining 9 test cases pass 100% cleanly.
