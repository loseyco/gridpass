import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { sessionId, password } = await request.json();

        if (!sessionId || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get session to find the user
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const leadId = session.client_reference_id;

        if (!leadId) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
        }

        // Get lead data
        const { data: lead } = await supabaseAdmin
            .from('resume_leads')
            .select('user_id, email')
            .eq('id', leadId)
            .single();

        if (!lead || !lead.user_id) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update user password via Supabase Admin
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            lead.user_id,
            { password: password }
        );

        if (updateError) {
            console.error('Error setting password:', updateError);
            return NextResponse.json({ error: 'Failed to set password' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in set-password:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
