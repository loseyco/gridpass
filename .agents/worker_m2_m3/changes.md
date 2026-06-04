# Changes - GridPass Milestones 2 & 3

This document lists the files modified, features implemented, and verification results for Milestone 2 and Milestone 3.

## Modified Files
1. `src/app/pricing/page.tsx` — Simplified pricing options to $1.99/mo per Active Identity (with sliding scale volume discounts: $1.99 -> $1.49 for 3+ -> $0.99 for 10+) and $49.00/mo for B2B Business Tier. Updated checkout request properties.
2. `src/app/api/billing/checkout/route.ts` — Updated the Stripe Checkout endpoint. Subscription plans ('subscription' item type) now correctly set Stripe Checkout session to `mode: 'subscription'` with recurring billing parameter `price_data.recurring = { interval: 'month' }` in `line_items`. Day passes and other payments preserve `mode: 'payment'`. Dynamically validates pricing on the sliding scale server-side to prevent tampering, and converts all pricing and fees accurately to integer cents using `Math.round(... * 100)`.
3. `src/app/dash/page.tsx` — Upgraded the Digital Garage dashboard with the "Transfer Identity" action on each vehicle card. Added glassmorphic modal utilizing existing React states (`showTransferModal`, `transferVehicle`, `transferEmail`, `transferError`, `transferSuccess`, `transferring`). Added clean P2P ownership transfer handler querying Firestore `users`, updating vehicle `owner_id` & `owner_email`, writing to `ownership_transfers` ledger collection in the required shape, and letting the vehicle be removed from the previous owner's list in real-time.
4. `tests/gridpass.spec.ts` — Fixed a Playwright strict mode locator violation by specifically targeting the modal's `h3` heading element for "Transfer Identity" rather than using a generic text locator which matched the action buttons as well.

## Implementation Details

### M2. Simplified $1.99/month Pricing Model
- **Pricing Cards Overhaul**: Reduced pricing complexity to focus on primary subscription models.
- **Stripe Session Configuration**:
  ```typescript
  const isSubscription = itemType === 'subscription';
  ...
  if (isSubscription) {
    priceData.recurring = { interval: 'month' };
  }
  ...
  mode: isSubscription ? 'subscription' : 'payment',
  ```
- **Pricing sliding scale & Cents conversion**:
  Converts fractional prices into exact integer cents matching Stripe requirements.

### M3. Peer-to-Peer Ownership Transfer Ledger
- **Transfer Action**: Integrated an "ArrowLeftRight" button in each vehicle card to launch the transfer flow.
- **User Verification**: Queries Firestore `users` by email.
- **Transfer & Ledger**: Updates vehicle `owner_id` and `owner_email`. Simultaneously writes a permanent entry to the `ownership_transfers` Firestore collection.
