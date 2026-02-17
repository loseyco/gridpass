'use client'

import React, { useState, use } from 'react'
import { Layout, Globe, Trash } from 'lucide-react'
import Link from 'next/link'
import { updateOrganizationSite } from '@/app/actions/organizations'

export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: orgId } = use(params)
    const [updating, setUpdating] = useState(false)

    const handleEnableSite = async () => {
        if (!confirm('Enable your public micro-site?')) return
        setUpdating(true)
        try {
            await updateOrganizationSite(orgId, { site_enabled: true })
            alert('Site enabled!')
        } catch (err) {
            alert('Failed to update')
        } finally {
            setUpdating(false)
        }
    }

    return (
        <div className="settings-page">
            <h1 className="page-title">Settings & Features</h1>

            <div className="section">
                <div className="section-header">
                    <Globe size={24} className="icon" />
                    <div>
                        <h2>Public Micro-Site</h2>
                        <p>Manage your public business profile and booking portal.</p>
                    </div>
                </div>

                <div className="actions">
                    <Link href={`/manage/${orgId}/services`} className="action-btn primary">
                        <Layout size={18} />
                        Manage Services
                    </Link>

                    <button className="action-btn outline" onClick={handleEnableSite} disabled={updating}>
                        {updating ? 'Updating...' : 'Enable/Disable Site'}
                    </button>

                    <Link href={`/biz/${orgId}`} className="action-btn outline" target="_blank">
                        View Live Site
                    </Link>
                </div>
            </div>

            <div className="section danger">
                <div className="section-header">
                    <Trash size={24} className="icon danger" />
                    <div>
                        <h2>Danger Zone</h2>
                        <p>Irreversible actions.</p>
                    </div>
                </div>
                <div className="actions">
                    <button className="action-btn danger-btn">Delete Organization</button>
                </div>
            </div>

            <style jsx>{`
                .settings-page { max-width: 800px; }
                .page-title { font-size: 1.5rem; margin-bottom: 2rem; }
                
                .section {
                    background: #111;
                    border: 1px solid #333;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }
                .section.danger { border-color: #331111; background: #110505; }
                
                .section-header { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
                .icon { color: var(--v2-accent-primary); }
                .icon.danger { color: #ff4d4d; }
                
                h2 { font-size: 1.2rem; margin: 0 0 0.25rem 0; }
                p { color: #888; margin: 0; }
                
                .actions { display: flex; gap: 1rem; flex-wrap: wrap; }
                
                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    border-radius: 8px;
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;
                    border: none;
                    font-size: 1rem;
                }
                
                .primary { background: white; color: black; }
                .outline { background: transparent; border: 1px solid #333; color: white; }
                .danger-btn { background: #331111; border: 1px solid #551111; color: #ff4d4d; }
                
                .action-btn:hover { opacity: 0.9; }
            `}</style>
        </div>
    )
}
