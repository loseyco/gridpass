
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');

    try {
        let query = supabase
            .from('gp_checkins')
            .select('*')
            .order('checked_in_at', { ascending: false });

        if (event_id) query = query.eq('event_id', event_id);

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            meta: { total: data.length }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!body.event_id || !body.user_id_to_checkin) {
            return NextResponse.json({
                success: false,
                error: { code: "VALIDATION_ERROR", message: "Event ID and User ID to checkin are required." }
            }, { status: 400 });
        }

        // 1. Verify Event Exists
        const { data: event, error: eventError } = await supabase
            .from('gp_events')
            .select('id, name')
            .eq('id', body.event_id)
            .single();

        if (eventError || !event) {
            return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
        }

        // 2. Fetch Requirements (Optional: For Tier A, we act as Staff verifying manually)
        // TODO: Auto-verify against gp_credentials

        // 3. Create Check-in
        const { data, error } = await supabase
            .from('gp_checkins')
            .insert({
                event_id: body.event_id,
                user_id: body.user_id_to_checkin,
                role_to_checkin: body.role || 'Attendee',
                checked_in_by: user.id,
                method: body.method || 'manual'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            message: `User checked into ${event.name}`
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
