import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebase/admin';
import { logEvent } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.StripeConfig['apiVersion'], // Preserve standard version compatibility
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      itemId, // vehicleId or parkId
      itemName, 
      itemType, // 'premium_upgrade' | 'day_pass' | 'event_registration'
      price, // in USD, e.g. 29.99
      quantity = 1,
      gridPassFee = 1.50, // default fee
      userId,
      userEmail,
      redirectUrl
    } = body;

    if (!price || !userId || !itemType) {
      return NextResponse.json({ error: 'Missing required billing arguments.' }, { status: 400 });
    }

    const host = request.headers.get('host') || 'gridpass.app';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${host}`;

    const isSubscription = itemType === 'subscription';
    const qtyVal = parseInt(quantity || '1', 10);

    // Validate pricing sliding scale dynamically on the server
    let validatedPrice = price;
    if (isSubscription && itemId === 'platform' && itemName?.toLowerCase().includes('identity')) {
      if (qtyVal >= 10) {
        validatedPrice = 0.99;
      } else if (qtyVal >= 3) {
        validatedPrice = 1.49;
      } else {
        validatedPrice = 1.99;
      }
    }

    // Standard platform line item
    const unitAmount = Math.round((validatedPrice + (itemType === 'day_pass' ? gridPassFee : 0)) * 100);
    
    const priceData: any = {
      currency: 'usd',
      product_data: {
        name: itemName || `GridPass ${itemType.replace('_', ' ').toUpperCase()}`,
        description: isSubscription 
          ? `GridPass monthly subscription: ${itemName}.`
          : itemType === 'premium_upgrade' 
            ? 'Permanent GridPass premium features & dynamic visual garage tools.'
            : 'Event Registration & digital safety liability waiver.',
      },
      unit_amount: unitAmount,
    };

    if (isSubscription) {
      priceData.recurring = { interval: 'month' };
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: priceData,
          quantity: qtyVal,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: redirectUrl 
        ? `${origin}${redirectUrl}?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/login?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: redirectUrl
        ? `${origin}${redirectUrl}?checkout_cancel=true`
        : `${origin}/`,
      metadata: {
        userId,
        userEmail: userEmail || 'unknown@gridpass.app',
        itemId: itemId || 'platform',
        itemType,
        pricePaid: price.toString(),
        feePaid: gridPassFee.toString(),
      },
    };

    // If it's a day pass or check-in, we split the payments with the track owner's Connect account
    if (itemType === 'day_pass' && itemId) {
      const adminDb = getAdminDb();
      if (!adminDb) {
        return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
      }
      const parkRef = adminDb.collection('gridpass_parks').doc(itemId);
      const parkSnap = await parkRef.get();
      
      if (parkSnap.exists && parkSnap.data()?.stripeAccountId) {
        const stripeAccountId = parkSnap.data()?.stripeAccountId;
        
        // Split transaction: Application fee stays on platform, remainder transfers to Connect account
        const applicationFeeAmount = Math.round(gridPassFee * 100);
        
        sessionConfig.payment_intent_data = {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: stripeAccountId,
          },
        };
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    await logEvent(
      'info',
      'payment',
      `Stripe checkout session created for ${userEmail || userId}. Type: ${itemType}. Amount: $${(unitAmount/100).toFixed(2)}`,
      { userId, itemType, itemId, sessionId: session.id }
    );

    return NextResponse.json({ id: session.id, url: session.url });

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe Checkout API] Error:', err);
    
    await logEvent(
      'error',
      'payment',
      `Failed to create Stripe session: ${errMsg}`
    );

    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

