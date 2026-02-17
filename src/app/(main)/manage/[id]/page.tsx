// Server Component

import React from 'react'
import { getBookingsForOrganization } from '@/app/actions/org-bookings'
import Link from 'next/link'
import { MapPin, ShoppingBag, Clock, Wallet, Settings, ChevronRight } from 'lucide-react'
// ... import other stats

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params; // This would fetch stats and display them
    return (
        <div className="manage-dashboard">
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Dashboard</h1>
            <p style={{ color: '#888' }}>Overview of your business performance.</p>

            <div style={{
                background: '#111',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '2rem',
                marginTop: '2rem',
                textAlign: 'center'
            }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Bookings & Revenue</h3>
                <p style={{ color: '#888', marginBottom: '1.5rem' }}>View your recent bookings and payouts.</p>
                {/* Stats would go here */}
                <div style={{ color: '#666', fontSize: '0.875rem' }}>Total Revenue (This Month)</div>
            </div>

            <div className="manage-menu" style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
                <Link href={`/manage/${id}/location`} className="menu-item">
                    <div className="menu-icon"><MapPin size={24} /></div>
                    <div className="menu-content">
                        <span className="menu-title">Location</span>
                        <span className="menu-subtitle">Manage address and map settings</span>
                    </div>
                    <ChevronRight size={20} className="menu-chevron" />
                </Link>

                <Link href={`/manage/${id}/services`} className="menu-item">
                    <div className="menu-icon"><ShoppingBag size={24} /></div>
                    <div className="menu-content">
                        <span className="menu-title">Services</span>
                        <span className="menu-subtitle">Add or edit your offerings</span>
                    </div>
                    <ChevronRight size={20} className="menu-chevron" />
                </Link>

                <Link href={`/manage/${id}/hours`} className="menu-item">
                    <div className="menu-icon"><Clock size={24} /></div>
                    <div className="menu-content">
                        <span className="menu-title">Hours</span>
                        <span className="menu-subtitle">Update operating hours</span>
                    </div>
                    <ChevronRight size={20} className="menu-chevron" />
                </Link>

                <Link href={`/manage/${id}/payouts`} className="menu-item">
                    <div className="menu-icon"><Wallet size={24} /></div>
                    <div className="menu-content">
                        <span className="menu-title">Payouts</span>
                        <span className="menu-subtitle">Connect Stripe to receive payments</span>
                    </div>
                    <ChevronRight size={20} className="menu-chevron" />
                </Link>

                <Link href={`/manage/${id}/settings`} className="menu-item">
                    <div className="menu-icon"><Settings size={24} /></div>
                    <div className="menu-content">
                        <span className="menu-title">Settings</span>
                        <span className="menu-subtitle">General settings and danger zone</span>
                    </div>
                    <ChevronRight size={20} className="menu-chevron" />
                </Link>
            </div>

            <style>{`
                .menu-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.25rem;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    text-decoration: none;
                    color: white;
                    transition: all 0.2s;
                }
                .menu-item:hover {
                    background: rgba(255,255,255,0.06);
                    border-color: rgba(255,255,255,0.1);
                    transform: translateY(-2px);
                }
                .menu-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--v2-accent-primary);
                }
                .menu-content { flex: 1; }
                .menu-title { display: block; font-weight: 600; font-size: 1.1rem; }
                .menu-subtitle { display: block; color: #888; font-size: 0.9rem; margin-top: 0.2rem; }
                .menu-chevron { color: #555; transition: transform 0.2s; }
                .menu-item:hover .menu-chevron { transform: translateX(2px); color: #fff; }
            `}</style>
        </div>
    )
}
