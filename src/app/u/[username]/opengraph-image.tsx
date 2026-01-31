import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'GridPass Racer Profile';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { username: string } }) {
    const { username } = await params;

    // Initialize Supabase client directly for Edge compatibility
    // We use the anon key since this is public data
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url, cover_image_url')
        .ilike('username', username)
        .single();

    if (!profile) {
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 48,
                        background: 'black',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                    }}
                >
                    GridPass Profile Not Found
                </div>
            ),
            { ...size }
        );
    }

    const displayName = profile.full_name || profile.username;

    // Check for JFIF which might crash Satori
    const isAvatarJfif = profile.avatar_url?.toLowerCase().endsWith('.jfif');
    const avatarUrlToUse = isAvatarJfif ? null : profile.avatar_url;

    return new ImageResponse(
        (
            <div
                style={{
                    background: '#0a0a0a',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {/* Background Layer with Cover Image */}
                {profile.cover_image_url ? (
                    <img
                        src={profile.cover_image_url}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '1200px',
                            height: '630px',
                            objectFit: 'cover',
                            opacity: 0.4
                        }}
                    />
                ) : (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '1200px',
                            height: '630px',
                            background: 'linear-gradient(to bottom right, #1a1a1a, #000000)',
                            opacity: 0.5
                        }}
                    />
                )}

                {/* Content Layer */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    padding: '40px',
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                    {/* Avatar */}
                    <div style={{
                        width: '180px',
                        height: '180px',
                        borderRadius: '90px',
                        overflow: 'hidden',
                        border: '4px solid #ffffff',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#333'
                    }}>
                        {avatarUrlToUse ? (
                            <img src={avatarUrlToUse} width="180" height="180" style={{ objectFit: 'cover' }} />
                        ) : (
                            <div style={{ fontSize: 60, color: '#666', display: 'flex' }}>?</div>
                        )}
                    </div>

                    {/* Text Info */}
                    <div style={{ display: 'flex', fontSize: 64, fontWeight: 900, color: 'white', marginBottom: '8px', textAlign: 'center' }}>
                        {displayName}
                    </div>
                    <div style={{ display: 'flex', fontSize: 32, color: '#a3a3a3', fontWeight: 500 }}>
                        @{profile.username}
                    </div>

                    {/* GridPass Branding Badge */}
                    <div style={{
                        marginTop: '32px',
                        background: '#4f46e5',
                        color: 'white',
                        padding: '8px 24px',
                        borderRadius: '50px',
                        fontSize: 20,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                    }}>
                        GRIDPASS RACER
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
