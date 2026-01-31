'use client';

import { useState, useEffect, useTransition } from 'react';
import { getAllMyRecommendations, updateRecommendationStatus } from '@/app/actions/recommendations';
import { CheckCircle, XCircle, Star, Clock, User, MessageSquare, Archive, ThumbsDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Recommendation {
    id: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    relationship: string;
    author_name: string | null;
    author?: {
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
    };
}

export default function RecommendationsPage() {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const fetchAll = async () => {
        try {
            const data = await getAllMyRecommendations();
            setRecommendations(data as Recommendation[]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleAction = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
        // Optimistic update
        setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status } : r));

        startTransition(async () => {
            try {
                // If we are moving TO pending, we might strictly only allow approved/rejected in backend function currently?
                // Let's check backend type: status: 'approved' | 'rejected'.
                // The backend function signature is: updateRecommendationStatus(id, status: 'approved' | 'rejected')
                // So we can't set back to pending easily without updating backend.
                // However, user just asked to see previously approved/rejected "in case you change your mind". 
                // Usually this means switching Approved <-> Rejected.
                // If they want to "Effectively Pending" again, maybe not needed.
                // Let's stick to Approved/Rejected toggling.

                if (status === 'pending') return; // Not supported by backend action yet

                await updateRecommendationStatus(id, status as 'approved' | 'rejected');

                // Dispatch event for badges
                window.dispatchEvent(new Event('recommendation-updated'));

                router.refresh();
            } catch (e) {
                console.error("Failed to update status", e);
                // Revert
                fetchAll();
            }
        });
    };

    const pendingRecs = recommendations.filter(r => r.status === 'pending');
    const approvedRecs = recommendations.filter(r => r.status === 'approved');
    const rejectedRecs = recommendations.filter(r => r.status === 'rejected');

    if (isLoading) return <div className="p-12 text-center text-neutral-500">Loading...</div>;

    return (
        <div className="space-y-12 animate-fade-in max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold mb-2">Recommendations</h1>
                <p className="text-neutral-400">Manage the testimonials linked to your profile.</p>
            </div>

            {/* Pending Section */}
            <section className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                {/* Decorator */}
                <div className="absolute top-0 right-0 p-32 bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="flex items-center gap-3 mb-6 relative">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Clock className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-indigo-100">Pending Review ({pendingRecs.length})</h2>
                </div>

                {pendingRecs.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 bg-neutral-950/30 rounded-xl border border-dashed border-white/5">
                        <p className="text-sm">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="grid gap-4 relative">
                        {pendingRecs.map(rec => (
                            <RecommendationCard
                                key={rec.id}
                                rec={rec}
                                onAction={handleAction}
                                isPending={isPending}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* History Section Grid */}
            <div className="grid lg:grid-cols-2 gap-8">

                {/* Approved */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <h2 className="text-lg font-bold text-emerald-100">Approved ({approvedRecs.length})</h2>
                    </div>
                    <div className="space-y-4">
                        {approvedRecs.map(rec => (
                            <div key={rec.id} className="bg-neutral-900/30 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-emerald-200/90">{rec.author_name || rec.author?.full_name}</div>
                                        <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold mt-0.5">{rec.relationship}</div>
                                    </div>
                                    <button
                                        onClick={() => handleAction(rec.id, 'rejected')}
                                        disabled={isPending}
                                        className="text-xs bg-neutral-800 hover:bg-red-900/30 text-neutral-400 hover:text-red-400 py-1.5 px-3 rounded border border-white/5 transition-colors"
                                    >
                                        Reject
                                    </button>
                                </div>
                                <p className="text-neutral-400 text-sm italic">"{rec.content}"</p>
                            </div>
                        ))}
                        {approvedRecs.length === 0 && <p className="text-neutral-600 text-sm italic">No approved recommendations.</p>}
                    </div>
                </section>

                {/* Rejected */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <XCircle className="w-4 h-4 text-red-500" />
                        </div>
                        <h2 className="text-lg font-bold text-red-100">Rejected ({rejectedRecs.length})</h2>
                    </div>
                    <div className="space-y-4">
                        {rejectedRecs.map(rec => (
                            <div key={rec.id} className="bg-neutral-900/30 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors group opacity-75 hover:opacity-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-red-200/70">{rec.author_name || rec.author?.full_name}</div>
                                        <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold mt-0.5">{rec.relationship}</div>
                                    </div>
                                    <button
                                        onClick={() => handleAction(rec.id, 'approved')}
                                        disabled={isPending}
                                        className="text-xs bg-neutral-800 hover:bg-emerald-900/30 text-neutral-400 hover:text-emerald-400 py-1.5 px-3 rounded border border-white/5 transition-colors"
                                    >
                                        Approve
                                    </button>
                                </div>
                                <p className="text-neutral-500 text-sm italic line-through decoration-neutral-700">"{rec.content}"</p>
                            </div>
                        ))}
                        {rejectedRecs.length === 0 && <p className="text-neutral-600 text-sm italic">No rejected recommendations.</p>}
                    </div>
                </section>

            </div>
        </div>
    );
}

function RecommendationCard({ rec, onAction, isPending }: { rec: Recommendation, onAction: any, isPending: boolean }) {
    return (
        <div className="bg-neutral-950 border border-white/10 rounded-xl p-6 md:flex gap-6 items-start shadow-xl">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg text-white">{rec.author_name || rec.author?.full_name || 'User'}</span>
                    <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 text-xs rounded-full border border-white/5 uppercase tracking-wide font-bold">
                        {rec.relationship}
                    </span>
                </div>
                <blockquote className="text-neutral-300 italic mb-4 border-l-2 border-indigo-500/30 pl-4 py-1">
                    "{rec.content}"
                </blockquote>
                <p className="text-xs text-neutral-500">Submitted on {new Date(rec.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex md:flex-col gap-2 mt-4 md:mt-0 min-w-[140px]">
                <button
                    onClick={() => onAction(rec.id, 'approved')}
                    disabled={isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                    onClick={() => onAction(rec.id, 'rejected')}
                    disabled={isPending}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <XCircle className="w-4 h-4" /> Reject
                </button>
            </div>
        </div>
    );
}
