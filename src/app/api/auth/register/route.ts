import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { email, password, full_name } = await request.json();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name }
        }
    });

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Check email for confirmation link", data: { user: data.user } }, { status: 201 });
}
