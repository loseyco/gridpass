
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import Link from 'next/link';
import { User, Trophy, Wrench, Search, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Members Directory",
    description: "Discover verified drivers, mechanics, and race teams on GridPass.",
};

export default async function MembersPage() {
    const supabase = await createClient();

    // Fetch all profiles    // Fetch Profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .not('is_banned', 'is', true)
        .order('created_at', { ascending: false });

    // Fetch Shadow Profiles (Leads)
    const supabaseAdmin = createAdminClient();
    const { data: leads } = await supabaseAdmin
        .from('leads')
        // Filter only those with a username generated
        // Note: JSONB filtering can be tricky, we'll fetch recent ones and filter in memory if volume is low, 
        // or rely on the agent having set it.
        // For efficiency, we should have an index on contact_info->>username but for now:
        .select('*')
        .not('contact_info->username', 'is', null)
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(50); // Limit to 50 for now

    // Map leads to profile structure
    const seenNames = new Set();
    const shadowProfiles = leads?.reduce((acc, lead) => {
        if (!seenNames.has(lead.name)) {
            seenNames.add(lead.name);
            acc.push({
                id: lead.id,
                username: lead.contact_info.username,
                full_name: lead.name,
                avatar_url: lead.contact_info.avatar_url,
                role: 'member', // Default role
                is_shadow: true, // Marker for UI
                skills: lead.skills
            });
        }
        return acc;
    }, [] as any[]) || [];

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans pt-24 px-4 md:px-8 pb-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4">
                            Grid<span className="text-red-600">Pass</span> Members
                        </h1>
                        <p className="text-neutral-400 text-lg max-w-2xl">
                            Connect with fellow racers, team managers, and enthusiasts.
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <div className="px-4 py-2 bg-neutral-900 rounded-lg border border-white/5 text-sm text-neutral-500 font-mono">
                            {profiles?.length || 0} MEMBERS
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {profiles?.map((profile: any) => (
                        <ClientMemberCard key={profile.id} profile={profile} />
                    ))}
                </div>

                {/* Divide with a section header */}
                {shadowProfiles.length > 0 && (
                    <div className="mt-16 mb-8">
                        <h2 className="text-3xl font-bold italic uppercase tracking-tighter mb-2">
                            Newest <span className="text-neutral-500">Additions</span>
                        </h2>
                        <p className="text-neutral-400">
                            Profiles discovered by our agents. Unclaimed but visible.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {shadowProfiles.map((profile: any) => (
                        <ClientMemberCard key={profile.id} profile={profile} isShadow={true} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ClientMemberCard({ profile, isShadow = false }: { profile: any, isShadow?: boolean }) {
    return (
        <Link
            href={`/u/${profile.username}`}
            className="group block bg-neutral-900 border border-white/5 rounded-xl overflow-hidden hover:border-red-600/50 transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.1)] hover:-translate-y-1"
        >
            <div className="relative h-32 bg-neutral-800">
                {profile.cover_image_url ? (
                    <img src={profile.cover_image_url} alt="Cover" className="w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900"></div>
                )}
                {/* User Avatar */}
                <div className="absolute -bottom-6 left-6">
                    <div className="w-16 h-16 rounded-full bg-neutral-900 border-4 border-neutral-900 overflow-hidden shadow-lg">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                <User className="w-8 h-8 text-neutral-600" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-8 px-6 pb-6">
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-white group-hover:text-red-500 transition-colors truncate">
                            {profile.full_name || profile.username}
                        </h3>
                        {/* Founder Badges based on profile.role */}
                        {(() => {
                            if (profile.role === 'superadmin') {
                                return (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/10 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                        <Shield className="w-3 h-3 text-red-500" /> The Founder
                                    </span>
                                );
                            }
                            if (profile.role === 'founder') {
                                return (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                                        <Shield className="w-3 h-3" /> Founder
                                    </span>
                                );
                            }
                            return null;
                        })()}
                        {isShadow && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-neutral-500 text-[10px] font-bold uppercase tracking-wider border border-neutral-700">
                                Unverified
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
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
    );
}
