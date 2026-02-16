'use client'

import React, { useState, useEffect, use } from 'react'
import { getOrganizationHours, updateOrganizationHours, OrganizationHours } from '@/app/actions/org-hours'
import { Loader2, Save, Clock } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function HoursPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: orgId } = use(params)
    const [hours, setHours] = useState<Partial<OrganizationHours>[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadHours()
    }, [])

    const loadHours = async () => {
        try {
            const data = await getOrganizationHours(orgId)

            // Initialize with defaults if empty
            if (data.length === 0) {
                const defaults = DAYS.map((_, index) => ({
                    day_of_week: index,
                    open_time: '09:00',
                    close_time: '17:00',
                    is_closed: index === 0 || index === 6 // Closed weekends by default
                }))
                setHours(defaults)
            } else {
                setHours(data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (index: number, field: keyof OrganizationHours, value: any) => {
        const newHours = [...hours]
        newHours[index] = { ...newHours[index], [field]: value }
        setHours(newHours)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateOrganizationHours(orgId, hours)
            alert('Hours saved successfully!')
        } catch (err) {
            alert('Failed to save hours')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>

    return (
        <div className="hours-page">
            <div className="header">
                <div>
                    <h1>Business Hours</h1>
                    <p>Set your weekly schedule. This will be displayed on your public profile.</p>
                </div>
            </div>

            <div className="hours-list">
                {hours.map((day, index) => (
                    <div key={index} className={`day-row ${day.is_closed ? 'closed' : ''}`}>
                        <div className="day-name">
                            <span className="toggle">
                                <input
                                    type="checkbox"
                                    checked={!day.is_closed}
                                    onChange={(e) => handleChange(index, 'is_closed', !e.target.checked)}
                                />
                            </span>
                            {DAYS[day.day_of_week!]}
                        </div>

                        <div className="time-inputs">
                            {day.is_closed ? (
                                <span className="closed-text">Closed</span>
                            ) : (
                                <>
                                    <input
                                        type="time"
                                        value={day.open_time || ''}
                                        onChange={(e) => handleChange(index, 'open_time', e.target.value)}
                                    />
                                    <span className="separator">to</span>
                                    <input
                                        type="time"
                                        value={day.close_time || ''}
                                        onChange={(e) => handleChange(index, 'close_time', e.target.value)}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="footer-actions">
                <button
                    className="save-btn"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Save Changes
                </button>
            </div>

            <style jsx>{`
                .hours-page { max-width: 800px; padding-bottom: 4rem; }
                .header { margin-bottom: 2rem; }
                h1 { font-size: 1.5rem; margin: 0; }
                p { color: #888; margin: 0; }
                
                .footer-actions {
                    margin-top: 2rem;
                    display: flex;
                    justify-content: flex-end;
                }
                
                .save-btn {
                    background: var(--v2-accent-primary);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.25rem;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    font-weight: 600;
                }
                .save-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                .hours-list {
                    background: #111;
                    border: 1px solid #333;
                    border-radius: 12px;
                    overflow: hidden;
                }
                
                .day-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid #333;
                }
                .day-row:last-child { border-bottom: none; }
                .day-row.closed { background: #0a0a0a; color: #666; }
                
                .day-name { display: flex; align-items: center; gap: 1rem; font-weight: 500; min-width: 150px; }
                .toggle input { width: 1.25rem; height: 1.25rem; cursor: pointer; }
                
                .time-inputs { display: flex; align-items: center; gap: 1rem; }
                .closed-text { color: #555; font-style: italic; }
                
                input[type="time"] {
                    background: #222;
                    border: 1px solid #444;
                    color: white;
                    padding: 0.5rem;
                    border-radius: 6px;
                    font-family: inherit;
                }
                .separator { color: #666; }
            `}</style>
        </div>
    )
}
