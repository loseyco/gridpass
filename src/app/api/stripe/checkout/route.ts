import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia', // Updated to match type definition
});

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { seasonId } = body;

        if (!seasonId) {
            return NextResponse.json({ error: 'Missing seasonId' }, { status: 400 });
        }

        // 1. Fetch Season Details
        const { data: season, error: seasonError } = await supabase
            .from('os_league_seasons')
            .select('*')
            .eq('id', seasonId)
            .single();

        if (seasonError || !season) {
            return NextResponse.json({ error: 'Season not found' }, { status: 404 });
        }

        const amount = season.entry_fee_amount || 0;
        const currency = season.currency || 'usd';

        if (amount <= 0) {
            return NextResponse.json({ error: 'This season is free to join.' }, { status: 400 });
        }

        // 2. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: user.email,
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: {
                            name: `Entry Fee: ${season.name}`,
                            description: `Join the GridPass ${season.name}.`,
                        },
                        // Stripe expects amount in cents for USD
                        unit_amount: Math.round(amount * 100),
                    },
                    quantity: 1,
                },
            ],
            ui_mode: 'embedded',
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/league/join/return?session_id={CHECKOUT_SESSION_ID}&season_id=${seasonId}`,
            metadata: {
                userId: user.id,
                seasonId: seasonId,
                leagueId: season.league_id
            },
        });

        return NextResponse.json({ clientSecret: session.client_secret });
    } catch (err: any) {
        console.error('Stripe Checkout Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
