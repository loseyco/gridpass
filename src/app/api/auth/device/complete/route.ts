import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // User must be logged in to complete the flow
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
        }

        // Try parsing body
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const { user_code, session } = body;

        if (!user_code || !session) {
            return NextResponse.json({ error: 'Missing code or session' }, { status: 400 });
        }

        // Verify code exists and is pending
        const { data: requestRecord, error: fetchError } = await supabase
            .from('auth_device_requests')
            .select('id, status')
            .eq('user_code', user_code)
            .single();

        if (fetchError || !requestRecord) {
            return NextResponse.json({ error: 'Invalid code or not found', details: fetchError?.message }, { status: 404 });
        }

        if (requestRecord.status !== 'pending') {
            return NextResponse.json({ error: 'Code expired or already used' }, { status: 400 });
        }

        // Update the request with the session data and mark complete
        const { error: updateError } = await supabase
            .from('auth_device_requests')
            .update({
                status: 'completed',
                session_data: session
            })
            .eq('id', requestRecord.id);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to link device', details: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Complete error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
