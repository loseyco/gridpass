import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is missing');
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-01-28.clover', // Update to latest stable if needed
    });
};

export async function POST(request: Request) {
    try {
        const stripe = getStripe();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let { userId, email, isDonation, amount, message, isAnonymous } = await request.json();

        if (user) {
            userId = user.id;
            email = user.email;
        }

        // Donations do not require User ID (can be anonymous guest)
        if (!userId && !isDonation) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        let priceInCents = 0;
        let productName = '';
        let productDesc = '';
        let metadata = {
            userId: userId || 'guest',
            type: isDonation ? 'donation' : 'founder_membership',
            message: message || '',
            isAnonymous: isAnonymous ? 'true' : 'false'
        };

        if (isDonation) {
            // --- DONATION LOGIC ---
            if (!amount || amount < 1) {
                return NextResponse.json({ error: 'Valid donation amount required' }, { status: 400 });
            }
            priceInCents = Math.round(amount * 100); // Amount passed in dollars
            productName = 'GridPass Contribution';
            productDesc = 'Fueling the Vision';
        } else {
            // --- FOUNDER MEMBER LOGIC ---
            // 1. Get current sold count
            const { count, error: countError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'founder');

            const soldCount = count || 0;

            // 2. Calculate dynamic price
            const { calculateFounderPrice } = await import('@/utils/pricing');
            const priceInDollars = calculateFounderPrice(soldCount);
            priceInCents = priceInDollars * 100;

            productName = `Founding Member Pass #${soldCount + 1}`;
            productDesc = 'Lifetime Access + Founder Badge';
        }

        const origin = request.headers.get('origin') || 'https://gridpass.app';

        // Created Embedded Session
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: productName,
                            description: productDesc,
                            images: ['https://gridpass.app/logo-square.png'],
                        },
                        unit_amount: priceInCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            return_url: `${origin}/founder/welcome?session_id={CHECKOUT_SESSION_ID}&type=${isDonation ? 'donation' : 'founder'}`,
            customer_email: email, // Optional for guests, but good if we have it
            metadata: metadata,
        });

        // Return client_secret instead of sessionId
        return NextResponse.json({ clientSecret: session.client_secret });

    } catch (err: any) {
        console.error('Stripe Checkout Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
