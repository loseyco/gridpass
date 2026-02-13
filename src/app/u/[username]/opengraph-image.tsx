
import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export const alt = 'GridPass Profile';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { username: string } }) {
    const { username } = await params;

    // Initialize Supabase client
    // Note: We use the REST API URL and Anon Key ideally, but here we need Service Role for reliable fetching if RLS is strict?
    // Actually, profiles should be public.
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );



    try {
        // Fetch profile data
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', username)
            .single();

        if (!profile) {
            return new ImageResponse(
                (
                    <div
                        style={{
                            fontSize: 48,
                            background: '#0a0a0a',
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
                {
                    ...size,
                }
            );
        }

        const role = profile.role || 'Member';
        const points = profile.points || 0;
        const avatarUrl = profile.avatar_url;

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
                        color: 'white',
                        fontFamily: '"Inter", sans-serif',
                    }}
                >
                    {/* Background Gradient */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(to bottom right, #171717, #000000)',
                            zIndex: -1,
                        }}
                    />

                    {/* Accent Glow */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '800px',
                            height: '800px',
                            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
                            zIndex: 0,
                        }}
                    />

                    {/* Card Container */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            zIndex: 1,
                            padding: '60px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(23, 23, 23, 0.8)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            width: '1000px',
                            gap: '60px',
                        }}
                    >
                        {/* Avatar */}
                        <div
                            style={{
                                display: 'flex',
                                width: '280px',
                                height: '280px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '8px solid rgba(255, 255, 255, 0.05)',
                                background: '#1a1a1a',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Avatar"
                                    width="280"
                                    height="280"
                                    style={{
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                <div style={{ fontSize: '80px', color: '#555' }}>?</div>
                            )}
                        </div>

                        {/* Info */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                            }}
                        >
                            {/* Username */}
                            <div
                                style={{
                                    fontSize: '32px',
                                    color: '#a3a3a3',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                @{profile.username}
                            </div>

                            {/* Name */}
                            <div
                                style={{
                                    fontSize: '64px',
                                    fontWeight: 800,
                                    color: 'white',
                                    lineHeight: 1,
                                    marginBottom: '24px',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                                }}
                            >
                                {profile.full_name || profile.username}
                            </div>

                            {/* Role Badge */}
                            <div
                                style={{
                                    display: 'flex',
                                    background: 'rgba(99, 102, 241, 0.2)',
                                    color: '#818cf8',
                                    padding: '12px 32px',
                                    borderRadius: '99px',
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    width: 'fit-content',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '32px',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                }}
                            >
                                {role}
                            </div>

                            {/* Footer Stats */}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '40px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                    paddingTop: '32px',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '16px', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reputation</span>
                                    <span style={{ fontSize: '32px', color: 'white', fontWeight: 700 }}>{points}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '16px', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Member Since</span>
                                    <span style={{ fontSize: '32px', color: 'white', fontWeight: 700 }}>
                                        {new Date(profile.created_at).getFullYear()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Branding */}
                    <div style={{
                        position: 'absolute',
                        bottom: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        opacity: 0.6,
                    }}>
                        <div style={{ width: '12px', height: '12px', background: '#6366f1', borderRadius: '50%' }} />
                        <div style={{ fontSize: '24px', color: 'white', fontWeight: 700, letterSpacing: '0.2em' }}>GRIDPASS</div>
                    </div>

                </div>
            ),
            {
                ...size,
            }
        );
    } catch (e) {
        console.error('Error generating image:', e);
        return new Response('Error generating image', { status: 500 });
    }
}
