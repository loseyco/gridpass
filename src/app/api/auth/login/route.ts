import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { email, password } = await request.json();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: { user: data.user, session: data.session } }, { status: 200 });
}
