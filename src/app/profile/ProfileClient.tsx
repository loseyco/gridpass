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
  ownedOrgs?: any[]
}

export default function ProfileClient({ profile, isVerified, ownedOrgs = [] }: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
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

        {/* Identity & Profile Actions */}
        <div className="v2-card v2-mb-4" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    objectFit: 'cover', border: '2px solid var(--v2-accent-primary)'
                  }}
                />
              ) : (
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'var(--v2-bg-secondary)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--v2-border)', color: 'var(--v2-text-tertiary)',
                  fontWeight: 'bold', fontSize: '1.5rem'
                }}>
                  {profile.username?.[0]?.toUpperCase()}
                </div>
              )}
              {isVerified && (
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  background: '#1DA1F2',
                  width: '20px', height: '20px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '2px solid #000'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white" />
                  </svg>
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h2 className="v2-heading-3" style={{ marginBottom: '0.25rem', lineHeight: 1.2, fontSize: '1.25rem' }}>{profile.full_name || profile.username}</h2>
              <span style={{ color: 'var(--v2-text-secondary)', fontSize: '0.9rem' }}>@{profile.username}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Link href="/profile/edit" className="v2-btn v2-btn-secondary v2-justify-center" style={{ height: '40px' }}>
              <Edit size={16} /> Edit Profile
            </Link>
            <Link href={`/u/${profile.username}`} className="v2-btn v2-btn-secondary v2-justify-center" style={{ height: '40px' }}>
              <ExternalLink size={16} /> View Public
            </Link>
          </div>
        </div>



        {/* Account Settings */}
        <div className="v2-mb-4">
          <h3 className="v2-heading-3" style={{ fontSize: '0.9rem', padding: '0 0.5rem', marginBottom: '0.75rem', color: 'var(--v2-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Account
          </h3>
          <div className="v2-card" style={{ padding: 0, overflow: 'hidden' }}>
            <Link href="/settings" className="v2-list-item">
              <div className="v2-list-item-icon">
                <Settings size={20} />
              </div>
              <div className="v2-list-item-content">
                <span className="v2-list-item-label">Settings</span>
              </div>
              <ChevronRight size={18} className="v2-list-item-chevron" />
            </Link>

            <button
              onClick={handleSignOut}
              className="v2-list-item"
              style={{ width: '100%', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="v2-list-item-icon" style={{ color: '#ff4444' }}>
                <LogOut size={20} />
              </div>
              <div className="v2-list-item-content">
                <span className="v2-list-item-label" style={{ color: '#ff4444' }}>Sign Out</span>
              </div>
            </button>
          </div>
        </div>

        <div style={{ paddingBottom: '2rem' }}></div>

        <footer className="track-footer">
          <span className="version-id">GRIDPASS V2.1 // {new Date().getFullYear()}</span>
        </footer>
      </div>
    </>
  )
}
