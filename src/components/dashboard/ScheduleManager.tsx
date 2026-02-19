
'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, CheckCircle, XCircle, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AvailabilityBlock {
    id: string
    start_date: string
    end_date: string
    status: 'available' | 'booked' | 'unavailable'
    notes: string
}

export default function ScheduleManager() {
    const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [newBlock, setNewBlock] = useState({
        start_date: '',
        end_date: '',
        status: 'booked',
        notes: ''
    })

    const fetchSchedule = async () => {
        try {
            const res = await fetch('/api/user/availability')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setBlocks(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSchedule()
    }, [])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/user/availability', {
                method: 'POST',
                body: JSON.stringify(newBlock)
            })
            if (!res.ok) throw new Error('Failed to add')

            setIsAdding(false)
            setNewBlock({ start_date: '', end_date: '', status: 'booked', notes: '' })
            fetchSchedule()
        } catch (error) {
            alert('Error adding block')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this schedule block?')) return
        try {
            await fetch(`/api/user/availability?id=${id}`, { method: 'DELETE' })
            setBlocks(blocks.filter(b => b.id !== id))
        } catch (error) {
            console.error(error)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'text-green-400 bg-green-500/10 border-green-500/20'
            case 'booked': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
            case 'unavailable': return 'text-red-400 bg-red-500/10 border-red-500/20'
            default: return 'text-neutral-400 bg-neutral-800'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'available': return <CheckCircle size={14} />
            case 'booked': return <Briefcase size={14} />
            case 'unavailable': return <XCircle size={14} />
            default: return <Calendar size={14} />
        }
    }

    return (
        <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Calendar className="text-blue-500" size={20} />
                        My Schedule
                    </h3>
                    <p className="text-sm text-neutral-400">Manage your availability for the season.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="text-sm bg-white text-black font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-neutral-200 transition-colors"
                >
                    <Plus size={16} /> Add Block
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAdd} className="mb-6 bg-neutral-800/50 p-4 rounded-lg border border-white/5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase">Start Date</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white text-sm"
                                value={newBlock.start_date}
                                onChange={e => setNewBlock({ ...newBlock, start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase">End Date</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white text-sm"
                                value={newBlock.end_date}
                                onChange={e => setNewBlock({ ...newBlock, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase">Status</label>
                        <select
                            className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white text-sm"
                            value={newBlock.status}
                            onChange={e => setNewBlock({ ...newBlock, status: e.target.value })}
                        >
                            <option value="booked">Booked (Working)</option>
                            <option value="available">Available (Open to Work)</option>
                            <option value="unavailable">Unavailable (Time Off)</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase">Event / Notes</label>
                        <input
                            type="text"
                            placeholder="e.g. Daytona 500, West Coast Swing"
                            className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white text-sm"
                            value={newBlock.notes}
                            onChange={e => setNewBlock({ ...newBlock, notes: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white font-bold rounded hover:bg-blue-500"
                        >
                            Save Block
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                {loading ? (
                    <div className="text-sm text-neutral-500 animate-pulse">Loading schedule...</div>
                ) : blocks.length === 0 ? (
                    <div className="text-sm text-neutral-500 italic text-center py-4 border border-dashed border-white/5 rounded-lg">
                        No schedule blocks added.
                    </div>
                ) : (
                    blocks.map(block => (
                        <div key={block.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border flex items-center gap-1 ${getStatusColor(block.status)}`}>
                                    {getStatusIcon(block.status)}
                                    {block.status}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{block.notes || 'Untitled Block'}</div>
                                    <div className="text-xs text-neutral-400">
                                        {new Date(block.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })} - {new Date(block.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(block.id)}
                                className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
