'use client'

import React, { useState } from 'react'
import { GridRenderer, ComponentSchema } from '@/os/core/GridRenderer'
import { updateOSField, saveOSContext } from '@/os/actions/grid-actions'
import { toast } from 'sonner' // Assuming sonner is installed as seen in package.json

interface AppClientProps {
    slug: string
    schema: ComponentSchema | null // Null if not found
    name?: string
    initialData: Record<string, any>
    targetUserId?: string
    sourceMapping?: Record<string, string>
}

export default function AppClient({ slug, schema, name, initialData, targetUserId, sourceMapping }: AppClientProps) {
    const [data, setData] = useState<Record<string, any>>(initialData)
    const [dirtyTables, setDirtyTables] = useState<Set<string>>(new Set())

    const handleChange = (key: string, value: any) => {
        // Local state update only
        // console.log(`[${slug}] Change:`, key, value)

        const newData = JSON.parse(JSON.stringify(data)) // deep clone

        // Helper to set nested value "a.b" = val
        const setNestedValue = (obj: any, path: string, val: any) => {
            const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.')
            let current = obj

            // Track dirty table
            if (keys.length > 0) {
                const tableName = keys[0]
                if (!dirtyTables.has(tableName)) {
                    setDirtyTables(prev => new Set(prev).add(tableName))
                }
            }

            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i]
                if (!current[k]) current[k] = {} // create path if missing
                current = current[k]
            }
            current[keys[keys.length - 1]] = val
        }

        setNestedValue(newData, key, value)
        setData(newData)
    }

    const handleAction = async (action: string, payload?: any) => {
        if (action === 'submit') {
            try {
                // Only send dirty tables
                const dirtyData: Record<string, any> = {}
                dirtyTables.forEach(tableName => {
                    if (data[tableName]) {
                        dirtyData[tableName] = data[tableName]
                    }
                })

                if (Object.keys(dirtyData).length === 0) {
                    toast.info('No changes to save')
                    return
                }

                const result = await saveOSContext(dirtyData, targetUserId, sourceMapping)
                if (result.success) {
                    toast.success('App Data Saved')
                    setDirtyTables(new Set()) // Reset dirty
                } else {
                    console.error('[AppClient] Save Failed:', JSON.stringify(result, null, 2))
                    toast.error('Failed to save data')
                }
            } catch (e) {
                console.error('[AppClient] Exception during save:', e)
                toast.error('Exception during save')
            }
        }
    }

    if (!schema) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#888' }}>
                <h1>App Not Found</h1>
                <p>The app "{slug}" could not be loaded from the OS registry.</p>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white' }}>
            {/* OS Header / App Shell */}
            <div style={{ borderBottom: '1px solid #333', padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>GRIDPASS OS // {name || slug}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#4caf50' }}>● Live Sync</div>
                </div>
            </div>

            <GridRenderer schema={schema} data={data} onChange={handleChange} onAction={handleAction} />
        </div>
    )
}
