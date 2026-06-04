# BRIEFING — 2026-05-25T12:35:00Z

## Mission
Investigate and analyze c:\_Projects\Gridpass-v4 codebase regarding Firestore schemas, dashboard modal operations, Stripe checkout, and B2B dealership resolution.

## 🔒 My Identity
- Archetype: Teamwork Explorer
- Roles: Read-only investigator, analyzer
- Working directory: c:\_Projects\Gridpass-v4\.agents\teamwork_preview_explorer_m1_2
- Original parent: 5a45960c-cd69-44ee-ba0f-b5ffce02593b
- Milestone: Teamwork Preview Explorer Milestone 1.2

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- CODE_ONLY network mode: No external network calls
- Write files only to our folder `c:\_Projects\Gridpass-v4\.agents\teamwork_preview_explorer_m1_2`

## Current Parent
- Conversation ID: 5a45960c-cd69-44ee-ba0f-b5ffce02593b
- Updated: 2026-05-25T12:35:00Z

## Investigation State
- **Explored paths**:
  - `src/lib/firebase/config.ts`
  - `src/lib/firebase/admin.ts`
  - `src/app/dash/page.tsx`
  - `src/app/api/billing/checkout/route.ts`
  - `src/app/api/billing/webhook/route.ts`
  - `src/app/previews/[slug]/page.tsx`
  - `src/app/claim/[slug]/page.tsx`
  - `src/app/join/page.tsx`
  - `src/components/qr/ClaimTagForm.tsx`
- **Key findings**:
  - Firestore schemas are defined inline via TS interfaces rather than external schemas.
  - Profile and vehicle registration handle user data and tag linking with validation and clean transform layers.
  - Stripe integrations utilize integer cent conversion, metadata transmission, and advanced Stripe Connect payout split mechanics to route base tickets to tracks while keeping a platform processing fee.
  - B2B partner dealerships are mapped using local `LEADS_DATABASE` parameters based on slug segments and conditionally formatted by category.
- **Unexplored areas**: None. All requested investigation items have been thoroughly analyzed.

## Key Decisions Made
- Concluded codebase analysis with highly detailed explanations of schemas, operations, Stripe flows, and B2B partner pages.

## Artifact Index
- c:\_Projects\Gridpass-v4\.agents\teamwork_preview_explorer_m1_2\original_prompt.md — Copy of original instructions
- c:\_Projects\Gridpass-v4\.agents\teamwork_preview_explorer_m1_2\progress.md — Progress log / heartbeat
- c:\_Projects\Gridpass-v4\.agents\teamwork_preview_explorer_m1_2\analysis.md — Comprehensive findings and analysis report
- c:\_Projects\Gridpass-v4\.agents\teamwork_preview_explorer_m1_2\handoff.md — Final structured handoff report in 5-component layout

