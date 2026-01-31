import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // 1. Authenticate User
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    // 2. Verify Code (Admin privileges needed to search global codes?)

    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: codeEntry, error: codeError } = await adminClient
        .from('device_codes')
        .select('*')
        .eq('code', code)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

    if (codeError || !codeEntry) {
        return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 });
    }

    // 3. Link Device
    // Find Device
    const { data: device, error: deviceError } = await adminClient
        .from('devices')
        .select('*')
        .eq('hardware_id', codeEntry.device_hardware_id)
        .single();

    if (deviceError || !device) {
        return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Update Device
    const { error: linkError } = await adminClient
        .from('devices')
        .update({
            user_id: user.id,
            name: device.name || `PC-${code}` // Keep existing name or fallback
        })
        .eq('id', device.id);

    if (linkError) return NextResponse.json({ error: 'Failed to link device' }, { status: 500 });

    // 4. Mark Code as Used
    await adminClient
        .from('device_codes')
        .update({ status: 'linked' })
        .eq('code', code);

    return NextResponse.json({ success: true, device_id: device.id, name: device.name });
}
