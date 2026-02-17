'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SkillsEditorProps {
    profile: any
}

export default function SkillsEditor({ profile }: SkillsEditorProps) {
    const router = useRouter()
    const [skills, setSkills] = useState<string[]>(profile.skills || [])
    const [newSkill, setNewSkill] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSave = async (updatedSkills: string[]) => {
        setSaving(true)
        try {
            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills: updatedSkills }),
            })

            if (!response.ok) throw new Error('Failed to save')

            setSkills(updatedSkills)
            router.refresh()
            setSaving(false)
        } catch (error) {
            console.error(error)
            setSaving(false)
            alert('Failed to save changes')
        }
    }

    const addSkill = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = newSkill.trim()
        if (!trimmed) return

        if (skills.includes(trimmed)) {
            alert('Skill already added')
            return
        }

        const updated = [...skills, trimmed]
        setSkills(updated)
        setNewSkill('')
        // Auto-save
        handleSave(updated)
    }

    const removeSkill = (skillToRemove: string) => {
        const updated = skills.filter(s => s !== skillToRemove)
        setSkills(updated)
        // Auto-save
        handleSave(updated)
    }

    return (
        <>
            <div className="v2-header">
                <Link href="/profile/edit" className="v2-link">
                    ← Settings
                </Link>
                <h1 className="v2-title">Skills & Badges</h1>
                <div style={{ width: '60px' }} />
            </div>

            <div className="v2-content">
                <div className="v2-card">
                    <h2 className="v2-heading-3">Add Skills</h2>
                    <p className="v2-text-secondary v2-text-sm v2-mb-4">
                        Add skills to highlight your expertise. Verified badges are awarded for confirmed skills.
                    </p>

                    <form onSubmit={addSkill} className="v2-form-group" style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            className="v2-input"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="e.g. Race Strategy, Data Analysis..."
                            style={{ flex: 1 }}
                        />
                        <button
                            type="submit"
                            className="v2-btn v2-btn-primary"
                            disabled={!newSkill.trim() || saving}
                            style={{ padding: '0 1.25rem' }}
                        >
                            Add
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {skills.map((skill) => (
                            <div key={skill} className="v2-badge">
                                <span>{skill}</span>
                                <button
                                    onClick={() => removeSkill(skill)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--v2-text-tertiary)',
                                        marginLeft: '0.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: 0,
                                        fontSize: '1.2rem',
                                        lineHeight: 1
                                    }}
                                    aria-label={`Remove ${skill}`}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {skills.length === 0 && (
                            <p className="v2-empty-state" style={{ padding: '1rem 0' }}>
                                No skills added yet.
                            </p>
                        )}
                    </div>
                </div>

                <div className="v2-mt-4">
                    <button
                        onClick={() => router.push('/profile/edit')}
                        className="v2-btn v2-btn-primary v2-btn-full v2-justify-center"
                    >
                        Save & Return
                    </button>
                </div>
            </div>


            <style jsx>{`
                .v2-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.5rem 0.75rem;
                    background: var(--v2-bg-secondary);
                    border: 1px solid var(--v2-border);
                    border-radius: 20px;
                    font-size: var(--v2-text-sm);
                    font-weight: 500;
                    color: var(--v2-text-primary);
                }
            `}</style>
        </>
    )
}
