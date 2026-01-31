import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Use Service Role to bypass RLS for device management
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { hardware_id, capabilities, name } = await request.json();

    if (!hardware_id) {
        return NextResponse.json({ error: 'Missing hardware_id' }, { status: 400 });
    }

    // 1. Check if device exists
    const { data: existingDevice, error: fetchError } = await adminClient
        .from('devices')
        .select('*')
        .eq('hardware_id', hardware_id)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = JSON object requested, multiple (or no) rows returned - effectively "Not Found" if using .single()
        return NextResponse.json({ error: 'Database error', details: fetchError }, { status: 500 });
    }

    // 2. If valid device found
    if (existingDevice) {
        // A. If linked to a user -> Start Session
        if (existingDevice.user_id) {
            // Create session
            const { data: session, error: sessionError } = await adminClient
                .from('sessions')
                .insert({
                    device_id: existingDevice.id,
                    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
                    user_agent: request.headers.get('user-agent')
                })
                .select() // Return the session
                .single();

            if (sessionError) return NextResponse.json({ error: 'Session creation failed' }, { status: 500 });

            // Update Status
            await adminClient.from('devices').update({ status: 'online', last_seen_at: new Date().toISOString() }).eq('id', existingDevice.id);

            return NextResponse.json({
                status: 'linked',
                device_id: existingDevice.id,
                session_id: session.id,
                user_id: existingDevice.user_id
            });
        }

        // B. If NOT linked -> Return Pending / Generate Code
        // Check if valid code exists
        const { data: existingCode } = await adminClient
            .from('device_codes')
            .select('*')
            .eq('device_hardware_id', hardware_id)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .single();

        if (existingCode) {
            return NextResponse.json({ status: 'setup', code: existingCode.code });
        }
    }

    // 3. Register New Device (or re-register unlinked)
    // Upsert device to ensure it exists
    const { data: newDevice, error: upsertError } = await adminClient
        .from('devices')
        .upsert(
            {
                hardware_id,
                name: name || `PC-${hardware_id.substring(0, 6)}`,
                capabilities: capabilities || {},
                last_seen_at: new Date().toISOString()
            },
            { onConflict: 'hardware_id' }
        )
        .select()
        .single();

    if (upsertError) return NextResponse.json({ error: 'Device registration failed', details: upsertError }, { status: 500 });

    // Generate Code
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // Simple 6 digit
    // Insert Code
    const { error: codeError } = await adminClient
        .from('device_codes')
        .insert({
            code,
            device_hardware_id: hardware_id,
            status: 'pending'
        });

    if (codeError) return NextResponse.json({ error: 'Code generation failed' }, { status: 500 });

    return NextResponse.json({ status: 'setup', code });
}
