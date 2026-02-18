'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface AppIconProps {
  label: string
  icon: LucideIcon
  href?: string
  color?: string
  onClick?: () => void
  badge?: number | string
  status?: 'active' | 'soon' | 'new' | 'disabled' | 'alpha' | 'beta' | 'admin'
  className?: string
}

export default function AppIcon({
  label,
  icon: Icon,
  href,
  color = 'var(--v2-accent-primary)',
  onClick,
  badge,
  status = 'active',
  className = ''
}: AppIconProps) {

  const isDisabled = status === 'disabled' || status === 'soon';
  const isAlpha = status === 'alpha';
  const isBeta = status === 'beta';

  const badgeText = status === 'soon' ? 'SOON' : (status === 'alpha' ? 'ALPHA' : (status === 'beta' ? 'BETA' : (status === 'admin' ? 'ADMIN' : (status === 'new' ? 'NEW' : null))));
  const badgeColor = status === 'alpha' ? 'var(--v2-accent-primary)' : (status === 'beta' ? '#FF9500' : (status === 'admin' ? '#FF3B30' : (status === 'new' ? '#30D158' : 'rgba(255, 255, 255, 0.2)')));

  const content = (
    <>
      {/* Icon Container - Squircle */}
      <div
        className={`app-icon-container ${isDisabled ? 'disabled' : ''}`}
        style={{
          background: isDisabled
            ? 'rgba(255, 255, 255, 0.05)'
            : `linear-gradient(135deg, ${color}cc 0%, ${color} 100%)`
        }}
      >
        <Icon size={32} color={isDisabled ? 'rgba(255, 255, 255, 0.3)' : '#fff'} strokeWidth={1.5} />

        {/* Status Banner (Inside clipped container) */}
        {badgeText && (
          <div className="status-banner" style={{ background: badgeColor }}>
            {badgeText}
          </div>
        )}
      </div>

      {/* Notification Badge (Outside clipped container) */}
      {badge && (
        <div className="notification-badge">
          {badge}
        </div>
      )}

      {/* Label */}
      <span className={`app-label ${isDisabled ? 'disabled' : ''}`}>
        {label}
      </span>

      <style jsx>{`
        .app-icon-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          cursor: pointer;
          position: relative; /* Context for absolute badge */
          isolation: isolate; /* Create new stacking context */
        }

        .app-icon-wrapper:hover:not(.disabled) {
          transform: translateY(-4px);
        }

        .app-icon-wrapper:active:not(.disabled) .app-icon-container {
          transform: scale(0.95);
        }

        /* The Box */
        .app-icon-container {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.1s;
          overflow: hidden; /* Clips the banner properly */
          z-index: 1;
        }

        .app-icon-container.disabled {
          box-shadow: none;
          border-color: rgba(255, 255, 255, 0.05);
        }

        /* The Banner inside the box */
        .status-banner {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          color: rgba(255, 255, 255, 0.95);
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          padding: 2px 0;
          text-align: center;
          backdrop-filter: blur(4px);
          letter-spacing: 0.1em;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        /* The Red Notification Dot (Outside the box) */
        .notification-badge {
          position: absolute;
          top: -6px;
          right: calc(50% - 38px); /* Center relative to icon width */
          background: #ff3b30;
          color: white;
          font-size: 11px;
          font-weight: 700;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid #000;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 10; /* Above everything */
        }
        
        /* Tablet adjustments for badge position */
        @media (min-width: 768px) {
           .notification-badge {
               right: calc(50% - 42px);
           }
        }

        .app-label {
          color: #fff;
          font-size: 11px;
          font-weight: 500;
          text-align: center;
          letter-spacing: 0.01em;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          max-width: 80px;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .app-label.disabled {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Desktop sizes */
        @media (min-width: 768px) {
          .app-icon-container {
            width: 72px;
            height: 72px;
            border-radius: 18px;
          }
          .app-label {
            font-size: 12px;
          }
          .status-banner {
             font-size: 9px;
          }
        }
      `}</style>
    </>
  )

  if (href && !isDisabled) {
    return (
      <Link href={href} className={`app-icon-wrapper ${className}`}>
        {content}
      </Link>
    )
  }

  return (
    <div className={`app-icon-wrapper ${isDisabled ? 'disabled' : ''} ${className}`} onClick={!isDisabled ? onClick : undefined}>
      {content}
    </div>
  )
}
