# Codebase Analysis — Gridpass-v4 Investigation

This document presents a detailed, read-only analysis of the Gridpass-v4 codebase structure, addressing the four primary areas of inquiry: Firestore schema conventions, dashboard modal operations, Stripe checkout integrations, and B2B partner dealership details resolution.

---

## 1. Firestore Schema Conventions

In the Gridpass-v4 architecture, Firestore collections are modeled using standard TypeScript interfaces for clear client-server type safety. There is no dedicated ORM; instead, the codebase relies on clean React-state mapping and Firestore Admin SDK documents.

### A. The `users` Collection
The `users` collection holds member driver records.
- **Collection Name:** `'users'`
- **Key Document ID:** User UID (`user.uid` from Firebase Authentication)
- **TypeScript Interface Reference (`src/app/dash/page.tsx`):**
  ```typescript
  interface DashboardProfile {
    name?: string;
    phone?: string;
    location?: string;
    bio?: string;
    avatar?: string;
    email?: string;
    tag_id?: string;       // GridPass Holographic ID mapped to driver keyway
    displayName?: string;
    avatarIcon?: string;
    views?: number;
  }
  ```
- **Seeding & Synchronization:**
  - In `src/app/dash/page.tsx` (Lines 197–225), when a user signs in, the system checks if a record exists at `users/${user.uid}`. If missing, it **auto-seeds** a default record:
    ```json
    {
      "displayName": "DisplayName or EmailPrefix",
      "email": "user@email.com",
      "tag_id": "GP-XXXX-XXX (randomly generated)",
      "phone": "",
      "bio": "Active GridPass pilot member.",
      "location": "United States",
      "avatarIcon": "user",
      "views": 0,
      "created_at": "serverTimestamp()"
    }
    ```

### B. The `vehicles` Collection
The `vehicles` collection holds registered digital garage passports for cars/track rigs.
- **Collection Name:** `'vehicles'`
- **Key Document ID:** Auto-generated Firestore Document ID
- **TypeScript Interface Reference (`src/app/dash/page.tsx` & `src/components/qr/ClaimTagForm.tsx`):**
  ```typescript
  interface DashboardVehicle {
    id?: string;
    year?: number | string;
    make?: string;
    model?: string;
    engine?: string;
    power?: string;
    transmission?: string;
    mods?: string[];           // Stored as an array of strings in Firestore
    tag_id?: string;           // Physical QR windshield tag ID linked to vehicle
    owner_id?: string;         // Mapped to user.uid
    owner_email?: string | null;
    updated_at?: unknown;      // Firestore ServerTimestamp
    created_at?: unknown;      // Firestore ServerTimestamp
    isPremium?: boolean;       // Set to true after a Premium Upgrade checkout
    views?: number;
  }
  ```
- **Ownership/Permission Linkage:**
  - Vehicles are queried in real-time filter matched on `owner_id == user.uid`.
  - In checkout or scans, vehicles are looked up using `where('tag_id', '==', tagId)`.

---

## 2. Dashboard Modal Operations in `src/app/dash/page.tsx`

The dashboard page uses React state variables to control the visibility of modal dialog overlays and handle form editing, rendering under standard conditional expressions (e.g., `{showProfileModal && <Modal />}`).

### A. Active & Dead States
- **Profile Modal States:**
  - `showProfileModal` (boolean): Controls visibility of the profile editor.
  - Form Fields: `profileName` (string), `profilePhone` (string), `profileLocation` (string), `profileBio` (string), `profileAvatar` (string/icon selection).
  - Loading: `updatingProfile` (boolean).
- **Vehicle Modal States:**
  - `showVehicleModal` (boolean): Controls vehicle register/edit popup.
  - Selected Target: `selectedVehicle` (`DashboardVehicle | null`). If `null`, form is in "Registering New" mode; if set, form is in "Edit existing Specs" mode.
  - Form Fields: `vYear` (string), `vMake` (string), `vModel` (string), `vEngine` (string), `vPower` (string), `vTransmission` (string), `vModsString` (string, binds to a comma-separated text input), `vTagId` (string).
  - Loading: `savingVehicle` (boolean).
- **Print Sign Modal States:**
  - `showPrintModal` (boolean): Controls print sign customizer window.
  - Custom Fields: `signTitle`, `signTheme` (`'cyan' | 'red' | 'emerald'`), `signSubtext`, `signFormat` (`'windshield' | 'poster'`).
- **Dead/Unused State (Observation):**
  - `showTransferModal`, `transferVehicle`, `transferEmail`, `transferError`, `transferSuccess`, and `transferring` are declared on lines 147–152 but are not referenced elsewhere. This represents an unused feature for vehicle ownership transfer.

### B. Form Structure & Input Validation
- Forms are structured as semantic HTML `<form>` segments with onSubmit binding handlers.
- **Validations Applied:**
  - **HTML5 constraints:** `required` inputs, `type="number"` with limits (`min="1900"` and `max="2035"` for vehicle year) or `type="tel"` / `type="email"`.
  - **Dynamic uppercase sanitization:** The tag ID input in the vehicle form automatically converts values to uppercase during keystrokes (`onChange={(e) => setVTagId(e.target.value.toUpperCase())}`).
  - **Array transformations:** In the vehicle form, `mods` are typed as a single text block by the user (comma-separated). On submit, they are parsed via `.split(',').map(m => m.trim()).filter(Boolean)` into an array of clean strings.
  - **Error handling:** Catch blocks alert errors using browser native `alert(...)` dialogs, and logging events are generated via `logEvent` back to Firestore telemetry logs (`system_logs`).

---

## 3. Stripe Checkout API Integrations

Pricing calculations, checkout session preparation, and Connect payments split routing are implemented in `src/app/api/billing/checkout/route.ts` and fulfilled in the webhook handler `src/app/api/billing/webhook/route.ts`.

### A. Stripe Session Configurations
The endpoint expects a POST request with JSON arguments:
```json
{
  "itemId": "vehicleId or parkId",
  "itemName": "Display Name",
  "itemType": "premium_upgrade | day_pass | event_registration",
  "price": 29.99,
  "gridPassFee": 1.50,
  "userId": "user.uid",
  "userEmail": "user@email.com",
  "redirectUrl": "/dash"
}
```
- **Pricing Calculation:** Stripe requires pricing in integers (cents). Surcharges are calculated as:
  ```typescript
  const unitAmount = Math.round((price + (itemType === 'day_pass' ? gridPassFee : 0)) * 100);
  ```
  *Note:* The custom `gridPassFee` ($1.50) is dynamically added to the customer-facing checkout amount only for `'day_pass'` item types.
- **Standard Checkout Metadata:** Sessions store transaction parameters in metadata (`userId`, `userEmail`, `itemId`, `itemType`, `pricePaid`, `feePaid`) to guarantee that webhooks can cleanly associate success logs back to individual Firestore records.

### B. Stripe Connect Split Payments
For the B2B ticketing flow (`itemType === 'day_pass'`), Gridpass supports dynamic payment splitting with partner tracks/venues using Stripe Connect:
1. The route grabs the `itemId` (representing the park ID).
2. It fetches the park details from the database: `adminDb.collection('gridpass_parks').doc(itemId)`.
3. If the park document contains a valid `stripeAccountId`, it triggers Connect routing:
   ```typescript
   const applicationFeeAmount = Math.round(gridPassFee * 100); // Retained by Gridpass
   
   sessionConfig.payment_intent_data = {
     application_fee_amount: applicationFeeAmount,
     transfer_data: {
       destination: stripeAccountId, // Connected account of the track owner
     },
   };
   ```
4. The customer pays the total. Stripe keeps its merchant fees, holds the `$1.50` platform fee for Gridpass, and automatically transfers the base ticket price directly to the connected track account.

---

## 4. B2B Partner Dealership & Venue Details Resolution

B2B partner details (tracks, clubs, offroad parks, and auto shops) are resolved locally on the public pages `src/app/previews/[slug]/page.tsx` and `src/app/claim/[slug]/page.tsx` via a crawler-populated ledger.

### A. The Static Leads Ledger
Both B2B pages house a duplicate local database array called `LEADS_DATABASE` containing pre-built records:
```typescript
const LEADS_DATABASE = [
  { slug: 'sonoma-raceway', name: 'Sonoma Raceway', category: 'track', location: 'Sonoma, CA', ... },
  { slug: 'viola-auto-care', name: 'Viola Auto Care & Muffler', category: 'auto_shop', location: 'Viola, IL', ... },
  { slug: 'blackwood-mx-park', name: 'Blackwood Motocross Park', category: 'mx', location: 'Viola, IL', ... },
  // ...
];
```

### B. Slug Resolution Logic
1. **Dynamic Segment Parsing:**
   The slug is passed as an App Router parameter and resolved using React's `use()` hook:
   ```typescript
   const resolvedParams = use(params);
   const slug = resolvedParams.slug;
   const lead = LEADS_DATABASE.find(l => l.slug === slug) || LEADS_DATABASE[0];
   ```
   *Fallback:* If the crawler slug is unrecognized, it falls back to Sonoma Raceway (`LEADS_DATABASE[0]`).

2. **Live Synchronization Check:**
   Public pages actively subscribe to a Firestore document listener to check whether a B2B partner has self-onboarded/claimed their portal:
   ```typescript
   const docRef = doc(db, 'voyage_claims', slug);
   const unsubscribe = onSnapshot(docRef, (docSnap) => {
     setIsSyncing(false);
     if (docSnap.exists() && docSnap.data().onboarded === true) {
       setIsClaimed(true); // Payout splits active & LIVE banner shown
     } else {
       setIsClaimed(false); // Automated program preview site banner shown with Claim link
     }
   });
   ```

3. **Dynamic Category Formatting:**
   - **Pre-assigned Events (`getMockEvents`):** Returns distinct options depending on `lead.category`. Auto repair shops (`'auto_shop'`) display diagnostic packages and scheduling blocks, whereas motorsport tracks display HPDE lap sessions.
   - **Title Labels (`getTitleSuffix()`):** Dynamically appends specialized suffixes such as `"Automotive Service Hub"`, `"Dirt Oval Pass Portal"`, or `"Motocross Gate Portal"`.
   - **Agreement Terms & Digital Waivers:** Shows diagnostic/road-test waivers for shops vs. extreme-sport collision/injury liability waivers for race venues.
   - **Split Fee Math UI:** Dynamically displays exactly how much of the buyer's ticket goes to the venue vs. platform surcharges using calculated margins.
