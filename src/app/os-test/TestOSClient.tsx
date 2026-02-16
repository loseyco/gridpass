'use client'

import React, { useState } from 'react'
import { GridRenderer, ComponentSchema } from '@/os/core/GridRenderer'

const TEST_SCHEMA: ComponentSchema = {
    component: 'Container',
    props: { className: 'v2-content', style: { padding: '2rem', maxWidth: '800px', margin: '0 auto' } },
    children: [
        {
            component: 'Container',
            props: { style: { marginBottom: '2rem' } },
            children: [
                {
                    component: 'Container',
                    props: { children: 'OS Kernel Test: GridRenderer', style: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' } }
                },
                {
                    component: 'Container',
                    props: { children: 'This form is generated entirely from JSON schema.', style: { color: '#888', marginBottom: '2rem' } }
                }
            ]
        },
        {
            component: 'Container',
            props: { className: 'v2-card', style: { padding: '2rem' } },
            children: [
                {
                    component: 'Row',
                    children: [
                        {
                            component: 'Col',
                            children: [
                                {
                                    component: 'GridInput',
                                    props: { label: 'First Name', name: 'first_name', placeholder: 'e.g. Lewis' },
                                    bind: 'first_name'
                                }
                            ]
                        },
                        {
                            component: 'Col',
                            children: [
                                {
                                    component: 'GridInput',
                                    props: { label: 'Last Name', name: 'last_name', placeholder: 'e.g. Hamilton' },
                                    bind: 'last_name'
                                }
                            ]
                        }
                    ]
                },
                {
                    component: 'GridInput',
                    props: { label: 'Headline', name: 'headline', placeholder: 'e.g. Format 1 Driver' },
                    bind: 'headline'
                },
                {
                    component: 'GridToggle',
                    props: { label: 'Available for Hire?', name: 'is_available' },
                    bind: 'is_available'
                },
                {
                    component: 'GridBadgePicker',
                    props: { label: 'Skills', name: 'skills', placeholder: 'Add a skill (e.g. Braking)' },
                    bind: 'skills'
                }
            ]
        },
        {
            component: 'Container',
            props: { className: 'v2-card', style: { padding: '2rem', marginTop: '2rem' } },
            children: [
                {
                    component: 'Container',
                    props: { children: 'Telemetry & Stats', style: { fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' } }
                },
                {
                    component: 'Row',
                    children: [
                        {
                            component: 'Col',
                            children: [
                                {
                                    component: 'GridGauge',
                                    props: { label: 'Completion', value: 75, units: '%' }
                                }
                            ]
                        },
                        {
                            component: 'Col',
                            children: [
                                {
                                    component: 'GridGauge',
                                    props: { label: 'Reliability', value: 98, units: '%', color: '#4caf50' }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}

export default function TestOSClient() {
    const [data, setData] = useState({
        first_name: '',
        last_name: '',
        headline: '',
        is_available: true,
        skills: ['Driving', 'Data Analysis']
    })

    const handleChange = (key: string, value: any) => {
        console.log('OS Change:', key, value)
        setData(prev => ({ ...prev, [key]: value }))
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white' }}>
            <GridRenderer schema={TEST_SCHEMA} data={data} onChange={handleChange} />

            <div style={{ marginTop: '2rem', padding: '2rem', background: '#111', borderTop: '1px solid #333' }}>
                <h3>Live Data State</h3>
                <pre style={{ color: '#0f0', background: '#000', padding: '1rem', borderRadius: '8px' }}>
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    )
}
