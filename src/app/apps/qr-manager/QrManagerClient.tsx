'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { QrCode, Trash2, ExternalLink, Plus, Save, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Scanner } from '@yudiel/react-qr-scanner'

type Redirect = {
    id: string
    target_url: string
    description: string
    created_at: string
    updated_at: string
}

export default function QrManagerClient() {
    const [redirects, setRedirects] = useState<Redirect[]>([])
    const [loading, setLoading] = useState(true)
    const [newId, setNewId] = useState('')
    const [newUrl, setNewUrl] = useState('')
    const [newDesc, setNewDesc] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isScanning, setIsScanning] = useState(false)

    const supabase = createClient()

    const fetchRedirects = async () => {
        const { data } = await supabase
            .from('sys_qr_redirects')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setRedirects(data as Redirect[])
        setLoading(false)
    }

    useEffect(() => {
        fetchRedirects()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newId || !newUrl) return

        setIsSubmitting(true)
        const { error } = await supabase
            .from('sys_qr_redirects')
            .upsert({
                id: newId,
                target_url: newUrl,
                description: newDesc,
                updated_at: new Date().toISOString()
            })

        if (!error) {
            setNewId('')
            setNewUrl('')
            setNewDesc('')
            fetchRedirects()
            toast.success('Redirect Saved')
        } else {
            toast.error('Error: ' + error.message)
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Start engine sequence? (Delete this redirect?)')) return

        const { error } = await supabase
            .from('sys_qr_redirects')
            .delete()
            .eq('id', id)

        if (!error) {
            setRedirects(redirects.filter(r => r.id !== id))
            toast.success('Redirect Deleted')
        } else {
            toast.error('Error: ' + error.message)
        }
    }

    const handleScan = (result: any) => {
        if (result) {
            const raw = result[0]?.rawValue
            if (raw) {
                // Try to extract ID from URL if it's a gridpass URL
                try {
                    const url = new URL(raw)
                    const id = url.searchParams.get('id')
                    if (id) {
                        setNewId(id)
                        toast.success(`Scanned ID: ${id}`)
                    } else {
                        // usage of raw value if not a URL with ID
                        setNewId(raw)
                        toast.success('Scanned Raw Value')
                    }
                } catch {
                    // Not a URL, use raw
                    setNewId(raw)
                    toast.success('Scanned Code')
                }
                setIsScanning(false)
            }
        }
    }

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-pulse">Loading System...</div>
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white' }}>
            {/* OS Header */}
            <div style={{ borderBottom: '1px solid #333', padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-400 hover:text-white transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <span style={{ fontWeight: 'bold' }}>GRIDPASS OS // QR MANAGER</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#4caf50' }}>● System Active</div>
                </div>
            </div>

            <div className="v2-content" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>

                {/* Intro Card */}
                <div className="v2-card" style={{ padding: '2rem', marginBottom: '2rem', background: '#111', border: '1px solid #333', borderRadius: '12px' }}>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-900/20 rounded-lg">
                            <QrCode className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold mb-2">Targeting Computer</h1>
                            <p className="text-gray-400 text-sm">
                                Configure the destination coordinates for your physical business cards.
                                When a card is scanned (ID: XXXX), the system will redirect to the Target URL below.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Create Form */}
                <div className="v2-card" style={{ padding: '2rem', marginBottom: '2rem', background: '#111', border: '1px solid #333', borderRadius: '12px' }}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                        <Plus className="w-4 h-4 text-accent" />
                        New Coordinates
                    </h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">ID Code</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newId}
                                    onChange={e => setNewId(e.target.value)}
                                    className="w-full bg-black border border-gray-700 rounded p-3 focus:border-blue-500 outline-none font-mono text-white"
                                    placeholder="0747"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsScanning(true)}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded border border-zinc-700"
                                    title="Scan QR Code"
                                >
                                    <QrCode size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-5">
                            <label className="block text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">Target URL</label>
                            <input
                                type="text"
                                value={newUrl}
                                onChange={e => setNewUrl(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded p-3 focus:border-blue-500 outline-none text-white"
                                placeholder="https://gridpass.app/u/pjlosey"
                                required
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">Label</label>
                            <input
                                type="text"
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded p-3 focus:border-blue-500 outline-none text-white"
                                placeholder="Metal Card 1"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="v2-card" style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/50 text-gray-400 border-b border-gray-800 text-xs uppercase tracking-wider">
                                    <th className="p-4">ID Code</th>
                                    <th className="p-4">Destination</th>
                                    <th className="p-4">Label</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {redirects.map((redirect) => (
                                    <tr key={redirect.id} className="border-b border-gray-800 hover:bg-white/5 transition group">
                                        <td className="p-4 font-mono text-blue-400 font-bold">
                                            {redirect.id}
                                        </td>
                                        <td className="p-4 text-gray-300 break-all">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate max-w-[300px]">{redirect.target_url}</span>
                                                <a href={redirect.target_url} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition">
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 italic text-sm">
                                            {redirect.description || '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={() => {
                                                        setNewId(redirect.id)
                                                        setNewUrl(redirect.target_url)
                                                        setNewDesc(redirect.description)
                                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
                                                    title="Edit"
                                                >
                                                    <span className="text-xs font-bold">EDIT</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(redirect.id)}
                                                    className="p-2 text-red-500 hover:bg-red-900/20 rounded transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {redirects.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-gray-600 italic">
                                            No coordinates set. System standby.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {isScanning && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'absolute', top: 20, right: 20 }}>
                            <button onClick={() => setIsScanning(false)} className="bg-white rounded-full p-2 text-black">
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ width: '100%', maxWidth: '400px', padding: '1rem' }}>
                            <h3 className="text-white text-center mb-4 font-bold">Point Camera at QR Code</h3>
                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #30cfd0' }}>
                                <Scanner onScan={handleScan} />
                            </div>
                            <button onClick={() => setIsScanning(false)} className="mt-8 w-full bg-red-600 text-white py-3 rounded font-bold">
                                Cancel Scan
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
