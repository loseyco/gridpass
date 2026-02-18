
"use client";

import { useEffect, useState } from "react";
import { AgencyJob, AgencyCandidate } from "@/types/agency";
import { JobCard } from "@/components/agency/JobCard";
import { CandidateCard } from "@/components/agency/CandidateCard";
import { Plus, Search } from "lucide-react";

export default function AgencyDashboard() {
    const [activeTab, setActiveTab] = useState<'jobs' | 'candidates' | 'placements'>('candidates');
    const [jobs, setJobs] = useState<AgencyJob[]>([]);
    const [candidates, setCandidates] = useState<AgencyCandidate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch initial data
        const fetchData = async () => {
            try {
                const [jobsRes, candidatesRes] = await Promise.all([
                    fetch('/api/agency/jobs'),
                    fetch('/api/agency/candidates')
                ]);

                if (jobsRes.ok) setJobs(await jobsRes.json());
                if (candidatesRes.ok) setCandidates(await candidatesRes.json());
            } catch (e) {
                console.error("Failed to fetch agency data", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
            <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        Agency Console
                    </h1>
                    <p className="text-neutral-400">Manage your recruitment pipeline and commissions.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-medium transition hover:bg-white/20">
                        <Plus className="h-4 w-4" />
                        <span>New Listing</span>
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="mb-6 flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('candidates')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'candidates' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-400 hover:text-white'
                        }`}
                >
                    Candidates ({candidates.length})
                </button>
                <button
                    onClick={() => setActiveTab('jobs')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'jobs' ? 'border-purple-500 text-purple-400' : 'border-transparent text-neutral-400 hover:text-white'
                        }`}
                >
                    Job Listings ({jobs.length})
                </button>
                <button
                    onClick={() => setActiveTab('placements')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'placements' ? 'border-green-500 text-green-400' : 'border-transparent text-neutral-400 hover:text-white'
                        }`}
                >
                    Placements (0)
                </button>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center text-neutral-500">
                    Loading pipeline data...
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {activeTab === 'jobs' && jobs.map(job => (
                        <JobCard key={job.id} job={job} />
                    ))}
                    {activeTab === 'candidates' && candidates.map(candidate => (
                        <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                    {activeTab === 'placements' && (
                        <div className="col-span-full py-12 text-center text-neutral-500 border border-dashed border-white/10 rounded-xl">
                            No active placements yet. Drag a candidate to a job to start one.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
