'use client'

import { useState } from 'react'
import Link from 'next/link'

interface NetworkClientProps {
    people: any[]
}

export default function NetworkClient({ people }: NetworkClientProps) {
    const [activeTab, setActiveTab] = useState<'people' | 'businesses'>('people')

    return (
        <>
            <div className="v2-header">
                <Link href="/" className="v2-link">
                    ← Home
                </Link>
                <h1 className="v2-title">
                    <span className="v2-text-white">GRID</span>
                    <span className="v2-text-accent">PASS</span>
                </h1>
                <div style={{ width: '40px' }} />
            </div>

            <div className="v2-content">
                <h2 className="v2-heading-2">Network</h2>

                {/* Segmented Control */}
                <div className="segment-control">
                    <button
                        onClick={() => setActiveTab('people')}
                        className={`segment-btn ${activeTab === 'people' ? 'active' : ''}`}
                    >
                        People ({people.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('businesses')}
                        className={`segment-btn ${activeTab === 'businesses' ? 'active' : ''}`}
                    >
                        Businesses (0)
                    </button>
                </div>

                {/* Content */}
                <div className="network-content">
                    {activeTab === 'people' ? (
                        people.length === 0 ? (
                            <div className="v2-card empty-state">
                                <div className="empty-icon">👥</div>
                                <h3 className="v2-heading-3">No Connections</h3>
                                <p className="v2-text-secondary v2-mb-4">Connect with other racers and professionals.</p>
                                <Link href="/" className="v2-btn v2-btn-secondary">Browse Feed</Link>
                            </div>
                        ) : (
                            <div className="people-list">
                                {people.map((person) => (
                                    <Link key={person.id} href={`/u/${person.username}`} className="v2-card person-card">
                                        <div className="person-avatar">
                                            {person.avatar_url ? (
                                                <img src={person.avatar_url} alt={person.username} />
                                            ) : (
                                                <div className="avatar-placeholder">{person.full_name?.[0] || person.username?.[0] || '?'}</div>
                                            )}
                                        </div>
                                        <div className="person-info">
                                            <h3 className="person-name">{person.full_name || person.username}</h3>
                                            <p className="person-username">@{person.username}</p>
                                        </div>
                                        <div className="person-arrow">→</div>
                                    </Link>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="v2-card empty-state">
                            <div className="empty-icon">🏢</div>
                            <h3 className="v2-heading-3">No Businesses</h3>
                            <p className="v2-text-secondary">Follow shops, teams, and organizations.</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .segment-control {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: var(--v2-space-4);
                    background: rgba(255,255,255,0.05);
                    padding: 4px;
                    border-radius: var(--v2-radius-md);
                    border: 1px solid var(--v2-border);
                }

                .segment-btn {
                    flex: 1;
                    padding: 0.75rem 0.5rem;
                    background: transparent;
                    border: none;
                    color: var(--v2-text-secondary);
                    font-size: var(--v2-text-sm);
                    font-weight: 700;
                    border-radius: var(--v2-radius-sm);
                    cursor: pointer;
                    transition: all 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .segment-btn:hover {
                    color: white;
                    background: rgba(255,255,255,0.05);
                }

                .segment-btn.active {
                    background: var(--v2-accent-primary);
                    color: white;
                    box-shadow: var(--v2-shadow-sm);
                }

                .empty-state {
                    text-align: center;
                    padding: var(--v2-space-6) var(--v2-space-4);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .empty-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .people-list {
                    display: flex;
                    flex-direction: column;
                    gap: var(--v2-space-3);
                }

                .person-card {
                    display: flex;
                    align-items: center;
                    gap: var(--v2-space-3);
                    padding: var(--v2-space-3);
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .person-card:hover {
                    border-color: var(--v2-accent-primary);
                    transform: translateX(4px);
                }

                .person-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    overflow: hidden;
                    flex-shrink: 0;
                    border: 2px solid var(--v2-bg-secondary);
                }

                .person-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    background: var(--v2-accent-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    color: white;
                    font-family: var(--v2-font-racing);
                }

                .person-info {
                    flex: 1;
                    min-width: 0;
                }

                .person-name {
                    font-size: var(--v2-text-base);
                    font-weight: 700;
                    color: var(--v2-text-primary);
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .person-username {
                    font-size: var(--v2-text-sm);
                    color: var(--v2-text-secondary);
                    margin: 0;
                }

                .person-arrow {
                    color: var(--v2-text-tertiary);
                    font-weight: bold;
                    transition: transform 0.2s;
                }

                .person-card:hover .person-arrow {
                    color: var(--v2-accent-primary);
                    transform: translateX(4px);
                }
            `}</style>
        </>
    )
}
