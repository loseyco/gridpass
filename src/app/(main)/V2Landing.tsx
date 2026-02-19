'use client'

import Link from 'next/link'
import { Trophy, Wrench, Users, ChevronRight, CheckCircle2, Flag, Briefcase, Car, Gamepad2, ShoppingBag } from 'lucide-react'
import AppIcon from '@/components/os/AppIcon'
import UserCard from '@/components/profile/UserCard'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function V2Landing() {
    const [founderProfile, setFounderProfile] = useState<any>(null)

    useEffect(() => {
        const fetchFounder = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('username', 'pjlosey')
                .single()

            if (data) {
                setFounderProfile(data)
            }
        }
        fetchFounder()
    }, [])

    return (
        <div className="landing-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">

                    {/* Brand Logo */}
                    <div className="brand-logo mb-8">
                        <span className="text-white text-4xl font-black italic tracking-tighter">GRID</span>
                        <span className="text-accent text-4xl font-black italic tracking-tighter">PASS</span>
                    </div>

                    <div className="hero-badge">
                        <span className="pulsing-dot"></span>
                        SEASON 2026: LIVE
                    </div>
                    <h1 className="hero-title">
                        OPTIMIZE YOUR<br />
                        <span className="text-accent">RACING LIFE</span>
                    </h1>
                    <p className="hero-subtitle">
                        The operating system for your career, garage, and team. Earn money between races, or hire the best in the paddock.
                    </p>
                    <div className="hero-actions">
                        <Link href="/register" className="v2-btn v2-btn-primary v2-btn-lg">
                            Launch App <ChevronRight size={20} />
                        </Link>
                        <Link href="/services" className="v2-btn v2-btn-secondary v2-btn-lg">
                            Find Talent / Services
                        </Link>
                    </div>
                </div>
            </section>

            {/* OS Preview Section */}
            <section className="os-preview-section">
                <div className="os-preview-container">
                    <h2 className="section-title">ONE APP. ENDLESS POSSIBILITIES.</h2>
                    <p className="section-subtitle">Manage every aspect of your motorsports life from a single dashboard.</p>

                    <div className="preview-grid">
                        <div className="preview-item">
                            <AppIcon label="Profile" icon={Users} color="#007AFF" status="disabled" />
                            <span>Build Your Brand</span>
                        </div>
                        <div className="preview-item">
                            <AppIcon label="Garage" icon={Car} color="#FF3B30" status="disabled" />
                            <span>Track Assets</span>
                        </div>
                        <div className="preview-item">
                            <AppIcon label="Career" icon={Trophy} color="#FF9500" status="disabled" />
                            <span>Get Sponsorship</span>
                        </div>
                        <div className="preview-item">
                            <AppIcon label="Services" icon={Briefcase} color="#34C759" status="disabled" />
                            <span>Find Work</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why GridPass Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2 className="section-title">BUILT FOR RACERS</h2>
                    <p className="section-subtitle">Whether you're a driver, team owner, or shop manager, GridPass OS scales with your career.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon bg-accent">
                            <Briefcase size={32} color="white" />
                        </div>
                        <h3>Gig Economy</h3>
                        <p>Fund your season by offering your skills—fabrication, coaching, transport, and more. Or find the help you need.</p>
                        <ul className="feature-list">
                            <li><CheckCircle2 size={16} /> Verified Talent</li>
                            <li><CheckCircle2 size={16} /> Instant Booking</li>
                            <li><CheckCircle2 size={16} /> Secure Payments</li>
                        </ul>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon bg-dark">
                            <Wrench size={32} color="white" />
                        </div>
                        <h3>Garage Management</h3>
                        <p>Keep track of your chassis, engines, and parts. Log maintenance, setup sheets, and asset history.</p>
                        <ul className="feature-list">
                            <li><CheckCircle2 size={16} /> Asset Tracking</li>
                            <li><CheckCircle2 size={16} /> Setup Database</li>
                            <li><CheckCircle2 size={16} /> Maintenance Logs</li>
                        </ul>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon bg-dark">
                            <Users size={32} color="white" />
                        </div>
                        <h3>Team Command</h3>
                        <p>Manage your personnel, logistics, and operations. Streamline communication and planning.</p>
                        <ul className="feature-list">
                            <li><CheckCircle2 size={16} /> Staff Rosters</li>
                            <li><CheckCircle2 size={16} /> Logistics Planning</li>
                            <li><CheckCircle2 size={16} /> Partner Management</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Vision / Roadmap Section */}
            <section className="roadmap-section">
                <h2 className="section-title">COMING SOON TO OS</h2>
                <div className="roadmap-grid">
                    <div className="roadmap-item">
                        <ShoppingBag size={24} className="mb-2" />
                        <h4>Classifieds</h4>
                        <p>Buy/Sell parts & cars</p>
                    </div>
                    <div className="roadmap-item">
                        <Gamepad2 size={24} className="mb-2" />
                        <h4>Sim Racing</h4>
                        <p>Leagues & Setup Shops</p>
                    </div>
                    <div className="roadmap-item">
                        <Trophy size={24} className="mb-2" />
                        <h4>Driver Profiles</h4>
                        <p>Rich Media & Stats</p>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="brand-logo mb-4">
                        <span className="text-white text-2xl font-black italic tracking-tighter">GRID</span>
                        <span className="text-accent text-2xl font-black italic tracking-tighter">PASS</span>
                    </div>
                    <p className="mb-4 text-sm text-white/50">
                        The Operating System for your Motorsports Life.
                    </p>


                    <div className="built-by mb-8 flex flex-col items-center">
                        <span className="text-white/30 text-xs mb-3 uppercase tracking-widest font-bold">Built by</span>
                        <UserCard
                            username="pjlosey"
                            displayName="PJ Losey"
                            photoUrl={founderProfile?.avatar_url || "https://github.com/pjlosey.png"}
                            role="Founder & Engineer"
                        />
                    </div>

                    <div className="social-links flex justify-center gap-6 mb-8">
                        <a href="https://instagram.com/pjlosey" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                            Instagram
                        </a>
                        <a href="https://github.com/pjlosey" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                            GitHub
                        </a>
                        <a href="https://linkedin.com/in/pjlosey" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                            LinkedIn
                        </a>
                    </div>

                    <div className="footer-links text-xs border-t border-white/10 pt-8">
                        <Link href="/terms">Terms</Link>
                        <Link href="/privacy">Privacy</Link>
                        <Link href="/contact">Contact</Link>
                    </div>
                    <p className="mt-8 text-xs text-white/20">&copy; 2026 GridPass. All rights reserved.</p>
                </div>
            </footer>

            <style jsx>{`
        .landing-container {
            padding-bottom: 80px; /* Space for bottom tab bar if visible */
            width: 100%;
            overflow-x: hidden;
        }

        .hero-section {
            padding: 8rem 1rem 6rem;
            text-align: center;
            background: radial-gradient(circle at top center, rgba(225, 6, 0, 0.2) 0%, transparent 60%);
            width: 100%;
            border-bottom: 1px solid rgba(255,255,255,0.05);
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
            margin-bottom: 2rem;
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

        .os-preview-section {
            padding: 4rem 1rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            text-align: center;
        }

        .preview-grid {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-top: 3rem;
            flex-wrap: wrap;
        }

        .preview-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            color: var(--v2-text-secondary);
            font-size: 0.9rem;
            font-weight: 600;
        }

        .features-section {
            padding: 6rem 1rem;
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
        }
        
        .section-header {
            text-align: center;
            margin-bottom: 5rem;
        }

        .section-title {
            font-family: var(--v2-font-racing);
            font-size: 2.5rem;
            font-style: italic;
            text-transform: uppercase;
            margin-bottom: 1rem;
            color: white;
            line-height: 0.9;
        }

        .section-subtitle {
             color: var(--v2-text-secondary);
             max-width: 600px;
             margin: 0 auto;
        }

        .features-grid {
            display: grid;
            gap: 2rem;
        }

        .feature-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--v2-radius-md);
            padding: 2.5rem;
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

        .roadmap-section {
            padding: 4rem 1rem;
            text-align: center;
            background: rgba(255,255,255,0.02);
            border-top: 1px solid rgba(255,255,255,0.05);
        }

        .roadmap-grid {
             display: flex;
             justify-content: center;
             gap: 2rem;
             margin-top: 3rem;
             flex-wrap: wrap;
        }

        .roadmap-item {
             color: var(--v2-text-tertiary);
        }
        
        .roadmap-item h4 {
             color: white;
             font-weight: bold;
             margin-bottom: 4px;
        }

        .landing-footer {
            margin-top: 0;
            border-top: 1px solid rgba(255,255,255,0.05);
            padding: 3rem 1rem;
            text-align: center;
            color: var(--v2-text-tertiary);
            font-size: 0.9rem;
            width: 100%;
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
        }
        
        .font-black { font-weight: 900; }
        .italic { font-style: italic; }
        .text-4xl { font-size: 2.5rem; }
        .text-2xl { font-size: 1.5rem; }
        .text-white { color: white; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-4 { margin-bottom: 1rem; }
        .text-sm { font-size: 0.875rem; }
        .text-xs { font-size: 0.75rem; }
        .mt-8 { margin-top: 2rem; }
        .pt-8 { padding-top: 2rem; }
        .border-t { border-top-width: 1px; }
        .border-white\/10 { border-color: rgba(255,255,255,0.1); }
        .text-white\/50 { color: rgba(255,255,255,0.5); }
        .text-white\/40 { color: rgba(255,255,255,0.4); }
        .text-white\/20 { color: rgba(255,255,255,0.2); }
        .text-white\/60 { color: rgba(255,255,255,0.6); }
        .hover\:text-white:hover { color: white; }
        .transition-colors { transition: color 0.2s; }
        .font-medium { font-weight: 500; }
        .flex { display: flex; }
        .justify-center { justify-content: center; }
        .gap-6 { gap: 1.5rem; }

        @media (min-width: 768px) {
            .hero-title {
                font-size: 5rem;
            }
            .text-4xl { font-size: 4rem; }
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
