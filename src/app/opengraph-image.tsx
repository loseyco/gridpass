import { ImageResponse } from 'next/og';

export const alt = 'Gridpass | One Tag for Everything';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
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
            gap: '30px',
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
            {/* Official Gridpass Original Logo Emblem */}
            <svg
              width="150"
              height="125"
              viewBox="0 0 400 350"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 30 205 L 95 88 L 115 185 L 170 40 L 195 145 L 250 85 L 280 155 Z" fill="#ffffff" />
              <path d="M 95 88 L 110 170 M 170 40 L 188 135 M 250 85 L 265 148" stroke="#0a0a0c" strokeWidth="7" strokeLinecap="round" />
              <g>
                <path d="M 285 170 C 270 172, 230 185, 205 190 L 225 210 C 250 205, 290 190, 305 188 Z" fill="#ffffff" />
                <path d="M 205 190 C 180 195, 150 215, 135 225 L 155 245 C 170 235, 200 215, 225 210 Z" fill="#ff3b30" />
                <path d="M 135 225 C 120 235, 95 260, 80 275 L 105 298 C 120 280, 145 258, 155 245 Z" fill="#ffffff" />
                <path d="M 80 275 C 65 290, 35 330, 25 345 L 55 370 C 65 352, 95 315, 105 298 Z" fill="#ff3b30" />
                <path d="M 25 345 C 18 355, 10 368, 5 378 L 38 395 C 42 385, 48 375, 55 370 Z" fill="#ffffff" />
              </g>
              <path d="M 335 170 C 300 175, 220 200, 195 245 C 170 290, 175 350, 170 380 L 210 380 C 215 340, 215 285, 240 240 C 260 205, 320 188, 345 182 Z" fill="#ff3b30" />
            </svg>

            {/* Typography brand name */}
            <div
              style={{
                display: 'flex',
                fontSize: '90px',
                fontWeight: 900,
                letterSpacing: '-0.06em',
                color: '#ffffff',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              GRID<span style={{ color: '#bd2925' }}>PASS</span>
            </div>
          </div>

          {/* Value pitch description */}
          <div
            style={{
              fontSize: '26px',
              fontWeight: 500,
              color: '#a3a3a3',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
              letterSpacing: '-0.02em',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Whether you race it, show it, cook it, or capture it — Gridpass brings your world together with One Universal Tag.
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
            Gridpass Engine Online
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
