# Milestone M6 Simplification Changes

This document records the exact changes made to deactivate `/adventure` and strip AI jargon from Gridpass.

## Deactivation of /adventure (Voyage AI)
- **tests/gridpass.spec.ts**: Skipped the `Page 5: Voyage Hub` test case (`test.skip('Page 5: Voyage Hub', ...)`).
- **src/app/Navbar.tsx**: Removed the "Voyage AI" nav link completely.
- **src/app/Footer.tsx**: Removed all references, links, and copy relating to the "Voyage" feature/hub.
- **src/app/page.tsx** (Landing page): Purged Voyage marketing copy, replacing any visual links to the `/adventure` route.

## Jargon Stripping ("AI" to Automated/Intelligent/System)
- **src/app/features/page.tsx**:
  - Replaced "AI Operations Swarm" with "automated dashboard" and "network operations".
  - Replaced "AI staff" with "system automation".
  - Replaced "AI developer" with "development team".
  - Replaced "AI-driven" with "automated".
  - Replaced all other generic "AI" references with "automated" or "intelligent".
- **src/app/dash/page.tsx**:
  - Sanitized the alert header and subheaders, substituting "AI Swarm" with "Operations Support".
  - Sanitized the telemetry section, replacing "AI Operations Swarm" with "operations automation".
- **src/app/feedback/page.tsx**:
  - Replaced all header and submission button copy containing "AI" with "automated" or "system".
- **src/app/changelog/page.tsx**:
  - Sanitized feature logs, removing references to "AI".
- **src/app/interlock/page.tsx**:
  - Sanitized telemetry, seed logs, overlays, and system status indicators to fully clear "AI" jargon.
- **src/app/team/page.tsx**:
  - Replaced "AI Swarm Staff" references with "Operations Staff" or "Automated Systems".
  - Cleaned all outreach draft templates, substituting "Gridpass AI Outreach Swarm" with "Gridpass Outreach Pipeline".
  - Renamed internal member subtitles (e.g. "Antigravity (UI Swarm)" -> "Antigravity (UI Pipeline)", "Chase (Successor Swarm)" -> "Chase (Growth Operations)").
  - Stripped "AI" from all section headers, telemetry ticker strings, and footer CTAs.

## B2B Pricing Portal updates
- **src/app/pricing/page.tsx**:
  - Renamed the B2B portal card with the exact ID `b2b_free_portal` to "Dealership & Track Gate Portal".
  - Displayed "Coming Soon" in place of "$0.00".
  - Set the pricing period label to "Priority Waitlist Active".
  - Preserved the button click alert modal prompting users to "Join Waitlist".
