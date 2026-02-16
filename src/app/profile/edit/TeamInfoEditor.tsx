'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

interface TeamInfoEditorProps {
    profile: any
}

export default function TeamInfoEditor({ profile }: TeamInfoEditorProps) {
    const supabase = createClient()
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        hometown: profile.logistics_info?.hometown || '',
        home_airport: profile.logistics_info?.home_airport || '',
        helmet_size: profile.physical_info?.helmet_size || '',
        suit_size: profile.physical_info?.suit_size || '',
        shoe_size: profile.physical_info?.shoe_size || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Update logistics_info
            const { error: logisticsError } = await supabase
                .from('profiles')
                .update({
                    logistics_info: {
                        ...profile.logistics_info,
                        hometown: formData.hometown,
                        home_airport: formData.home_airport,
                    }
                })
                .eq('id', user.id)

            if (logisticsError) throw logisticsError

            // Update physical_info
            const { error: physicalError } = await supabase
                .from('profiles')
                .update({
                    physical_info: {
                        ...profile.physical_info,
                        helmet_size: formData.helmet_size,
                        suit_size: formData.suit_size,
                        shoe_size: formData.shoe_size,
                    }
                })
                .eq('id', user.id)

            if (physicalError) throw physicalError

            router.push('/profile/edit')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
            setSaving(false)
        }
    }

    return (
        <>
            <div className="v2-header">
                <Link href="/profile/edit" className="v2-link">
                    ← Settings
                </Link>
                <h1 className="v2-title">Team Info</h1>
                <div style={{ width: '60px' }} />
            </div>

            <div className="v2-content">
                <form onSubmit={handleSubmit} className="v2-form-group">
                    {error && (
                        <div className="v2-error-banner">
                            {error}
                        </div>
                    )}

                    {/* Location Information */}
                    <div className="v2-card v2-mb-4">
                        <h2 className="v2-heading-2">Location</h2>
                        <p className="v2-text-secondary v2-text-sm v2-mb-4">
                            Help teams understand where you're based and how you travel.
                        </p>

                        <div className="v2-form-group">
                            <label className="v2-label">Hometown</label>
                            <input
                                type="text"
                                className="v2-input"
                                value={formData.hometown}
                                onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                                placeholder="Indianapolis, IN"
                            />
                            <p className="v2-text-tertiary v2-text-sm" style={{ marginTop: '0.25rem' }}>
                                Where you're originally from or currently based
                            </p>
                        </div>

                        <div className="v2-form-group">
                            <label className="v2-label">Home Airport</label>
                            <input
                                type="text"
                                className="v2-input"
                                value={formData.home_airport}
                                onChange={(e) => setFormData({ ...formData, home_airport: e.target.value.toUpperCase() })}
                                placeholder="IND"
                                maxLength={3}
                                style={{ textTransform: 'uppercase' }}
                            />
                            <p className="v2-text-tertiary v2-text-sm" style={{ marginTop: '0.25rem' }}>
                                3-letter airport code (e.g., AUS, LAX, JFK)
                            </p>
                        </div>
                    </div>

                    {/* Gear Sizes */}
                    <div className="v2-card v2-mb-4">
                        <h2 className="v2-heading-2">Gear Sizes</h2>
                        <p className="v2-text-secondary v2-text-sm v2-mb-4">
                            Essential for teams to have proper safety equipment ready.
                        </p>

                        <div className="v2-form-group">
                            <label className="v2-label">Helmet Size</label>
                            <select
                                className="v2-input"
                                value={formData.helmet_size}
                                onChange={(e) => setFormData({ ...formData, helmet_size: e.target.value })}
                            >
                                <option value="">Select size...</option>
                                <option value="XS">XS</option>
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="XXL">XXL</option>
                            </select>
                        </div>

                        <div className="v2-form-group">
                            <label className="v2-label">Suit Size</label>
                            <input
                                type="text"
                                className="v2-input"
                                value={formData.suit_size}
                                onChange={(e) => setFormData({ ...formData, suit_size: e.target.value })}
                                placeholder="54 Euro / 42 US"
                            />
                            <p className="v2-text-tertiary v2-text-sm" style={{ marginTop: '0.25rem' }}>
                                Racing suit size (Euro or US sizing)
                            </p>
                        </div>

                        <div className="v2-form-group">
                            <label className="v2-label">Shoe Size</label>
                            <input
                                type="text"
                                className="v2-input"
                                value={formData.shoe_size}
                                onChange={(e) => setFormData({ ...formData, shoe_size: e.target.value })}
                                placeholder="10.5"
                            />
                            <p className="v2-text-tertiary v2-text-sm" style={{ marginTop: '0.25rem' }}>
                                Racing shoe size (US sizing)
                            </p>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        className="v2-btn v2-btn-primary v2-btn-full v2-justify-center"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </>
    )
}
