
"use client";

import { useEffect, useState } from "react";
import { AgencyJob, AgencyCandidate, AgencyPlacement, AgencyGig } from "@/types/agency";
import { JobCard } from "@/components/agency/JobCard";
import { CandidateCard } from "@/components/agency/CandidateCard";
import { PlacementCard } from "@/components/agency/PlacementCard";
import { GigCard } from "@/components/agency/GigCard";
import { Plus, Search, AlertCircle } from "lucide-react";

export default function AgencyDashboard() {
    const [activeTab, setActiveTab] = useState<'jobs' | 'candidates' | 'placements' | 'gigs'>('gigs');
    const [jobs, setJobs] = useState<AgencyJob[]>([]);
    const [candidates, setCandidates] = useState<AgencyCandidate[]>([]);
    const [placements, setPlacements] = useState<AgencyPlacement[]>([]);
    const [gigs, setGigs] = useState<AgencyGig[]>([]);

    const [loading, setLoading] = useState(true);
    const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
    const [isGigModalOpen, setIsGigModalOpen] = useState(false);

    const [editingCandidate, setEditingCandidate] = useState<AgencyCandidate | null>(null);
    const [viewingCandidate, setViewingCandidate] = useState<AgencyCandidate | null>(null);
    const [placementCandidate, setPlacementCandidate] = useState<AgencyCandidate | null>(null);

    const refreshData = async () => {
        setLoading(true);
        try {
            const [jobsRes, candidatesRes, placementsRes, gigsRes] = await Promise.all([
                fetch('/api/agency/jobs'),
                fetch('/api/agency/candidates'),
                fetch('/api/agency/placements'),
                fetch('/api/gigs')
            ]);

            if (jobsRes.ok) setJobs(await jobsRes.json());
            if (candidatesRes.ok) setCandidates(await candidatesRes.json());
            if (placementsRes.ok) setPlacements(await placementsRes.json());
            if (gigsRes.ok) setGigs(await gigsRes.json());
        } catch (e) {
            console.error("Failed to fetch agency data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleCreatePlacement = async (data: any) => {
        try {
            const res = await fetch('/api/agency/placements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                setPlacementCandidate(null);
                refreshData();
                setActiveTab('placements'); // Switch to view result
            } else {
                console.error("Failed to create placement");
            }
        } catch (error) {
            console.error("Error creating placement:", error);
        }
    };

    const handleSaveCandidate = async (data: Partial<AgencyCandidate>) => {
        try {
            const res = await fetch('/api/agency/candidates', {
                method: editingCandidate ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, id: editingCandidate?.id }),
            });

            if (res.ok) {
                setIsCandidateModalOpen(false);
                setEditingCandidate(null);
                refreshData();
            } else {
                console.error("Failed to save candidate");
            }
        } catch (error) {
            console.error("Error saving candidate:", error);
        }
    };

    const handleSaveGig = async (data: Partial<AgencyGig>) => {
        try {
            const res = await fetch('/api/gigs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                setIsGigModalOpen(false);
                refreshData();
            } else {
                console.error("Failed to save gig");
            }
        } catch (error) {
            console.error("Error saving gig:", error);
        }
    };

    const handleEditCandidate = (candidate: AgencyCandidate) => {
        setViewingCandidate(null); // Close view if open
        setEditingCandidate(candidate);
        setIsCandidateModalOpen(true);
    };

    const handleViewCandidate = (candidate: AgencyCandidate) => {
        setViewingCandidate(candidate);
    };

    const handleAddPlacement = (candidate: AgencyCandidate) => {
        setPlacementCandidate(candidate);
    };

    const handleAddNewCandidate = () => {
        setEditingCandidate(null);
        setIsCandidateModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans relative">
            <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        Agency Console
                    </h1>
                    <p className="text-neutral-400">Manage your recruitment pipeline and urgent needs.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsGigModalOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-red-600/20 px-4 py-2 font-medium text-red-400 border border-red-500/30 hover:bg-red-600/30 transition shadow-lg shadow-red-900/10"
                    >
                        <AlertCircle className="h-4 w-4" />
                        <span>Post Urgent Need</span>
                    </button>
                    <button
                        onClick={handleAddNewCandidate}
                        className="flex items-center gap-2 rounded-lg bg-blue-600/20 px-4 py-2 font-medium text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Candidate</span>
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="mb-6 flex border-b border-white/10 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('gigs')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'gigs' ? 'border-red-500 text-red-400' : 'border-transparent text-neutral-400 hover:text-white'
                        }`}
                >
                    Urgent Needs ({gigs.length})
                </button>
                <button
                    onClick={() => setActiveTab('candidates')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'candidates' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-400 hover:text-white'
                        }`}
                >
                    Candidates ({candidates.length})
                </button>
                <button
                    onClick={() => setActiveTab('jobs')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'jobs' ? 'border-purple-500 text-purple-400' : 'border-transparent text-neutral-400 hover:text-white'
                        }`}
                >
                    Job Listings ({jobs.length})
                </button>
                <button
                    onClick={() => setActiveTab('placements')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'placements' ? 'border-green-500 text-green-400' : 'border-transparent text-neutral-400 hover:text-white'
                        }`}
                >
                    Placements ({placements.length})
                </button>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center text-neutral-500">
                    Loading pipeline data...
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {activeTab === 'gigs' && gigs.map(gig => (
                        <GigCard key={gig.id} gig={gig} />
                    ))}
                    {activeTab === 'gigs' && gigs.length === 0 && (
                        <div className="col-span-full py-12 text-center text-neutral-500 border border-dashed border-white/10 rounded-xl">
                            No urgent needs posted. Click "Post Urgent Need" to broadcast a gig.
                        </div>
                    )}

                    {activeTab === 'jobs' && jobs.map(job => (
                        <JobCard key={job.id} job={job} />
                    ))}
                    {activeTab === 'candidates' && candidates.map(candidate => (
                        <CandidateCard
                            key={candidate.id}
                            candidate={candidate}
                            onManage={handleEditCandidate}
                            onView={() => handleViewCandidate(candidate)}
                            onAddPlacement={handleAddPlacement}
                        />
                    ))}
                    {activeTab === 'placements' && placements.map(placement => (
                        <PlacementCard key={placement.id} placement={placement} />
                    ))}
                    {activeTab === 'placements' && placements.length === 0 && (
                        <div className="col-span-full py-12 text-center text-neutral-500 border border-dashed border-white/10 rounded-xl">
                            No active placements yet. Click "Add to Job" on a candidate card to start one.
                        </div>
                    )}
                </div>
            )}

            {isCandidateModalOpen && (
                <div className="fixed inset-0 z-50">
                    <CandidateForm
                        candidate={editingCandidate}
                        onSave={handleSaveCandidate}
                        onCancel={() => { setIsCandidateModalOpen(false); setEditingCandidate(null); }}
                    />
                </div>
            )}

            {isGigModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <GigForm
                        onSave={handleSaveGig}
                        onCancel={() => setIsGigModalOpen(false)}
                    />
                </div>
            )}

            {placementCandidate && (
                <PlacementModal
                    candidate={placementCandidate}
                    jobs={jobs}
                    onClose={() => setPlacementCandidate(null)}
                    onSave={handleCreatePlacement}
                />
            )}

            {viewingCandidate && (
                <CandidateDetailView
                    candidate={viewingCandidate}
                    onClose={() => setViewingCandidate(null)}
                    onEdit={() => handleEditCandidate(viewingCandidate)}
                />
            )}
        </div>
    );
}

// Dynamic import for the form to avoid SSR issues if any, but regular import is fine too if component is client-safe
import { CandidateForm } from "@/components/agency/CandidateForm";
import { CandidateDetailView } from "@/components/agency/CandidateDetailView";
import { PlacementModal } from "@/components/agency/PlacementModal";
import { GigForm } from "@/components/agency/GigForm";
