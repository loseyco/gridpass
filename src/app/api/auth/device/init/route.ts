import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Initialize admin client for creating codes (requires service role or just use RLS?)
// Actually we can use anon client if RLS allows insert.
// We enabled "public insert" in the migration.

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // Generate a simple 6-character code (e.g. ABCD-12)
        // or 8 characters. User suggested 6 digits.
        // Let's use 4 letters + 4 numbers? Or just 8 chars?
        // User said "6 digit code" in prompt, but implementation plan said "BC-8492".
        // Let's do 4 letters-4 numbers for uniqueness, or just 6 random chars.
        // 6 chars Base32 (no I, O, 1, 0) is good.

        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let userCode = '';
        for (let i = 0; i < 4; i++) userCode += chars.charAt(Math.floor(Math.random() * chars.length));
        userCode += '-';
        for (let i = 0; i < 4; i++) userCode += chars.charAt(Math.floor(Math.random() * chars.length));
        // Result: AAAA-9999 (9 chars total) - Easy to read.

        // Create record
        const { data, error } = await supabase
            .from('auth_device_requests')
            .insert({
                user_code: userCode,
                status: 'pending'
            })
            .select('user_code, device_secret, expires_at')
            .single();

        if (error) {
            console.error('Error creating device request:', error);
            return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
        }

        return NextResponse.json({
            user_code: data.user_code,
            device_secret: data.device_secret,
            expires_at: data.expires_at,
            verification_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/activate`
        });

    } catch (error) {
        console.error('Init error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
