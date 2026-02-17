'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Lead = {
    id: string
    created_at: string
    name: string
    role: string
    skills: string[]
    status: 'new' | 'approved' | 'sent' | 'rejected' | 'failed_no_box'
    contact_info: {
        profile_link: string
        suggested_outreach: string
    }
}

export default function OutreachDashboard() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchLeads = async () => {
        const { data } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .in('status', ['new', 'approved', 'sent', 'failed_no_box'])
            .limit(50)

        if (data) setLeads(data as Lead[])
        setLoading(false)
    }

    useEffect(() => {
        fetchLeads()
        const channel = supabase
            .channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    const handleApprove = async (id: string) => {
        await supabase.from('leads').update({ status: 'approved' }).eq('id', id)
        setLeads(leads.map(l => l.id === id ? { ...l, status: 'approved' } : l))
    }

    const handleDismiss = async (id: string) => {
        await supabase.from('leads').update({ status: 'rejected' }).eq('id', id)
        setLeads(leads.filter(l => l.id !== id))
    }

    const handleUpdateMessage = async (id: string, newMessage: string) => {
        const lead = leads.find(l => l.id === id)
        if (!lead) return

        const updatedLead = { ...lead, contact_info: { ...lead.contact_info, suggested_outreach: newMessage } }
        setLeads(leads.map(l => l.id === id ? updatedLead : l))

        await supabase.from('leads').update({ contact_info: updatedLead.contact_info }).eq('id', id)
    }

    if (loading) return <div className="p-10 text-white">Loading leads...</div>

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-6">📢 Outreach Manager</h1>
            <div className="overflow-x-auto bg-gray-800 rounded-lg">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-700 text-gray-300 border-b border-gray-600">
                            <th className="p-4">Name / Role</th>
                            <th className="p-4">Link</th>
                            <th className="p-4 w-1/3">Message</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((lead) => (
                            <tr key={lead.id} className="border-b border-gray-700 hover:bg-gray-750">
                                <td className="p-4 align-top">
                                    <div className="font-bold text-lg">{lead.name}</div>
                                    <div className="text-sm text-gray-400">{lead.role}</div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {lead.skills?.slice(0, 3).map(s => <span key={s} className="text-xs bg-gray-700 px-1 rounded">{s}</span>)}
                                    </div>
                                </td>
                                <td className="p-4 align-top">
                                    <a href={lead.contact_info?.profile_link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline max-w-[150px] truncate block">
                                        View Post ↗
                                    </a>
                                </td>
                                <td className="p-4 align-top">
                                    <textarea
                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm h-24 focus:border-blue-500 outline-none"
                                        value={lead.contact_info?.suggested_outreach || ''}
                                        onChange={(e) => handleUpdateMessage(lead.id, e.target.value)}
                                    />
                                </td>
                                <td className="p-4 align-top">
                                    <Badge status={lead.status} />
                                </td>
                                <td className="p-4 align-top">
                                    <div className="flex flex-col gap-2">
                                        {lead.status === 'new' && (
                                            <>
                                                <button onClick={() => handleApprove(lead.id)} className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm font-bold text-white transition">
                                                    Approve & Send
                                                </button>
                                                <button onClick={() => handleDismiss(lead.id)} className="px-3 py-1 bg-red-900/40 hover:bg-red-900 text-red-200 rounded text-sm transition">
                                                    Dismiss
                                                </button>
                                            </>
                                        )}
                                        {lead.status === 'approved' && <span className="text-yellow-400 text-sm animate-pulse">⏳ Queued to Send...</span>}
                                        {lead.status === 'sent' && <span className="text-green-400 text-sm font-bold">✓ Sent</span>}
                                        {lead.status === 'failed_no_box' && <span className="text-red-400 text-sm">❌ Failed (No Box)</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {leads.length === 0 && <div className="p-10 text-center text-gray-500">No leads found.</div>}
            </div>
        </div>
    )
}

function Badge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        new: 'bg-blue-900 text-blue-200 border-blue-700',
        approved: 'bg-yellow-900 text-yellow-200 border-yellow-700',
        sent: 'bg-green-900 text-green-200 border-green-700',
        rejected: 'bg-gray-700 text-gray-400 border-gray-600',
        failed_no_box: 'bg-red-900 text-red-200 border-red-700'
    }
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${colors[status] || 'bg-gray-800 border-gray-600'}`}>
            {status}
        </span>
    )
}
