'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, Settings, ArrowLeft, MapPin, ShoppingBag } from 'lucide-react'

export default function ManageLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const pathname = usePathname()
    const { id: orgId } = use(params)

    const navItems = [
        { label: 'Overview', href: `/manage/${orgId}`, icon: <LayoutDashboard size={20} /> },
        { label: 'Location', href: `/manage/${orgId}/location`, icon: <MapPin size={20} /> },
        { label: 'Services', href: `/manage/${orgId}/services`, icon: <ShoppingBag size={20} /> },
        { label: 'Payouts', href: `/manage/${orgId}/payouts`, icon: <Wallet size={20} /> },
        { label: 'Settings', href: `/manage/${orgId}/settings`, icon: <Settings size={20} /> },
    ]

    return (
        <div className="manage-layout">
            <aside className="manage-sidebar">
                <div className="sidebar-header">
                    <Link href="/" className="back-link">
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>
                    <h2 className="sidebar-title">Business Manager</h2>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            <main className="manage-content">
                {children}
            </main>

            <style jsx>{`
                .manage-layout {
                    display: flex;
                    min-height: 100vh;
                    background: #000;
                    color: #fff;
                }

                .manage-sidebar {
                    width: 250px;
                    border-right: 1px solid #333;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                }

                .sidebar-header {
                    margin-bottom: 2rem;
                }

                .back-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #888;
                    text-decoration: none;
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                    transition: color 0.2s;
                }

                .back-link:hover {
                    color: #fff;
                }

                .sidebar-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                }

                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    border-radius: 6px;
                    color: #aaa;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .nav-item:hover {
                    background: #111;
                    color: #fff;
                }

                .nav-item.active {
                    background: var(--v2-accent-primary);
                    color: #fff;
                }

                .manage-content {
                    flex: 1;
                    padding: 2rem;
                    overflow-y: auto;
                }
            `}</style>
        </div>
    )
}
