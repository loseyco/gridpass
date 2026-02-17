'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, Settings, ArrowLeft, MapPin, ShoppingBag, Clock } from 'lucide-react'

export default function ManageLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const pathname = usePathname()
    const { id: orgId } = use(params)
    const isDashboardRoot = pathname === `/manage/${orgId}`

    return (
        <div className="manage-layout v2-container">
            <header className="manage-header">
                <div className="header-content">
                    {isDashboardRoot ? (
                        <Link href="/profile" className="back-link">
                            <ArrowLeft size={16} />
                            Back to Profile
                        </Link>
                    ) : (
                        <Link href={`/manage/${orgId}`} className="back-link">
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </Link>
                    )}
                </div>
            </header>

            <main className="manage-content">
                {children}
            </main>

            <style jsx>{`
                .manage-layout {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }

                .manage-header {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    background: #111;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: rgba(255,255,255,0.7);
                    text-decoration: none;
                    font-size: 0.9rem;
                    font-weight: 500;
                    transition: color 0.2s;
                }
                .back-link:hover {
                    color: #fff;
                }

                .manage-content {
                    flex: 1;
                    padding: 1.5rem;
                    max-width: 800px;
                    margin: 0 auto;
                    width: 100%;
                }

                @media (max-width: 768px) {
                    .manage-header { padding: 1rem; }
                    .manage-content { padding: 1rem; }
                }
            `}</style>
        </div>
    )
}
