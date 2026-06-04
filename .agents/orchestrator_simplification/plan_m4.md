# Milestone M4 Design & Implementation Plan: Public Vehicle Dynamic Lifecycle Page `/v/[id]`

## Objective
Upgrade the public vehicle profile `/v/[id]` to render an elegant, verified, and complete vertical timeline of the vehicle's lifecycle (creation, service entries, modifications, location check-ins, and ownership handovers) and display B2B dealership provenance badges (e.g. "Sold & Serviced by Monmouth Motors • Partner Dealer").

## Data Sources & Firestore Queries
1. **Vehicle Core Data**:
   - Query: `doc(db, 'vehicles', vehicleId)`
   - Fields needed: `year`, `make`, `model`, `tag_id`, `owner_id`, `isPremium`, `partner_dealer`, `created_at` (or `createdAt`).
2. **Service & Maintenance Logs**:
   - Query: `collection(db, 'service_logs')` where `'vehicle_id' == vehicleId`
   - Fields: `title`, `notes`, `date`, `recorded_by`.
3. **Location Check-ins (Tag Scans)**:
   - Query: `collection(db, 'tag_scans')` where `'tagId' == vehicle.tag_id`
   - Fields: `scannedAt` (or `timestamp`), `location` (latitude/longitude coordinates, or custom check-in text if present, or fallback text e.g., "Verified Tag Scan"), `userAgent` (or source info).
4. **Ownership Handovers**:
   - Query: `collection(db, 'ownership_transfers')` where `'vehicle_id' == vehicleId` (or vehicle doc's ID)
   - Fields: `previous_owner_email`, `new_owner_email`, `timestamp`, `date`.

## UI Design (Glassmorphic Timeline)
We will construct a unified, chronological timeline ordered by date/timestamp descending. Each event will have a specific visual icon and label:
- **Vehicle Registered (Born)**:
  - Trigger: Vehicle document creation date (`created_at` or a default fallback if missing, e.g., 2026-01-15).
  - UI: `CarFront` or `PlusCircle` icon. Light blue glow. "Digital Identity Registered & Permanent QR Passport Activated."
- **Service & Maintenance**:
  - Trigger: Service logs whose title/notes do NOT indicate modifications.
  - UI: `Wrench` or `ShieldCheck` icon. Green/Emerald theme. "Verified Maintenance Log: [Title]".
- **Modifications**:
  - Trigger: Service logs where title/notes contains "mod", "install", "upgrade", "tuning", "performance", etc.
  - UI: `TrendingUp` or `Crown` icon. Purple theme. "Performance Modification: [Title]".
- **Location Check-ins (Scans)**:
  - Trigger: Records from `tag_scans` collection matching the vehicle tag ID.
  - UI: `Camera` or `Navigation` icon. Orange/Blue theme. "Physical Tag Scan Check-in". Display coordinates or scan details if available, along with a truncated browser user-agent.
- **Ownership Handovers**:
  - Trigger: Records from `ownership_transfers` collection matching the vehicle.
  - UI: `ArrowRightLeft` or `UserCheck` icon. Amber theme. "Ownership Transfer Completed: [Previous Owner] → [New Owner]" (mask emails e.g. `d***r@gridpass.app` to protect privacy).

## Dealership Provenance B2B Badges
- If the vehicle document has a `partner_dealer` field containing `'Monmouth Motors'` or a similar B2B partner, or if the history is tied to Monmouth Motors (e.g. initial sale or service recorded by Monmouth Motors):
  - Render a prominent glassmorphic badge at the top/hero of the page:
    - Text: `Sold & Serviced by Monmouth Motors • Partner Dealer`
    - Icon: `ShieldCheck` or `Crown` in emerald/amber with a `.btn-glow` or `.mesh-glow` hover effect.
- In mock mode (Playwright E2E), the mock vehicle object MUST include `partner_dealer: 'Monmouth Motors'` and have mock timeline entries representing creation, service, modification, scan, and transfer events so E2E tests can assert their visual rendering.

## E2E Mock Coverage Requirements
To support Playwright E2E headless validation, the Playwright mock block (line 75 of `src/app/v/[id]/page.tsx`) must be updated with:
1. `partner_dealer: 'Monmouth Motors'` on the vehicle object.
2. A complete set of service logs, modifications, location scans, and ownership transfer objects mapped to the new combined timeline state.
