'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

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
    confidence?: number
    username?: string
  }
}

export default function OutreachDashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'approved' | 'sent' | 'rejected'>('all')
  const supabase = createClient()

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200) // Fetch more to handle client-side dedupe

    if (data) {
      // Deduplicate by profile_link (preferring the most recent one)
      const uniqueLeads = new Map()
      data.forEach((lead: any) => {
        const link = lead.contact_info?.profile_link
        if (!link || !uniqueLeads.has(link)) {
          uniqueLeads.set(link || lead.id, lead)
        }
      })

      // Sort by Confidence, then Status, then Date
      const sorted = Array.from(uniqueLeads.values()).sort((a: Lead, b: Lead) => {
        const confA = a.contact_info.confidence || 0
        const confB = b.contact_info.confidence || 0

        // Status priority for "Action needed"
        const statusPriority = { new: 3, approved: 2, sent: 0, failed_no_box: 1, rejected: -1 }
        // @ts-ignore
        const prioA = statusPriority[a.status] || 0
        // @ts-ignore
        const prioB = statusPriority[b.status] || 0

        if (prioA !== prioB) return prioB - prioA
        if (confA !== confB) return confB - confA
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setLeads(sorted as Lead[])
    }
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

  const handleApprove = async (id: string, message: string) => {
    // Update local state immediately
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'approved', contact_info: { ...l.contact_info, suggested_outreach: message } } : l))

    // Update DB
    await supabase.from('leads').update({
      status: 'approved',
      contact_info: leads.find(l => l.id === id)?.contact_info // Ensure message is saved
    }).eq('id', id)
  }

  const handleDismiss = async (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' } : l))
    await supabase.from('leads').update({ status: 'rejected' }).eq('id', id)
  }

  const handleUpdateMessage = async (id: string, newMessage: string) => {
    const lead = leads.find(l => l.id === id)
    if (!lead) return

    const updatedLead = { ...lead, contact_info: { ...lead.contact_info, suggested_outreach: newMessage } }
    setLeads(leads.map(l => l.id === id ? updatedLead : l))

    // Debounce actual save if needed, but for now direct is fine for low volume
    await supabase.from('leads').update({ contact_info: updatedLead.contact_info }).eq('id', id)
  }

  const filteredLeads = leads.filter(l => {
    if (filter === 'all') return l.status !== 'rejected' // Hide rejected in "All" view to keep it clean
    return l.status === filter
  })

  if (loading) return <div className="p-10 text-white bg-gray-900 min-h-screen flex items-center justify-center">Loading leads...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 md:p-6 pb-20">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2">
              📢 Outreach Manager
              <span className="text-sm font-normal text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                {leads.filter(l => l.status !== 'rejected').length} Active
              </span>
            </h1>
          </div>

          <div className="flex bg-gray-800 rounded-lg p-1 gap-1 overflow-x-auto max-w-full no-scrollbar">
            {(['all', 'new', 'approved', 'sent', 'rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-xs md:text-sm font-bold uppercase transition whitespace-nowrap ${filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                {f === 'all' ? 'Active' : f}
              </button>
            ))}
          </div>
        </div>

        {/* List View */}
        <div className="space-y-4">
          {filteredLeads.map((lead) => {
            const confidence = lead.contact_info.confidence || 0
            const confidencePercent = Math.round(confidence * 100)
            const isSent = lead.status === 'sent'

            return (
              <div key={lead.id} className={`rounded-lg shadow-lg border relative overflow-hidden transition-all duration-200 ${isSent ? 'bg-gray-800/50 border-green-900/30' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>

                {/* Confidence Indicator Strip */}
                {lead.status === 'new' && (
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${confidence > 0.8 ? 'bg-green-500' : confidence > 0.5 ? 'bg-yellow-500' : 'bg-gray-600'}`}></div>
                )}

                <div className="p-4 pl-6">
                  {/* Top Row: Name, Score, Status */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-lg ${isSent ? 'text-gray-400' : 'text-white'}`}>{lead.name}</h3>
                        {confidence > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${confidence > 0.8 ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                            {confidencePercent}% MATCH
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{lead.role}</p>
                    </div>
                    <Badge status={lead.status} />
                  </div>

                  {/* Skills / Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {lead.skills?.slice(0, 4).map(s => (
                      <span key={s} className="text-xs bg-black/30 border border-gray-700 px-2 py-0.5 rounded text-gray-300">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Link */}
                  <div className="mb-4">
                    <a href={lead.contact_info?.profile_link} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:underline inline-flex items-center gap-1 group">
                      <span className="group-hover:text-blue-300">🔗 Open Facebook Post</span>
                      <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  </div>

                  {/* Message Section */}
                  <div className="mb-4 bg-black/20 rounded-lg p-3 border border-gray-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2">
                        {isSent ? '✅ Message Sent' : '📝 Draft Message'}
                        {isSent && <span className="text-green-500 text-[10px]">(Automated)</span>}
                      </label>
                    </div>

                    {isSent ? (
                      <p className="text-sm text-gray-300 italic pl-2 border-l-2 border-green-700">
                        "{lead.contact_info?.suggested_outreach}"
                      </p>
                    ) : (
                      <textarea
                        className="w-full bg-transparent border-none p-0 text-sm h-auto min-h-[80px] focus:ring-0 text-gray-200 placeholder-gray-600 resize-none font-sans"
                        value={lead.contact_info?.suggested_outreach || ''}
                        onChange={(e) => handleUpdateMessage(lead.id, e.target.value)}
                        placeholder="Write your message here..."
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {lead.status === 'new' && (
                      <>
                        <button
                          onClick={() => handleApprove(lead.id, lead.contact_info.suggested_outreach)}
                          className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white shadow-lg shadow-green-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <span>Approve & Send</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        </button>
                        <button
                          onClick={() => handleDismiss(lead.id)}
                          className="px-4 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-300 border border-red-900/30 rounded-lg font-medium transition-all active:scale-95"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    {lead.status === 'approved' && (
                      <div className="w-full py-2 flex items-center justify-center gap-2 bg-yellow-900/20 text-yellow-500 rounded border border-yellow-900/30">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        <span className="font-bold text-sm">Queued for sending...</span>
                      </div>
                    )}
                    {lead.status === 'failed_no_box' && (
                      <div className="w-full py-2 text-center bg-red-900/20 text-red-400 rounded border border-red-900/30 flex items-center justify-center gap-2">
                        <span>❌ Failed (Comment box not found)</span>
                        <button onClick={() => handleDismiss(lead.id)} className="text-xs underline hover:text-white">Dismiss</button>
                      </div>
                    )}
                    {lead.status === 'rejected' && (
                      <div className="w-full py-2 text-center text-gray-600 text-sm">
                        dismissed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredLeads.length === 0 && (
          <div className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl mt-8 bg-gray-900/50">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-xl font-medium text-gray-400">No leads found</p>
            <p className="text-sm mt-2 opacity-60">Try adjusting the filters or wait for the agent to find more.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Badge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-blue-900/40 text-blue-300 border-blue-800',
    approved: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
    sent: 'bg-green-900/40 text-green-300 border-green-800',
    rejected: 'bg-gray-800 text-gray-500 border-gray-700',
    failed_no_box: 'bg-red-900/40 text-red-300 border-red-800'
  }

  const labels: Record<string, string> = {
    new: 'Needs Review',
    approved: 'Queued',
    sent: 'Sent',
    rejected: 'Dismissed',
    failed_no_box: 'Failed'
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider ${styles[status] || 'bg-gray-800 border-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}
