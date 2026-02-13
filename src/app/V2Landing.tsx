'use client'

import Link from 'next/link'
import { Trophy, Wrench, Users, ChevronRight, CheckCircle2 } from 'lucide-react'

export default function V2Landing() {
    return (
        <div className="landing-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="pulsing-dot"></span>
                        ALPHA: Season 2026
                    </div>
                    <h1 className="hero-title">
                        THE MOTORSPORT<br />
                        <span className="text-accent">CAREER NETWORK</span>
                    </h1>
                    <p className="hero-subtitle">
                        Build your resume, manage your Car Collection, and connect with others.
                        The professional network for the motorsports world.
                    </p>
                    <div className="hero-actions">
                        <Link href="/register" className="v2-btn v2-btn-primary v2-btn-lg">
                            Join The Grid <ChevronRight size={20} />
                        </Link>
                        <Link href="/login" className="v2-btn v2-btn-secondary v2-btn-lg">
                            Login
                        </Link>
                    </div>
                </div>
            </section>

            <style jsx>{`
        .landing-container {
            padding-bottom: 80px; /* Space for bottom tab bar if visible */
            width: 100%;
        }

        .hero-section {
            padding: 6rem 1rem 4rem;
            text-align: center;
            background: radial-gradient(circle at top center, rgba(225, 6, 0, 0.15) 0%, transparent 70%);
            width: 100%;
        }

        .hero-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 6px 12px;
            border-radius: 100px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 1.5rem;
            color: var(--v2-text-secondary);
        }

        .pulsing-dot {
            width: 8px;
            height: 8px;
            background: #00ff00;
            border-radius: 50%;
            box-shadow: 0 0 8px #00ff00;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
        }

        .hero-title {
            font-family: var(--v2-font-racing);
            font-size: 3rem;
            line-height: 0.9;
            font-weight: 900;
            font-style: italic;
            text-transform: uppercase;
            margin-bottom: 1.5rem;
            letter-spacing: -0.02em;
        }

        .text-accent {
            color: var(--v2-accent-primary);
        }

        .hero-subtitle {
            font-size: 1.1rem;
            color: var(--v2-text-secondary);
            max-width: 600px;
            margin: 0 auto 2.5rem;
            line-height: 1.5;
        }

        .hero-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
        }

        .v2-btn-lg {
            padding: 1rem 2rem;
            font-size: 1rem;
            height: 54px;
        }

        .features-section {
            padding: 4rem 1rem;
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
        }

        .section-title {
            font-family: var(--v2-font-racing);
            font-size: 2rem;
            font-style: italic;
            text-transform: uppercase;
            text-align: center;
            margin-bottom: 3rem;
            color: white;
        }

        .features-grid {
            display: grid;
            gap: 1.5rem;
        }

        .feature-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--v2-radius-md);
            padding: 2rem;
            transition: transform 0.2s;
            display: flex;
            flex-direction: column;
        }

        .feature-card:hover {
            transform: translateY(-4px);
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.15);
        }

        .feature-icon {
            width: 64px;
            height: 64px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .bg-accent { background: var(--v2-accent-primary); }
        .bg-dark { background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1); }

        .feature-card h3 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: white;
            text-transform: uppercase;
            font-style: italic;
        }

        .feature-card p {
            color: var(--v2-text-secondary);
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
            flex-grow: 1;
        }

        .feature-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .feature-list li {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: var(--v2-text-tertiary);
            font-size: 0.95rem;
            font-weight: 500;
        }

        .landing-footer {
            margin-top: 4rem;
            border-top: 1px solid rgba(255,255,255,0.05);
            padding: 3rem 1rem;
            text-align: center;
            color: var(--v2-text-tertiary);
            font-size: 0.9rem;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
        }

        .footer-links {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-top: 1.5rem;
        }

        .footer-links a {
            color: var(--v2-text-secondary);
            text-decoration: none;
            transition: color 0.2s;
        }

        .footer-links a:hover {
            color: white;
        }

        @media (min-width: 768px) {
            .hero-title {
                font-size: 5rem;
            }
            .hero-subtitle {
                font-size: 1.25rem;
            }
            .hero-actions {
                flex-direction: row;
                max-width: 440px;
            }
            .features-grid {
                grid-template-columns: repeat(3, 1fr);
                gap: 2rem;
            }
        }
      `}</style>
        </div>
    )
}
