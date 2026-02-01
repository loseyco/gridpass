'use client';

import FeatureItem from './FeatureItem';

interface Feature {
    id: string;
    title: string;
    description: string;
    status: string;
    votes: number;
    hasVoted: boolean;
    category: string;
}

export default function FeatureList({ features, isAdmin = false }: { features: Feature[], isAdmin?: boolean }) {
    return (
        <div className="space-y-4">
            {features.map((feature) => (
                <FeatureItem key={feature.id} feature={feature} isAdmin={isAdmin} />
            ))}

            {features.length === 0 && (
                <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-white/5 border-dashed">
                    <p className="text-neutral-500">No features found.</p>
                </div>
            )}
        </div>
    );
}
