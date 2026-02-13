import { ImageResponse } from 'next/og';


export const runtime = 'edge';

export const alt = 'GridPass Exclusive Invitation';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

// 1. Safe searchParams handling for Next.js 15+
export default async function Image({ searchParams }: { searchParams: Promise<{ token?: string }> | { token?: string } }) {
    let role = 'MEMBER';
    let note: string | null = null;
    let valid = false;

    // Default colors
    const colors: Record<string, string> = {
        FOUNDER: '#fbbf24', // Amber/Gold
        ADMIN: '#ef4444',   // Red
        MEMBER: '#34d399',  // Emerald
        DRIVER: '#ffffff',  // White
    };

    try {
        // Await searchParams if it's a promise
        const resolvedParams = await searchParams;
        const token = resolvedParams?.token;

        if (token) {
            // Use direct fetch to avoid cookie issues on Edge Runtime
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (supabaseUrl && supabaseKey) {
                // Determine protocol - usually https, but helpful to be explicit if needed
                // Using simple fetch to RPC
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_invite_by_token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`
                    },
                    body: JSON.stringify({ lookup_token: token })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && !data.used_at) {
                        role = data.role || 'MEMBER';
                        note = data.note || null;
                        valid = true;
                    }
                }
            }
        }
    } catch (e) {
        console.error('OG Generation Error:', e);
        // Fallback to default state on error
        role = 'MEMBER';
        valid = false;
    }

    const accentColor = colors[role.toUpperCase()] || colors.DRIVER;

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0a0a0a',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                {/* Background Pattern */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(circle at 25px 25px, #262626 2%, transparent 0%), radial-gradient(circle at 75px 75px, #262626 2%, transparent 0%)',
                        backgroundSize: '100px 100px',
                        opacity: 0.2,
                    }}
                />

                {/* Main Card */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${valid ? accentColor : '#333'}`,
                        borderRadius: '24px',
                        padding: '40px 80px',
                        backgroundColor: '#171717',
                        boxShadow: valid ? `0 0 50px -12px ${accentColor}40` : 'none',
                        position: 'relative',
                    }}
                >
                    {/* Logo Area */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{
                            fontSize: '32px',
                            fontWeight: 900,
                            color: '#fff',
                            letterSpacing: '-1px',
                            fontStyle: 'italic'
                        }}>
                            GRID<span style={{ color: '#ef4444' }}>PASS</span>
                        </div>
                    </div>

                    {valid ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                                fontSize: '24px',
                                color: '#a3a3a3',
                                textTransform: 'uppercase',
                                letterSpacing: '4px',
                                marginBottom: '12px',
                                fontWeight: 700,
                            }}>
                                You Are Invited
                            </div>

                            <div style={{
                                fontSize: '72px',
                                fontWeight: 900,
                                color: accentColor,
                                textTransform: 'uppercase',
                                letterSpacing: '-2px',
                                lineHeight: '1',
                                marginBottom: '16px',
                                textShadow: `0 0 20px ${accentColor}40`,
                            }}>
                                {role}
                            </div>

                            {note && (
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    marginBottom: '24px',
                                    fontStyle: 'italic',
                                    opacity: 0.9,
                                }}>
                                    For: {note}
                                </div>
                            )}

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px 24px',
                                background: 'white',
                                borderRadius: '12px',
                            }}>
                                <div style={{
                                    color: 'black',
                                    fontWeight: 900,
                                    fontSize: '20px',
                                    textTransform: 'uppercase',
                                }}>
                                    Access Granted
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                                fontSize: '48px',
                                fontWeight: 900,
                                color: '#fff',
                                marginBottom: '16px',
                            }}>
                                Join The Grid
                            </div>
                            <div style={{
                                fontSize: '24px',
                                color: '#737373',
                            }}>
                                The Business Operating System for Racing
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer URL */}
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    color: '#525252',
                    fontSize: '20px',
                    fontWeight: 600,
                    letterSpacing: '1px',
                }}>
                    gridpass.app
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
