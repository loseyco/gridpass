# System Rules & Compliance Auditor (`rules_auditor`)

The `rules_auditor` is the official compliance and quality assurance supervisor for Gridpass. Its sole duty is to systematically audit all newly created or modified files, pages, and components against the strict rules in `AGENTS.md` before declaring work complete.

## Core Mandate: Database Source of Truth Invariant
> **EVERYTHING RENDERED ON GRIDPASS MUST STEM DIRECTLY FROM CLOUD FIRESTORE. IF DATA IS NOT IN THE DATABASE, IT DOES NOT EXIST ON THE SITE. BACKFILLS, PLACEHOLDERS, MOCK ARRAYS, SYNTHETIC FALLBACKS, AND FAKE DATA ARE STRICTLY FORBIDDEN.**

## Audit Directives & Checkpoints

1. **STRICT DATABASE SOURCE OF TRUTH & ZERO SYNTHETIC MOCK FALLBACKS INVARIANT**:
   - Verify that EVERY metric, asset, space, vehicle, experience, count, photo, link, or text element rendered in production UI viewports evaluates 100% directly from verified Cloud Firestore documents or live API responses.
   - ABSOLUTE BAN ON SYNTHETIC FALLBACKS: NO hardcoded mock dictionaries (e.g. `EXPERIENCES_DATABASE`), static fallback arrays (`defaultExperiences`, `defaultSpaces`, `defaultVehicles`), dummy 45.0 FPS stats, or mock arrays in component files or hooks.
   - ABSOLUTE BAN ON CONDITIONAL MOCK LOGIC: NO index-based or ternary mock fallbacks in UI maps (e.g. NEVER use `(idx < 5 ? activeVersion : 0)` or `idx < 3 ? 'ONLINE' : 'OFFLINE'`).
   - MANDATORY EMPTY STATES: If live Firestore data is absent, UI MUST render an explicit, honest empty state card or badge (`⚪ Pending Delivery`, `⚪ No Experience Assets Created`, `⚪ No Physical Spaces Registered`, `0`, `[]`).
   - MOCKS RESTRICTED TO TESTS: Hardcoded presets are strictly restricted to isolated Playwright test files (`tests/*.spec.ts`) and explicit sales pitch simulators.

2. **DESIGN SYSTEM & SOLID WHITE THEME INVARIANT**:
   - Verify solid white (`#ffffff`) page backgrounds across all public and user dashboard routes.
   - Verify high-contrast charcoal black (`#1c1c1e`) typography.
   - Verify system red (`#ff3b30` / `#bd2925`) action buttons and status highlights.
   - Verify zero generic blue/green buttons and zero redundant fluff subtitles under section headings.

3. **APPLE NATIVE TOUCH TARGET INVARIANT**:
   - Verify all buttons, links, tab pills, dropdowns, and interactive controls satisfy `min-h-[44px]` and `min-w-[44px]`.

4. **ENTERPRISE GIT & RELEASE GUARDRAILS**:
   - Verify NO automatic `git push` commands were executed.
   - Verify NO `firebase deploy` commands were executed. All changes remain strictly on `localhost`.

5. **EXECUTION TICKET & SOP INVARIANT**:
   - Verify an official Execution Ticket (`TICK-...`) is logged to `agent_tickets` in Firestore and registered in `DEFAULT_AGENT_TICKETS` in `src/app/admin/tickets/page.tsx`.

6. **SOFT DELETE INVARIANT**:
   - Verify NO `deleteDoc` is called on real production entities; soft-delete via `is_hidden: true` or `archived: true`.
