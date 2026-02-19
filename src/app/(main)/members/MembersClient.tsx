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
    is_open_to_work?: boolean
}

interface MembersClientProps {
    initialProfiles: Profile[]
    user: any
}

export default function MembersClient({ initialProfiles, user }: MembersClientProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [showOpenToWork, setShowOpenToWork] = useState(false)

    const filteredProfiles = initialProfiles.filter(profile => {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = (
            profile.username?.toLowerCase().includes(searchLower) ||
            profile.full_name?.toLowerCase().includes(searchLower) ||
            profile.role?.toLowerCase().includes(searchLower)
        )
        const matchesFilter = showOpenToWork ? profile.is_open_to_work : true
        return matchesSearch && matchesFilter
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 className="v2-heading-2">Members ({filteredProfiles.length})</h2>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowOpenToWork(!showOpenToWork)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${showOpenToWork
                                    ? 'bg-green-500/20 text-green-400 border-green-500/40'
                                    : 'bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500'
                                }`}
                        >
                            Open to Work only
                        </button>

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
                </div>

                <div className="v2-card v2-mb-4" style={{ padding: 0, overflow: 'hidden' }}>
                    {filteredProfiles.map(profile => (
                        <Link key={profile.id} href={`/u/${profile.username}`} className="v2-list-item">
                            <div className="v2-list-item-icon" style={{ width: '48px', height: '48px', flexShrink: 0, position: 'relative' }}>
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
                                {profile.is_open_to_work && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: '#4ade80',
                                        border: '2px solid #1a1a1a'
                                    }} title="Open to Work" />
                                )}
                            </div>
                            <div className="v2-list-item-content">
                                <div className="flex items-center gap-2">
                                    <span className="v2-list-item-label">{profile.full_name || profile.username}</span>
                                    {profile.is_open_to_work && (
                                        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400">
                                            OPEN
                                        </span>
                                    )}
                                </div>
                                <span className="v2-list-item-desc">{profile.role}</span>
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
