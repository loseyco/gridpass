'use client'

import Link from 'next/link'
import { Settings, User, Edit, CreditCard, LogOut, ChevronRight, ExternalLink } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface ProfileClientProps {
  profile: any
  vehicleCount: number
  connectionsCount: number
  memberSince: number
  isVerified: boolean
}

export default function ProfileClient({ profile, isVerified }: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  // Common card style to match ProfileEditHub
  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.05)', // Fallback if class fails
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 'var(--v2-radius-md)',
    overflow: 'hidden'
  }

  // Flex row style for links
  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
    textDecoration: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    width: '100%',
    transition: 'background 0.2s'
  }

  return (
    <>
      <div className="v2-header profile-nav">
        <Link href="/" className="v2-title-link">
          <h1 className="v2-title">
            <span className="v2-text-white">GRID</span>
            <span className="v2-text-accent">PASS</span>
          </h1>
        </Link>
      </div>

      <div className="v2-content">
        <h2 className="v2-heading-2 v2-mb-4" style={{ marginBottom: '1.5rem', opacity: 0.8 }}>You</h2>

        {/* Identity Card */}
        <div className="v2-card v2-mb-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
          <div style={{ position: 'relative' }}>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--v2-accent-primary)'
                }}
              />
            ) : (
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--v2-bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--v2-border)',
                color: 'var(--v2-text-tertiary)',
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}>
                {profile.username?.[0]?.toUpperCase()}
              </div>
            )}
            {isVerified && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: '#1DA1F2',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #000'
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white" />
                </svg>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="v2-heading-3" style={{ marginBottom: 0, lineHeight: 1.2 }}>{profile.full_name || profile.username}</h2>
            <span style={{ color: 'var(--v2-text-secondary)', fontSize: '0.9rem' }}>@{profile.username}</span>
          </div>
          <Link href={`/u/${profile.username}`} style={{ color: 'var(--v2-text-tertiary)' }}>
            <ExternalLink size={20} />
          </Link>
        </div>

        {/* Management Menu */}
        <div className="v2-card v2-mb-4" style={{ padding: 0, overflow: 'hidden' }}>

          <Link href="/profile/edit" className="v2-list-item">
            <div className="v2-list-item-icon">
              <Edit size={20} />
            </div>
            <div className="v2-list-item-content">
              <span className="v2-list-item-label">Edit Profile</span>
            </div>
            <ChevronRight size={18} className="v2-list-item-chevron" />
          </Link>

          <Link href={`/u/${profile.username}`} className="v2-list-item">
            <div className="v2-list-item-icon">
              <User size={20} />
            </div>
            <div className="v2-list-item-content">
              <span className="v2-list-item-label">View Public Profile</span>
            </div>
            <ChevronRight size={18} className="v2-list-item-chevron" />
          </Link>

          <Link href="/settings" className="v2-list-item">
            <div className="v2-list-item-icon">
              <Settings size={20} />
            </div>
            <div className="v2-list-item-content">
              <span className="v2-list-item-label">Account Settings</span>
            </div>
            <ChevronRight size={18} className="v2-list-item-chevron" />
          </Link>

          <Link href="/billing" className="v2-list-item">
            <div className="v2-list-item-icon">
              <CreditCard size={20} />
            </div>
            <div className="v2-list-item-content">
              <span className="v2-list-item-label">Billing & Membership</span>
            </div>
            <ChevronRight size={18} className="v2-list-item-chevron" />
          </Link>

        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="v2-card v2-mb-4"
          style={{
            width: '100%',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            border: '1px solid rgba(255, 68, 68, 0.2)',
            background: 'rgba(255, 0, 0, 0.05)',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ color: '#ff4444' }}><LogOut size={20} /></div>
          <span style={{ color: '#ff4444', fontWeight: 600 }}>Sign Out</span>
        </button>

        <div style={{ paddingBottom: '2rem' }}></div>

        <footer className="track-footer">
          <span className="version-id">GRIDPASS V2.1 // {new Date().getFullYear()}</span>
        </footer>
      </div>
    </>
  )
}
