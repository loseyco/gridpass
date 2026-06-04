# Project: Gridpass QR Passport Ecosystem

Gridpass is a physical-to-digital automotive connection platform. By mapping permanent, re-routable QR codes to vehicles, drivers, and businesses, it builds an interactive registry of vehicle specs, maintenance history, and geographic adventures.

---

## 1. System Architecture
*   **Framework**: Next.js (App Router)
*   **Database**: Cloud Firestore
*   **Styling**: Tailwind CSS & Vanilla CSS (glowing glassmorphic layout theme)
*   **APIs**: Custom NextJS API Route Handlers for payments and check-ins.
*   **Specs**: Cheap VIN Decoder API (for specs auto-population).

---

## 2. Phased Development Roadmap

| Phase | Milestone Name | Key Features | Target Status |
|---|---|---|---|
| **Phase 1** | Core Foundation & Support Portal | Routing sitemaps, `#soon` gates, dynamic SEO metatags, Early Supporter checkouts and gold-ring styles. | **IN_PROGRESS** (Active) |
| **Phase 2** | Onboarding & Avery QR Customizer | `/join?id=xxx` claim resolver, dashboard QR customizer canvas, printable Avery and SVG vector download tools. | PLANNED |
| **Phase 3** | Context-Aware Profiles & Telemetry | Spectator/Owner/Shop dashboard views, scan telemetry map timeline, service log lists. | PLANNED |
| **Phase 4** | Racetrack Operations & Marshalls | `/grid/[id]` Marshall check-in console, `/track/[id]` portals, waiver gate checks, MyLaps transponder webhook listener. | PLANNED |
| **Phase 5** | Sighting Feeds & Leaderboards | Geolocated `/spotted` sightings feed cards, `/leaderboard` competitive ranks. | PLANNED |

---

## 3. Directory & Route Contracts

*   `src/app/page.tsx` - Home Page & Supporter Portal
*   `src/app/dash/page.tsx` - User Digital Garage Dashboard
*   `src/app/join/page.tsx` - Tag claim resolver UI
*   `src/app/v/[id]/page.tsx` - Dynamic Vehicle Passport profile
*   `src/app/u/[id]/page.tsx` - Driver profile passport card
*   `src/app/b/[id]/page.tsx` - B2B Business Profile (Sponsored Inventory, Check-ins)
*   `src/app/grid/[id]/page.tsx` - Grid Marshall scanner console
*   `src/app/track/[id]/page.tsx` - Racetrack/Venue details & waiver check-in
*   `src/app/spotted/page.tsx` - Geolocation sightings map feed
*   `src/app/leaderboard/page.tsx` - Ecosystem ranking leaderboards
