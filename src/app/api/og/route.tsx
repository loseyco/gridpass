import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const title = searchParams.get('title') || 'GRIDPASS';
    const description = searchParams.get('desc') || 'Whether you race it, show it, cook it, or capture it — Gridpass brings your world together.';
    const badge = searchParams.get('badge') || 'Gridpass Engine Online';

    return new ImageResponse(
      (
        <div
          style={{
            background: '#060608',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '80px',
          }}
        >
          {/* Sleek tech grid overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(189, 41, 37, 0.04) 2px, transparent 0)',
              backgroundSize: '40px 40px',
              opacity: 0.8,
            }}
          />

          {/* Ambient red HSL glow */}
          <div
            style={{
              position: 'absolute',
              width: '600px',
              height: '350px',
              borderRadius: '100%',
              background: 'radial-gradient(circle, rgba(189, 41, 37, 0.12) 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              filter: 'blur(60px)',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              gap: '20px',
            }}
          >
            {/* Logo Brand SVG Group */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
              }}
            >
              {/* The Mountain Track SVG Logo */}
              <svg
                width="120"
                height="100"
                viewBox="0 0 120 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Mountain Peaks */}
                <path
                  d="M10 70 L42 22 L65 52 L88 28 L110 70 Z"
                  fill="#121214"
                  stroke="#f4f4f7"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                {/* Ridge highlights */}
                <path
                  d="M42 22 L52 42 M88 28 L98 48"
                  stroke="#525252"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Asphalt racetrack road */}
                <path
                  d="M18 86 C 48 86, 56 59, 96 59"
                  stroke="#262626"
                  strokeWidth="15"
                  strokeLinecap="round"
                />
                {/* Curb stripes */}
                <path
                  d="M18 90 C 48 90, 56 63, 96 63"
                  stroke="#f4f4f7"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
                <path
                  d="M18 90 C 48 90, 56 63, 96 63"
                  stroke="#bd2925"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeDasharray="9 9"
                />
              </svg>

              {/* Typography brand name */}
              <div
                style={{
                  display: 'flex',
                  fontSize: '80px',
                  fontWeight: 900,
                  letterSpacing: '-0.06em',
                  color: '#ffffff',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                GRID<span style={{ color: '#bd2925' }}>PASS</span>
              </div>
            </div>

            {/* Custom dynamic title */}
            {title !== 'GRIDPASS' && (
              <div
                style={{
                  fontSize: '44px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  maxWidth: '900px',
                  fontFamily: 'system-ui, sans-serif',
                  marginTop: '10px',
                }}
              >
                {title}
              </div>
            )}

            {/* Custom dynamic description */}
            <div
              style={{
                fontSize: '22px',
                fontWeight: 500,
                color: '#a3a3a3',
                textAlign: 'center',
                maxWidth: '900px',
                lineHeight: 1.4,
                letterSpacing: '-0.02em',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {description}
            </div>
          </div>

          {/* Bottom clean status badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '99px',
              background: '#121214',
              border: '1px solid #262626',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '100%',
                background: '#bd2925',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#d4d4d4',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {badge}
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
