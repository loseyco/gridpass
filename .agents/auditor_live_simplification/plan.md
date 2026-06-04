# M6 Forensic Audit Plan

This plan outlines the concrete, step-by-step verification procedures to perform a Forensic Integrity Audit on the Milestone M6 implementation.

## Phase 1: Build & Compilation Verification
- **Step 1.1**: Run `npm run build` command.
  - *Verification*: Confirm compilation completes with zero errors or warnings.
- **Step 1.2**: Run `npx eslint --quiet` command.
  - *Verification*: Confirm lint checks pass with zero errors.
- **Step 1.3**: Run Playwright test suite `npx playwright test`.
  - *Verification*: Confirm all non-skipped tests execute successfully and pass. Verify Voyage Hub test is skipped.

## Phase 2: Static Code Audit
- **Step 2.1**: Audit `/pricing` page (`src/app/pricing/page.tsx`).
  - *Verification*: 
    - Card with `id: 'b2b_free_portal'` named "Dealership & Track Gate Portal".
    - Price slot renders "Coming Soon".
    - Period label renders "Priority Waitlist Active".
    - Button labeled "Join Waitlist" shows waitlist alert behavior when clicked.
- **Step 2.2**: Audit Navbar and Footer components for `/adventure` or Voyage AI links/copy.
  - *Verification*: Ensure no `/adventure` references exist in `src/components/Navbar.tsx` and `src/components/Footer.tsx`.
- **Step 2.3**: Audit whole `src/` directory for customer-facing AI jargon.
  - *Verification*: Perform grep searches for "AI Swarm", "AI staff", "AI developer", "AI systems", and standard AI terms to verify replacements.

## Phase 3: Integrity Forensics Verification (General Profile)
- **Step 3.1**: Check for hardcoded test results, expected outputs, or static mocks in the application code.
  - *Verification*: Ensure true Firestore/Client state is queried and updated, particularly in pricing, dashboard, P2P transfer, and vehicle lifecycle routes.
- **Step 3.2**: Check for facade implementations.
  - *Verification*: Confirm no functions have mock `return <constant>` or static return values where dynamic behavior is required.
- **Step 3.3**: Pre-populated artifact detection.
  - *Verification*: Ensure no pre-populated log files or test result artifacts pre-date our audit.
