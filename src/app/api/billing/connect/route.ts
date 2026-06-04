import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb, adminFirestore } from '@/lib/firebase/admin';
import { logEvent } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.StripeConfig['apiVersion'],
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { parkId, userId, userEmail } = body;

    if (!parkId || !userId) {
      return NextResponse.json({ error: 'Missing parkId or userId parameter.' }, { status: 400 });
    }

    const host = request.headers.get('host') || 'gridpass.app';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${host}`;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const parkRef = adminDb.collection('gridpass_parks').doc(parkId);
    const parkSnap = await parkRef.get();
    let accountId: string;

    if (parkSnap.exists && parkSnap.data()?.stripeAccountId) {
      accountId = parkSnap.data()?.stripeAccountId;
    } else {
      // Create a brand new Express connected account on Stripe
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: userEmail || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      // Link it to the park document in Firestore
      await parkRef.set({
        stripeAccountId: accountId,
        ownerUid: userId,
        updatedAt: adminFirestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/join?id=${parkId}&onboard_refresh=true`,
      return_url: `${origin}/join?id=${parkId}&onboard_success=true`,
      type: 'account_onboarding',
    });

    await logEvent(
      'info',
      'payment',
      `Stripe Express Connected Account link created for park ID ${parkId} by User ${userEmail}`,
      { parkId, accountId }
    );

    return NextResponse.json({ url: accountLink.url });

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe Connect API] Error:', err);
    
    await logEvent(
      'error',
      'payment',
      `Stripe Connect Onboarding failure: ${errMsg}`
    );

    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

