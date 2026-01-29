
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { method, path, status, response_ms } = await req.json();

    if (!method || !path || !status) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Update or Insert (Upsert behavior is useful if script finds new endpoints)
    const { data, error } = await supabase
        .from('sys_api_registry')
        .upsert({
            method,
            path,
            status,
            last_verified_at: new Date().toISOString(),
            last_response_ms: response_ms || 0
        }, { onConflict: 'method, path' })
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
