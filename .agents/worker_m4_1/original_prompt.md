## 2026-05-25T12:40:10Z

You are a teamwork_preview_worker. Your working directory is c:\_Projects\Gridpass-v4\.agents\worker_m4_1.
Your task is to implement the following requirements for Milestone M4 (Public Vehicle Dynamic Lifecycle page):

### M4. Public Vehicle Dynamic Timeline & Provenance Badge
1. **Upgrade the Dynamic Vehicle Profile Page `src/app/v/[id]/page.tsx`**:
   - Query and load the following events from Firestore:
     - Core vehicle data: `doc(db, 'vehicles', vehicleId)`. Read fields like `year`, `make`, `model`, `tag_id`, `owner_id`, `isPremium`, `partner_dealer` (or `dealer`), and `created_at`.
     - Service & Maintenance records: `collection(db, 'service_logs')` where `'vehicle_id' == vehicleId`.
     - Location Check-ins (tag scans): `collection(db, 'tag_scans')` where `'tagId' == vehicle.tag_id`.
     - Ownership handovers: `collection(db, 'ownership_transfers')` where `'vehicle_id' == vehicleId`.
   - Group all these events into a single, unified vertical timeline, ordered chronologically descending by date/timestamp:
     - **Vehicle Registered (Born)**: Timeline entry matching the vehicle's creation date (`created_at` or fallback, e.g. '2026-01-15' if null). Visual icon: `CarFront` or `PlusCircle`, theme: light blue. Label: "Digital Identity Registered & QR Passport Activated".
     - **Service & Maintenance**: Entries from `service_logs` that are standard maintenance (no modification keywords). Visual icon: `Wrench` or `ShieldCheck`, theme: green/emerald. Label: "Verified Maintenance Log: [Title]".
     - **Performance Modifications**: Entries from `service_logs` where title or notes contains modification-related keywords (e.g., "mod", "install", "upgrade", "tuning", "performance", "system", etc.). Visual icon: `Crown` or `TrendingUp`, theme: purple. Label: "Performance Modification: [Title]".
     - **Location Check-ins (Tag Scans)**: Entries from `tag_scans` collection matching the vehicle tag ID. Visual icon: `Navigation` or `Camera`, theme: orange/blue. Label: "Physical Tag Scan Check-in". Display the scan location or coordinates if present, along with a truncated browser user-agent.
     - **Ownership Transfers**: Entries from `ownership_transfers` collection matching the vehicle ID. Visual icon: `ArrowLeftRight` or `UserCheck`, theme: amber. Label: "Ownership Transfer Completed". Display the masked emails of the transition (e.g. `p***r@gridpass.app` -> `d***r@gridpass.app`).
   
2. **Add Dealership Provenance B2B Badge**:
   - Check if the vehicle's `partner_dealer` or `dealer` field is `'Monmouth Motors'` or a partner dealer.
   - If yes, display a prominent, glassmorphic badge at the top/hero of the page: "Sold & Serviced by Monmouth Motors • Partner Dealer" using Tailwind glass-card styles and elegant `.btn-glow` or `.mesh-glow` highlights.

3. **Playwright E2E Mock Data Support**:
   - Update the client-side Playwright E2E mock block (under `__PLAYWRIGHT_MOCK__` on line 75 of `src/app/v/[id]/page.tsx`) to contain `partner_dealer: 'Monmouth Motors'` and have representative mock timeline entries for creation, service log, modification log, location check-in scan, and ownership transfer.
   - This ensures the Playwright E2E tests can load `/v/[id]` and successfully verify the presence of the vertical timeline, different event types, and the B2B dealership badge.

4. **Verify Your Changes**:
   - Run compilation: `npm run build`.
   - Run E2E test suite: `node run-tests.js`.
   - Make sure all builds compile 100% cleanly and E2E Playwright tests pass perfectly.

Document all changes made, the files edited, and compilation/test results in changes.md and handoff.md inside your working directory.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Send a message back to parent conversation 5a45960c-cd69-44ee-ba0f-b5ffce02593b when complete.

## 2026-05-25T12:42:17Z

**Context**: URGENT: Simplify B2B Pricing (Completely Remove B2B $49/mo Tier, Dynamic Sliding Scale Only)
**Content**: The user has introduced another critical pricing simplification that we must implement immediately:

### **Completely Remove Flat B2B Pricing Tier ($49/mo)**
Business users (dealerships, repair shops, fleets) should be placed directly on our unified per-tag sliding scale with:
1. **Zero Flat B2B Base Fees**: Anyone can sign up for free.
2. **Dynamic Volume Billing**: Dealerships and fleets pay dynamically based on the number of active tags they own (automatically falling into the $0.99/mo tier for 10+ active tags).
3. **Free Track Gate Portals**: Racetracks and event organizers pay no monthly subscription fee; they only pay the pay-as-you-go commission cut on spectator ticket splits processed via Stripe Connect.

### **Required Actions**:
1. **Update `src/app/pricing/page.tsx`**:
   - Completely remove the flat $49.00/mo B2B Business subscription tier card.
   - Replace it with a beautiful, glassmorphic **"Dealership & Track Gate Portal"** card marked as **Free / Pay-As-You-Go** (Zero base fees).
   - Update its description and features to highlight:
     - **100% Free Signup** (Zero flat B2B base fees).
     - **Dynamic Volume Billing** (Dealerships/fleets tier automatically based on active tags they own: Single $1.99, Enthusiast 3+ $1.49, Commercial/Dealership 10+ $0.99/mo per active tag).
     - **Free Track Gate Portals** (racetracks and event organizers pay zero monthly subscription fee; they only pay the standard pay-as-you-go commission split).
     - Standard capabilities: printed banners, mobile safety waivers, Stripe splits.
   - The button for the Free B2B Card should link B2B users to establish their accounts for free (e.g. routing to `/join` or `/dash` or `/register` where they can sign up/login for free).
   - Ensure the FAQ answers or other copy on the page reflect the removal of the flat B2B fee.
   
2. **Update `src/app/api/billing/checkout/route.ts`**:
   - Verify there are no legacy $49/mo B2B plan validations.
   - Ensure that dynamic server-side pricing validation for active identity subscriptions continues to work flawlessly.

3. **Verify and Run Builds/Tests**:
   - Complete this pricing simplification in parallel with your Milestone M4 task (dynamic `/v/[id]` vertical lifecycle timeline and B2B partner provenance badges).
   - Verify that production build compiles flawlessly (`npm run build`) and all Playwright tests pass perfectly (`node run-tests.js`).

**Action**: Please integrate these updated pricing requirements into your current active execution. Reply to confirm you have received and integrated these instructions!
