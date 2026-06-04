# Codebase Exploration Analysis — GridPass Protocol

This document provides a comprehensive, read-only analysis of the **Gridpass-v4** codebase, focusing on the following four core areas as requested:
1. **Pricing Page & Stripe Billing API Routes**
2. **Digital Garage Operations & Vehicle/Owner Integration**
3. **Dynamic Public Vehicle Profile Route & Redirection Architecture**
4. **B2B Partnership Dealerships & Venue Onboarding Resolution**

---

## 1. Pricing Page & Stripe Billing API Routes

### 1.1 Pricing Tier Configurations (`src/app/pricing/page.tsx`)
The frontend defines a `PricingTier` interface and registers four tiers to guide user checkout. They are structured as follows:

| Plan / Tier ID | Display Name | Billed Rate | Mode | Target Audience / Features |
| :--- | :--- | :--- | :--- | :--- |
| **`passport_monthly`** | GridPass Passport Monthly | $4.99 / mo | Subscription | Paddock drivers wanting premium styling, unlimited check-ins, auto-filled waivers, and verified owner status. |
| **`passport`** | GridPass Passport Lifetime | $29.99 (Once) | One-time | Lifetime pass, includes a physical track-day decal, premium custom theme, unlimited digital check-ins, auto-filled waivers. |
| **`operator`** | Autopilot Venue / Club | $49.00 / mo | Subscription | Racetracks and event clubs needing ticket split layouts, pre-built websites, visitor gate check-ins, custom DNS. |
| **`auto_shop`** | Autopilot Service Shop | $49.00 / mo | Subscription | Professional local auto mechanics requiring calendar deposit schedules, pre-authorized road test waivers, mechanic companion app. |

#### Frontend Checkout Trigger
When a user clicks "Choose Plan", it invokes `handleCheckout(tier)`:
- Sets `isPending(true)` via a React `useTransition`.
- POSTs to `/api/billing/checkout` with a payload of:
  ```json
  {
    "itemId": "passport_monthly" | "passport" | "operator" | "auto_shop",
    "itemName": "GridPass Passport Monthly Plan" | "..." ,
    "itemType": "subscription" | "premium_upgrade",
    "price": 4.99 | 29.99 | 49.00,
    "userId": "user.uid",
    "userEmail": "user.email",
    "redirectUrl": "/dash"
  }
  ```
- Receives a Stripe session URL `data.url` and redirects via `router.push(data.url)`.

### 1.2 Checkout Session Initialization (`src/app/api/billing/checkout/route.ts`)
The API route creates Stripe sessions using integer math in **cents** to guarantee precision.
- **Conversion to Cents:** The price is parsed and multiplied by 100: `const priceInCents = Math.round(price * 100);`.
- **Payment Types:**
  - **`itemType === 'premium_upgrade'`**: Creates a one-time checkout session with `mode: 'payment'`.
  - **`itemType === 'subscription'`**: Sets `mode: 'subscription'` and provisions recurring billing items.
  - **`itemType === 'day_pass'` (Split payouts)**: Retrieves the B2B venue metadata (`gridpass_parks`) via Firestore to check for a linked `stripeAccountId`. If a partner track is claimed and has Connect credentials:
    - Sells a day-pass ticket.
    - Calculates the platform fee surcharge.
    - Sets `payment_intent_data.application_fee_amount` to retain the GridPass platform cut.
    - Sets `transfer_data.destination` to the B2B partner's `stripeAccountId`, routing the lion's share directly to the venue.

### 1.3 Billing Webhook Fulfillment (`src/app/api/billing/webhook/route.ts`)
Fulfillment is handled by listening for Stripe `checkout.session.completed` webhook events:
- **Vehicle Upgrades (`premium_upgrade`)**: Sets `{ isPremium: true }` on the target vehicle document under the `vehicles` collection.
- **Day Pass Check-ins (`day_pass`)**: Creates a check-in log inside `gridpass_checkins`, tracking check-in time, attendee details, and payment state.
- **SaaS Subscriptions (`subscription`)**: Configures recurring subscription states and updates the corresponding user document in the `users` collection.

---

## 2. The Digital Garage (`src/app/dash/page.tsx`)

### 2.1 Owner State & Real-Time Reactivity
The Digital Garage dashboard uses Firebase Firestore reactive listeners to provide real-time updates without polling:
- **User Profile:** Subscribes to the logged-in user profile document via `onSnapshot(doc(db, 'users', user.uid), ...)`.
- **Auto-Seeding Profile:** If a driver logs in but doesn't have an existing profile document in the `users` collection, the system auto-seeds a default profile record, automatically assigning them a unique `tag_id` using a random alphanumeric generator conforming to:
  `GP-[1000-9999]-[3-character random string]` (e.g. `GP-5249-X8Z`).
- **Vehicle Inventory:** Subscribes to the vehicles collection where the vehicle is owned by the user:
  ```typescript
  const q = query(collection(db, 'vehicles'), where('owner_id', '==', user.uid));
  const unsubscribe = onSnapshot(q, (snapshot) => { ... });
  ```

### 2.2 Vehicle Registry & Specifications Schema
Users can click "Register New Vehicle" to open a modal that captures specifications and stores them in the `vehicles` Firestore collection. The documents include:
- `year` (number)
- `make` (string)
- `model` (string)
- `engine` (string, defaults to "Stock Specs")
- `power` (string, defaults to "Factory HP")
- `transmission` (string, e.g. "6-Speed Manual")
- `mods` (array of strings, input is captured as a comma-separated string on the client and split)
- `tag_id` (string, unique windshield tag, generated during creation unless editing)
- `owner_id` (string, equal to the creator's `user.uid`)
- `owner_email` (string, equal to `user.email`)
- `isPremium` (boolean, defaults to `false` until Stripe checkout webhook upgrades it)
- `views` (number, initialized to `0`)
- `created_at` / `updated_at` (Firestore server timestamps)

### 2.3 Printable Trackside Signboard Generator
A centerpiece feature of the Digital Garage is the **Print Sign Customizer** modal. It allows drivers to configure and print physical signboards to display in their car windows at track events:
- **HTML5 Canvas:** Generates high-DPI (2x scale) print-ready signboard assets.
- **Customizations:** Users can select backgrounds (e.g. *Dark Carbon*, *High Contrast Trackside*, *Gold Foil Premium*, *Vintage Garage*).
- **QR Decal Routing:** Draws a customized QR code directly on the Canvas. The QR code encodes a dynamic URL leading to:
  `${siteUrl}/qr/${tagId}`
- **Exporting:** Provides a high-resolution download option, converting the canvas drawing to a printable PNG via `canvas.toDataURL('image/png')`.

---

## 3. Public Vehicle Profile Route & Redirection Architecture

### 3.1 Redirection Pipeline (`src/app/qr/[id]/page.tsx`)
When a spectator scans a physical windshield or roll-bar decal, the QR code routes them to `/qr/[id]`, which is a client-side redirection layout:
- Extracts the dynamic route parameter `id` (which represents the permanent `tag_id`).
- Immediately triggers a replacement redirect:
  `router.replace('/join?id=' + encodeURIComponent(id))`
- Displays a clean visual mesh spinner while the client transitions to the Join Portal.

### 3.2 Dynamic Profile Page (`src/app/v/[id]/page.tsx`)
The public vehicle showcase renders vehicle statistics, owner info, and maintenance logs:
- **Route Segment:** `src/app/v/[id]/page.tsx`, where `id` represents the Firestore vehicle document ID.
- **Firestore Resolvers:**
  - Fetches the `vehicles` document matching the ID.
  - Fetches owner user metadata from the `users` collection using the retrieved `owner_id`.
  - Queries all verified maintenance reports under the `service_logs` collection where `vehicle_id == vehicleId`.
- **Maintenance Ledger (`service_logs` schema):**
  - Displays a clean, chronologically sorted list (newest first) of verified maintenance events.
  - Documents contain: `vehicle_id`, `title`, `notes`, `date`, `recorded_by`, and `created_at`.
  - Displays a green "Immutable Registry" emblem with a checked-shield icon next to each log.
- **Service Recording:**
  - If the logged-in user is the vehicle owner (`user.uid === vehicle.owner_id`), a "Log Service" button is unlocked.
  - Displays a modal to record oil changes, brake pads, exhausts, or custom ECU setups, writing directly to `service_logs` with a server timestamp.
- **Premium Monetization Funnel:**
  - If the vehicle's `isPremium` field is false and the viewer is the owner, a call-out banner appears:
    *"Unlock Premium GridPass Garage — Pin your vehicle to track groups, attach verified dealer documents, and enjoy permanent custom theme styling for a single $29.99 lifetime pass."*
  - Triggers a Stripe checkout session with a redirect link back to `/v/[id]` upon successful webhook completion.

---

## 4. B2B Partnership Dealerships & Venue Onboarding Resolution

### 4.1 "Monmouth Motors" & Dealership Identifiers
A broad search of the codebase indicates that `"Monmouth Motors"` is **not** a hardcoded entity in the active codebase. 
- **Origin:** It appears in instructions and prompts as a prime example of B2B dealership integration, specifically for **dealership-provenance identifiers** (e.g. `"Sold & Serviced by Monmouth Motors • Partner Dealer"`) in verified maintenance rows.
- **Architecture Strategy:** The database and UI are designed to display verified B2B dealer provenance markers in the maintenance log rows when the `recorded_by` or custom B2B fields point to a registered partner merchant.

### 4.2 Local Leads Crawler Database (`LEADS_DATABASE`)
Both B2B preview pages (`src/app/previews/[slug]/page.tsx`) and onboarding pages (`src/app/claim/[slug]/page.tsx`) house a local catalog of crawler-indexed regional B2B venues and service centers. These leads represent regional auto shops, racetracks, offroad lands, and clubs, structured as:
```typescript
const LEADS_DATABASE = [
  { slug: 'sonoma-raceway', name: 'Sonoma Raceway', category: 'track', location: 'Sonoma, CA', ... },
  { slug: 'weathertech-raceway-laguna-seca', name: 'WeatherTech Raceway Laguna Seca', category: 'track', ... },
  { slug: 'mercer-county-motorsports', name: 'Mercer County Motorsports Park', category: 'dirt_track', ... },
  { slug: 'viola-auto-care', name: 'Viola Auto Care & Muffler', category: 'auto_shop', ... },
  { slug: 'blackwood-mx-park', name: 'Blackwood Motocross Park', category: 'mx', ... },
  { slug: 'mercer-county-offroad', name: 'Mercer County Offroad Lands', category: 'open_land', ... }
];
```

### 4.3 Onboarding Claims Loop (`src/app/claim/[slug]/page.tsx`)
Gridpass provides a self-serve onboarding portal where partner auto shops or tracks can claim their pre-built web previews:
1. **Verify Authority:** Pre-populated from lead crawler indexes, the user enters a manager email to assert ownership.
2. **Stripe Connect KYC:** Integrates with Stripe Connect Express to gather Know Your Customer (KYC) details and route billing payout splits directly to their corporate bank accounts. Writes claim configurations to Firestore under `voyage_claims`.
3. **Active Secured Gateway:** Once claimed (`onboarded === true` in Firestore), the preview page dynamically swaps from an automated preview teaser to a **Secured Live Gateway**.

### 4.4 Cashless Spectator Gate Check-ins & Split Mathematics
When a B2B partner gateway is secured, the ticket sales widget automatically resolves:
- **Platform Fee Surcharges:** The system calculates total pricing using absolute integer math to prevent floating point issues:
  - Base Ticket Price: $P$
  - Platform Fee: $F_{platform} = 1.50 + 0.01 \times P$
  - Total Charged to Spectator: $C_{total} = \frac{P + 1.80}{1 - 0.039}$
  - Stripe Fee: $F_{stripe} = 0.029 \times C_{total} + 0.30$
  - Net Passive Profit (GridPass Cut): $PlatformProfit = C_{total} - P - F_{stripe}$
- **Splits:** Spectator passes are routed live through the Stripe Connected express merchant account, splitting payouts automatically and shielding the primary platform ledger from chargebacks or dispute holds.
