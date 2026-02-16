import { NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/video/youtube';

export const dynamic = 'force-dynamic';

export async function GET() {
    const oauth2Client = getOAuth2Client();

    const scopes = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
    ];

    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/auth/youtube/callback';

    console.log('YouTube Auth Debug:', {
        hasClientId: !!process.env.YOUTUBE_CLIENT_ID,
        redirectUri,
        scopes
    });

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        redirect_uri: redirectUri // Explicitly passing it to ensure it's in the URL
    });

    console.log('Generated Auth URL:', url);

    return NextResponse.redirect(url);
}
