'use client';

import { useState, useEffect, useTransition } from 'react';
import { getPendingRecommendations, updateRecommendationStatus } from '@/app/actions/recommendations';
import { CheckCircle, XCircle, MessageSquare, Loader2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PendingRecommendationsWidget() {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                const data = await getPendingRecommendations();
                setRecommendations(data);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecs();
    }, []);

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        startTransition(async () => {
            try {
                await updateRecommendationStatus(id, status);
                setRecommendations(prev => prev.filter(r => r.id !== id));
                window.dispatchEvent(new Event('recommendation-updated'));
                router.refresh();
            } catch (e) {
                console.error("Failed to update status", e);
            }
        });
    };

    if (isLoading) return null; // Or skeleton
    if (recommendations.length === 0) return null; // Hide if nothing pending

    return (
        <div className="md:col-span-3 bg-neutral-900 bg-gradient-to-br from-indigo-900/10 to-transparent border border-indigo-500/20 rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Star className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-bold text-white">Pending Recommendations</h3>
                    <p className="text-sm text-neutral-400">You have {recommendations.length} new recommendation{recommendations.length > 1 ? 's' : ''} to review.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map(rec => (
                    <div key={rec.id} className="bg-neutral-950 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-white">{rec.author_name || rec.author?.full_name || 'User'}</span>
                                <span className="text-xs text-neutral-500 bg-neutral-900 px-2 py-1 rounded">{rec.relationship}</span>
                            </div>
                            <p className="text-xs text-neutral-400 italic mb-2">"{rec.content}"</p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAction(rec.id, 'approved')}
                                disabled={isPending}
                                className="flex-1 bg-green-600/10 hover:bg-green-600/20 text-green-500 text-xs font-bold py-2 rounded-lg border border-green-600/20 transition-colors flex items-center justify-center gap-1"
                            >
                                <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button
                                onClick={() => handleAction(rec.id, 'rejected')}
                                disabled={isPending}
                                className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 text-xs font-bold py-2 rounded-lg border border-red-600/20 transition-colors flex items-center justify-center gap-1"
                            >
                                <XCircle className="w-3 h-3" /> Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
