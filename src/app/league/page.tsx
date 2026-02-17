
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/server';
import { ArrowRight, Trophy, Users, Globe } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'League Directory',
    description: 'Find and join the best sim racing leagues on GridPass. Compete, track stats, and climb the rankings.',
}

async function getLeagues() {
    const supabase = await createClient();
    const { data: leagues, error } = await supabase
        .from('os_leagues')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

    if (error) console.error('Error fetching leagues:', error);
    return leagues || [];
}

export default async function LeagueDirectory() {
    const leagues = await getLeagues();

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="container mx-auto max-w-6xl">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">League Directory</h1>
                        <p className="text-gray-400 text-lg">Find a league and start racing.</p>
                    </div>
                    <Link href="/league/admin">
                        <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black">
                            Start Your Own League
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leagues.length === 0 ? (
                        <div className="col-span-full text-center py-24 bg-zinc-900/50 rounded-2xl border border-white/5">
                            <Trophy className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-500">No leagues found</h3>
                            <p className="text-gray-600 mt-2">Be the first to create one!</p>
                        </div>
                    ) : (
                        leagues.map((league) => (
                            <Link key={league.id} href={`/league/${league.slug}`} className="group">
                                <Card className="h-full bg-zinc-900 border-white/10 hover:border-cyan-500/50 transition-all hover:bg-zinc-800 p-6 flex flex-col relative overflow-hidden">
                                    {league.banner_url && (
                                        <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity">
                                            <img src={league.banner_url} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                                        </div>
                                    )}

                                    <div className="relative z-10 flex-grow">
                                        <div className="flex justify-between items-start mb-4">
                                            {league.is_official && (
                                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30">
                                                    OFFICIAL
                                                </span>
                                            )}
                                            {league.require_membership ? (
                                                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-gray-400 text-xs font-medium border border-white/10">
                                                    Membership
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-green-900/20 text-green-400 text-xs font-medium border border-green-500/30">
                                                    Open
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-2xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">{league.name}</h3>
                                        <p className="text-gray-400 text-sm line-clamp-3 mb-6">
                                            {league.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    <div className="relative z-10 pt-6 border-t border-white/5 flex items-center justify-between mt-auto">
                                        <span className="text-sm text-gray-500 flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            Online
                                        </span>
                                        <span className="flex items-center gap-1 text-cyan-400 font-medium text-sm">
                                            Visit League <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
