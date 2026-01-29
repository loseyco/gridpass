'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Hash, Folder } from 'lucide-react';
import FeatureCard from './FeatureCard';

interface Props {
    title: string;
    features: any[];
}

export default function CategoryAccordion({ title, features }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const totalVotes = features.reduce((acc, curr) => acc + (curr.votes || 0), 0);
    const completedCount = features.filter(f => f.status === 'completed').length;

    return (
        <div className="border border-white/5 rounded-xl bg-neutral-900/30 overflow-hidden mb-4 transition-all hover:border-amber-500/20">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isOpen ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                        <p className="text-xs text-neutral-500 font-mono mt-1">
                            {features.length} MODULES • {completedCount} RELEASED
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* <div className="text-right hidden md:block">
                        <div className="text-xs text-neutral-500 uppercase tracking-widest">Community Interest</div>
                        <div className="font-bold text-amber-500">{totalVotes} Votes</div>
                    </div> */}
                </div>
            </button>

            {/* Content */}
            <div className={`grid md:grid-cols-2 gap-4 p-6 pt-0 border-t border-white/5 bg-neutral-900/50 ${isOpen ? 'block animate-fade-in-down' : 'hidden'}`}>
                {features.map(feat => (
                    <FeatureCard key={feat.id} feature={feat} />
                ))}
            </div>
        </div>
    );
}
