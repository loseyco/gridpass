'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Settings, Briefcase, Calendar, User } from 'lucide-react'
import ScheduleManager from '@/components/dashboard/ScheduleManager'

interface ProfileEditHubProps {
    profile: any
}

export default function ProfileEditHub({ profile }: ProfileEditHubProps) {
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') as 'basics' | 'resume' | 'schedule' | null
    const [activeTab, setActiveTab] = useState<'basics' | 'resume' | 'schedule'>(initialTab || 'basics') // Default to basics if no param
    // Menu items config
    const [openToWork, setOpenToWork] = useState(profile.job_preferences?.is_open_to_work || false)
    const router = useRouter()

    const handleOpenToWorkChange = async (val: boolean) => {
        setOpenToWork(val)
        try {
            await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_preferences: {
                        ...(profile.job_preferences || {}),
                        is_open_to_work: val
                    }
                })
            })
            router.refresh()
        } catch (e) {
            console.error(e)
        }
    }

    const menuItems = [
        {
            id: 'basic',
            label: 'Basic Information',
            description: 'Name, bio, avatar, location',
            href: '/profile/edit/basic',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            )
        },
        {
            id: 'team',
            label: 'Team Information',
            description: 'Hometown, airport, gear sizes',
            href: '/profile/edit/team',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            )
        },
        {
            id: 'career',
            label: 'Career History',
            description: 'Jobs, positions, experience',
            href: '/profile/edit/career',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
            )
        },
        {
            id: 'skills',
            label: 'Skills & Badges',
            description: 'Expertise tags, specializations',
            href: '/profile/edit/skills',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            )
        },
        {
            id: 'media',
            label: 'Media Gallery',
            description: 'Photos, videos, portfolio',
            href: '/profile/edit/media',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            )
        },
        {
            id: 'social',
            label: 'Social Links',
            description: 'Instagram, LinkedIn, Website',
            href: '/profile/edit/social',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
            )
        }
    ]

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="v2-header mb-6">
                <Link href="/profile" className="v2-link">
                    Done
                </Link>
                <h1 className="v2-title">Edit Profile</h1>
                <div style={{ width: '40px' }} /> {/* Spacer */}
            </div>

            <div className="flex gap-6 mb-8 border-b border-white/10 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('basics')}
                    className={`pb-3 px-1 text-sm font-bold uppercase transition-colors relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'basics' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    <User size={16} /> Basics
                    {activeTab === 'basics' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
                </button>
                <button
                    onClick={() => setActiveTab('resume')}
                    className={`pb-3 px-1 text-sm font-bold uppercase transition-colors relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'resume' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    <Briefcase size={16} /> My Resume
                    {activeTab === 'resume' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`pb-3 px-1 text-sm font-bold uppercase transition-colors relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'schedule' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    <Calendar size={16} /> My Schedule
                    {activeTab === 'schedule' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
                </button>
            </div>

            {/* Tab: Basics (Existing Menu) */}
            {activeTab === 'basics' && (
                <div className="v2-content">
                    <div className="v2-card v2-mb-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                                    {profile.full_name?.charAt(0) || profile.username?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 className="v2-heading-3" style={{ marginBottom: 0 }}>{profile.full_name || profile.username}</h2>
                            <Link href={`/u/${profile.username}`} className="v2-link-accent" style={{ fontSize: '0.9rem' }}>
                                View Public Profile →
                            </Link>
                        </div>
                    </div>

                    {/* Open To Work Indicator */}
                    {profile.job_preferences?.is_open_to_work && (
                        <div className="v2-card v2-mb-4 v2-bg-success-subtle v2-border-success">
                            <div className="v2-flex v2-items-center v2-gap-2">
                                <div className="v2-w-3 v2-h-3 v2-rounded-full v2-bg-success animate-pulse"></div>
                                <Link href="/profile/edit/preferences" className="v2-flex-1" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="v2-flex v2-items-center v2-justify-between">
                                        <div>
                                            <span className="v2-font-bold">Preferences</span>
                                            <span className="v2-text-sm v2-text-secondary v2-ml-2">Open to work, notifications</span>
                                        </div>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Main Menu */}
                    <div className="v2-card v2-mb-4" style={{ padding: 0, overflow: 'hidden' }}>
                        {menuItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="v2-list-item"
                            >
                                <div className="v2-list-item-icon">
                                    {item.icon}
                                </div>
                                <div className="v2-list-item-content">
                                    <span className="v2-list-item-label">{item.label}</span>
                                    <span className="v2-list-item-desc">{item.description}</span>
                                </div>
                                <div className="v2-list-item-chevron">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Upsell Section */}
                    <div className="v2-card" style={{
                        background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
                        border: '1px solid rgba(227, 30, 36, 0.2)',
                        textAlign: 'center'
                    }}>
                        <h3 className="v2-heading-3" style={{ marginBottom: '0.5rem', color: 'white' }}>Get Verified</h3>
                        <p className="v2-text-secondary v2-text-sm v2-mb-4">
                            Stand out with a verified badge and professional profile formatting.
                        </p>
                        <Link href="/pro" style={{ textDecoration: 'none', width: '100%', display: 'block' }}>
                            <button className="v2-btn v2-btn-primary" style={{ width: '100%' }}>
                                Upgrade to Pro ($20)
                            </button>
                        </Link>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--v2-text-tertiary)' }}>
                        GridPass V2.0 (Beta)
                    </div>
                </div>
            )}

            {/* Tab: Resume */}
            {activeTab === 'resume' && (
                <div className="p-8 border border-dashed border-white/10 rounded-xl text-center">
                    <Briefcase size={48} className="mx-auto text-neutral-600 mb-4" />
                    <h3 className="text-lg font-bold text-neutral-300">Resume Editor</h3>
                    <p className="text-neutral-500 mt-2">Manage your experience and career verification. (Migration in progress)</p>
                    <Link href="/profile/edit/career" className="inline-block mt-4 text-blue-400 hover:text-blue-300">
                        Go to Career History →
                    </Link>
                </div>
            )}

            {/* Tab: Schedule */}
            {activeTab === 'schedule' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ScheduleManager />
                </div>
            )}

        </div >
    )
}
