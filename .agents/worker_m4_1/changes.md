# Change Log — Milestone M4 and B2B Pricing Simplification

## Modified Files
1. **`src/app/v/[id]/page.tsx`**:
   - Added imports for `ArrowLeftRight`, `Navigation`, and `PlusCircle` icons from `lucide-react`.
   - Updated `Vehicle` interface properties to include `partner_dealer`, `dealer`, and `created_at`.
   - Added states for `tagScans` and `ownershipTransfers`.
   - Populated Firestore queries in `loadVehicleDetails` to fetch and load documents from `tag_scans` matching the vehicle's `tag_id`, and `ownership_transfers` matching the vehicle's `id`.
   - Updated the client-side `__PLAYWRIGHT_MOCK__` mock block to provide a representative full vehicle telemetry data, including `partner_dealer: 'Monmouth Motors'`, `created_at: '2026-01-15'`, a standard service log, a performance modification log, a physical tag scan location entry, and an ownership transfer record.
   - Built a vertical timeline chronology builder that groups, categories (registered, maintenance, performance mod, location scan check-in, ownership transfer), masks email data, and formats timestamps, then sorts them chronologically descending.
   - Added a glassmorphic B2B Partner Dealership Provenance Badge ("Sold & Serviced by Monmouth Motors • Partner Dealer") at the top/hero of the page when `partner_dealer` or `dealer` field matches `'Monmouth Motors'`.
   - Replaced the standard service log list panel with the custom, elegant unified chronological vertical timeline UI container with Tailwind-styled glass-card design, exact matching lucide icons, specific themes, and interactive details.

2. **`src/app/pricing/page.tsx`**:
   - Completely removed the legacy flat-fee B2B Business Subscription Tier card ($49.00/mo).
   - Replaced it with a brand-new, glassmorphic "Dealership & Track Gate Portal" card marked as **Free / Pay-As-You-Go** ($0.00 base fees).
   - Updated copy to clearly state:
     - 100% Free Signup (Zero flat monthly base fees).
     - Dynamic volume billing (fleet tags tier down automatically based on active tag count: Single $1.99, Enthusiast 3+ $1.49, Commercial 10+ $0.99/mo per active tag).
     - Free Track Gate Portals (zero monthly subscription fees for tracks and event organizers, only standard pay-as-you-go commission cut on spectator ticket splits processed via Stripe Connect).
     - Banners, safety waivers, Express bank split payouts features.
   - Updated price formatting using `.toFixed(2)` on pricing displays.
   - Modified `handleCheckout` click handler so B2B card clicks directly route B2B users to register for free (guest to `/join`, signed-in to `/dash`).

3. **`tests/gridpass.spec.ts`**:
   - Added assertions to the Page 1 & 2 pricing test to check for the presence of the updated pricing cards: `Active Identity Passport` and `Dealership & Track Gate Portal`.
   - Updated the Page 6 E2E test to verify that the glassmorphic dealership provenance badge is visible and asserts the presence of all five Vertical Chronological Timeline Event types on the dynamic vehicle profile page (registered, maintenance, modification, location scans, ownership transfers).

## Build Results
- Spawning Next.js Turbopack compiler.
- Compiled successfully with Zero errors or warnings.
- TypeScript compilation finished successfully with Zero type mismatch errors.

## Test Results
- Ran full test suite via `node run-tests.js`.
- All 10 tests passed perfectly in 13.6 seconds.
