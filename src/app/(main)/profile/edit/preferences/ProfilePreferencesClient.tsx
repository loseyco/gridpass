'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GridInput } from '@/os/components/GridInput'
import { GridToggle } from '@/os/components/GridToggle'
import { ArrowLeft, Save, Briefcase, MapPin, DollarSign, Clock } from 'lucide-react'

interface ProfilePreferencesClientProps {
    profile: any
}

export default function ProfilePreferencesClient({ profile }: ProfilePreferencesClientProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [preferences, setPreferences] = useState(profile.job_preferences || {
        is_open_to_work: false,
        roles: [],
        job_types: [],
        salary_expectations: '',
        locations: [],
        relocation: false,
        availability: 'immediately'
    })

    // Helper for comma-separated arrays
    const handleArrayChange = (key: string, value: string) => {
        setPreferences({
            ...preferences,
            [key]: value.split(',').map(s => s.trim()).filter(Boolean)
        })
    }

    const handleJobTypeChange = (type: string) => {
        const types = preferences.job_types || []
        if (types.includes(type)) {
            setPreferences({
                ...preferences,
                job_types: types.filter((t: string) => t !== type)
            })
        } else {
            setPreferences({
                ...preferences,
                job_types: [...types, type]
            })
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_preferences: preferences
                })
            })

            if (!res.ok) throw new Error('Failed to update')

            router.refresh()
            router.push('/profile/edit')
        } catch (error) {
            console.error(error)
            alert('Failed to save preferences')
        } finally {
            setLoading(false)
        }
    }

    const jobTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship']

    return (
        <>
            <div className="v2-header">
                <Link href="/profile/edit" className="v2-link">
                    <ArrowLeft size={20} className="v2-mr-2" />
                    Back
                </Link>
                <h1 className="v2-title">Career Preferences</h1>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="v2-btn v2-btn-primary v2-btn-sm"
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>

            <div className="v2-content">

                {/* Main Toggle */}
                <div className="v2-card v2-mb-4">
                    <GridToggle
                        label="Open To Work"
                        name="open_to_work"
                        value={preferences.is_open_to_work}
                        onChange={(val) => setPreferences({ ...preferences, is_open_to_work: val })}
                        className="v2-mb-0"
                    />
                    <p className="v2-text-secondary v2-text-sm v2-mt-2">
                        Signal to recruiters and teams that you are looking for new opportunities.
                    </p>
                </div>

                {preferences.is_open_to_work && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        {/* Target Roles */}
                        <div className="v2-card v2-mb-4">
                            <div className="v2-flex v2-items-center v2-gap-2 v2-mb-4">
                                <Briefcase className="v2-text-accent" size={20} />
                                <h3 className="v2-heading-3 v2-mb-0">Target Roles</h3>
                            </div>
                            <GridInput
                                label="Job Titles (comma separated)"
                                name="roles"
                                value={preferences.roles?.join(', ') || ''}
                                onChange={(val) => handleArrayChange('roles', String(val))}
                                placeholder="e.g. Race Engineer, Mechanic, Data Analyst"
                            />

                            <label className="v2-label v2-mt-4">Job Types</label>
                            <div className="v2-flex v2-flex-wrap v2-gap-2 v2-mt-2">
                                {jobTypeOptions.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleJobTypeChange(type)}
                                        className={`v2-badge cursor-pointer hover:opacity-80 transition-all ${preferences.job_types?.includes(type)
                                            ? 'v2-badge-green'
                                            : 'v2-bg-secondary v2-text-secondary'
                                            }`}
                                        style={{ border: 'none', padding: '8px 16px' }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Location & Relocation */}
                        <div className="v2-card v2-mb-4">
                            <div className="v2-flex v2-items-center v2-gap-2 v2-mb-4">
                                <MapPin className="v2-text-accent" size={20} />
                                <h3 className="v2-heading-3 v2-mb-0">Location</h3>
                            </div>
                            <GridInput
                                label="Preferred Locations (comma separated)"
                                name="locations"
                                value={preferences.locations?.join(', ') || ''}
                                onChange={(val) => handleArrayChange('locations', String(val))}
                                placeholder="e.g. Indianapolis, Charlotte, Remote"
                            />
                            <div className="v2-mt-4">
                                <GridToggle
                                    label="Willing to Relocate"
                                    name="relocation"
                                    value={preferences.relocation || false}
                                    onChange={(val) => setPreferences({ ...preferences, relocation: val })}
                                />
                            </div>
                        </div>

                        {/* Compensation */}
                        <div className="v2-card v2-mb-4">
                            <div className="v2-flex v2-items-center v2-gap-2 v2-mb-4">
                                <DollarSign className="v2-text-accent" size={20} />
                                <h3 className="v2-heading-3 v2-mb-0">Expectations</h3>
                            </div>
                            <GridInput
                                label="Salary / Rate Expectations"
                                name="salary"
                                value={preferences.salary_expectations || ''}
                                onChange={(val) => setPreferences({ ...preferences, salary_expectations: String(val) })}
                                placeholder="e.g. $80k+/yr or $500/day"
                            />

                            <div className="v2-mt-4">
                                <label className="v2-label">Availability</label>
                                <select
                                    className="v2-input v2-w-full"
                                    value={preferences.availability || 'immediately'}
                                    onChange={(e) => setPreferences({ ...preferences, availability: e.target.value })}
                                >
                                    <option value="immediately">Immediately</option>
                                    <option value="2_weeks">2 Weeks Notice</option>
                                    <option value="1_month">1 Month Notice</option>
                                    <option value="negotiable">Negotiable</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
