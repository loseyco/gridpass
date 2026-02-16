import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
});

// Use Service Role to write to DB
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        const seasonId = session.metadata?.seasonId;
        const leagueId = session.metadata?.leagueId;

        if (userId && leagueId) {
            console.log(`Payment successful for User: ${userId}, League: ${leagueId}`);

            // Upsert member status as ACTIVE
            const { error } = await supabase.from('os_league_members').upsert({
                league_id: leagueId,
                user_id: userId,
                role: 'driver',
                status: 'active',
                subscription_status: 'paid',
                payment_details: {
                    stripe_session_id: session.id,
                    amount_total: session.amount_total,
                    currency: session.currency
                }
            }, { onConflict: 'league_id, user_id' });

            if (error) {
                console.error('Error updating member status:', error);
                return NextResponse.json({ error: 'DB Error' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
// Disable Next.js body parser (handled by req.text() above) - config export not needed in App Router if using standard fetch API
