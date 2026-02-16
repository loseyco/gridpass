'use client'

import Link from 'next/link'
import {
  Car, Users, MessageSquare, ClipboardList, Truck, Folder, Bell,
  Wrench, Calculator, Settings, Newspaper, User, Briefcase, QrCode,
  ShoppingBag, Gamepad2, Building2, Key, Flag
} from 'lucide-react'
import AppIcon from '@/components/os/AppIcon'

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
        <Link href="/public" className="v2-title-link md:hidden" style={{ textDecoration: 'none' }}>
          <h1 className="v2-title">
            <span className="v2-text-white">GRIDPASS</span>
            <span className="v2-text-accent">OS</span>
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

        {/* App Grid - OS Style */}
        <div className="app-grid-container">
          <div className="app-grid">

            {/* Row 1: Core Personal */}
            <AppIcon
              label="Profile"
              icon={User}
              href={`/u/${userProfile?.username || 'pjlosey'}`}
              color="#007AFF"
              status="beta"
            />
            <AppIcon
              label="My Garage"
              icon={Car}
              href="/garage"
              color="#FF3B30"
              status="soon"
            />
            <AppIcon
              label="My Resume"
              icon={ClipboardList}
              href="/profile/edit"
              color="#FF9500"
              status="beta"
            />
            <AppIcon
              label="Messages"
              icon={MessageSquare}
              href="/messages"
              color="#34C759"
              status="soon"
            />

            {/* Row 2: Community & Content */}
            <AppIcon
              label="News"
              icon={Newspaper}
              href="/news"
              color="#FF2D55"
              status="beta"
            />
            <AppIcon
              label="Members"
              icon={Users}
              href="/members"
              color="#5856D6"
              status="beta"
            />
            <AppIcon
              label="Classifieds"
              icon={ShoppingBag}
              href="/classifieds"
              color="#FF9500"
              status="soon"
            />
            <AppIcon
              label="Sim Racing"
              icon={Gamepad2}
              href="/sim-racing"
              color="#5856D6"
              status="soon"
            />

            {/* Row 3: Commerce & Services */}
            <AppIcon
              label="Business"
              icon={Building2}
              href="/businesses"
              color="#AF52DE"
              status="alpha"
            />
            <AppIcon
              label="Rentals"
              icon={Key}
              href="/rentals"
              color="#FF2D55"
              status="soon"
            />
            <AppIcon
              label="Careers"
              icon={Briefcase}
              href="/jobs"
              color="#007AFF"
              status="soon"
            />
            <AppIcon
              label="Logistics"
              icon={Truck}
              href="/logistics"
              color="#FFCC00"
              status="soon"
            />

            {/* Row 4: Management & Tools */}
            <AppIcon
              label="Team Manager"
              icon={Flag}
              href="/team-manager"
              color="#FF3B30"
              status="soon"
            />
            <AppIcon
              label="Shop Manager"
              icon={Wrench}
              href="/shop-manager"
              color="#8E8E93"
              status="soon"
            />
            <AppIcon
              label="Tool Box"
              icon={Calculator}
              href="/tools"
              color="#5AC8FA"
              status="soon"
            />
            <AppIcon
              label="Collections"
              icon={Folder}
              href="/collections"
              color="#8E8E93"
              status="soon"
            />

            {/* Row 5: System */}
            <AppIcon
              label="Scan"
              icon={QrCode}
              href="/scan"
              color="#30cfd0"
              status="soon"
            />
            <AppIcon
              label="Settings"
              icon={Settings}
              href="/settings"
              color="#8E8E93"
            />

          </div>
        </div>

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

        .v2-greeting-container {
             padding-bottom: var(--v2-space-4);
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

        .app-grid-container {
            padding: 1rem 0;
            display: flex;
            justify-content: center;
        }

        .app-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px 12px;
            width: 100%;
            max-width: 400px; /* Restrain width on larger screens for phone feel */
        }
        
        /* Tablet/Desktop Tweaks */
        @media (min-width: 600px) {
             .app-grid {
                grid-template-columns: repeat(6, 1fr);
                gap: 32px 24px;
                max-width: 800px;
             }
        }
      `}</style>
    </>
  )
}
