import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ArrowRight, MapPin, Globe, Trophy, Search } from 'lucide-react';
import { getOrganizations } from '@/app/actions/organizations';

export const metadata = {
    title: 'Race Teams | GridPass',
    description: 'Find and connect with race teams for fly-in support and opportunities.',
};

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
    const params = await searchParams;
    const search = params.search || '';
    const teams = await getOrganizations({ type: 'team', search });

    return (
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30 font-sans">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-neutral-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="font-bold text-xl tracking-tighter flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 relative rounded bg-neutral-100 flex items-center justify-center font-bold text-black overflow-hidden">
                            <img src="/logo-square.png" alt="GridPass" className="object-cover w-full h-full" />
                        </div>
                        GridPass <span className="text-indigo-500 text-xs uppercase tracking-widest border border-indigo-500/20 px-2 py-0.5 rounded-full bg-indigo-500/10">Teams</span>
                    </Link>
                    <div className="flex items-center gap-4 text-sm font-medium text-neutral-400">
                        <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-32 pb-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-6 leading-[0.9]">
                        RACE TEAM <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">DATABASE</span>
                    </h1>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        The open directory of verified race teams. <br />
                        Find your next seat, ride, or fly-in opportunity.
                    </p>

                    {/* Search Input */}
                    <div className="max-w-xl mx-auto relative">
                        <form action="/teams" method="GET" className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-neutral-500" />
                            </div>
                            <input
                                type="text"
                                name="search"
                                defaultValue={search}
                                placeholder="Search teams by name..."
                                className="block w-full pl-11 pr-4 py-4 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                            />
                        </form>
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="px-6 pb-24 max-w-7xl mx-auto">
                {teams.length === 0 ? (
                    <div className="text-center py-20 border border-white/5 rounded-2xl bg-neutral-900/50">
                        <p className="text-neutral-500">No teams found matching &quot;{search}&quot;. Be the first to join.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team) => (
                            <div key={team.id} className="group relative bg-neutral-900/50 border border-white/5 p-6 rounded-2xl hover:border-indigo-500/30 transition-all hover:bg-neutral-900 overflow-hidden">
                                <div className="absolute top-0 right-0 p-20 bg-indigo-500/5 blur-[60px] rounded-full group-hover:bg-indigo-500/10 transition-all"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-neutral-800 rounded-xl border border-white/5">
                                            <Trophy className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${team.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-neutral-800 text-neutral-500 border-white/5'}`}>
                                            {team.status === 'pending_claim' ? 'Unclaimed' : team.status}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{team.name}</h3>

                                    {team.description && (
                                        <p className="text-neutral-400 text-sm mb-4 line-clamp-2 min-h-[40px]">{team.description}</p>
                                    )}

                                    <div className="space-y-3 mb-6">
                                        {team.location && (
                                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                <MapPin className="w-3 h-3" />
                                                {team.location}
                                            </div>
                                        )}
                                        {team.website && (
                                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                <Globe className="w-3 h-3" />
                                                <a href={team.website} target="_blank" rel="noreferrer" className="hover:text-indigo-400 underline decoration-indigo-500/30 underline-offset-2 transition-colors truncate max-w-[200px]">
                                                    {team.website}
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <Link href={`/organization/${team.id}`} className="block w-full py-2.5 text-center text-sm font-bold bg-white text-black rounded-lg hover:bg-indigo-50 transition-colors">
                                        View Profile
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
