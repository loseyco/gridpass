# Handoff Report — Dynamic Metadata Mapping & Physical Scan Conversion Strategy

**Core Findings**: Gridpass.app resolves physical QR tag scans (`id=xxxx`) by querying vehicles, businesses, and users in Firestore, redirecting to their respective profiles. By introducing an event-driven gate registration and waiver verification schema alongside location-aware wallet passes, we can reduce check-in times to under 5 seconds, gamify the paddock with digital garages and leaderboards, and capture leads seamlessly in offline and low-friction physical environments.

---

## 1. Observation

A direct read-only investigation of the `gridpass.app` codebase and business strategy documents revealed the following technical and operational states:

1. **URL Parameter Resolution**:
   In `c:\_Projects\Gridpass-v4\src\app\join\page.tsx`, the route `/join` extracts the dynamic parameter `id` (line 15: `const tagId = searchParams.get('id') || '';`) and resolves it via three sequential Firestore collection queries:
   * **Vehicles**: (lines 91-92) `const vQuery = query(collection(db, 'vehicles'), where('tag_id', '==', tagId));` -> Redirects to `/v/${matchedVehicle.id}` (line 97)
   * **Businesses**: (lines 103-104) `const bQuery = query(collection(db, 'businesses'), where('tag_id', '==', tagId));` -> Redirects to `/b/${matchedBusiness.id}` (line 109)
   * **User Profiles**: (lines 115-116) `const uQuery = query(collection(db, 'users'), where('tag_id', '==', tagId));` -> Redirects to `/u/${matchedUser.id}` (line 121)

2. **Unclaimed Tag Claiming Flow**:
   If the tag is unclaimed, `c:\_Projects\Gridpass-v4\src\app\join\page.tsx` renders a low-friction prompt (lines 223-288) containing a CTA button `/login?redirect=/join?id=${tagId}` (line 260) which leads the visitor to register/log in. Once authenticated, the page renders the `<ClaimTagForm tagId={tagId} />` component (line 291).
   In `c:\_Projects\Gridpass-v4\src\components\qr\ClaimTagForm.tsx`, the authenticated user can claim the tag by:
   * **Linking Driver Identity**: Invokes `handleClaim('users', user.uid, 'User Profile')` (line 186).
   * **Linking Existing Vehicle**: Iterates over user-owned vehicles and maps `tag_id` using `handleClaim('vehicles', v.id, ...)` (line 214).
   * **Registering a New Vehicle Inline**: Renders a fast registration card (lines 230-277) that runs `handleRegisterAndClaimVehicle` (line 103) inserting the new vehicle to Firestore and updating its `tag_id` field.
   * **Linking Existing Business**: Updates `tag_id` on businesses (line 309).

3. **Current Document Schemas**:
   As observed in `c:\_Projects\Gridpass-v4\src\app\v\[id]\page.tsx` (lines 53-90, 134-170, 249-272), the active collections use these fields:
   * **`vehicles`**: `year` (number), `make` (string), `model` (string), `owner_id` (string), `owner_email` (string), `tag_id` (string), `isPremium` (boolean), `created_at` (timestamp)
   * **`users`**: `displayName` (string), `tag_id` (string)
   * **`service_logs`**: `vehicle_id` (string), `title` (string), `notes` (string), `date` (string, e.g. `YYYY-MM-DD`), `recorded_by` (string), `created_at` (timestamp)

4. **Strategic B2B2C Matrix & Pain Points**:
   In `c:\_Projects\Gridpass-v4\business_launch\outreach_playbook.md` (lines 17-56), the core growth engine is defined as a **Trojan Horse Strategy** aiming to win consumers via high-value physical gate bottlenecks:
   * **Tracks**: Saturday morning 7:00 AM gate bottlenecks backed up onto public roads due to paper waivers and clipboards. Target Metric: Reduce ingress speed from 180s to <5s.
   * **Offroad Parks**: Checking in UTV/ATV haulers with zero cell service. Target Metric: Offline permit and multi-passenger pass scanning.
   * **Car Clubs**: Volunteer admin burnout from spreadsheet roster drift and dues management. Target Metric: Fast-pass entry and interactive directories.

---

## 2. Logic Chain

1. **The Resolver Limitation**: The current `/join` route resolves dynamic IDs only to static assets (vehicles, businesses, users). It does not natively support an *active check-in event state*, *waiver sign-off verification*, or *temporary guest registrations* directly in a single flow at physical gates.
2. **Dynamic URL Architecture Needs**: To satisfy the gate-check physical scan experience, a scanned URL parameter `id=xxxx` must represent two primary scenarios:
   * **Scenario A (Windshield QR Tag Scan)**: Gate attendant scans a vehicle's windshield sticker (`id=GP-VEH-1234`). The back-end resolver must quickly pull the vehicle specs, check if the owner has registered for today's active event at this venue, verify if their liability waiver is signed, and check their tech inspection status.
   * **Scenario B (Gate Banner QR Tag Scan)**: Towing driver arrives at the gate and scans the venue check-in banner (`id=GP-GATE-SEARSPOINT`). The resolver must dynamically identify the venue, detect the day's active events, check if the driver is registered, and guide them through immediate, single-tap waiver signing and vehicle registration.
3. **The Offline & Weak Signal Constraint**: In remote racing circuits (e.g. Thunderhill) or adventure parks (e.g. OHV trails), cellular networks are slow or overloaded. Therefore:
   * Verification must not rely on intensive client-side database queries.
   * Passes must be cached natively in Apple Wallet or Google Wallet as `.pkpass` files containing location-based triggers so they display automatically on lock screens.
   * Attendants must be able to verify check-in using offline cryptographic scanning keys mapped within the QR code.
4. **Persuasion & Conversion Mechanics**: Car enthusiasts and drivers are highly driven by **prestige**, **speed**, and **community**. 
   * Transitioning the check-in from a legal friction point (paper waiver clipboard) to an interactive digital gateway (Digital Garages and Live Leaderboards) creates immediate desire to claim and build out a vehicle profile.
   * A localized, hyper-targeted value-prop that instantly answers *"Why do I need to register right now?"* overcomes gate resistance.

---

## 3. Caveats

1. **Integration with Payment Gateways**: This analysis outlines registration, waiver compliance, and check-in metadata, but does not detail exact Stripe webhook payloads for ticketing transactions, which are managed asynchronously.
2. **Offline Local Storage Sync**: The offline scan strategy assumes the gate attendant's scanning device utilizes a Service Worker caching the event registration index or an asymmetric cryptographic public key to decrypt signature check-ins locally. If the gate scanner has zero connectivity for hours, eventual consistency sync workflows must be implemented.
3. **Apple/Google Wallet API Keys**: Generation of `.pkpass` files requires an Apple Developer Account with a Pass Type ID certificate and a Google Wallet API service account. This analysis models the metadata payload but assumes these certificates are configured.

---

## 4. Conclusion

### 4.1 Dynamic URL Parameters & Back-End Metadata Mapping

To support the physical gate check-in and landing experience, we define the comprehensive **Firestore Document Schemas** and **JSON Resolver Payload** mapping.

#### Firestore Database Schema

```
                     ┌────────────────────────────────┐
                     │              tags              │
                     │  (Registry: maps ID to Asset)   │
                     └───────────────┬────────────────┘
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      ▼                              ▼                              ▼
┌───────────┐                  ┌───────────┐                  ┌───────────┐
│ vehicles  │                  │   users   │                  │venues/biz │
└─────┬─────┘                  └─────┬─────┘                  └─────┬─────┘
      │                              │                              │
      │                              ▼                              │
      │                  ┌──────────────────────┐                   │
      │                  │  waiver_signatures   │                   │
      │                  └───────────▲──────────┘                   │
      │                              │ (Signs)                      │
      ▼                              │                              ▼
┌────────────────────────────────────┴───────────────────────────┬─────────┐
│                          registrations                         │ events  │
│          (Intersection: binds driver + car to an event)        └─────────┘
└────────────────────────────────────────────────────────────────┘
```

##### 1. `tags` (Dynamic Tag Registry)
*Each physical QR code is registered in a central directory, mapping to its target type and destination.*
```typescript
interface TagRegistryDocument {
  id: string;              // Document ID (e.g. "GP-4091-AF8")
  type: 'vehicle' | 'user' | 'venue_gate' | 'event' | 'unclaimed';
  target_id: string | null;// Foreign key matching the target document ID
  owner_id: string | null; // UID of user owner (null if unclaimed)
  created_at: Timestamp;
  updated_at: Timestamp;
  status: 'active' | 'revoked' | 'pending';
}
```

##### 2. `venues` / `businesses` (Tracks, Adventure Parks, Clubs)
```typescript
interface VenueDocument {
  id: string;              // e.g. "sonoma-raceway"
  tag_id: string;          // e.g. "GP-GATE-SONOMA"
  name: string;            // e.g. "Sonoma Raceway"
  type: 'track' | 'offroad_park' | 'club';
  logo_url: string;
  brand_colors: {
    primary: string;       // hex: e.g. "#E31837"
    secondary: string;     // hex: e.g. "#002D62"
    accent: string;        // hex: e.g. "#FFC72C"
  };
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    geo: { latitude: number; longitude: number };
  };
  owner_id: string;
  status: 'active' | 'inactive';
}
```

##### 3. `events` (Track Days, Chapter Meets, Offroad Runs)
```typescript
interface EventDocument {
  id: string;              // e.g. "sonoma-hpde-may2026"
  venue_id: string;        // FK to venues
  name: string;            // e.g. "Sonoma HPDE Track Day & Time Attack"
  date: string;            // YYYY-MM-DD
  start_time: string;      // e.g. "07:00"
  end_time: string;        // e.g. "17:00"
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  waiver_template_id: string; // FK to waiver_templates
  schedule: Array<{
    time: string;          // e.g. "07:15 - 08:00"
    title: string;         // e.g. "Mandatory Driver's Meeting"
    description: string;
    group: string;         // e.g. "All Drivers", "Novice", "Advanced"
  }>;
}
```

##### 4. `registrations` & `check_ins` (The Gate Scan Ingress State)
*The critical database intersection table representing a driver and vehicle's active status at an event.*
```typescript
interface RegistrationDocument {
  id: string;              // Document ID
  event_id: string;        // FK to events
  user_id: string;         // FK to users
  vehicle_id: string;      // FK to vehicles
  run_group: 'novice' | 'intermediate' | 'advanced' | 'instructor' | 'spectator';
  payment_status: 'paid' | 'pending' | 'exempt';
  waiver_signed: boolean;
  waiver_signature_id: string | null; // FK to waiver_signatures
  tech_inspected: boolean;
  tech_inspector: string | null;
  check_in_status: 'pre_registered' | 'checked_in' | 'no_show';
  checked_in_at: Timestamp | null;
  wallet_pass_status: 'not_generated' | 'added' | 'removed';
  cryptographic_token: string; // Dynamic offline validation hash
}
```

##### 5. `waiver_templates` & `waiver_signatures` (Liability Compliance)
```typescript
interface WaiverTemplateDocument {
  id: string;
  venue_id: string;        // FK to venues
  title: string;           // e.g. "Sonoma General Liability Release & Waiver"
  content_html: string;     // Full waiver legal copy
  published_at: Timestamp;
}

interface WaiverSignatureDocument {
  id: string;
  waiver_id: string;       // FK to waiver_templates
  user_id: string;         // FK to users
  event_id: string;        // FK to events
  signed_name: string;     // Input must match user profile exactly
  signed_at: Timestamp;
  selfie_verification_url: string; // URL of facial verification photo
  signature_ip: string;
  signature_hash: string;  // SHA-256 integrity signature (user_id + signed_at + salt)
  status: 'verified' | 'pending_audit' | 'rejected';
}
```

#### JSON Payload Schema: `api/resolve-tag?id=xxxx`
When the Next.js landing experience resolves a QR tag scan, the server returns the following structured JSON configuration.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ResolveTagPayload",
  "type": "object",
  "properties": {
    "tagId": { "type": "string" },
    "tagType": { "type": "string", "enum": ["vehicle", "user", "venue_gate", "event", "unclaimed"] },
    "status": { "type": "string", "enum": ["active", "unclaimed", "suspended"] },
    "venueContext": {
      "type": "object",
      "properties": {
        "venueId": { "type": "string" },
        "name": { "type": "string" },
        "logoUrl": { "type": "string" },
        "primaryColor": { "type": "string" },
        "accentColor": { "type": "string" }
      },
      "required": ["venueId", "name", "logoUrl"]
    },
    "eventContext": {
      "type": "object",
      "properties": {
        "eventId": { "type": "string" },
        "name": { "type": "string" },
        "date": { "type": "string", "format": "date" },
        "schedule": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "time": { "type": "string" },
              "title": { "type": "string" },
              "group": { "type": "string" }
            },
            "required": ["time", "title"]
          }
        }
      },
      "required": ["eventId", "name", "date"]
    },
    "vehicleContext": {
      "type": "object",
      "properties": {
        "vehicleId": { "type": "string" },
        "year": { "type": "integer" },
        "make": { "type": "string" },
        "model": { "type": "string" },
        "ownerName": { "type": "string" },
        "vinVerified": { "type": "boolean" },
        "isPremium": { "type": "boolean" }
      },
      "required": ["vehicleId", "year", "make", "model", "ownerName"]
    },
    "registrationContext": {
      "type": "object",
      "properties": {
        "isRegistered": { "type": "boolean" },
        "runGroup": { "type": "string" },
        "waiverStatus": { "type": "string", "enum": ["SIGNED", "MISSING", "PENDING_VERIFICATION"] },
        "techStatus": { "type": "string", "enum": ["PASSED", "PENDING", "FAILED"] },
        "checkInStatus": { "type": "string", "enum": ["pre_registered", "checked_in"] }
      },
      "required": ["isRegistered", "waiverStatus", "techStatus", "checkInStatus"]
    }
  },
  "required": ["tagId", "tagType", "status"]
}
```

---

### 4.2 Persuasive Conversion Optimization Strategies

To ensure maximal conversion under intense physical gate constraints, we outline four strategic, physical-first implementation layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│               HIGH-CONVERSION GATE INGRESS SYSTEM                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. SCAN AND BIND         2. DYNAMIC BRANDING      3. SOCIAL PAD-GARAGE │
│  Scan gate QR or tag      Blends Gridpass &       Spectators vote on   │
│  instant Wallet Pass      Sonoma logo; green      build specs; makes   │
│  geofenced to lockscreen  denotes approved.       check-in fun!        │
│    [█ QR] ──> [.pkpass]      [Sonoma | GP]           [VOTE ★ 911 GT3]  │
└────────────────────────────────────────────────────────────────────────┘
```

#### 1. Instant Mobile Wallet Integration (Apple Wallet / Google Wallet Passes)
*   **Friction Reduction**: Eliminate typical user creation screens (username, password selection, email double-opt-in). A guest scans the gate QR, signs the waiver with a simple finger signature, and gets a "Download to Wallet" button.
*   **Contextual Lock-Screen Wakeup**: The `.pkpass` is packed with the venue's GPS coordinate bounding box. When the driver rolls within 500 meters of the gate, the pass automatically wakes up on their phone's lock screen. 
*   **Dynamic Scanning Barcodes**: Uses the Apple PKBarcode format rendering a high-contrast QR code tied to the `cryptographic_token` in the user's `registration` document, allowing instant verification.

#### 2. Dynamic co-branded Gate Ticket Generator
*   **Frictionless Trust**: When scanned at the gate, the landing page is not a blank Gridpass page. It dynamically pulls the venue's assets (`brand_colors`, `logo_url`, `name`) so the header reads `"Gridpass Fast-Pass | Sonoma Raceway"` in Sonoma's custom red/navy palette.
*   **Visual Color-Coding**: Once check-in criteria are met, the browser viewport turns solid emerald green with huge text reading **APPROVED - ACCESS GRANTED**. This allows gate crew to visually clear the vehicle from 10 feet away without leaning in or typing.

#### 3. The "Virtual Paddock Garage" Directory
*   **Viral Pride Loops**: Every participant checked in via Gridpass is added to that day's live virtual paddock list (e.g. `gridpass.app/events/sonoma-may2026/paddock`). 
*   **Windshield Scan-to-View**: When visitors walk the paddock, they scan a vehicle's windshield tag to open a rich mobile page showcasing build modifications, horsepower stats, dyno sheets, and mechanics logbooks. Drivers want to sign up immediately so they aren't the only ones with a "Blank Windshield Profile" in the paddock.

#### 4. Gamified Paddock Leaderboards
*   **Prestige Drivers**: Host daily event-specific leaderboards accessible directly from the gate-scan landing experience.
    *   *HPDE*: Peak horsepower leaderboard (pulled from verified dyno specs in the digital garage).
    *   *Car Club Meets*: "Cleanest Build of the Day" peer voting. Spectators scan the physical windshield tag and click a single star to vote, creating massive scan velocity.
    *   *Offroad*: Trail check-in badge tallies.

---

### 4.3 Segment-Specific Value-Prop Hooks

These specific hooks address the immediate emotional and operational pain of the driver at the physical gateway:

#### Category A: Racing Drivers (HPDE, Time Attack, Track Days)
*Focus: Speed of entry, technical precision, vehicle status logs.*
*   **Gate Hook**: 
    > *"Stop idling. Scan the Gate QR now, sign your liability waiver in 3 taps, and get your digital Fast-Pass straight to your Apple Wallet. Clear the gate in 3 seconds flat and never miss your run-group driver's meeting."*
*   **Windshield Hook**: 
    > *"Ditch the paper folder. Link this permanent windshield tag to digitize your car's safety inspection sheets, dyno certifications, and track maintenance logs. Give tech inspectors instant, verified access with a single scan."*
*   **Paddock Pride Hook**: 
    > *"Show the paddock what's under the hood. Let competitors scan your windshield tag to view your verified build specs, suspension settings, and track tire setup on our live paddock directory."*

#### Category B: Trail Riders (OHV Parks, UTV/ATV Enthusiasts)
*Focus: Offline safety compliance, multi-vehicle towing, weatherproof durability.*
*   **Gate Hook**: 
    > *"Towing a trailer? Bind all of your UTVs, dirt bikes, and passengers to a single digital pass. Scan once at the gate to verify all waivers in under 5 seconds, even with absolute zero cell service."*
*   **Offline/Ranger Hook**: 
    > *"No reception? No problem. Gridpass caches your active trail permit directly to your Apple or Google Wallet. Rangers can verify your signed waiver and UTV permit on the deep trails with a quick offline scan."*
*   **Safety Hook**: 
    > *"Mud-proof your emergency profile. If you run off-trail or break down, a ranger scanning your weatherproof windshield tag instantly pulls up your emergency medical contacts, vehicle model, and recovery specs."*

#### Category C: Club Enthusiasts (Cars & Coffee, Regional Car Meets)
*Focus: Community prestige, build showcase, volunteer roster automation.*
*   **Gate Hook**: 
    > *"Get on the live paddock roster. Scan this gate QR, verify your club dues, and claim your parking slot. See a live map and directory of every club build parked around you today."*
*   **Build Showcase Hook**: 
    > *"Throw away the card poster. Let spectators scan your windshield tag to view your high-res build history, exhaust sound clips, and dyno sheets. Share your entire garage in a single tap."*
*   **Gamified Hook**: 
    > *"Vote for the cleanest build. Scan the windshield decals of your favorite PCA/BMWCCA chapter cars in the parking field to vote on the live meet leaderboard, and see where your own car ranks."*

---

## 5. Verification Method

To independently verify the structural accuracy and integration capability of this dynamic metadata mapping and UX strategy, perform the following validation steps:

1. **Verify Database Field Matching**:
   Inspect the Firestore vehicle query syntax inside `c:\_Projects\Gridpass-v4\src\app\join\page.tsx` (lines 90-100) and compare it against the vehicle data rendering loop inside `c:\_Projects\Gridpass-v4\src\app\v\[id]\page.tsx` (lines 53-90). Confirm that the defined metadata payload fields perfectly map to standard Next.js route inputs without schema mismatches.
2. **Execute Personalization Verification Script**:
   Run the project validation script to ensure leads data structure is compliant:
   ```powershell
   python c:\_Projects\Gridpass-v4\business_launch\validate_personalization.py
   ```
   *Expected Result*: System outputs that personalization variables, database entries, and leads databases are structurally validated.
3. **Invalidation Conditions**:
   The proposed schemas and strategies become invalid if:
   * Firebase Firestore is replaced by a strict relational database (like Supabase PostgreSQL) without writing mapping adapters.
   * Apple modifies the `.pkpass` standard to prohibit local location geofencing parameters without an active background app companion (which is not currently the case).
