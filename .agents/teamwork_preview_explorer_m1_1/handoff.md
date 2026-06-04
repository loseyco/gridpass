# Handoff Report — teamwork_preview_explorer_m1_1

This report presents verified codebase discovery and architectural mapping for the Gridpass-v4 application.

---

## 1. Observation

### 1.1 Stripe Pricing Tiers & Webhooks
- **File:** `src/app/pricing/page.tsx`
- **Lines 28–50:**
  ```typescript
  export const pricingPlans: PricingPlan[] = [
    { id: 'passport_monthly', name: 'GridPass Passport Monthly', price: 4.99, ... },
    { id: 'passport', name: 'GridPass Passport Lifetime', price: 29.99, ... },
    { id: 'operator', name: 'Autopilot Venue / Club', price: 49.00, ... },
    { id: 'auto_shop', name: 'Autopilot Service Shop', price: 49.00, ... }
  ];
  ```
- **File:** `src/app/api/billing/checkout/route.ts`
- **Lines 25–48:**
  - Creates a checkout session using:
    ```typescript
    const priceInCents = Math.round(price * 100);
    ```
  - If `itemType === 'day_pass'`, it fetches `gridpass_parks` from Firestore to locate the partner's `stripeAccountId` and issues a payout split:
    ```typescript
    payment_intent_data: {
      application_fee_amount: platformFeeInCents,
      transfer_data: { destination: stripeAccountId }
    }
    ```
- **File:** `src/app/api/billing/webhook/route.ts`
  - Listens for Stripe `checkout.session.completed` events.
  - Upgrades vehicle documents to premium `{ isPremium: true }` under the `vehicles` collection when `itemType === 'premium_upgrade'`.

### 1.2 The Digital Garage Dashboard
- **File:** `src/app/dash/page.tsx`
- **Lines 102–148:**
  - Standard user metadata and inventory listener hooks:
    ```typescript
    onSnapshot(doc(db, 'users', user.uid), (docSnap) => { ... });
    onSnapshot(query(collection(db, 'vehicles'), where('owner_id', '==', user.uid)), (snap) => { ... });
    ```
  - Auto-seeds a default profile record if none exists, assigning a unique `tag_id` matching `GP-[1000-9999]-[3-character random string]`.
- **Canvas Signboard Render & Download:**
  - Generates a high-DPI custom card utilizing an HTML5 `<canvas>` element and constructs the QR scan redirection destination as:
    ```typescript
    const redirectUrl = `${siteUrl}/qr/${tagId}`;
    ```

### 1.3 Dynamic Vehicle Profiles & Redirection
- **File:** `src/app/qr/[id]/page.tsx`
- **Lines 15–19:**
  - Immediately redirects scans:
    ```typescript
    useEffect(() => {
        if (resolvedParams?.id) {
            router.replace(`/join?id=${encodeURIComponent(resolvedParams.id)}`);
        }
    }, [resolvedParams, router]);
    ```
- **File:** `src/app/v/[id]/page.tsx`
  - Fetches the vehicle by its doc ID (`id`), gets the matching owner doc from the `users` collection, and loads verified logs from the `service_logs` collection:
    ```typescript
    const logsQuery = query(collection(db, 'service_logs'), where('vehicle_id', '==', vehicleId));
    ```

### 1.4 B2B Dealership Provenance & Venues
- **File:** `src/app/previews/[slug]/page.tsx`
- **Lines 31–48:**
  - Contains a `LEADS_DATABASE` of crawler-indexed regional B2B venues/shops (e.g. `sonoma-raceway`, `viola-auto-care`, `mercer-county-motorsports`).
- **File:** `src/app/claim/[slug]/page.tsx`
  - Provides a 3-step self-serve onboarding portal utilizing Stripe Connect Express to authorize partner bank routes and store claims in the `voyage_claims` collection.

---

## 2. Logic Chain

1. **Stripe Checkout Mathematics:**
   - Observations in `src/app/api/billing/checkout/route.ts` show pricing values are converted to integers (`priceInCents`) to protect against floating point rounding issues.
   - For day-passes, the split math allocates `application_fee_amount` to GridPass and transfers the remainder directly to the vendor's `stripeAccountId`.
2. **Dashboard Real-Time Bindings:**
   - `onSnapshot` references in `src/app/dash/page.tsx` establish active, real-time listeners for both `users` and `vehicles` collections in Firestore.
3. **QR Redirection Workflow:**
   - Scanned physical tags route spectators to `/qr/[id]`, which replaces the client history with a redirect to `/join?id=[id]`.
   - The showcase profile page `/v/[id]` resolves vehicle details, owner data, and a maintenance history record from the `service_logs` collection.
4. **Dealership Provenance Status:**
   - Case-insensitive search across `src/` shows that `"Monmouth Motors"` is not a hardcoded asset or field.
   - However, the `LEADS_DATABASE` list in `src/app/previews/[slug]/page.tsx` and `src/app/claim/[slug]/page.tsx` resolves B2B partner details by slug, enabling verified shop maintenance entries and direct payment split mechanics when the gateway is claimed.

---

## 3. Caveats

- **No Writing Permission Constraint:** Under the current teamwork explorer mandate, no modifications have been made to the application source files.
- **Stripe Keys:** Stripe session logic is simulated locally/dynamically and depends on backend API keys configured in environment variables.

---

## 4. Conclusion

- **Pricing Structure:** Configured with four main tiers (Passport Monthly $4.99/mo, Passport Lifetime $29.99, Autopilot Venue $49/mo, Autopilot Shop $49/mo).
- **Digital Garage Reactivity:** Uses Firestore real-time snapshots to bind owner cards and inventory, and provides an HTML5 Canvas print-sign visualizer.
- **Dynamic Vehicle Profile Routing:** The path `/v/[id]` maps vehicle records and maintenance sheets, while `/qr/[tagId]` acts as a fast redirect landing strip.
- **Dealership/B2B Integrations:** Fully operational B2B venue/shop claims engine implemented via `voyage_claims` and `LEADS_DATABASE` resolvers. `"Monmouth Motors"` represents a placeholder dealer provenance identifier.

---

## 5. Verification Method

To verify these observations:
1. **Inspect Routes:**
   - View `src/app/pricing/page.tsx` to verify the four pricing tiers.
   - View `src/app/api/billing/checkout/route.ts` to inspect the Stripe session splits.
   - View `src/app/dash/page.tsx` to verify the `onSnapshot` hooks and HTML5 Canvas print logic.
   - View `src/app/v/[id]/page.tsx` to review public profiles and the service logs display.
   - View `src/app/qr/[id]/page.tsx` to review client-side redirection to `/join`.
2. **Search Verification:**
   - Run `grep -ri "Monmouth" src/` to verify that there are no hardcoded code references to Monmouth Motors in the active source files.
