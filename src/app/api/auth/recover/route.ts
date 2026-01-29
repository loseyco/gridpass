import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const body = await request.json();
    const { email } = body;

    if (!email) {
        return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password reset email sent." }, { status: 200 });
}
