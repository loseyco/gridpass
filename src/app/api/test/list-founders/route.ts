import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    // Bypassing RLS with Service Role
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all profiles with role 'founder'
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'founder');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        count: profiles.length,
        profiles
    });
}
