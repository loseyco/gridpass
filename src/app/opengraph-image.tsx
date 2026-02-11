import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const alt = 'GridPass - The Business Operating System for Racing';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
    // Font loading (using standard fonts available in edge)
    // In a real app we might load a custom font, but system fonts work for now

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #0a0a0a, #171717)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                    color: 'white',
                    position: 'relative',
                }}
            >
                {/* Background Grid Pattern */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
                        backgroundSize: '40px 40px',
                        opacity: 0.5,
                    }}
                />

                {/* Glow Effect */}
                <div
                    style={{
                        position: 'absolute',
                        top: '20%',
                        left: '30%',
                        width: '40%',
                        height: '40%',
                        background: 'rgba(99, 102, 241, 0.15)',
                        filter: 'blur(100px)',
                        borderRadius: '50%',
                    }}
                />

                {/* Content Container */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 10,
                        padding: '40px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                        background: 'rgba(10,10,10,0.5)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    }}
                >
                    {/* Logo Mark (Simulated) */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#6366f1', // Indigo-500
                            borderRadius: '16px',
                            fontSize: '40px',
                            fontWeight: 900,
                            marginBottom: '30px',
                            boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
                        }}
                    >
                        G
                    </div>

                    <div
                        style={{
                            fontSize: '70px',
                            fontWeight: 900,
                            letterSpacing: '-0.05em',
                            marginBottom: '10px',
                            background: 'linear-gradient(to right, #ffffff, #a5b4fc)',
                            backgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        GridPass
                    </div>

                    <div
                        style={{
                            fontSize: '28px',
                            color: '#94a3b8',
                            textAlign: 'center',
                            maxWidth: '600px',
                            lineHeight: '1.4',
                            fontWeight: 500,
                        }}
                    >
                        The Business Operating System for Racing
                    </div>
                </div>

                {/* Footer Ribbon */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '8px',
                        background: 'linear-gradient(to right, #6366f1, #f59e0b)',
                    }}
                />
            </div>
        ),
        {
            ...size,
        }
    );
}
