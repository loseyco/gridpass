
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { User, Trophy, Wrench, Search, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
    const supabase = await createClient();

    // Fetch all profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    // Fetch all roles
    const { data: roles } = await supabase
        .from('roles')
        .select('*');

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 md:p-12">
            <div className="max-w-7xl mx-auto animate-fade-in">

                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Members Directory</h1>
                        <p className="text-neutral-400">Discover drivers, mechanics, and teams on the Grid.</p>
                    </div>

                    {/* Placeholder for future search */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-neutral-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search members..."
                            className="bg-neutral-900 border border-white/10 text-white text-sm rounded-lg block w-full pl-10 p-2.5 focus:border-indigo-500 outline-none"
                            disabled
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profiles?.map((profile) => (
                        <Link
                            key={profile.id}
                            href={`/u/${profile.username}`}
                            className="group bg-neutral-900 border border-white/5 rounded-xl p-6 hover:border-indigo-500/50 hover:bg-neutral-900/80 transition-all flex items-start gap-4"
                        >
                            <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center shrink-0 border border-white/5 group-hover:border-indigo-500/30">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-6 h-6 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                                )}
                            </div>

                            <div className="overflow-hidden">
                                <h3 className="font-bold text-lg truncate group-hover:text-indigo-300 transition-colors">
                                    {profile.full_name || profile.username || 'Anonymous'}
                                </h3>
                                <p className="text-sm text-neutral-500 truncate mb-2">@{profile.username}</p>

                                <div className="flex flex-wrap gap-2">
                                    {/* Founder Badges */}
                                    {(() => {
                                        const userRoles = roles?.filter(r => r.user_id === profile.id);
                                        const isSuperAdmin = userRoles?.some(r => r.role === 'Super Admin');
                                        const isFounder = userRoles?.some(r => r.role === 'Founder');

                                        if (isSuperAdmin) {
                                            return (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/10 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                                    <Shield className="w-3 h-3 text-red-500" /> The Founder
                                                </span>
                                            );
                                        }
                                        if (isFounder) {
                                            return (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                                                    <Shield className="w-3 h-3" /> Founder
                                                </span>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Conditional Badges based on data presence */}
                                    {profile.real_world_info && Object.keys(profile.real_world_info).length > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                                            <Trophy className="w-3 h-3" /> Driver
                                        </span>
                                    )}
                                    {profile.driver_info && Object.keys(profile.driver_info).length > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                            <Trophy className="w-3 h-3" /> Sim Racer
                                        </span>
                                    )}
                                    {profile.mechanic_info && Object.keys(profile.mechanic_info).length > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                                            <Wrench className="w-3 h-3" /> Crew
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}

                    {(!profiles || profiles.length === 0) && (
                        <div className="col-span-full text-center py-12 text-neutral-500">
                            No members found. Be the first to join!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
