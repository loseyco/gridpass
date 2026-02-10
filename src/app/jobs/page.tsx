
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Briefcase, MapPin, Clock, DollarSign } from 'lucide-react';
import { Metadata } from 'next';
import EmptyState from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Sim Racing Jobs",
    description: "Find your next team, drive, or pit crew role in sim racing.",
};

export default async function JobsPage() {
    const supabase = await createClient();

    // Fetch active jobs (or open)
    const { data: items } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 md:p-12">
            <div className="max-w-5xl mx-auto animate-fade-in">

                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            <Briefcase className="w-10 h-10 text-emerald-500" />
                            Job Board
                        </h1>
                        <p className="text-neutral-400">Opportunities for drivers, engineers, and team managers.</p>
                    </div>
                    <Link href="/jobs/post" className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-colors">
                        Post a Job
                    </Link>
                </div>

                <div className="grid gap-4">
                    {items?.map((item) => (
                        <div key={item.id} className="bg-neutral-900 border border-white/5 rounded-xl p-6 hover:border-emerald-500/30 transition-colors group relative">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                                        {item.role}
                                    </h3>
                                    <p className="text-neutral-400 font-medium mb-2">{item.team_name}</p>

                                    <div className="flex flex-wrap gap-3 text-sm text-neutral-500 mb-4">
                                        <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                            <MapPin className="w-3 h-3" /> Remote
                                        </span>
                                        <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                            <Clock className="w-3 h-3" /> Full-time
                                        </span>
                                        {/* <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">
                                            <DollarSign className="w-3 h-3" /> Paid
                                        </span> */}
                                    </div>

                                    <p className="text-neutral-300 text-sm line-clamp-2 max-w-2xl">
                                        {item.description}
                                    </p>
                                </div>

                                <Link
                                    href={item.source_link || '#'}
                                    target={item.source_link ? '_blank' : '_self'}
                                    className="px-4 py-2 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors text-sm font-bold whitespace-nowrap"
                                >
                                    Apply Now
                                </Link>
                            </div>
                        </div>
                    ))}

                    {(!items || items.length === 0) && (
                        <EmptyState
                            icon={Briefcase}
                            title="No active job listings"
                            description="Be the first to post a role!"
                            actionLabel="Post a Job"
                            actionLink="/jobs/post"
                        />
                    )}
                </div>

            </div>
        </div>
    );
}
