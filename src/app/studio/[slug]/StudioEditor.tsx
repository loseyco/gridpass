'use client'

import React, { useState, useEffect } from 'react'
import { GridRenderer } from '@/os/core/GridRenderer'
import { fetchOSData } from '@/os/actions/grid-actions'
import { saveAppSchema } from '@/os/actions/studio-actions'
import { Save, Play, ArrowLeft, Loader2, Database } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface StudioEditorProps {
    app: any
    currentUserData?: any // Optional initial data
}

export default function StudioEditor({ app, currentUserData }: StudioEditorProps) {
    const router = useRouter()
    const [schemaJson, setSchemaJson] = useState(JSON.stringify(app.schema, null, 2))
    const [parsedSchema, setParsedSchema] = useState(app.schema)
    const [osData, setOsData] = useState(currentUserData || {})
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor') // Mobile tab switching

    // Refresh OS data on mount if not provided (client-side fetch mainly for dev)
    useEffect(() => {
        if (!currentUserData) {
            fetchOSData().then(data => {
                if (data) setOsData(data)
            })
        }
    }, [])

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setSchemaJson(val)
        try {
            const parsed = JSON.parse(val)
            setParsedSchema(parsed)
            setError(null)
        } catch (err: any) {
            // Don't update preview on invalid JSON, maybe show weak error
            // setError(err.message) // Optional: show syntax error
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)
        try {
            const parsed = JSON.parse(schemaJson)
            const result = await saveAppSchema(app.slug, parsed)
            if (result.error) {
                setError(result.error)
            } else {
                // Success feedback
                router.refresh()
            }
        } catch (err: any) {
            setError("Invalid JSON: " + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{
                height: '60px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1.5rem',
                background: '#09090b',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/studio" style={{ color: '#888', display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', height: '20px' }}></div>
                    <div>
                        <h2 className="v2-heading-3" style={{ margin: 0 }}>{app.name}</h2>
                        <span style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>{app.slug}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href={`/apps/${app.slug}`} target="_blank" className="v2-btn v2-btn-ghost" style={{ gap: '0.5rem', fontSize: '0.85rem' }}>
                        <Play size={16} /> Open Live
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="v2-btn v2-btn-primary"
                        style={{ gap: '0.5rem', minWidth: '100px', justifyContent: 'center' }}
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save
                    </button>
                    {error && <span style={{ color: 'red', fontSize: '0.8rem', alignSelf: 'center' }}>{error}</span>}
                </div>
            </div>

            {/* Split View */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* Code Editor */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    background: '#1a1a1a'
                }}>
                    <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: '#888', fontWeight: 'bold' }}>
                        JSON SCHEMA
                    </div>
                    <textarea
                        value={schemaJson}
                        onChange={handleJsonChange}
                        spellCheck={false}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            color: '#e4e4e7',
                            border: 'none',
                            padding: '1rem',
                            fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            resize: 'none',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* Live Preview */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'black',
                    position: 'relative'
                }}>
                    <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: '#888', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                        <span>LIVE PREVIEW</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Database size={12} /> Connected to your data</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                        {/* Renderer Wrapper same as app page */}
                        <div className="v2-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <GridRenderer schema={parsedSchema} data={osData} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
