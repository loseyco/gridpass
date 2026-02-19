'use client'

import { useState } from 'react'
import { Briefcase, MapPin, Clock, Search, Filter, DollarSign, Calendar, Plus } from 'lucide-react'
import Link from 'next/link'
import Swiper from '@/components/ui/Swiper'
import { Badge } from '@/components/ui/badge'
import { saveMatch } from '@/app/actions/match'

import { toast } from 'sonner'
import InviteCandidateModal from '@/components/jobs/InviteCandidateModal'
import JobBoardTutorial from '@/components/jobs/JobBoardTutorial'
import PostJobModal from '@/components/jobs/PostJobModal'

interface Job {
    id: string
    title: string
    company_name: string
    role: string
    location: string | null
    salary_range: string | null
    description: string
    created_at: string
    external_url: string | null
}

interface Gig {
    id: string
    title: string
    description: string
    location: string | null
    daily_rate: number | null
    currency: string
    category: string
    is_urgent: boolean
    created_at: string
}

interface Candidate {
    id: string
    full_name: string
    headline: string | null
    current_location: string | null
    target_role: string | null
    bio: string | null
    avatar_url: string | null
    is_open_to_work: boolean
    username: string | null
}

interface JobBoardClientProps {
    jobs: Job[]
    gigs: Gig[]
    candidates: Candidate[]
}

export default function JobBoardClient({ jobs, gigs, candidates }: JobBoardClientProps) {
    const [activeTab, setActiveTab] = useState<'match' | 'gigs' | 'jobs'>('match')
    const [viewMode, setViewMode] = useState<'worker' | 'business'>('worker') // 'worker' = looking for work, 'business' = looking for talent
    const [searchQuery, setSearchQuery] = useState('')
    const [locationQuery, setLocationQuery] = useState('')

    // Advanced Filters
    const [filterRemote, setFilterRemote] = useState(false)
    const [filterTravel, setFilterTravel] = useState(false)
    const [filterRadius, setFilterRadius] = useState(false) // Simplified boolean for "Within 50 miles" for now

    // Invite Modal State
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [postJobModalOpen, setPostJobModalOpen] = useState(false)
    const [selectedCandidate, setSelectedCandidate] = useState<{ id: string, name: string } | null>(null)

    console.log('ViewMode:', viewMode)
    console.log('Candidates:', candidates?.length)

    // Filter Logic
    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesLocation = !locationQuery || job.location?.toLowerCase().includes(locationQuery.toLowerCase())
        // Apply remote filter if active
        // const matchesRemote = !filterRemote || job.location?.toLowerCase().includes('remote')
        return matchesSearch && matchesLocation
    })

    const filteredGigs = gigs.filter(gig => {
        const matchesSearch = gig.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gig.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesLocation = !locationQuery || gig.location?.toLowerCase().includes(locationQuery.toLowerCase())
        return matchesSearch && matchesLocation
    })

    const filteredCandidates = candidates.filter(candidate => {
        const matchesSearch = candidate.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.target_role?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesLocation = !locationQuery || candidate.current_location?.toLowerCase().includes(locationQuery.toLowerCase())

        // Advanced Filters
        // If "Remote" is checked, we ideally check a 'remote_friendly' field.
        // For now, we'll verify if the user's location string contains 'remote'.
        // Or if willing to travel is checked. 
        // Since we don't have these fields in the candidate schema yet, this is placeholder logic.
        // It prevents the UI from breaking even if logic isn't perfect.
        const matchesRemote = !filterRemote || (candidate.current_location?.toLowerCase().includes('remote') ?? false)

        return matchesSearch && matchesLocation && matchesRemote
    })

    const handleApply = async (id: string, type: 'job' | 'gig') => {
        const result = await saveMatch(id, type, 'applied')
        if (result.error) {
            toast.error('Failed to apply')
        } else if (result.message === 'Already matched') {
            toast.info('You have already applied')
        } else {
            toast.success('Application sent!', {
                description: 'The employer has been notified.'
            })
        }
    }

    const openInviteModal = (candidate: Candidate) => {
        setSelectedCandidate({ id: candidate.id, name: candidate.full_name })
        setInviteModalOpen(true)
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 md:p-12">
            <div className="max-w-5xl mx-auto animate-fade-in">

                {/* Header */}
                <div id="job-board-header" className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            <Briefcase className="w-10 h-10 text-emerald-500" />
                            Find {viewMode === 'worker' ? 'Work' : 'Talent'}
                        </h1>
                        <p className="text-neutral-400">
                            {viewMode === 'worker'
                                ? "The hub for motorsports opportunities. Gigs or full-time."
                                : "Discover the best talent in the paddock. Swipe to match."}
                        </p>
                    </div>

                    {/* View Mode Toggle */}
                    <div id="view-mode-toggle" className="flex items-center gap-4">
                        <button
                            onClick={() => setPostJobModalOpen(true)}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-bold border border-white/10"
                        >
                            <Plus size={18} />
                            Post a Job
                        </button>

                        <div className="bg-neutral-900 p-1 rounded-lg border border-white/10 flex">
                            <button
                                onClick={() => setViewMode('worker')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'worker' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                            >
                                Find Work
                            </button>
                            <button
                                onClick={() => setViewMode('business')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'business' ? 'bg-emerald-500 text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                            >
                                Find Talent
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div id="filter-bar" className="bg-neutral-900/50 border border-white/10 rounded-2xl p-4 mb-8 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Search roles, skills..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="relative flex-1">
                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Location (e.g. Charlotte)"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                value={locationQuery}
                                onChange={(e) => setLocationQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Advanced Filter Toggles */}
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-white/5">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filterRadius ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-600 group-hover:border-neutral-400'}`}>
                                {filterRadius && <div className="w-2 h-2 bg-black rounded-sm" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={filterRadius} onChange={(e) => setFilterRadius(e.target.checked)} />
                            <span className={`text-sm font-medium ${filterRadius ? 'text-emerald-400' : 'text-neutral-400'}`}>Within 50 Miles</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filterTravel ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-600 group-hover:border-neutral-400'}`}>
                                {filterTravel && <div className="w-2 h-2 bg-black rounded-sm" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={filterTravel} onChange={(e) => setFilterTravel(e.target.checked)} />
                            <span className={`text-sm font-medium ${filterTravel ? 'text-emerald-400' : 'text-neutral-400'}`}>Willing to Travel</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filterRemote ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-600 group-hover:border-neutral-400'}`}>
                                {filterRemote && <div className="w-2 h-2 bg-black rounded-sm" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={filterRemote} onChange={(e) => setFilterRemote(e.target.checked)} />
                            <span className={`text-sm font-medium ${filterRemote ? 'text-emerald-400' : 'text-neutral-400'}`}>Remote Friendly</span>
                        </label>
                    </div>
                </div>

                {/* Tabs - Only show all tabs if looking for work, otherwise simplified for business */}
                <div id="job-tabs" className="flex gap-6 border-b border-white/10 mb-8">
                    <button
                        onClick={() => setActiveTab('match')}
                        className={`pb-4 px-2 text-lg font-bold transition-colors relative flex items-center gap-2 ${activeTab === 'match' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        <span className="bg-gradient-to-r from-pink-500 to-orange-500 text-transparent bg-clip-text font-black italic">RACER MATCH</span>
                        {activeTab === 'match' && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-orange-500 rounded-t-full" />}
                    </button>

                    {viewMode === 'worker' && (
                        <>
                            <button
                                onClick={() => setActiveTab('gigs')}
                                className={`pb-4 px-2 text-lg font-bold transition-colors relative ${activeTab === 'gigs' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                Gigs & Contracts
                                {activeTab === 'gigs' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('jobs')}
                                className={`pb-4 px-2 text-lg font-bold transition-colors relative ${activeTab === 'jobs' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                Full-Time Jobs
                                {activeTab === 'jobs' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full" />}
                            </button>
                        </>
                    )}
                </div>

                {/* Content */}
                <div id="job-content-area" className="grid gap-4">

                    {/* MATCH MODE */}
                    {activeTab === 'match' && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 min-h-[600px]">
                            <div className="text-center mb-8">
                                <p className="text-neutral-400 text-sm">
                                    {viewMode === 'worker'
                                        ? <span>Validating matches for <span className="text-white font-bold">Driver / Engineer</span> roles.</span>
                                        : <span>Showing candidates open to work in <span className="text-white font-bold">Motorsport</span>.</span>
                                    }
                                </p>
                            </div>

                            <Swiper
                                cards={viewMode === 'worker'
                                    ? [...filteredGigs, ...filteredJobs].map(item => ({ ...item, type: 'daily_rate' in item ? 'gig' : 'job' })) as any[]
                                    : filteredCandidates.map(c => ({ ...c, type: 'candidate' })) as any[]
                                }
                                onSwipe={async (cardId, direction) => {
                                    console.log(`Swiped ${direction} on ${cardId}`)
                                    const status = direction === 'right' ? 'like' : 'pass'
                                    // Identify type based on ID lookup or passed metadata (simplified here assuming mixed list)
                                    // In a real scenario, we'd need to know the type from the card data more robustly.
                                    // The card object in renderCard has the type, but onSwipe only gets ID. 
                                    // However, our Swiper component might not pass the full object back.
                                    // Let's assume we can find it in the list for now or update Swiper to pass data.
                                    // Actually, we can just look it up in the combined list.
                                    const card = [...filteredGigs, ...filteredJobs].find(c => c.id === cardId) as any
                                    const type = card?.daily_rate ? 'gig' : 'job' // Need fallback for candidate type?
                                    // No, card will be undefined if it's a candidate, check candidates:
                                    const candidateCard = filteredCandidates.find(c => c.id === cardId)
                                    const finalType = candidateCard ? 'candidate' : type

                                    if (cardId) {
                                        await saveMatch(cardId, finalType, status)
                                    }
                                }}
                                onCardLeftScreen={() => { }}
                                renderCard={(card) => (
                                    <div className="h-full flex flex-col">
                                        {/* Card Image / Header */}
                                        <div className={`h-1/2 p-6 flex flex-col justify-end relative ${card.type === 'gig' ? 'bg-gradient-to-b from-emerald-900 to-black'
                                            : card.type === 'job' ? 'bg-gradient-to-b from-blue-900 to-black'
                                                : 'bg-gradient-to-b from-purple-900 to-black' // Candidate color
                                            }`}>
                                            <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                                                {card.type === 'gig' ? (
                                                    <span className="bg-emerald-500 text-black text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">GIG</span>
                                                ) : card.type === 'job' ? (
                                                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">JOB</span>
                                                ) : (
                                                    <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">TALENT</span>
                                                )}

                                                {card.type === 'candidate' && card.username && (
                                                    <Link
                                                        href={`/u/${card.username}`}
                                                        className="text-xs font-bold text-white/80 hover:text-white underline decoration-white/30 hover:decoration-white transition-all bg-black/20 px-2 py-1 rounded"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        View Profile
                                                    </Link>
                                                )}
                                            </div>

                                            {card.type === 'candidate' ? (
                                                <>
                                                    <h2 className="text-3xl font-black text-white leading-tight mb-1 drop-shadow-lg">{card.full_name || 'Racer'}</h2>
                                                    <p className="text-neutral-300 font-bold text-lg drop-shadow-md">{card.target_role || card.headline || 'Motorsport Professional'}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <h2 className="text-3xl font-black text-white leading-tight mb-1 drop-shadow-lg">{card.title || card.role}</h2>
                                                    <p className="text-neutral-300 font-bold text-lg drop-shadow-md">{card.company_name || 'GridPass Network'}</p>
                                                </>
                                            )}
                                        </div>

                                        {/* Card Body */}
                                        <div className="flex-1 p-6 bg-neutral-900">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="flex items-center gap-2 text-neutral-400">
                                                    <MapPin size={18} />
                                                    <span className="font-medium">{card.location || 'Remote'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-neutral-400">
                                                    <DollarSign size={18} />
                                                    <span className="font-medium">
                                                        {card.daily_rate ? `${card.currency} ${card.daily_rate}/day` : (card.salary_range || 'Competitive')}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-neutral-300 leading-relaxed mb-6 line-clamp-6">
                                                {card.description}
                                            </p>

                                            <div className="mt-auto flex justify-between items-center">
                                                <div className="flex flex-wrap gap-2">
                                                    {card.type === 'gig' && card.category && (
                                                        <span className="bg-white/10 text-neutral-300 text-xs px-2 py-1 rounded">{card.category}</span>
                                                    )}
                                                    {card.is_urgent && (
                                                        <span className="bg-red-500/10 text-red-500 text-xs px-2 py-1 rounded border border-red-500/20">Urgent</span>
                                                    )}
                                                </div>

                                                {card.type !== 'candidate' ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleApply(card.id, card.type)
                                                        }}
                                                        className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors z-10 relative"
                                                    >
                                                        Apply
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openInviteModal(card)
                                                        }}
                                                        className="px-4 py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-400 transition-colors z-10 relative"
                                                    >
                                                        Invite
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>
                    )}

                    {/* GIGS VIEW */}
                    {activeTab === 'gigs' && (
                        <>
                            {filteredGigs.length === 0 ? (
                                <div className="text-center py-20 text-neutral-500">
                                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    No gigs found matching your search.
                                </div>
                            ) : (
                                filteredGigs.map(gig => (
                                    <div key={gig.id} className="bg-neutral-900 border border-white/5 rounded-xl p-6 hover:border-emerald-500/30 transition-colors group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    {gig.is_urgent && (
                                                        <span className="bg-red-500/10 text-red-500 text-xs font-bold px-2 py-0.5 rounded border border-red-500/20">
                                                            URGENT
                                                        </span>
                                                    )}
                                                    <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">{gig.category}</span>
                                                </div>
                                                <h3 className="text-xl font-bold group-hover:text-emerald-400 transition-colors">{gig.title}</h3>
                                                <div className="flex items-center gap-4 text-neutral-400 text-sm mt-2 mb-3">
                                                    <span className="flex items-center gap-1"><MapPin size={14} /> {gig.location || 'Remote'}</span>
                                                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(gig.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-neutral-300 text-sm line-clamp-2">{gig.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white font-mono font-bold text-lg">
                                                    {gig.daily_rate ? `${gig.currency} ${gig.daily_rate}/day` : '—'}
                                                </div>
                                                <button
                                                    onClick={() => handleApply(gig.id, 'gig')}
                                                    className="mt-3 bg-white text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {/* JOBS VIEW */}
                    {activeTab === 'jobs' && (
                        <>
                            {filteredJobs.length === 0 ? (
                                <div className="text-center py-20 text-neutral-500">
                                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    No full-time roles found.
                                </div>
                            ) : (
                                filteredJobs.map(job => (
                                    <div key={job.id} className="bg-neutral-900 border border-white/5 rounded-xl p-6 hover:border-blue-500/30 transition-colors group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">{job.role}</h3>
                                                <p className="text-neutral-400 font-medium mb-2">{job.company_name}</p>
                                                <div className="flex items-center gap-4 text-neutral-500 text-sm mb-4">
                                                    <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded"><MapPin size={12} /> {job.location || 'Remote'}</span>
                                                    <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded"><DollarSign size={12} /> {job.salary_range || 'Competitive'}</span>
                                                </div>
                                                <p className="text-neutral-300 text-sm line-clamp-2 max-w-2xl">{job.description}</p>
                                            </div>
                                            <button
                                                onClick={() => handleApply(job.id, 'job')}
                                                className="px-4 py-2 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-sm font-bold whitespace-nowrap"
                                            >
                                                Apply Now
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}

                </div>
            </div>

            {selectedCandidate && (
                <InviteCandidateModal
                    isOpen={inviteModalOpen}
                    onClose={() => setInviteModalOpen(false)}
                    candidateId={selectedCandidate.id}
                    candidateName={selectedCandidate.name}
                />
            )}

            <PostJobModal
                isOpen={postJobModalOpen}
                onClose={() => setPostJobModalOpen(false)}
            />

            <JobBoardTutorial />
        </div>
    )
}
