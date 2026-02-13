'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function AddVehiclePage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        year: '',
        make: '',
        model: '',
        trim: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Insert vehicle directly linked to user
            const { error } = await supabase
                .from('vehicles')
                .insert({
                    user_id: user.id,
                    year: parseInt(formData.year),
                    make: formData.make,
                    model: formData.model,
                    nickname: formData.trim || null, // Mapping trim to nickname or just ignoring? Let's use nickname if supported or just omit if schema doesn't match trim. V1 schema had nickname.
                    active: true
                })

            if (error) throw error

            router.push('/garage')
            router.refresh()
        } catch (error) {
            console.error('Error adding vehicle:', error)
            alert('Failed to add vehicle')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="v2-header">
                <Link href="/garage" className="back-btn">
                    ← Garage
                </Link>
                <h1 className="v2-title">Add Vehicle</h1>
                <div style={{ width: '60px' }} />
            </div>

            <div className="v2-content">
                <div className="v2-card">
                    <form onSubmit={handleSubmit} className="vehicle-form">
                        <div className="form-group">
                            <label className="form-label">Year</label>
                            <input
                                type="number"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g. 2024"
                                required
                                min="1900"
                                max="2030"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Make</label>
                            <input
                                type="text"
                                name="make"
                                value={formData.make}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g. Porsche"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Model</label>
                            <input
                                type="text"
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g. 911 GT3"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nickname / Trim (Optional)</label>
                            <input
                                type="text"
                                name="trim"
                                value={formData.trim}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g. 'Red Rocket' or 'Weissach Package'"
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="save-btn"
                                disabled={loading}
                            >
                                {loading ? 'Adding...' : 'Add Vehicle'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .back-btn {
                    font-size: var(--v2-text-sm);
                    font-weight: 600;
                    color: var(--v2-text-primary);
                    text-decoration: none;
                }

                .vehicle-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-label {
                    font-size: var(--v2-text-xs);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--v2-text-tertiary);
                }

                .form-input {
                    padding: 0.75rem;
                    border: 1px solid var(--v2-border);
                    border-radius: var(--v2-radius-md);
                    font-size: var(--v2-text-base);
                    font-family: inherit;
                    width: 100%;
                    background: var(--v2-bg-secondary);
                }

                .form-input:focus {
                    outline: none;
                    border-color: var(--v2-accent-primary);
                    background: white;
                    box-shadow: 0 0 0 3px var(--v2-accent-light);
                }

                .form-actions {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--v2-border);
                }

                .save-btn {
                    width: 100%;
                    padding: 0.875rem;
                    background: var(--v2-accent-primary);
                    color: white;
                    border: none;
                    border-radius: var(--v2-radius-md);
                    font-size: var(--v2-text-base);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: var(--v2-shadow-accent);
                }

                .save-btn:hover:not(:disabled) {
                    background: var(--v2-accent-primary-hover);
                    transform: translateY(-1px);
                    box-shadow: var(--v2-shadow-md);
                }

                .save-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
            `}</style>
        </>
    )
}
