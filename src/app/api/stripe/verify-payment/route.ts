import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
        return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    try {
        // Retrieve Stripe session
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent']
        });

        console.log('Session status:', session.status, 'Payment status:', session.payment_status);

        if (session.status === 'complete' || session.payment_status === 'paid') {
            // Find the resume lead by client_reference_id
            const leadId = session.client_reference_id;

            if (!leadId) {
                console.error('No client_reference_id found in session');
                return NextResponse.json({
                    success: false,
                    error: 'Invalid session data'
                });
            }

            // Get lead data
            const { data: lead, error: leadError } = await supabaseAdmin
                .from('resume_leads')
                .select('*, user_id')
                .eq('id', leadId)
                .single();

            if (leadError || !lead) {
                console.error('Lead not found:', leadError);
                return NextResponse.json({
                    success: false,
                    error: 'Resume lead not found'
                });
            }

            if (!lead.user_id) {
                console.error('No user_id associated with lead');
                return NextResponse.json({
                    success: false,
                    error: 'No user account found'
                });
            }

            // Get profile username for redirect
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('username')
                .eq('id', lead.user_id)
                .single();

            if (profileError || !profile) {
                console.error('Profile not found:', profileError);
                return NextResponse.json({
                    success: false,
                    error: 'Profile not found'
                });
            }

            // Get claim token
            const { data: tokenData, error: tokenError } = await supabaseAdmin
                .from('claim_tokens')
                .select('token')
                .eq('entity_id', lead.user_id)
                .eq('entity_type', 'lead')
                .single();

            if (tokenError || !tokenData) {
                console.error('Claim token not found:', tokenError);
                return NextResponse.json({
                    success: false,
                    error: 'Access token not found'
                });
            }

            // Update payment status to 'authorized'
            const paymentIntentId = typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id;

            const { error: updateError } = await supabaseAdmin
                .from('resume_leads')
                .update({
                    payment_status: 'authorized',
                    stripe_payment_intent_id: paymentIntentId
                })
                .eq('id', leadId);

            if (updateError) {
                console.error('Failed to update payment status:', updateError);
            }

            return NextResponse.json({
                success: true,
                profilePath: `/u/${profile.username}?secret=${tokenData.token}`,
                paymentStatus: 'authorized',
                email: lead.email
            });
        }

        // Payment not complete yet
        return NextResponse.json({
            success: false,
            error: 'Payment not completed',
            status: session.status
        });

    } catch (error: any) {
        console.error('Error verifying payment:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to verify payment' },
            { status: 500 }
        );
    }
}
