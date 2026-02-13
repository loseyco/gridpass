'use client'

import Link from 'next/link'
import { Search, UserPlus } from 'lucide-react'
import { useState } from 'react'

interface Profile {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    role: string | null
    bio: string | null
}

interface MembersClientProps {
    initialProfiles: Profile[]
    user: any
}

export default function MembersClient({ initialProfiles, user }: MembersClientProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredProfiles = initialProfiles.filter(profile => {
        const searchLower = searchTerm.toLowerCase()
        return (
            profile.username?.toLowerCase().includes(searchLower) ||
            profile.full_name?.toLowerCase().includes(searchLower) ||
            profile.role?.toLowerCase().includes(searchLower)
        )
    })

    return (
        <>
            <div className="v2-header profile-nav">
                <Link href="/" className="v2-title-link">
                    <h1 className="v2-title">
                        <span className="v2-text-white">GRID</span>
                        <span className="v2-text-accent">PASS</span>
                    </h1>
                </Link>

                <div style={{ flex: 1 }}></div>

                {user ? (
                    <Link href="/profile" className="v2-btn v2-btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        View Your Profile
                    </Link>
                ) : (
                    <Link href="/join" className="v2-btn v2-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        Sign Up
                    </Link>
                )}
            </div>

            <div className="v2-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 className="v2-heading-2">Members</h2>
                    <div className="v2-search-container" style={{ position: 'relative', width: '200px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--v2-text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Search members..."
                            className="v2-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '35px', fontSize: '0.9rem' }}
                        />
                    </div>
                </div>

                <div className="v2-card v2-mb-4" style={{ padding: 0, overflow: 'hidden' }}>
                    {filteredProfiles.map(profile => (
                        <Link key={profile.id} href={`//u/${profile.username}`} className="v2-list-item">
                            <div className="v2-list-item-icon">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.username}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '50%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        background: 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        color: 'var(--v2-text-tertiary)'
                                    }}>
                                        {profile.username?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="v2-list-item-content">
                                <span className="v2-list-item-label">{profile.full_name || profile.username}</span>
                                <span className="v2-list-item-desc">@{profile.username} {profile.role && `• ${profile.role}`}</span>
                            </div>
                            <div className="v2-list-item-chevron">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <style jsx>{`
      `}</style>
        </>
    )
}
