import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb, adminFirestore } from '@/lib/firebase/admin';
import { logEvent } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.StripeConfig['apiVersion'],
});

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature') || '';
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (process.env.NODE_ENV === 'production') {
      if (!sig || !endpointSecret) {
        throw new Error('Missing stripe-signature or STRIPE_WEBHOOK_SECRET in production');
      }
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } else {
      if (endpointSecret && sig) {
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
      } else {
        // In development environments without webhook proxy, we parse directly
        event = JSON.parse(payload);
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Stripe Webhook Error] Signature validation failed:`, errMsg);
    return NextResponse.json({ error: `Webhook Error: ${errMsg}` }, { status: 400 });
  }

  // Process checkout completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (metadata && metadata.itemType) {
      const { userId, userEmail, itemId, itemType, pricePaid, feePaid } = metadata;

      try {
        const adminDb = getAdminDb();
        if (!adminDb) {
          return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
        }

        if (itemType === 'premium_upgrade' && itemId !== 'platform') {
          // 1. Upgrade the vehicle record
          const vehicleRef = adminDb.collection('vehicles').doc(itemId);
          await vehicleRef.update({
            isPremium: true,
            premiumSince: adminFirestore.FieldValue.serverTimestamp(),
            updatedAt: adminFirestore.FieldValue.serverTimestamp()
          });

          await logEvent(
            'success',
            'payment',
            `Vehicle upgraded to Premium: ID ${itemId} for User ${userEmail || userId}`,
            { itemId, userId, session: session.id }
          );
        } else if (itemType === 'day_pass') {
          // 2. Register active track check-in
          await adminDb.collection('gridpass_checkins').add({
            userId,
            userEmail: userEmail || 'Driver',
            parkId: itemId,
            checkInTime: adminFirestore.FieldValue.serverTimestamp(),
            checkOutTime: null,
            status: 'active',
            waiverSigned: true,
            passPrice: parseFloat(pricePaid) || 25.00,
            feePaid: parseFloat(feePaid) || 1.50,
            stripeSessionId: session.id
          });

          await logEvent(
            'success',
            'payment',
            `Processed day pass check-in at Park: "${itemId}" for Driver: ${userEmail}`,
            { parkId: itemId, userId, session: session.id }
          );
        } else {
          // Generic platform payment success
          await logEvent(
            'success',
            'payment',
            `Platform Checkout Success for ${userEmail || userId}. Type: ${itemType}`,
            { userId, itemType, session: session.id }
          );
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Firestore write error';
        console.error(`[Stripe Webhook] Error updating database:`, err);
        
        await logEvent(
          'error',
          'payment',
          `Stripe webhook fulfillment failure for session ${session.id}: ${errMsg}`
        );
        return NextResponse.json({ error: 'Database update failed.' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}

