'use client';

import { useState } from 'react';
import { ChevronUp, Check, Clock } from 'lucide-react';

export default function FeatureCard({ feature }: { feature: any }) {
    const [votes, setVotes] = useState(feature.votes || 0);
    const [voted, setVoted] = useState(false);

    const handleVote = async () => {
        if (voted) return;
        setVotes((v: number) => v + 1);
        setVoted(true);
        await fetch(`/api/features/${feature.id}/vote`, { method: 'POST' });
    };

    return (
        <div className="group relative p-6 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-amber-500/30 transition-all hover:bg-neutral-900">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${feature.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                        feature.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-neutral-800 text-neutral-400'
                        }`}>
                        {feature.status.replace('_', ' ')}
                    </span>
                    {feature.category && (
                        <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400">
                            {feature.category}
                        </span>
                    )}
                </div>

                {/* Voting Mechanism */}
                {/* Voting Mechanism Hidden per request */}
                {/* <button ... /> */}
            </div>

            <h4 className="text-xl font-bold mb-2 group-hover:text-amber-500 transition-colors">{feature.title}</h4>
            <p className="text-neutral-400 text-sm leading-relaxed">{feature.description}</p>

            {/* Progress Bar (Visual Flair) */}
            {feature.status === 'in_progress' && (
                <div className="mt-4 h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-1/3 animate-pulse" />
                </div>
            )}
        </div>
    );
}
