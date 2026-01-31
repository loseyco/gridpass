import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia',
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let { userId, email } = await request.json();

        if (user) {
            userId = user.id;
            email = user.email;
        }

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const origin = request.headers.get('origin') || 'https://gridpass.app';

        // Created Embedded Session
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded', // <--- Key Change
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Founding Member Pass',
                            description: 'Lifetime Access + Founder Badge',
                            images: ['https://gridpass.app/logo-square.png'],
                        },
                        unit_amount: 150000,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            return_url: `${origin}/founder/welcome?session_id={CHECKOUT_SESSION_ID}`, // <--- Changed from success_url
            customer_email: email,
            metadata: {
                userId: userId,
                type: 'founder_membership'
            },
        });

        // Return client_secret instead of sessionId
        return NextResponse.json({ clientSecret: session.client_secret });

    } catch (err: any) {
        console.error('Stripe Checkout Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
