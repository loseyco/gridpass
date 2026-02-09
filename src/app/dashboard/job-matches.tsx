'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { ExternalLink, MapPin, Briefcase, Star } from 'lucide-react';

interface JobMatch {
    id: string;
    job_title: string;
    company_name: string;
    job_url: string;
    match_score: number;
    is_remote: boolean;
    status: string;
}

export default function JobMatches() {
    const [matches, setMatches] = useState<JobMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchMatches() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('job_matches')
                .select('*')
                .eq('user_id', user.id)
                .order('match_score', { ascending: false })
                .limit(5);

            if (data) setMatches(data);
            setLoading(false);
        }

        fetchMatches();
    }, []);

    if (loading) return <div className="animate-pulse h-48 bg-white/5 rounded-xl"></div>;

    if (matches.length === 0) {
        return (
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 text-center">
                <Briefcase className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white">No Job Matches Yet</h3>
                <p className="text-sm text-neutral-400 mt-1">
                    Our agent is scanning for opportunities. Check back soon!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                Top Job Recommendations
            </h2>
            <div className="grid gap-3">
                {matches.map((job) => (
                    <div key={job.id} className="group relative bg-neutral-900/50 hover:bg-neutral-900 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                                    {job.job_title}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-neutral-400 mt-1">
                                    <span>{job.company_name}</span>
                                    {job.is_remote && (
                                        <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-500/20">
                                            <MapPin className="w-3 h-3" /> Remote
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xs font-mono text-neutral-500 mb-1">Match Score</div>
                                <div className="text-lg font-bold text-white">{job.match_score}</div>
                            </div>
                        </div>

                        <a
                            href={job.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 z-10"
                            aria-label={`View job: ${job.job_title}`}
                        />

                        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-4 h-4 text-white/50" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
