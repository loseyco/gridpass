# Project: Gridpass P2P Passport & Simplification Launch

## Architecture
- Framework: Next.js (App Router)
- Database: Cloud Firestore
- Styling: Tailwind CSS (glassmorphic layouts)
- Payment: Stripe checkout integration

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1| Exploration & Design | Perform codebase analysis, map out files and dependencies, write implementation design | None | DONE |
| M2| Pricing & Stripe | Overhaul `/pricing` to sliding fleet discount tier: single ($1.99/mo), enthusiast 3+ ($1.49/mo), commercial 10+ ($0.99/mo). Update `/api/billing/checkout` | M1 | DONE (472f1fb5-8ea3-4cab-9ecc-59b8bf21d0b9) |
| M3| P2P Ownership Transfer | Integrate user's manually implemented modal/state/handlers in `/dash`, query Firestore `users`, verify database & transfer logs | M1 | DONE (472f1fb5-8ea3-4cab-9ecc-59b8bf21d0b9) |
| M4| Timeline & B2B Zero Fee | Upgrade `/v/[id]` dynamic profile and vertical timeline; simplify `/pricing` and Stripe routes to completely remove the B2B $49/mo fee and launch free portals | M2, M3 | DONE (9e224e4f-7a04-4bcf-9402-a781b51d5210) |
| M4C| Copywriting Overhaul | Integrate dynamic re-routable QR code & scan-to-activate bulk distribution marketing copy into `/pricing`, landing, and FAQs | M4 | DONE (51e86d5e-5912-4757-a96c-593198cad6ed) |
| M4C2| Low-Friction Price Copy | Integrate relatable direct price comparisons (cup of coffee, single gallon of gas) into `/pricing` and landing page | M4C | DONE (f9372888-b5ec-47a2-a4b5-a112310401e9) |
| M4B| Brand Alignment | Review all pages and globally integrate `@/components/Logo` component and carbon/crimson theme styling (#bd2925) | M4C2 | DONE (15dda26c-ea21-4f05-937d-fbfb8fd4d2ac) |
| M5| Testing & Integrity Verification | Perform E2E testing (Tiers 1-4) and White-box/Adversarial Hardening (Tier 5), run Forensic Auditor | M4B | DONE (ca39965e-7c83-4d4e-9dff-7c4bdaef50c4) |
| M6| Live Simplification | Remove /adventure link, strip AI jargon, and make Dealership Portal Coming Soon | M5 | DONE (5f0f062f-e284-41a2-8ac5-32c51b48b101 / 881b2271-8193-421c-8df5-8d12a7953dc2) |

## Interface Contracts
### Sliding Fleet Pricing
- Single Identity: $1.99/mo
- Enthusiast Fleet (3+): $1.49/mo per identity
- Commercial Fleet (10+): $0.99/mo per identity
- Zero Flat B2B Fees: Free Track & Dealership Portals (pay-as-you-go spectating splits).
- Parameters are passed cleanly into Stripe subscription checkout sessions.

### P2P Transfer API / Logic
- Expected payload / Firestore updates: Updates `owner_id` and `owner_email` on the vehicle document.
- Records a handover transaction record in `'ownership_transfers'` Firestore collection.

### Dynamic Lifecycle Route `/v/[id]`
- Page route: `/v/[id]` where `[id]` matches a vehicle document ID in Firestore.
- Dynamic data: Fetches vehicle from Firestore, reads its service log timeline, check-ins, ownership history, B2B dealer links.

## Code Layout
- `src/app/pricing/page.tsx` - Pricing Page UI with sliding scale (no flat B2B fee)
- `src/app/api/billing/checkout` - Stripe API Integration
- `src/app/dash/page.tsx` - Digital Garage / Dashboard (integrating user manual modal code)
- `src/app/v/[id]/page.tsx` - Public Vehicle Profile Page (dynamic vertical timeline)
