import { fetchAllApps, createApp } from '@/os/actions/studio-actions'
import Link from 'next/link'
import { Plus, Layout, ArrowRight, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudioDashboard() {
    const apps = await fetchAllApps()

    return (
        <div className="v2-layout" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div className="v2-header profile-nav" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="v2-title">
                    <span className="v2-text-white">GRID</span>
                    <span className="v2-text-accent">STUDIO</span>
                </h1>
                <Link href="/" className="v2-btn v2-btn-ghost">
                    Back to OS
                </Link>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>

                {/* Create App Panel */}
                <div className="v2-card" style={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <h2 className="v2-heading-2">Create New App</h2>
                    <p className="v2-text-secondary" style={{ marginBottom: '1.5rem' }}>
                        Initialize a new application in the registry.
                    </p>

                    <form action={createApp as any} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="v2-label">App Name</label>
                            <input
                                name="name"
                                type="text"
                                className="v2-input"
                                placeholder="e.g. Simple Profile Editor"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                            />
                        </div>
                        <div>
                            <label className="v2-label">Slug (URL)</label>
                            <input
                                name="slug"
                                type="text"
                                className="v2-input"
                                placeholder="e.g. simple-editor"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                            />
                        </div>
                        <button type="submit" className="v2-btn v2-btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                            <Plus size={18} style={{ marginRight: '0.5rem' }} /> Initialize App
                        </button>
                    </form>
                </div>

                {/* App List */}
                <div style={{ flex: '2 1 400px', minWidth: '300px' }}>
                    <h2 className="v2-heading-2" style={{ marginBottom: '1rem' }}>Existing Applications</h2>

                    {apps && apps.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {apps.map((app: any) => (
                                <div key={app.id} className="v2-card" style={{
                                    height: '100%',
                                    transition: 'transform 0.2s, border-color 0.2s',
                                    cursor: 'default',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <div style={{
                                            width: '40px', height: '40px',
                                            background: 'rgba(255, 68, 68, 0.1)',
                                            borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginBottom: '1rem',
                                            color: '#ff4444'
                                        }}>
                                            <Layout size={20} />
                                        </div>
                                        <h3 className="v2-heading-3" style={{ marginBottom: '0.5rem' }}>{app.name}</h3>
                                        <code style={{ fontSize: '0.75rem', color: '#666', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                                            {app.slug}
                                        </code>
                                    </div>

                                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                        <Link
                                            href={`/studio/${app.slug}`}
                                            style={{ flex: 1, textDecoration: 'none' }}
                                            className="v2-btn v2-btn-secondary"
                                        >
                                            Edit <ArrowRight size={14} style={{ marginLeft: '0.5rem' }} />
                                        </Link>
                                        <Link
                                            href={`/apps/${app.slug}`}
                                            target="_blank"
                                            style={{ flex: 1, textDecoration: 'none' }}
                                            className="v2-btn v2-btn-primary"
                                        >
                                            Launch <ExternalLink size={14} style={{ marginLeft: '0.5rem' }} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="v2-card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p className="v2-text-secondary">No apps found. Create your first one!</p>
                        </div>
                    )}
                </div>

            </div>
        </div >
    )
}
