<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Gridpass Coding Agent Guidelines

Before making any codebase edits or running tests, you MUST read and strictly adhere to:
1. The active execution phase checklist in [task.md](file:///c:/_Projects/Gridpass-v4/task.md) (in the brain directory).
2. The system roadmap and phases defined in [gridpass_phased_roadmap.md](file:///c:/_Projects/Gridpass-v4/gridpass_phased_roadmap.md).
3. The platform sitemap, routing architecture, and workflows defined in [ultimate_gridpass_business_plan.md](file:///c:/_Projects/Gridpass-v4/ultimate_gridpass_business_plan.md) and [gridpass_marketing_and_workflows.md](file:///c:/_Projects/Gridpass-v4/gridpass_marketing_and_workflows.md).

Always mark checklist progress in `task.md` using `[x]` for completed, `[/]` for in-progress, and ensure all changes are fully verified using E2E tests before completing your goal.

## 4. Local Testing & Verification Guardrails
*   **Local Dev Server**: All changes must be run and verified locally on the development server (`npm run dev`) first.
*   **Localhost First & User Verification**: Build, iterate, and verify all feature additions and UI changes strictly on `localhost` (`http://localhost:3000`). NEVER push changes to production or live hosting until the user has personally tested, verified, and approved the local implementation.
*   **STRICT ZERO FAKE DATA RULE**: NEVER pre-populate production views, admin tables, or state hooks with hardcoded fake seed data or dummy rows (e.g. fake staff arrays, mock clients, static dummy entries). All arrays must initialize clean (`[]`). If a Firestore collection is empty, render a clean empty state (`"No records found. Click '+ Add ...' to create your first entry"`) rather than auto-injecting seed objects. Hardcoded presets are strictly restricted to isolated Playwright test mocks and the sales pitch simulator.
*   **E2E Validation**: Run the Playwright test suite (`node run-tests.js`) to guarantee that all tests pass 100% before declaring a phase complete. Use the `/browser` command or browser tool options to manually verify complex UI flows.
*   **GitHub Deployments**: Always track progress by committing code changes locally and pushing updates to GitHub.
*   **Production Deployment Freeze**: **NEVER run live production builds or deployments (e.g., `firebase deploy`) without the USER's explicit written approval.**

## 5. Team Subagent Profiles
*   **`marketer`**: Manages landing page copy, SEO meta configurations, sitemap optimization, and GTM strategy files.
*   **`developer`**: Responsible for building dynamic NextJS page routes, Tailwind layouts, and Firestore rules.
*   **`tester`**: Writes automated Playwright tests, configures mock profiles (Marcus, Sarah, Dave, John, Steve, Mike), and audits local dev server builds.
*   **`user_panel`**: Represents core personas (Marcus, Sarah, Ranger Dave, Steve, Billy, Rich, and Chloe) in user-testing feedback walkthroughs.

## 6. Mandatory Pre-Push & Phase-Completion Auditing Process
Before completing any roadmap phase or pushing code updates live, the following agent workflow MUST be executed:
1. **Copy & Copywriting Audit**: Invoke the `ted` and `marketer` agents to ensure value propositions are layperson-friendly and free of jargon.
2. **Persona User Panel Interview**: Invoke the `user_panel` agent representing all key personas (Enthusiasts, Spectators, Track Owners, B2B Dealerships, Tech-illiterate Billy, Cynical CFO Rich, and Growth Marketer Chloe). Ensure they review the feature and report:
   - If they like the feature.
   - If they understand how it works in their role.
   - If they experience any friction or confusion.
   - (For Rich): How does this make us money? If it doesn't, why do we have it?
   - (For Chloe): Is the friction minimal enough to maximize growth, even if it's free? Can we monetize them later when they arrive?
3. **Resolve & Consolidate**: Adjust design/copy to solve persona issues, code it up using `developer`, and verify locally.
4. **E2E Test Execution**: Invoke `tester` to run the full Playwright E2E suite (`node run-tests.js`) and check for 100% pass rate.
## 7. Design System Guidelines (Red, White & Black Accent Theme)
*   **Solid White Backgrounds**: Page backgrounds must always default to solid white (`#ffffff`).
*   **Charcoal Text & Bold Typography**: Use high-contrast charcoal black (`#1c1c1e`) text. Headings and labels should be uppercase, bold, and use clean, tight spacing to match the physical business invitation cards.
*   **Crimson/Red Accents**: Primary action buttons, active tab indicators, and status highlights must use bright system red (`#ff3b30` / `#bd2925`).
*   **Simple Vertical Rows**: Avoid complex glowing card grids. Lay lists out in clean, vertically scrollable compact rows (`bg-neutral-50` with thin `border-neutral-200` borders) that scale gracefully without clipping on small viewports.
*   **Mobile-First Desktop-Optimized**: All UI views must prioritize mobile touch simplicity first. When viewed on desktop, wrap main content in clean, centered mobile-app card containers (e.g. `max-w-md` or `max-w-lg` centered with clean borders or subtle grey desktop framing) or responsive multi-column layouts so desktop users get a polished, app-like desk experience without breaking mobile simplicity.
*   **"Join" Terminology**: Drop the word "Register" in user-facing texts, forms, buttons, and landing paths. Always use the term **"Join"** (or "Join Gridpass") to match physical printed materials.
*   **Online Identity Resume Profiles**: Public driver profiles (`/u/[id]`) must act strictly as the driver's online card/resume. Hide vehicles, businesses, and event sections on public views unless executing in Playwright E2E mock suites.

## 8. Firestore Security Rules Synchronization Invariant
Whenever introducing a new Cloud Firestore collection (e.g. `products`, `proposals`, `crm_deals`, `client_feedback`), you MUST immediately append the corresponding collection permission match rule in [firestore.rules](file:///c:/_Projects/Gridpass-v4/firestore.rules). Never leave new collections out of `firestore.rules` to prevent `FirebaseError: Missing or insufficient permissions` console warnings.
