import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    let userId: string | null = null;

    // 1. Check if User is ALREADY Authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        userId = user.id;
        console.log("Using existing session for user:", userId);
    } else {
        // 2. If NOT authenticated, Create New User
        // Note: In "Real" world, we might want to check if email exists first?
        // Supabase signUP handles this (returns user if not email confirmed, or error if exists).

        if (!email || !password) {
            return NextResponse.json({ error: "Missing Credentials" }, { status: 400 });
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { first_name: firstName, last_name: lastName }
            }
        });

        if (authError) {
            // If user already exists, we return error and tell them to login?
            // Or we could silently proceed if we want? Better to be explicit for safety.
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        userId = authData.user?.id || null;
    }

    if (!userId) {
        return NextResponse.json({ error: "User identification failed" }, { status: 500 });
    }

    // 2. Record Transaction (Mock Payment of $1,500)
    const { error: txError } = await supabase.from('gp_transactions').insert({
        user_id: userId,
        amount: 1500.00,
        description: 'Founding Member Pass (Lifetime)',
        status: 'completed'
    });

    if (txError) {
        console.error('Transaction Error:', txError);
    }

    // 3. Assign Role (Upsert to ensure we don't duplicate error if they re-buy?)
    // Actually, Roles are usually Unique per user/type.
    const { error: roleError } = await supabase.from('gp_roles').insert({
        user_id: userId,
        role_type: 'Founder',
        season_year: new Date().getFullYear(),
        verified: true
    });

    if (roleError) {
        console.error('Role Assignment Error:', roleError);
        // It might fail if already exists, which is fine.
    }

    return NextResponse.json({ success: true, userId });
}
