'use client'

import React, { JSX } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Car, Briefcase, User, LogIn } from 'lucide-react'

interface Tab {
  id: string
  label: string
  href: string
  icon: JSX.Element
}

export default function BottomTabBar({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const pathname = usePathname()

  const tabs: Tab[] = [
    {
      id: 'home',
      label: isLoggedIn ? 'DASHBOARD' : 'HOME',
      href: '/',
      icon: <Home size={24} strokeWidth={2.5} />
    },
    {
      id: 'members',
      label: 'MEMBERS',
      href: '/members',
      icon: <Users size={24} strokeWidth={2.5} />
    },
    {
      id: 'vehicles',
      label: 'VEHICLES',
      href: '/vehicles',
      icon: <Car size={24} strokeWidth={2.5} />
    },
    {
      id: 'businesses',
      label: 'BUSINESSES',
      href: '/businesses',
      icon: <Briefcase size={24} strokeWidth={2.5} />
    },
    {
      id: isLoggedIn ? 'profile' : 'login',
      label: isLoggedIn ? 'YOU' : 'LOGIN',
      href: isLoggedIn ? '/profile' : '/login',
      icon: isLoggedIn ? <User size={24} strokeWidth={2.5} /> : <LogIn size={24} strokeWidth={2.5} />
    },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="bottom-tab-bar">
      <style jsx>{`
        .bottom-tab-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 68px;
          background: rgba(5, 5, 5, 0.9);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-top: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: var(--v2-z-tab-bar);
          padding: 0;
        }

        .tab-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          flex: 1;
          height: 100%;
          text-decoration: none;
          color: var(--v2-text-tertiary);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .tab-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tab-item:hover {
          color: var(--v2-text-secondary);
        }

        .tab-item.active {
          color: var(--v2-accent-primary);
        }

        .tab-item.active .tab-icon {
            filter: drop-shadow(0 0 8px var(--v2-accent-primary));
        }

        /* Racing style top border indicating active component */
        .tab-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%) skew(-20deg);
          width: 40px;
          height: 4px;
          background: var(--v2-accent-primary);
          opacity: 0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 10px var(--v2-accent-primary);
        }

        .tab-item.active::before {
          opacity: 1;
        }

        .tab-label {
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          line-height: 1;
          font-family: var(--v2-font-racing);
          font-style: italic;
        }

        @media (min-width: 768px) {
          .bottom-tab-bar {
            max-width: 480px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: var(--v2-radius-lg) var(--v2-radius-lg) 0 0;
            border-left: 1px solid var(--v2-border);
            border-right: 1px solid var(--v2-border);
          }
        }

        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .bottom-tab-bar {
            padding-bottom: env(safe-area-inset-bottom);
            height: calc(68px + env(safe-area-inset-bottom));
          }
        }
      `}</style>

      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`tab-item ${isActive(tab.href) ? 'active' : ''}`}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
