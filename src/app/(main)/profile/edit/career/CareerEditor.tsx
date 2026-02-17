'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CareerItem {
    id: string
    title: string
    organization: string
    start_date: string
    end_date?: string | null
    is_current: boolean
    description?: string
    location?: string
    type: 'employment' | 'contract' | 'freelance'
}

interface CareerEditorProps {
    profile: any
}

export default function CareerEditor({ profile }: CareerEditorProps) {
    const router = useRouter()
    const [history, setHistory] = useState<CareerItem[]>(profile.career_history || [])
    const [isEditing, setIsEditing] = useState(false)
    const [currentItem, setCurrentItem] = useState<CareerItem | null>(null)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        try {
            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ career_history: history }),
            })

            if (!response.ok) throw new Error('Failed to save')

            router.refresh()
            setSaving(false)
        } catch (error) {
            console.error(error)
            setSaving(false)
            alert('Failed to save changes')
        }
    }

    const addNew = () => {
        setCurrentItem({
            id: crypto.randomUUID(),
            title: '',
            organization: '',
            start_date: '',
            is_current: false,
            type: 'employment',
            description: '',
            location: ''
        })
        setIsEditing(true)
    }

    const editItem = (item: CareerItem) => {
        setCurrentItem({ ...item })
        setIsEditing(true)
    }

    const saveItem = () => {
        if (!currentItem) return

        // Validation
        if (!currentItem.title || !currentItem.organization || !currentItem.start_date) {
            alert('Please fill in required fields')
            return
        }

        const newHistory = [...history]
        const index = newHistory.findIndex(i => i.id === currentItem.id)

        if (index >= 0) {
            newHistory[index] = currentItem
        } else {
            // Sort by date (newest first)
            newHistory.unshift(currentItem)
            newHistory.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        }

        setHistory(newHistory)
        setIsEditing(false)
        setCurrentItem(null)
        // Auto-save to DB
        setTimeout(() => handleSave(), 0)
    }

    const deleteItem = (id: string) => {
        if (!confirm('Are you sure you want to remove this entry?')) return
        const newHistory = history.filter(i => i.id !== id)
        setHistory(newHistory)
        // Auto-save to DB
        setTimeout(() => {
            // We need to pass the *new* history directly because state update might lag in this closure
            // Actually, simplest is to just call handleSave but with the new data passed in?
            // Or update state then trigger save. 
            // Ideally we'd separate save logic. For now, manual trigger:
            fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ career_history: newHistory }),
            }).then(() => router.refresh())
        }, 0)
    }

    if (isEditing && currentItem) {
        return (
            <div className="v2-fade-in">
                <div className="v2-header">
                    <button onClick={() => setIsEditing(false)} className="v2-btn v2-btn-outline" style={{ border: 'none', paddingLeft: 0 }}>
                        Cancel
                    </button>
                    <h1 className="v2-title">{currentItem.title ? 'Edit Position' : 'Add Position'}</h1>
                    <div style={{ width: '40px' }} />
                </div>

                <div className="v2-content">
                    <div className="v2-card">
                        <div className="v2-form-group">
                            <label className="v2-label">Job Title *</label>
                            <input
                                type="text"
                                className="v2-input"
                                value={currentItem.title}
                                onChange={e => setCurrentItem({ ...currentItem, title: e.target.value })}
                                placeholder="e.g. Race Engineer"
                            />
                        </div>

                        <div className="v2-form-group">
                            <label className="v2-label">Organization *</label>
                            <input
                                type="text"
                                className="v2-input"
                                value={currentItem.organization}
                                onChange={e => setCurrentItem({ ...currentItem, organization: e.target.value })}
                                placeholder="e.g. Red Bull Racing"
                            />
                        </div>

                        <div className="v2-form-group">
                            <label className="v2-label">Employment Type</label>
                            <select
                                className="v2-input"
                                value={currentItem.type}
                                onChange={e => setCurrentItem({ ...currentItem, type: e.target.value as any })}
                            >
                                <option value="employment">Employment</option>
                                <option value="contract">Contract</option>
                                <option value="freelance">Freelance</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="v2-form-group" style={{ flex: 1 }}>
                                <label className="v2-label">Start Date *</label>
                                <input
                                    type="date"
                                    className="v2-input"
                                    value={currentItem.start_date}
                                    onChange={e => setCurrentItem({ ...currentItem, start_date: e.target.value })}
                                />
                            </div>
                            <div className="v2-form-group" style={{ flex: 1 }}>
                                <label className="v2-label">End Date</label>
                                <input
                                    type="date"
                                    className="v2-input"
                                    value={currentItem.end_date || ''}
                                    onChange={e => setCurrentItem({ ...currentItem, end_date: e.target.value })}
                                    disabled={currentItem.is_current}
                                    style={{ opacity: currentItem.is_current ? 0.5 : 1 }}
                                />
                            </div>
                        </div>

                        <div className="v2-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="is_current"
                                checked={currentItem.is_current}
                                onChange={e => setCurrentItem({ ...currentItem, is_current: e.target.checked, end_date: e.target.checked ? null : currentItem.end_date })}
                                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--v2-accent-primary)' }}
                            />
                            <label htmlFor="is_current" className="v2-label" style={{ marginBottom: 0, cursor: 'pointer' }}>I currently work here</label>
                        </div>

                        <div className="v2-form-group">
                            <label className="v2-label">Location</label>
                            <input
                                type="text"
                                className="v2-input"
                                value={currentItem.location || ''}
                                onChange={e => setCurrentItem({ ...currentItem, location: e.target.value })}
                                placeholder="e.g. London, UK"
                            />
                        </div>

                        <div className="v2-form-group">
                            <label className="v2-label">Description</label>
                            <textarea
                                className="v2-input"
                                value={currentItem.description || ''}
                                onChange={e => setCurrentItem({ ...currentItem, description: e.target.value })}
                                placeholder="Describe your role and achievements..."
                                rows={4}
                                style={{ resize: 'vertical', minHeight: '100px' }}
                            />
                        </div>
                        <div className="v2-mt-4">
                            <button
                                onClick={saveItem}
                                className="v2-btn v2-btn-primary v2-btn-full v2-justify-center"
                            >
                                Save Position
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="v2-header">
                <Link href="/profile/edit" className="v2-link">
                    ← Settings
                </Link>
                <h1 className="v2-title">Career History</h1>
                <button onClick={addNew} className="v2-btn v2-btn-ghost" style={{ color: 'var(--v2-accent-primary)', paddingRight: 0 }}>
                    + Add
                </button>
            </div>

            <div className="v2-content">
                {history.length === 0 ? (
                    <div className="v2-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <p className="v2-text-secondary v2-mb-4">No career history added yet.</p>
                        <button onClick={addNew} className="v2-btn v2-btn-primary">Add Your First Role</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="v2-card"
                                onClick={() => editItem(item)}
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'transform 0.2s, background 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.borderColor = 'var(--v2-accent-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.borderColor = 'var(--v2-border)';
                                }}
                            >
                                <div>
                                    <h3 className="v2-heading-3" style={{ marginBottom: '0.25rem' }}>{item.title}</h3>
                                    <p className="v2-text-secondary v2-text-sm" style={{ marginBottom: '0.25rem' }}>{item.organization}</p>
                                    <p className="v2-text-tertiary v2-text-xs">
                                        {new Date(item.start_date).getFullYear()} -
                                        {item.is_current ? ' Present' : (item.end_date ? ` ${new Date(item.end_date).getFullYear()}` : '')}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                                        className="v2-btn v2-btn-ghost"
                                        style={{ color: '#ef4444', padding: '0.5rem' }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path>
                                        </svg>
                                    </button>
                                    <span style={{ color: 'var(--v2-text-tertiary)' }}>→</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
