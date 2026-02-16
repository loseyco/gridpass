'use client'

import Link from 'next/link'
import { Car, Users, MessageSquare, ClipboardList, Truck, Folder, Bell, Wrench, Calculator, ChevronRight } from 'lucide-react'

interface HomeClientProps {
  hasUser: boolean
  userProfile: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
  } | null
}

export default function HomeClient({
  hasUser,
  userProfile,
}: HomeClientProps) {

  const userName = userProfile?.full_name?.split(' ')[0] || userProfile?.full_name || 'Racer'

  return (
    <>
      <div className="v2-header">
        <Link href="/" className="v2-title-link" style={{ textDecoration: 'none' }}>
          <h1 className="v2-title">
            <span className="v2-text-white">GRID</span>
            <span className="v2-text-accent">PASS</span>
          </h1>
        </Link>

        <div style={{ flex: 1 }}></div>

        {/* Notification Bell */}
        <button className="v2-btn-icon v2-btn-ghost notification-btn">
          <Bell size={24} />
          <span className="notification-dot"></span>
        </button>
      </div>

      <div className="v2-greeting-container">
        <h1 className="greeting">
          <span className="greeting-sub">WELCOME BACK,</span>
          <span className="greeting-name">{userName}</span>
        </h1>
      </div>

      <div className="v2-content">

        {/* Action Center - High Priority */}
        <section className="dashboard-section">
          <h2 className="section-heading">ACTION CENTER</h2>
          <div className="action-grid">

            {/* Manage Resume - HERO Action */}
            <Link href="/profile" className="hero-card">
              <div className="hero-content">
                <div className="hero-icon-container">
                  <ClipboardList size={32} strokeWidth={1.5} />
                  <span className="notification-badge-icon">!</span>
                </div>
                <div className="hero-text">
                  <span className="hero-label">Manage Resume</span>
                  <span className="hero-sublabel">Update Profile & Career</span>
                </div>
              </div>
              <div className="hero-shine"></div>
            </Link>

            {/* Quick Edit Profile - New Action */}
            <Link href={`/apps/simple-editor?id=${userProfile?.username || userProfile?.id || ''}`} className="action-card primary-card">
              <div className="action-icon">
                <Wrench size={24} />
              </div>
              <div className="action-text">
                <span className="action-label">Quick Edit Info</span>
                <span className="action-sublabel">Via Simple Editor App</span>
              </div>
            </Link>


            {/* Messages - Coming Soon */}
            <div className="action-card disabled">
              <div className="action-icon">
                <MessageSquare size={24} />
              </div>
              <div className="action-text">
                <span className="action-label">Messages</span>
                <span className="coming-soon-label">COMING SOON</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Access - Management */}
        <section className="dashboard-section">
          <h2 className="section-heading">QUICK ACCESS</h2>
          <div className="dashboard-grid">

            {/* Collections - Coming Soon */}
            <div className="dash-card disabled">
              <div className="dash-icon-container">
                <Folder size={32} />
              </div>
              <span className="dash-label">Collections</span>
              <span className="coming-soon-badge">COMING SOON</span>
            </div>

            {/* Network - Coming Soon */}
            <div className="dash-card disabled">
              <div className="dash-icon-container">
                <Users size={32} />
              </div>
              <span className="dash-label">Network</span>
              <span className="coming-soon-badge">COMING SOON</span>
            </div>

            {/* Logistics (Coming Soon) */}
            <div className="dash-card disabled">
              <div className="dash-icon-container">
                <Truck size={32} />
              </div>
              <span className="dash-label">Logistics</span>
              <span className="coming-soon-badge">COMING SOON</span>
            </div>

            {/* Tools (Coming Soon) */}
            <div className="dash-card disabled">
              <div className="dash-icon-container">
                <Calculator size={32} />
              </div>
              <span className="dash-label">Race Tools</span>
              <span className="coming-soon-badge">COMING SOON</span>
            </div>

            {/* Shop (Coming Soon) */}
            <div className="dash-card disabled">
              <div className="dash-icon-container">
                <Wrench size={32} />
              </div>
              <span className="dash-label">Shop</span>
              <span className="coming-soon-badge">COMING SOON</span>
            </div>
          </div>
        </section>

      </div>

      <style jsx>{`
        .v2-header {
            height: auto;
            padding-top: var(--v2-space-4);
            padding-bottom: var(--v2-space-2);
            background: transparent;
            backdrop-filter: none;
            border-bottom: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-left {
            display: flex;
            align-items: center;
        }

        .header-logo {
            object-fit: contain;
        }

        .header-right {
           display: flex;
           align-items: center;
        }

        .v2-greeting-container {
             padding-bottom: var(--v2-space-4);
        }

        .notification-badge-icon {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #fff;
            color: var(--v2-accent-primary);
            font-size: 10px;
            font-weight: 900;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid var(--v2-accent-primary);
            z-index: 10;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            animation: pulse-badge 2s infinite;
        }

        @keyframes pulse-badge {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
            70% { transform: scale(1.1); box-shadow: 0 0 0 4px rgba(255, 255, 255, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }

        .greeting {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .greeting-sub {
            font-size: 0.75rem;
            color: var(--v2-text-tertiary);
            font-weight: 700;
            letter-spacing: 0.1em;
        }

        .greeting-name {
            font-family: var(--v2-font-racing);
            font-size: 2rem;
            font-style: italic;
            text-transform: uppercase;
            line-height: 0.9;
            color: white;
        }

        .notification-btn {
            position: relative;
            margin-top: 4px;
        }

        .notification-dot {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 8px;
            height: 8px;
            background: var(--v2-accent-primary);
            border-radius: 50%;
            border: 2px solid #000;
        }

        .dashboard-section {
            margin-bottom: 2rem;
        }

        .section-heading {
            font-size: 0.75rem;
            color: var(--v2-text-secondary);
            font-weight: 700;
            letter-spacing: 0.1em;
            margin-bottom: 1rem;
            padding-left: 4px;
        }

        .action-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.75rem;
        }

        .action-card {
            display: flex;
            align-items: center;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: var(--v2-radius-md);
            text-decoration: none;
            color: white;
            transition: all 0.2s;
        }
        
        .action-card.disabled {
            opacity: 0.6;
            cursor: default;
        }

        .action-card:hover:not(.disabled) {
            background: rgba(255, 255, 255, 0.08);
            transform: translateX(2px);
        }

        .action-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1rem;
            background: rgba(255, 255, 255, 0.05);
            color: var(--v2-text-secondary);
        }



        .primary-card {
            background: var(--v2-accent-primary) !important;
            border-color: var(--v2-accent-primary) !important;
            box-shadow: 0 4px 12px rgba(225, 6, 0, 0.25);
        }

        .primary-card:hover {
            background: var(--v2-accent-primary-hover) !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(225, 6, 0, 0.4);
        }

        .primary-card .action-icon {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }

        .primary-card .action-label,
        .primary-card .action-sublabel,
        .primary-card .action-arrow {
            color: white !important;
        }

        .primary-card .action-sublabel {
            opacity: 0.8;
        }

        .warning-card .action-icon {
            background: rgba(255, 135, 0, 0.15);
            color: #FF8700;
        }
        
        .warning-card:hover {
            border-color: #FF8700;
        }

        .info-card .action-icon {
            background: rgba(0, 150, 255, 0.15);
            color: #0096FF;
        }

        .info-card:hover {
             border-color: #0096FF;
        }

        .action-text {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .action-label {
            font-size: 0.9rem;
            font-weight: 600;
            color: white;
        }
        
        .action-sublabel {
            font-size: 0.75rem;
            color: var(--v2-text-secondary);
        }
        
        .coming-soon-label {
            font-size: 0.7rem;
            color: var(--v2-text-tertiary);
            font-weight: 700;
            letter-spacing: 0.05em;
        }

        .action-arrow {
            color: var(--v2-text-tertiary);
            opacity: 0.5;
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
        }

        .dash-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: var(--v2-radius-md);
            padding: 1.5rem 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: white;
            transition: all 0.2s;
            aspect-ratio: 1/1;
            position: relative;
        }

        .dash-card:hover:not(.disabled) {
            background: rgba(255, 255, 255, 0.08);
            border-color: var(--v2-accent-primary);
            transform: translateY(-2px);
        }

        .dash-card.disabled {
            opacity: 0.5;
            cursor: default;
        }
        
        .dash-card.disabled:hover {
            transform: none;
            border-color: rgba(255, 255, 255, 0.1);
        }

        .dash-icon-container {
            color: var(--v2-accent-primary);
            margin-bottom: 0.75rem;
        }

        .dash-card.disabled .dash-icon-container {
            color: var(--v2-text-tertiary);
        }

        .dash-label {
            font-size: 0.9rem;
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
        }

        .dash-sublabel {
            font-size: 0.75rem;
            color: var(--v2-text-tertiary);
        }

        .coming-soon-badge {
            font-size: 0.6rem;
            font-weight: 800;
            color: #000;
            background: var(--v2-text-tertiary);
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 0.5rem;
        }

        /* Hero Card Styles */
        .hero-card {
            background: linear-gradient(135deg, var(--v2-accent-primary) 0%, #a30400 100%);
            border-radius: var(--v2-radius-md);
            padding: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            text-decoration: none;
            color: white;
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 30px -10px rgba(225, 6, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hero-card:hover {
            transform: translateY(-2px) scale(1.01);
            box-shadow: 0 20px 40px -10px rgba(225, 6, 0, 0.6);
            border-color: rgba(255, 255, 255, 0.3);
        }

        .hero-content {
            display: flex;
            align-items: center;
            gap: 1.25rem;
            z-index: 2;
        }

        .hero-icon-container {
            width: 56px;
            height: 56px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .hero-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .hero-label {
            font-family: var(--v2-font-racing);
            font-size: 1.5rem;
            font-style: italic;
            font-weight: 900;
            text-transform: uppercase;
            line-height: 1;
            letter-spacing: -0.02em;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .hero-sublabel {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 500;
        }

        .hero-arrow {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            z-index: 2;
            transition: all 0.3s;
        }

        .hero-card:hover .hero-arrow {
            background: white;
            color: var(--v2-accent-primary);
            transform: translateX(4px);
        }

        .hero-shine {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.0) 50%);
            background-size: 200% 200%;
            animation: shine 6s infinite linear;
            pointer-events: none;
        }

        @keyframes shine {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        @media (min-width: 600px) {
            .dashboard-grid {
                grid-template-columns: repeat(3, 1fr);
            }
            .action-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .hero-card {
                grid-column: span 2;
            }
        }
      `}</style>
    </>
  )
}
