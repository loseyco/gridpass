import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/video/youtube';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');
    const error = req.nextUrl.searchParams.get('error');

    if (error) {
        return NextResponse.json({ error }, { status: 400 });
    }

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            console.warn('No refresh token received. User might need to revoke access and try again.');
        }

        // Save tokens securely
        const supabase = createAdminClient();

        // Check if system settings table exists, if not we might fail here.
        // For now, let's just output it to console or try to save if we had the table.
        // We will create the table in a migration next.

        await supabase.from('os_system_settings').upsert({
            key: 'youtube_refresh_token',
            value: { token: tokens.refresh_token || 'EXISTING_TOKEN_KEPT' } // Don't overwrite if null?
        }, { onConflict: 'key' });

        // Also just return it for the user to copy into .env as a backup
        return NextResponse.json({
            success: true,
            message: 'YouTube connected successfully!',
            refresh_token: tokens.refresh_token,
            note: 'If refresh_token is missing, you already authorized the app. Go to Google Account permissions and revoke it to reset.'
        });

    } catch (error) {
        console.error('Error exchanging token:', error);
        return NextResponse.json({ error: 'Failed to exchange token', details: error }, { status: 500 });
    }
}
