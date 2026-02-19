
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, MapPin, AlertCircle, Briefcase, Home, Truck, Wrench, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PostNeedModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function PostNeedModal({ isOpen, onClose }: PostNeedModalProps) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        category: 'personnel',
        location: '',
        description: '',
        is_urgent: false,
        duration_type: 'event', // Default
        budget_description: '', // For non-rate items
        daily_rate: '' // Optional
    })

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('os_gigs')
                .insert({
                    created_by: user.id,
                    title: formData.title,
                    role: categories.find(c => c.id === formData.category)?.label || 'General',
                    category: formData.category,
                    duration_type: formData.duration_type,
                    location: formData.location,
                    description: formData.description,
                    start_date: new Date().toISOString(),
                    end_date: new Date().toISOString(),
                    is_urgent: formData.is_urgent,
                    budget_description: formData.budget_description,
                    daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : null,
                    status: 'open'
                })

            if (error) throw error

            onClose()
            router.refresh()
        } catch (error) {
            console.error('Error posting need:', error)
            alert('Failed to post. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const categories = [
        { id: 'personnel', label: 'Personnel', icon: Briefcase },
        { id: 'housing', label: 'Housing', icon: Home },
        { id: 'transport', label: 'Transport', icon: Truck },
        { id: 'parts', label: 'Parts', icon: Package },
        { id: 'equipment', label: 'Equipment', icon: Wrench },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Post a Need</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Category Selection */}
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, category: cat.id })}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${formData.category === cat.id
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                                    }`}
                            >
                                <cat.icon size={20} className="mb-1" />
                                <span className="text-[10px] uppercase font-bold">{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Need tire changer for Sebring"
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Location</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-3.5 text-neutral-500" />
                            <input
                                type="text"
                                required
                                placeholder="City or Track"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 pl-9 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1">Duration / Type</label>
                            <select
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.duration_type}
                                onChange={e => setFormData({ ...formData, duration_type: e.target.value })}
                            >
                                <option value="event">Single Event (Weekend)</option>
                                <option value="season">Full Season</option>
                                <option value="contract">Project / Contract</option>
                                <option value="full_time">Full Time / Permanent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1">Budget / Rate</label>
                            <input
                                type="text"
                                placeholder="$X/day or 'Negotiable'"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.budget_description || formData.daily_rate}
                                onChange={e => setFormData({ ...formData, budget_description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Description</label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Details about what you need..."
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="urgent"
                            checked={formData.is_urgent}
                            onChange={e => setFormData({ ...formData, is_urgent: e.target.checked })}
                            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-red-600 focus:ring-red-600"
                        />
                        <label htmlFor="urgent" className="text-sm font-medium text-red-400 flex items-center gap-1">
                            <AlertCircle size={14} /> Mark as Urgent
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Posting...' : 'Post to Network'}
                    </button>
                </form>
            </div>
        </div>
    )
}
