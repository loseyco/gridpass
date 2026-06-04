# Gridpass.app V4 — Stripe Connect & Split-Billing Engineering Specification

**Project**: Gridpass.app V4 Financial Infrastructure  
**Author**: Financial AI Agent  
**Date**: May 22, 2026  
**Status**: APPROVED FOR IMPLEMENTATION  

---

## Executive Summary

Gridpass.app serves as the premier digital gateway and liability waiver platform for racetracks, offroad parks, and automotive clubs. Managing financial transactions across these diverse operators requires a highly robust, secure, and compliant split-billing payments engine. 

This document defines the complete engineering architecture for the **Stripe Connect & Split-Billing Model** within Gridpass V4. It details the mathematical foundations of our transaction routing, provides a comparative analysis of Stripe onboarding flows, specifies the transactional state machines for refunds and chargebacks, and outlines dynamic payout mechanisms.

---

## 1. Split-Billing Mathematical & Technical Architecture

### 1.1 The Break-Even Vulnerability in Current Codebase
In our current implementation (`src/app/api/billing/checkout/route.ts`), day pass check-ins are processed via a flat application fee:
* Customer is charged: $C_{total} = P_{pass} + F_{platform\_flat}$ (where $F_{platform\_flat} = \$1.50$)
* The Stripe processing fee on the platform account is: $S_{total} = C_{total} \times 2.9\% + \$0.30$
* The platform retains the $F_{platform\_flat}$ application fee and transfers the remainder ($P_{pass}$) to the Connected Account.
* The platform's net revenue is: $R_{platform\_net} = F_{platform\_flat} - S_{total}$

#### Algebraic Proof of Vulnerability:
For Gridpass to not lose money, we must satisfy:
$$R_{platform\_net} \ge 0$$
$$F_{platform\_flat} - S_{total} \ge 0$$
$$1.50 - \left((P_{pass} + 1.50) \times 0.029 + 0.30\right) \ge 0$$
$$1.50 - 0.029 \cdot P_{pass} - 0.0435 - 0.30 \ge 0$$
$$1.1565 - 0.029 \cdot P_{pass} \ge 0$$
$$0.029 \cdot P_{pass} \le 1.1565$$
$$P_{pass} \le \$39.88$$

**Conclusion**: For any day pass price $P_{pass}$ greater than **$39.88**, Gridpass experiences a net financial loss on the transaction. For example, on a **$100.00** pass, the Stripe fee is $2.94$ + $0.30 = $3.24, resulting in a net loss of **-$1.74** for the platform. This is a severe threat to margin sustainability.

---

### 1.2 Proposed Production Formula: Dynamic Fee Splitting

To ensure platform margin protection while offering transparent pricing to venues, Gridpass V4 introduces a **Dynamic Fee Splitting Model** where the customer-facing fee incorporates both a fixed platform service fee and a pass-through of the Stripe transaction processing cost.

#### Variables & Notation:
* $P_{pass}$: Base day pass/ticket price set by the venue (cents).
* $F_{base}$: Gridpass flat platform service fee = $150$ cents ($1.50).
* $F_{margin\_pct}$: Platform variable margin = $1.0\%$ ($0.01$).
* $S_{pct}$: Stripe percentage fee = $2.9\%$ ($0.029$).
* $S_{flat}$: Stripe flat fee = $30$ cents ($0.30$).
* $C_{total}$: Total amount charged to the customer (cents).
* $S_{total}$: Processing fee deducted by Stripe (cents).
* $F_{app\_fee}$: Platform application fee retained in Stripe (`application_fee_amount`) (cents).
* $P_{venue}$: Net transfer amount sent to the venue's connected account (cents).
* $R_{platform\_net}$: Net platform revenue after Stripe deductions (cents).

#### Derivation of Customer Charge ($C_{total}$):
To protect the venue's base price ($P_{pass}$) so they receive exactly their ticket price, the Stripe fee and platform fee must be added on top. The customer total is:
$$C_{total} = \frac{P_{pass} + F_{base} + S_{flat}}{1 - S_{pct} - F_{margin\_pct}}$$

Substituting our constant values ($F_{base} = 150$, $S_{flat} = 30$, $S_{pct} = 0.029$, $F_{margin\_pct} = 0.01$):
$$C_{total} = \frac{P_{pass} + 150 + 30}{1 - 0.029 - 0.01}$$
$$C_{total} = \frac{P_{pass} + 180}{0.961}$$

This formula guarantees that after Stripe takes $2.9\% + 30\text{c}$ and Gridpass takes $1\% + \$1.50$, the venue receives exactly $P_{pass}$.

#### Formula Set for Split Calculations:
1. **Total Charged**: $C_{total} = \text{Round}\left(\frac{P_{pass} + 180}{0.961}\right)$
2. **Stripe Processing Fee**: $S_{total} = \text{Round}(C_{total} \times 0.029) + 30$
3. **Application Fee**: $F_{app\_fee} = C_{total} - P_{pass}$
4. **Venue Payout**: $P_{venue} = C_{total} - F_{app\_fee} = P_{pass}$
5. **Net Platform Profit**: $R_{platform\_net} = F_{app\_fee} - S_{total}$

---

### 1.3 TypeScript Implementation (Integer Math Engine)

To prevent floating-point calculation errors, all calculations are executed strictly in integer cents.

```typescript
// src/lib/billing/feeCalculator.ts

export interface FeeSplitResult {
  basePriceCents: number;          // P_pass
  customerChargedCents: number;    // C_total
  stripeFeeCents: number;          // S_total
  applicationFeeCents: number;     // F_app_fee
  venuePayoutCents: number;        // P_venue
  platformNetRevenueCents: number; // R_platform_net
}

/**
 * Computes production-grade split fees in integer cents.
 * Ensures the platform never takes a negative fee and that venues receive exactly their base price.
 */
export function calculateSplitFees(basePriceCents: number): FeeSplitResult {
  if (basePriceCents < 0) {
    throw new Error('Base price cannot be negative.');
  }

  // 1. Calculate Customer Charge (C_total)
  // C_total = Math.round((P_pass + 180) / 0.961)
  const customerChargedCents = Math.round((basePriceCents + 180) / 0.961);

  // 2. Calculate Stripe Processing Fee (S_total)
  // S_total = Math.round(C_total * 0.029) + 30
  const stripeFeeCents = Math.round(customerChargedCents * 0.029) + 30;

  // 3. Calculate Platform Application Fee (F_app_fee)
  // This is what the platform keeps out of the total charge on Stripe
  const applicationFeeCents = customerChargedCents - basePriceCents;

  // 4. Calculate Net Platform Revenue (R_platform_net)
  // What the platform keeps after paying Stripe's fee
  const platformNetRevenueCents = applicationFeeCents - stripeFeeCents;

  // 5. Venue Payout matches their base price exactly
  const venuePayoutCents = basePriceCents;

  return {
    basePriceCents,
    customerChargedCents,
    stripeFeeCents,
    applicationFeeCents,
    venuePayoutCents,
    platformNetRevenueCents,
  };
}
```

---

### 1.4 Scenario Walkthroughs

The following cases illustrate the mathematical correctness across diverse venue operations.

```
+-----------------------------------------------------------------------------------------+
| SCENARIO WALKTHROUGHS (VALUES IN CENTS & USD)                                           |
+------------------------------+---------------------------+------------------------------+
| Metric                       | Case A: Racetrack Pass    | Case B: Offroad Park Pass    | Case C: Car Club Fee        |
+------------------------------+---------------------------+------------------------------+
| Base Price (P_pass)          | 15000 cents ($150.00)     | 2500 cents ($25.00)          | 1000 cents ($10.00)         |
| Formula: (P_pass + 180)/0.961| (15000+180)/0.961 = 15796 | (2500+180)/0.961 = 2788.7    | (1000+180)/0.961 = 1227.8   |
| Customer Charge (C_total)    | 15796 cents ($157.96)     | 2789 cents ($27.89)          | 1228 cents ($12.28)         |
| Stripe Fee (S_total)         | 15796 * 0.029 + 30 = 488  | 2789 * 0.029 + 30 = 111      | 1228 * 0.029 + 30 = 66      |
| Application Fee (F_app_fee)  | 15796 - 15000 = 796       | 2789 - 2500 = 289            | 1228 - 1000 = 228           |
| Venue Payout (P_venue)       | 15000 cents ($150.00)     | 2500 cents ($25.00)          | 1000 cents ($10.00)         |
| Net Platform (R_platform_net)| 796 - 488 = 308 ($3.08)   | 289 - 111 = 178 ($1.78)      | 228 - 66 = 162 ($1.62)      |
+------------------------------+---------------------------+------------------------------+
```

* **Case A (High ticket):** Platform retains **$3.08** net (representing the $1.50 base fee + $1.50 variable margin + fractional rounding).
* **Case B (Standard ticket):** Platform retains **$1.78** net (representing the $1.50 base fee + $0.25 variable margin + fractional rounding).
* **Case C (Low ticket):** Platform retains **$1.62** net (representing the $1.50 base fee + $0.10 variable margin + fractional rounding).

*Note: In all cases, Gridpass achieves a guaranteed positive profit, eliminating the breakeven vulnerability.*

---

## 2. Stripe Connect Onboarding Workflows & Developer Integration Paths

To scale merchant onboarding for various venue types (racetracks, car clubs, offroad parks), Gridpass V4 utilizes Stripe Connect. We support both **Stripe Express** and **Stripe Standard** accounts, though Express is designated as the primary architecture.

### 2.1 Comparative Analysis Matrix

```
+----------------------------------------------------------------------------------------------------------+
| STRIPE CONNECT TYPE COMPARISON MATRIX                                                                    |
+---------------------------+--------------------------------------+---------------------------------------+
| Feature                   | Stripe Express Account (Recommended) | Stripe Standard Account               |
+---------------------------+--------------------------------------+---------------------------------------+
| Merchant User Experience  | Fully co-branded, streamlined.       | Standard Stripe onboarding flow.      |
| Platform Dev Control      | High. Platform triggers payouts and  | Low. Venue controls their Stripe      |
|                           | manages payout frequencies.          | dashboard settings directly.          |
| Stripe Dashboard Access   | Simplified dashboard managed by      | Full Stripe Dashboard access with all |
|                           | Stripe, embedded in Gridpass.        | standard reporting and dev tools.     |
| KYC/AML & Tax (1099-K)    | Stripe handles KYC, identity, and    | Stripe handles KYC, identity, and     |
|                           | auto-generates 1099-K.               | auto-generates 1099-K.                |
| Platform SaaS Costs       | $2.00/active account/month +         | $0.00 per account (free).             |
|                           | $0.25 per payout.                    |                                       |
| Operational Support       | Low. Stripe handles account support. | Moderate. Venues might require assistance|
|                           |                                      | with OAuth credential linking.        |
| Integration Complexity    | Low (uses Stripe Account Links).     | Moderate (requires OAuth 2.0 flow).   |
+---------------------------+--------------------------------------+---------------------------------------+
```

---

### 2.2 Developer Integration Path: Stripe Express

Stripe Express uses standard Connect Account Links. The venue is directed to a Stripe-hosted onboarding portal and redirected back to the platform once complete.

#### 1. Onboarding Initiation Endpoint
The platform triggers account creation and generates a dynamic activation link.

```typescript
// src/app/api/billing/connect/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, adminFirestore } from '@/lib/firebase/admin';
import { logEvent } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const { parkId, userId, userEmail } = await request.json();

    if (!parkId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters: parkId, userId.' }, { status: 400 });
    }

    const host = request.headers.get('host') || 'gridpass.app';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const origin = `${protocol}://${host}`;

    const parkRef = adminDb.collection('gridpass_parks').doc(parkId);
    const parkSnap = await parkRef.get();
    let accountId = parkSnap.data()?.stripeAccountId;

    if (!accountId) {
      // 1. Create a brand new Express connected account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: userEmail || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'manual', // Controlled by Gridpass scheduler
            },
          },
        },
        metadata: {
          parkId,
          ownerUid: userId,
        },
      });

      accountId = account.id;

      // 2. Persist account status as "initiated"
      await parkRef.set({
        stripeAccountId: accountId,
        ownerUid: userId,
        stripeOnboardingStatus: 'initiated',
        updatedAt: adminFirestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    // 3. Generate the onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/join?id=${parkId}&onboard_refresh=true`,
      return_url: `${origin}/join?id=${parkId}&onboard_success=true`,
      type: 'account_onboarding',
    });

    await logEvent('info', 'payment', `Express Connect Link generated for park: ${parkId}`, { parkId, accountId });

    return NextResponse.json({ url: accountLink.url });

  } catch (err: any) {
    console.error('[Stripe Express Connection Error]:', err);
    await logEvent('error', 'payment', `Express onboarding failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

### 2.3 Developer Integration Path: Stripe Standard (OAuth 2.0 Alternative)

If standard accounts are utilized, the platform uses an OAuth flow to request write permissions on the venue's self-managed Stripe account.

#### 1. OAuth Url Construction
Direct the user to the Stripe authorization screen:
```
https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_GRIDPASS_CLIENT_ID&scope=read_write&state=PARK_ID_HERE
```

#### 2. Token Exchange Endpoint
Upon completing the OAuth process, Stripe redirects the venue to our redirect URL (e.g. `/api/billing/connect/oauth-callback`) with a query parameter `code`.

```typescript
// src/app/api/billing/connect/oauth-callback/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, adminFirestore } from '@/lib/firebase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const parkId = searchParams.get('state'); // State tracks our internal parkId

  if (!code || !parkId) {
    return NextResponse.json({ error: 'Missing OAuth authorization code or state.' }, { status: 400 });
  }

  try {
    // Exchange the authorization code for the Access Token and Stripe Account ID
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code,
    });

    const connectedAccountId = response.stripe_user_id;

    // Persist details to Firestore
    await adminDb.collection('gridpass_parks').doc(parkId).set({
      stripeAccountId: connectedAccountId,
      stripeAccountType: 'standard',
      stripeOnboardingStatus: 'active',
      payoutsEnabled: true,
      chargesEnabled: true,
      updatedAt: adminFirestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Redirect to success screen
    return NextResponse.redirect(`${new URL(request.url).origin}/join?id=${parkId}&onboard_success=true`);

  } catch (err: any) {
    console.error('[OAuth Standard Exchange Error]:', err);
    return NextResponse.redirect(`${new URL(request.url).origin}/join?id=${parkId}&onboard_error=${encodeURIComponent(err.message)}`);
  }
}
```

---

### 2.4 Automated Registration Webhooks

To track ongoing compliance, KYC verification, and blockages, our system listens to `account.updated` events in the global Stripe Webhook endpoint.

```typescript
// Part of src/app/api/billing/webhook/route.ts

export async function processAccountUpdate(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;
  const stripeAccountId = account.id;

  // Retrieve the matching park by Stripe Account ID
  const parksQuery = await adminDb.collection('gridpass_parks')
    .where('stripeAccountId', '==', stripeAccountId)
    .limit(1)
    .get();

  if (parksQuery.empty) {
    console.warn(`[Webhook Warning]: account.updated received for unknown stripeAccount: ${stripeAccountId}`);
    return;
  }

  const parkDoc = parksQuery.docs[0];
  const parkRef = parkDoc.ref;

  // Determine current verification standing
  const chargesEnabled = account.charges_enabled;
  const payoutsEnabled = account.payouts_enabled;
  
  // Extract currently due and eventually due verification requirements
  const currentlyDue = account.requirements?.currently_due || [];
  const eventuallyDue = account.requirements?.eventually_due || [];
  const disabledReason = account.requirements?.disabled_reason || null;

  let localStatus: 'initiated' | 'restricted' | 'active' = 'initiated';

  if (chargesEnabled && payoutsEnabled && currentlyDue.length === 0) {
    localStatus = 'active';
  } else if (currentlyDue.length > 0 || disabledReason) {
    localStatus = 'restricted';
  }

  // Update Firestore with real-time compliance status
  await parkRef.update({
    stripeOnboardingStatus: localStatus,
    chargesEnabled,
    payoutsEnabled,
    kycCurrentlyDue: currentlyDue,
    kycEventuallyDue: eventuallyDue,
    disabledReason,
    updatedAt: adminFirestore.FieldValue.serverTimestamp(),
  });

  await logEvent(
    localStatus === 'active' ? 'success' : 'warning',
    'payment',
    `Stripe account state synced: ID ${stripeAccountId} (Status: ${localStatus})`,
    { stripeAccountId, currentlyDue }
  );
}
```

#### Onboarding Status State-Machine Table:

```
+---------------------------------------------------------------------------------------------------------------------+
| ONBOARDING STATUS STATE MACHINE TABLE                                                                               |
+----------------------+--------------------+--------------------------------+----------------------------------------+
| Current DB Status    | Trigger Event      | Condition Checked              | Next DB Status & Action                |
+----------------------+--------------------+--------------------------------+----------------------------------------+
| unlinked             | POST /connect      | Account created on Stripe      | initiated (Save Account ID)            |
| initiated            | account.updated    | charges/payouts false, KYC due | restricted (Notify venue of KYC need)  |
| initiated            | account.updated    | charges/payouts true, KYC empty| active (Unlock checkout scheduling)    |
| restricted           | account.updated    | charges/payouts true, KYC empty| active (Enable payouts, remove banner) |
| active               | account.updated    | New KYC requirements due       | restricted (Add warning banner to UI)  |
| restricted / active  | account.updated    | account.requirements.disabled  | restricted (Disable sales, freeze payouts) |
+----------------------+--------------------+--------------------------------+----------------------------------------+
```

---

## 3. Chargeback and Refund Lifecycle (State-Machines & Database Triggers)

Managing partial or full refunds and unexpected payment disputes is critical for preserving platform liquidity. Because Stripe **does not** return original processing fees when processing refunds, we must architect a secure mechanism that preserves platform balances.

### 3.1 Refund Processing Architecture

#### The Non-Refundable Fee Formula:
When a customer purchases a pass, Gridpass collects the total charge, pays the Stripe fee, and transfers the remainder to the Venue.
Upon issuing a refund (e.g. event cancellation or bad weather):
* Stripe retains the original transaction fee ($S_{total}$).
* Gridpass reverses the transfer from the Venue Connect Account back to the Platform.
* Gridpass returns $C_{total}$ to the customer.

To prevent Gridpass from paying the Stripe processing fee out of pocket (which would mean a loss of $S_{total}$), the loss is absorbed by the Venue. The net withdrawal from the Venue's Connect Account is:
$$\text{Venue Refund Cost} = P_{pass} + S_{total}$$

#### Refund API Implementation:
This API processes the refund on Stripe, handles partial or full adjustments, and automatically handles transfer reversals.

```typescript
// src/app/api/billing/refund/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, adminFirestore } from '@/lib/firebase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const { checkInId, refundAmountCents, reason } = await request.json();

    if (!checkInId) {
      return NextResponse.json({ error: 'Missing checkInId.' }, { status: 400 });
    }

    const checkInRef = adminDb.collection('gridpass_checkins').doc(checkInId);
    const checkInSnap = await checkInRef.get();

    if (!checkInSnap.exists) {
      return NextResponse.json({ error: 'Check-in record not found.' }, { status: 404 });
    }

    const checkInData = checkInSnap.data()!;
    const stripeSessionId = checkInData.stripeSessionId;

    if (!stripeSessionId) {
      return NextResponse.json({ error: 'No successful payment session associated with check-in.' }, { status: 400 });
    }

    // 1. Retrieve the Stripe Charge ID from the Session
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    const paymentIntentId = session.payment_intent as string;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const chargeId = paymentIntent.latest_charge as string;

    // 2. Issue the refund via Stripe API
    // We reverse the transfer to ensure the refund amount is deducted from the venue's Connect account
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: refundAmountCents || undefined, // undefined triggers full refund
      reverse_transfer: true,                 // Pull funds back from the connected account
      refund_application_fee: false,          // Platform retains the app fee to cover Stripe's non-refundable processing cost
      metadata: {
        checkInId,
        reason: reason || 'Customer requested refund',
      },
    });

    // 3. Persist refund record to Firestore
    const refundRecordRef = adminDb.collection('gridpass_refunds').doc();
    await refundRecordRef.set({
      id: refund.id,
      checkInId,
      chargeId,
      refundAmount: refundAmountCents ? (refundAmountCents / 100) : checkInData.passPrice,
      refundedAt: adminFirestore.FieldValue.serverTimestamp(),
      status: 'succeeded',
      reason: reason || 'Customer requested refund',
    });

    // 4. Update the Check-in record status
    await checkInRef.update({
      status: refundAmountCents ? 'partially_refunded' : 'refunded',
      updatedAt: adminFirestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, refundId: refund.id });

  } catch (err: any) {
    console.error('[Refund Processing Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

### 3.2 Chargeback / Payment Dispute State Machine

When a driver files a chargeback/dispute with their bank:
1. Stripe immediately withdraws the disputed amount plus a **$15.00 dispute fee** from our Platform account balance.
2. The platform status transitions to `needs_response`.
3. We must freeze the disputed funds from the Venue's Connect Account to protect platform capital.

#### Webhook Handlers for Dispute Events:
```typescript
// Part of src/app/api/billing/webhook/route.ts

export async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const chargeId = dispute.charge as string;
  const disputedAmountCents = dispute.amount; // In cents
  
  // Find associated check-in by charge ID
  const checkinsQuery = await adminDb.collection('gridpass_checkins')
    .where('stripeChargeId', '==', chargeId)
    .limit(1)
    .get();

  if (checkinsQuery.empty) {
    console.error(`[Dispute Error]: No matching check-in found for Charge ID: ${chargeId}`);
    return;
  }

  const checkinDoc = checkinsQuery.docs[0];
  const checkinRef = checkinDoc.ref;
  const parkId = checkinDoc.data().parkId;

  // Track dispute in Firestore
  const disputeRef = adminDb.collection('gridpass_disputes').doc(dispute.id);
  await disputeRef.set({
    disputeId: dispute.id,
    chargeId,
    checkInId: checkinDoc.id,
    parkId,
    amountCents: disputedAmountCents,
    status: 'needs_response',
    evidenceDeadline: new Date(dispute.evidence_details.due_by * 1000),
    created: adminFirestore.FieldValue.serverTimestamp(),
  });

  // Apply collateral hold to park
  const parkRef = adminDb.collection('gridpass_parks').doc(parkId);
  await adminDb.runTransaction(async (transaction) => {
    const parkSnap = await transaction.get(parkRef);
    if (!parkSnap.exists) return;

    const currentHold = parkSnap.data()?.collateralHoldCents || 0;
    // Disputed amount + $15.00 Dispute Fee
    const newHold = currentHold + disputedAmountCents + 1500; 

    transaction.update(parkRef, {
      collateralHoldCents: newHold,
      hasActiveDispute: true,
      updatedAt: adminFirestore.FieldValue.serverTimestamp(),
    });
  });

  // Update check-in record status
  await checkinRef.update({
    status: 'disputed',
    updatedAt: adminFirestore.FieldValue.serverTimestamp(),
  });
}
```

#### Dispute Status Transitions & Webhook Events:

```
+--------------------------------------------------------------------------------------------------------------------+
| DISPUTE STATUS TRANSITIONS & WEBHOOK EVENTS                                                                        |
+----------------------------+---------------------------------+---------------------+-------------------------------+
| Stripe Webhook Event       | Action Taken                    | Park DB Hold state  | Check-in/Dispute DB Status    |
+----------------------------+---------------------------------+---------------------+-------------------------------+
| charge.dispute.created     | Log dispute, hold funds         | Hold += (Amt + $15) | Status = "needs_response"     |
| charge.dispute.closed      | Evidences evaluated (Won)       | Hold -= (Amt + $15) | Status = "won"                |
| charge.dispute.closed      | Evidences evaluated (Lost)      | Hold -= (Amt + $15) | Status = "lost", Deduct Bal.  |
+----------------------------+---------------------------------+---------------------+-------------------------------+
```

*Note: In the event of a "Lost" dispute, the platform makes the collateral hold permanent by deducting the total amount ($DisputedAmount + \$15.00$) from the Venue's ledger balance or processing a reverse transfer from their connected balance.*

---

## 4. Payout Frequencies & Dynamic Handling

Connected accounts need access to cash flow. We support two payout tracks: **Standard 2-Day rolling payouts** and **Manual Instant payouts**.

### 4.1 Standard Payouts (Automated 2-Day Schedule)
For standard venues, Stripe manages the automated daily payout cycle. In the US, standard payouts clear on a **2-business-day rolling schedule**.
To enforce this configuration programmatically on Connect accounts:
```typescript
await stripe.accounts.update(stripeAccountId, {
  settings: {
    payouts: {
      schedule: {
        interval: 'daily',
        delay_days: 2,
      },
    },
  },
});
```

---

### 4.2 Manual Instant Payouts & Balance Checks

To support racetrack operators who require immediate liquidity on weekends, Gridpass provides a **Manual Instant Payout** toggle. 

#### Safety Guardrails & Dynamic Validations:
1. **Collateral Hold Verification**: Before authorizing any payout, the engine queries the venue's document in Firestore to check active `collateralHoldCents` (due to active disputes).
2. **Stripe Balance Inquiries**: The engine performs real-time balance queries using the Stripe API to verify the available funds.
3. **Transaction Fee Adjustments**: Stripe charges a **1.5% fee** (minimum $0.50) for instant payouts. This fee is automatically deducted from the venue's instant payout amount.

#### Implementation Endpoint for Instant Payouts:

```typescript
// src/app/api/billing/payouts/instant/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, adminFirestore } from '@/lib/firebase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const { parkId, userId } = await request.json();

    if (!parkId || !userId) {
      return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 });
    }

    const parkRef = adminDb.collection('gridpass_parks').doc(parkId);
    const parkSnap = await parkRef.get();

    if (!parkSnap.exists) {
      return NextResponse.json({ error: 'Park not found.' }, { status: 404 });
    }

    const parkData = parkSnap.data()!;
    const stripeAccountId = parkData.stripeAccountId;
    const collateralHoldCents = parkData.collateralHoldCents || 0;

    if (!stripeAccountId) {
      return NextResponse.json({ error: 'Venue has not connected a Stripe account.' }, { status: 400 });
    }

    // 1. Query Stripe Connect Available Balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeAccountId,
    });

    const usdBalance = balance.available.find(b => b.currency === 'usd');
    const availableCents = usdBalance ? usdBalance.amount : 0;

    // 2. Perform safety checks against collateral holds
    const safeWithdrawalCents = availableCents - collateralHoldCents;

    // Deduct instant payout fee (1.5% with $0.50 minimum)
    const instantPayoutFeeCents = Math.max(50, Math.round(safeWithdrawalCents * 0.015));
    const finalPayoutCents = safeWithdrawalCents - instantPayoutFeeCents;

    if (finalPayoutCents <= 100) { // Require minimum payout of $1.00
      return NextResponse.json({ 
        error: `Insufficient safe funds for instant payout. Available: $${(availableCents/100).toFixed(2)}, Collateral Hold: $${(collateralHoldCents/100).toFixed(2)}` 
      }, { status: 400 });
    }

    // 3. Execute the Instant Payout on Stripe
    const payout = await stripe.payouts.create({
      amount: finalPayoutCents,
      currency: 'usd',
      method: 'instant',
      statement_descriptor: 'GRIDPASS INSTANT',
      metadata: {
        parkId,
        requestedBy: userId,
        originalSafeBalance: safeWithdrawalCents.toString(),
        instantPayoutFee: instantPayoutFeeCents.toString(),
      }
    }, {
      stripeAccount: stripeAccountId, // Run on connected account ledger
    });

    // 4. Record payout transaction in Firestore
    const payoutRecordRef = adminDb.collection('gridpass_payouts').doc();
    await payoutRecordRef.set({
      id: payout.id,
      parkId,
      amount: finalPayoutCents / 100,
      fee: instantPayoutFeeCents / 100,
      method: 'instant',
      status: 'pending',
      requestedBy: userId,
      createdAt: adminFirestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ 
      success: true, 
      payoutId: payout.id,
      amountTransferred: finalPayoutCents / 100,
      feeDeducted: instantPayoutFeeCents / 100,
    });

  } catch (err: any) {
    console.error('[Instant Payout Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

### 4.3 Currency Conversion & Multi-Currency FX Strategies

For international venues (e.g. racetracks in Canada or Baja offroad courses in Mexico), multi-currency routing requires careful design to mitigate foreign exchange (FX) fee losses (which typically add **1% to 2%** overhead on standard conversions).

```
+----------------------------------------------------------------------------------------------------------+
| STRIPE MULTI-CURRENCY CONVERSION FLOW                                                                    |
|                                                                                                          |
| [Customer Credit Card (USD)]                                                                             |
|            │                                                                                             |
|            ▼                                                                                             |
| [Gridpass Platform Balance (USD)] ──(Deducts Stripe processing fee 2.9% + 30c)                           |
|            │                                                                                             |
|            ▼ (Application Fee retained in USD)                                                           |
| [Transfer Request to Connected Account]                                                                  |
|            │                                                                                             |
|            ├───────────────► US Venue: Transfers USD directly (No FX cost)                               |
|            │                                                                                             |
|            └───────────────► CAD Venue: Stripe converts USD -> CAD (Charges 1%-2% Conversion Fee)        |
+----------------------------------------------------------------------------------------------------------+
```

#### Multi-Currency Engineering Requirements:
1. **Matching Country Accounts**: To prevent double-conversion fees (converting ticket currencies twice), we create Connect Accounts in the venue's resident jurisdiction (e.g. `country: 'CA'` for Canadian tracks, `country: 'MX'` for Mexican tracks).
2. **Local Currency Day Passes**: The checkout sessions for foreign venues must designate the local currency rather than forcing USD conversion atcheckout.
   * *Example*: A Canadian track lists their day pass at **$50.00 CAD**. The customer's checkout session charges **$50.00 CAD**.
   * Gridpass calculates the fee splits directly in CAD cents using the exact same formulas:
     $$C_{CAD} = \frac{P_{CAD\_pass} + 180}{0.961}$$
   * The destination transfer is executed entirely in CAD, ensuring the venue receives exactly $50.00 CAD into their local Canadian bank account, completely bypassing double-conversion overhead.
3. **Application Fee Conversion**: The application fee is converted into USD automatically by Stripe upon transfer back to the platform account. Since the platform absorbs the minor FX fee on the application fee margin rather than the high ticket price, platform margins are securely shielded.
