import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

// const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key_for_build');
    const body = await request.text();
    const headersList = await headers(); // Await the headers() promise
    const signature = headersList.get('stripe-signature')!; // Use headersList

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const type = session.metadata?.type;

        if (userId && type === 'founder_membership') {
            console.log(`Processing Founder Upgrade for User: ${userId}`);

            // 1. Update User Role
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    role: 'founder', // Assuming role column exists, or use metadata
                    // If you use a separate tiers column: membership_tier: 'founder'
                })
                .eq('id', userId);

            if (error) {
                console.error('Failed to update user role:', error);
                return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
            }

            // 2. Send Welcome Email
            try {
                if (session.customer_details?.email) {
                    await resend.emails.send({
                        from: 'GridPass Founders <founders@gridpass.app>',
                        to: session.customer_details.email,
                        subject: 'Welcome to the Founding 100',
                        html: `
                            <div style="font-family: sans-serif; color: #333;">
                                <h1>Welcome to the Inner Circle.</h1>
                                <p>You have successfully secured your spot in the GridPass Founding 100.</p>
                                <p>Your profile now displays the exclusive <strong>Founder Badge</strong>.</p>
                                <br/>
                                <a href="https://gridpass.app/dashboard" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                                    Access Founder Dashboard
                                </a>
                            </div>
                        `
                    });
                }
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
            }
        } else if (type === 'donation') {
            console.log(`Donation received from ${userId || 'Guest'} - Amount: ${(session.amount_total || 0) / 100}`);
            // TODO: Add donation tracking table if needed
        }
    }

    return NextResponse.json({ received: true });
}
