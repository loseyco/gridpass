import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const { refresh_token } = await request.json();

        if (!refresh_token) {
            return NextResponse.json({ error: 'Missing refresh token' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase.auth.refreshSession({ refresh_token });

        if (error) {
            console.error('Token refresh failed:', error);
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ session: data.session });
    } catch (error) {
        console.error('Refresh error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
