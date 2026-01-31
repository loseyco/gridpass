import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // 1. Queue Command (User -> Device)
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { device_id, command, payload } = await request.json();

    if (!device_id || !command) {
        return NextResponse.json({ error: 'Missing device_id or command' }, { status: 400 });
    }

    // Verify ownership
    const { data: device } = await supabase
        .from('devices')
        .select('user_id')
        .eq('id', device_id)
        .single();

    if (!device || device.user_id !== user.id) {
        return NextResponse.json({ error: 'Device not found or not owned' }, { status: 404 });
    }

    // Insert Command using Service Role (or user role if RLS permits, but Service Role is robust for queueing)
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { error: insertError } = await adminClient
        .from('command_queue')
        .insert({
            device_id,
            command,
            payload: payload || {},
            status: 'pending',
            created_by: user.id
        });

    if (insertError) return NextResponse.json({ error: 'Queue failed', details: insertError }, { status: 500 });

    return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
    // 2. Poll Commands (Device -> Server)
    const deviceId = request.headers.get('x-device-id');
    if (!deviceId) return NextResponse.json({ error: 'Missing Device ID' }, { status: 401 });

    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // Fetch pending commands
    const { data: commands, error } = await adminClient
        .from('command_queue')
        .select('*')
        .eq('device_id', deviceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });

    // Auto-mark as 'processed' (Simple ACK for now, ideally separate ACK)
    // We'll mark them sent.
    if (commands && commands.length > 0) {
        const ids = commands.map(c => c.id);
        await adminClient
            .from('command_queue')
            .update({ status: 'sent', processed_at: new Date().toISOString() })
            .in('id', ids);
    }

    return NextResponse.json({ commands: commands || [] });
}
