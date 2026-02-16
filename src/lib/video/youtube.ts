import { google } from 'googleapis';
import { createAdminClient } from '@/utils/supabase/admin';

// Initialize OAuth2 client
export const getOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/auth/youtube/callback'
    );
};

export async function uploadVideo(
    title: string,
    description: string,
    videoBuffer: Buffer, // Or stream
    privacyStatus: 'private' | 'unlisted' | 'public' = 'private'
) {
    const supabase = createAdminClient();

    // Get stored refresh token
    // In a real app, this might be stored per user. For a system bot, we store it in a config table or env.
    // We'll use a 'system_settings' table or similar, assuming row id 'youtube_bot'
    const { data: settings } = await supabase
        .from('os_system_settings') // We need to create this or store in env if it was static (but refresh tokens change)
        .select('value')
        .eq('key', 'youtube_refresh_token')
        .single();

    const refreshToken = settings?.value?.token || process.env.YOUTUBE_REFRESH_TOKEN;

    if (!refreshToken) {
        throw new Error('No YouTube refresh token found. Please authenticate first.');
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    try {
        const res = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title,
                    description,
                    tags: ['racing', 'news', 'motorsport', 'gridpass', 'shorts'],
                    categoryId: '17', // Sports
                },
                status: {
                    privacyStatus,
                    selfDeclaredMadeForKids: false,
                },
            },
            media: {
                body: videoBuffer, // ReadableStream is better for large files
            },
        });

        return res.data;
    } catch (error) {
        console.error('YouTube Upload Error:', error);
        throw error;
    }
}
