# plan.md — Project Plan for gridpass.app Swarm

## Objectives
Coordinate the development and QA swarm to ensure flawless Next.js compilation, comprehensive E2E browser testing/layout verification, seamless production deployment, and high-converting marketing social posts.

## Architecture & Boundaries
- **Frontend Framework**: Next.js (version 16.2.6) with React 19 and Tailwind CSS 4.
- **Backend/Deployment**: Firebase Hosting & Google Cloud Run.
- **Local Testing Environment**: `npm run dev` running on localhost.

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Next.js compilation & hardening | Fix TypeScript, lint issues, component hydration issues, and DB connection conflicts | None | DONE |
| M2 | E2E Browser Testing & Layout Verification | Verify landing, pricing, webcam scanner, dashboard (Canvas sign gen), voyage hub, and public telemetry profiles using headless browser testing. Capture screenshots. | M1 | DONE |
| M3 | Automated Firebase Cloud Run Deployment | Compile static assets, sync security rules, deploy live with `firebase deploy`, verify Cloud Run SSR routing parity | M1, M2 | DONE |
| M4 | Social Seeding Playbook | Draft copy-paste-ready community posts optimized for Reddit and vBulletin to drive viral signups, saving to `social_seeding_playbook.md` | None | DONE |

## Verification Criteria
### Milestone 1: Compilation & Hardening
- Run `npm run build` locally.
- 0 TypeScript errors.
- 0 ESLint errors.
- Completed in under 10 seconds.

### Milestone 2: E2E Browser Testing & Layout Verification
- Run headless browser tests.
- Verify pages: `/`, `/pricing`, `/scan`, `/dash`, `/adventure`, `/u/[id]`.
- Verify dark glassmorphic layouts.
- Capture screenshots for desktop & mobile.
- Verify high-DPI canvas sign exports (ensure no cross-origin / tainted canvas issues).

### Milestone 3: Firebase SSR Live Deployment
- Run `firebase deploy`.
- Verify routes `/adventure` and `/scan` render correctly on production domain (`https://gridpass.web.app`).
- Live parity check.

### Milestone 4: Social Seeding Playbook
- Create `social_seeding_playbook.md` with structured marketing copy for `r/projectcar`, `r/Jeep`, `r/dualsport`, etc.
- Include custom copy pitching the poster generator and pet passport.
