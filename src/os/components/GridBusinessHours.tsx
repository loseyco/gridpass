'use client'
import React from 'react'

interface BusinessHour {
    day_of_week: number
    open_time?: string
    close_time?: string
    is_closed?: boolean
    notes?: string
}

interface GridBusinessHoursProps {
    hours?: BusinessHour[]
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function GridBusinessHours({ hours = [] }: GridBusinessHoursProps) {
    if (!hours || hours.length === 0) {
        return <div className="v2-text-secondary">Hours not available</div>
    }

    // Create a map for quick lookup
    const hoursMap = new Map(hours.map(h => [h.day_of_week, h]))

    return (
        <div style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '1.5rem',
            margin: '2rem 0'
        }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Business Hours</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {DAYS.map((day, index) => {
                    const dayHours = hoursMap.get(index)
                    const isToday = new Date().getDay() === index

                    return (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem',
                                background: isToday ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                                borderRadius: '8px',
                                borderLeft: isToday ? '3px solid #667eea' : '3px solid transparent'
                            }}
                        >
                            <span style={{
                                fontWeight: isToday ? 'bold' : 'normal',
                                color: isToday ? '#667eea' : '#fff',
                                minWidth: '100px'
                            }}>
                                {day}
                            </span>
                            <span style={{ color: '#aaa' }}>
                                {!dayHours ? (
                                    'Closed'
                                ) : dayHours.is_closed ? (
                                    'Closed'
                                ) : dayHours.notes ? (
                                    dayHours.notes
                                ) : dayHours.open_time && dayHours.close_time ? (
                                    <>
                                        {formatTime(dayHours.open_time)} - {formatTime(dayHours.close_time)}
                                    </>
                                ) : (
                                    'Closed'
                                )}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function formatTime(time: string): string {
    try {
        const [hours, minutes] = time.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        return `${displayHour}:${minutes} ${ampm}`
    } catch {
        return time
    }
}
