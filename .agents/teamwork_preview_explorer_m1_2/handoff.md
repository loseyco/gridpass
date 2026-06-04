# Handoff Report — Gridpass-v4 Codebase Investigation

This handoff report summarizes the read-only investigation findings for the Gridpass-v4 codebase as of May 25, 2026.

---

## 1. Observation

Direct observations and file paths examined during the investigation:

- **File Path `src/app/dash/page.tsx`:** Binds client-side user dashboard.
  - Line 51–67: Defines `interface DashboardVehicle` with year, make, model, tag_id, owner_id, etc.
  - Line 69–80: Defines `interface DashboardProfile` with displayName, bio, email, location, avatarIcon, etc.
  - Line 147: Binds `const [showTransferModal, setShowTransferModal] = useState<boolean>(false);` as an unused/dead state.
  - Line 197–225: Standard client-side auto-seeding logic for first-time users. If a user record is missing in `users/${user.uid}`, it seeds a default document utilizing Firestore `serverTimestamp()`.
  - Line 275: Vehicle real-time listener `const q = query(collection(db, 'vehicles'), where('owner_id', '==', user.uid));`.
  - Line 338: Profile editor form handler `updateDoc(userDocRef, { ... })`.
  - Line 454: Vehicle form handler `updateDoc(docRef, vehicleData)` or `addDoc(colRef, vehicleData)` with validation and comma-split array creation for modifications list (`vModsString`).

- **File Path `src/app/api/billing/checkout/route.ts`:** Handles Stripe checkout initialization.
  - Line 33: Calculates unit cents `const unitAmount = Math.round((price + (itemType === 'day_pass' ? gridPassFee : 0)) * 100);`.
  - Line 69–90: B2B Connect Split Pay routing. If `itemType === 'day_pass'`, it fetches the connected Stripe account ID from `gridpass_parks` and configures `payment_intent_data.application_fee_amount` to retain the gridPassFee ($1.50) while routing the base price to the partner.

- **File Path `src/app/api/billing/webhook/route.ts`:** Webhook fulfillment.
  - Line 51–58: Upgrades standard vehicle passports to premium: `vehicles/${itemId}` sets `isPremium: true` and `premiumSince: serverTimestamp()`.
  - Line 66–79: Registers day passes: inserts a new document under `'gridpass_checkins'` with active status.

- **File Paths `src/app/previews/[slug]/page.tsx` & `src/app/claim/[slug]/page.tsx`:** B2B partner pages.
  - Line 31–49: Hardcoded `LEADS_DATABASE` of 16 crawler-indexed regional B2B venues/shops.
  - Line 119–130: Real-time claim status listener. Subscribes to `'voyage_claims'` for the lead's slug and updates `isClaimed` dynamically based on the claim status.
  - Line 133–141: Absorbable pass-through mathematical pricing:
    ```typescript
    const totalCents = Math.round((baseCents + 180) / 0.961);
    ```
    This mathematical structure ensures buyers pay all platform fees ($1.50 flat + 1% platform commission + 2.9% + 30c card transaction fee), guaranteeing zero marginal cost to the partner.

---

## 2. Logic Chain

The following logic maps the direct observations to the final assessments:

1. **Firestore Schema Convention:**
   - *Observation:* TypeScript interfaces defined inside client files (`src/app/dash/page.tsx` and `ClaimTagForm.tsx`) are the source of truth for Firestore schema configurations.
   - *Reasoning:* There are no database migrations or schemas configured inside `src/lib/firebase`. The shapes of documents are determined entirely by these localized TypeScript definitions and the default auto-seeding structures (e.g. `users` and `vehicles` objects populated in forms).

2. **Unused States in Dashboard:**
   - *Observation:* The dashboard declares `showTransferModal` and matching state hooks (`transferVehicle`, etc.) but has no rendering bindings for them.
   - *Reasoning:* The vehicle transfer feature is currently dead code in the dashboard page and has not been fully implemented in the UI.

3. **Pricing Calculations & Surcharges:**
   - *Observation:* Pricing calculations are split between the Stripe API route (`checkout/route.ts` line 33) and the B2B previews page (`previews/[slug]/page.tsx` lines 133–141).
   - *Reasoning:* For individual premium upgrades, Stripe receives the exact base price. For day-pass tickets, the platform surcharge ($1.50) is added directly to the total charged. On public pages, a complex algebraic fee formula ensures that credit card processing fees (2.9% + 30¢) and Gridpass platform margins ($1.50 + 1%) are calculated accurately and passed entirely to the purchaser, leaving the partner with 100% of their base ticket price.

4. **B2B Previews Dynamic Content:**
   - *Observation:* A localized `LEADS_DATABASE` structure resolves details by the slug in the URL, dynamically formatting the display text, event registers, check-in terms, and pricing widgets depending on `lead.category`.
   - *Reasoning:* Since no central database holds B2B lead info yet, the static array acts as a mock/local cache, resolving different layouts (e.g. diagnostic services for garages vs HPDE track days for tracks) entirely on the client side using router slugs.

---

## 3. Caveats

- **No Writing/Mutations Permitted:** This was a read-only codebase exploration. No mock writes or database tests were performed directly.
- **Mock Firestore Values in Playwright Tests:** The dashboard page features standard Playwright mock checks (`(window as any).__PLAYWRIGHT_MOCK__`) that short-circuit live Firestore listeners during end-to-end testing, returning simulated Corvette Z06 (C8) vehicle credentials.
- **Unverified Stripe Secret Keys:** Local environment configuration variables (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) were not inspected since they belong to server-level system parameters.

---

## 4. Conclusion

- **Firestore Schemas:** Handled directly in client-side TypeScript. Collection `'users'` binds key driver attributes with auto-seeding on first login, while collection `'vehicles'` links physical QR windshield identifiers to car specifications, elevating to `isPremium: true` after payment.
- **Dashboard Modals:** Governed by local React hooks in `src/app/dash/page.tsx` (such as `showProfileModal` and `showVehicleModal`). Forms utilize HTML5 requirements, dynamic uppercase transformations, and comma-string parsers. A dead/unused `showTransferModal` state is present in the code.
- **Stripe Pricing:** Converted to integer cents. Surcharges are automatically added for day passes. Webhook logs register success and write check-ins (`gridpass_checkins`) or vehicle upgrades. High-fidelity split payouts automatically route ticket proceeds directly to the partner's Connect account while retaining platform margins.
- **B2B Partner Resolution:** Slug routing resolves pages against a local duplicate `LEADS_DATABASE` list. Public pages listen to Firestore `'voyage_claims'` to format either a secure/claimed live check-in route or an automated promotional teaser.

---

## 5. Verification Method

To verify these observations independently:

1. **Verify Dashboard Forms & Modal Structures:**
   - Open `src/app/dash/page.tsx` and inspect lines 51–94 (`DashboardVehicle` / `DashboardProfile` interfaces) and lines 114–153 (React state definitions).
2. **Verify Stripe Connect Billing Splits:**
   - Inspect `src/app/api/billing/checkout/route.ts` lines 33–50 (surcharge and session configs) and lines 69–90 (the `gridpass_parks` database lookup and connected destination account mapping).
3. **Verify Public B2B Previews & Claims:**
   - View `src/app/previews/[slug]/page.tsx` lines 31–49 (`LEADS_DATABASE` definition), lines 117–130 (`voyage_claims` document listener), and lines 133–141 (mathematical fee split math).
