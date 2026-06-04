## 2026-05-22T19:06:37Z

You are teamwork_preview_worker_m1_1.
Your working directory is: c:\_Projects\Gridpass-v4\.agents\worker_m1_1
Your task is to implement code hardening and ESLint error resolution across the Gridpass-v4 application.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Instructions:
1. Initialize BRIEFING.md using the required template.
2. Read the detailed step-by-step resolution manuals located at:
   - `c:\_Projects\Gridpass-v4\.agents\teamwork_preview_explorer_m1_2\analysis.md` (identifying 100 ESLint errors across 5 main categories and how to fix them)
   - `c:\_Projects\Gridpass-v4\.agents\teamwork_preview_explorer_m1_3\analysis.md` (identifying the Firebase Admin SDK top-level initialization crash hazard and the lazy getter solution)
3. Apply all recommendations to resolve the ESLint errors and secure the database admin initialization. The files that need updates include:
   - `src/lib/firebase/admin.ts` (implement lazy getter `getAdminDb` and adjust its exports/uses)
   - `src/app/api/billing/checkout/route.ts` (use `getAdminDb()`)
   - `src/app/api/billing/connect/route.ts` (use `getAdminDb()`)
   - `src/app/api/billing/webhook/route.ts` (use `getAdminDb()`)
   - `src/app/pricing/page.tsx` (change `window.location.href = data.url` to `window.location.assign(data.url)`)
   - `src/app/scan/page.tsx` (hoist `startCamera` and `stopCamera` declarations or move them)
   - `src/app/previews/[slug]/page.tsx` (remove calculation state, render derived values, initialize states inline)
   - `src/app/claim/[slug]/page.tsx` (initialize states inline and remove useEffect pre-filler)
   - `src/app/join/page.tsx` (initialize states inline and clean useEffect)
   - `src/app/dash/page.tsx` (guard useEffect setters, fix const reassignment let promotions)
   - Escape HTML quotes/apostrophes in `src/app/about/page.tsx`, `src/app/features/page.tsx`, `src/app/interlock/page.tsx`, `src/app/u/[id]/page.tsx`, `src/app/u/pjlosey/page.tsx` using `&apos;` or `&quot;` (or curly braces).
   - Re-type explicit `any` usage in `src/app/admin/logs/page.tsx`, catch blocks, and Firestore queries to make `@typescript-eslint/no-explicit-any` pass.
4. Execute `npm run lint`, `npx tsc --noEmit`, and `npm run build` using the `run_command` tool in `c:\_Projects\Gridpass-v4` to verify all checks pass successfully.
5. Create a `changes.md` in your working directory documenting the files modified and fixes applied.
6. Create a `handoff.md` following Handoff Protocol, proving passing build and test results.
7. Send a message to the orchestrator summarizing your work and linking to your `changes.md` and `handoff.md`.
