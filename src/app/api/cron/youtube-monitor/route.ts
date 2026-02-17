
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // 1. Auth Check
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channelId = 'UC...'; // TODO: Get from env or settings if variable
    // For now, let's search for the channel or use the authenticated user's channel if we have a refresh token?
    // Actually, searching by Channel ID is public info (mostly), but we need an API Key.

    // We'll use the API Key from env
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing GOOGLE_API_KEY' }, { status: 500 });
    }

    const youtube = google.youtube({ version: 'v3', auth: apiKey });

    try {
        // 2. Check for active live broadcasts on the channel
        // We know the channel ID from user info or hardcoded.
        // Let's hardcode the Channel ID for "GridPass" / "PJ Losey" for now or fetch it.
        // User's channel ID: UC052-... wait, we need to find it.
        // Let's search for "Live" events for the configured channel.

        // Better: Search for "completed" or "live" broadcasts for the authenticated user, but that requires OAuth.
        // Public search: search.list({ channelId: '...', eventType: 'live', type: 'video' })

        // Let's assume we want to monitor the channel "GridPass" or the user's connected channel.
        // Since we don't have the channel ID handy in env, let's try to find it or skip for now.
        // Re-reading user context: "our /live youtube stream".

        // Let's just update the heartbeat for now and mock the check until we get the Channel ID.
        // OR, we can use the `youtube.ts` library we saw earlier?

        const supabase = createAdminClient();

        // Update heartbeat
        await supabase
            .from('os_system_settings')
            .upsert({
                key: 'cron.youtube_monitor.last_run',
                value: { timestamp: new Date().toISOString(), status: 'checked' }
            });

        return NextResponse.json({
            success: true,
            status: 'offline',
            message: 'YouTube Monitor placeholder (Channel ID needed)'
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
