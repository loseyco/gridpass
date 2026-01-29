
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import {
    Trophy, Wrench, Briefcase, User, MapPin,
    Globe, Shield, Calendar, Award
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Force dynamic rendering since we rely on DB data for slugs
export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
    const supabase = await createClient();
    const { username } = await params;

    // 1. Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username) // Case-insensitive lookup
        .single();

    if (!profile) {
        notFound();
    }

    // 2. Fetch Roles
    const { data: roles } = await supabase
        .from('roles')
        .select('*')
        .eq('user_id', profile.id);

    const isFounder = roles?.some(r => r.role === 'Founder');
    const isSuperAdmin = roles?.some(r => r.role === 'Super Admin');

    const Section = ({ title, icon: Icon, data }: { title: string, icon: any, data: any }) => {
        if (!data || Object.keys(data).length === 0) return null;

        // Filter out empty keys
        const validKeys = Object.keys(data).filter(k => data[k]);
        if (validKeys.length === 0) return null;

        return (
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 md:p-8 animate-fade-in mb-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                    <div className="p-2 bg-neutral-800 rounded-lg">
                        <Icon className="w-5 h-5 text-neutral-300" />
                    </div>
                    <h3 className="text-xl font-bold">{title}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                    {validKeys.map(key => (
                        <div key={key}>
                            <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">
                                {key.replace(/_/g, ' ')}
                            </div>
                            <div className="text-neutral-200">
                                {typeof data[key] === 'boolean' ? (data[key] ? 'Yes' : 'No') : data[key]}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-8">
                        &larr; Back to GridPass
                    </Link>

                    {/* Header Card */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-8 mb-8 relative overflow-hidden">
                        {isSuperAdmin ? (
                            <div className="absolute top-0 right-0 p-4">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-500 text-xs font-bold uppercase tracking-widest rounded-full border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                    <Shield className="w-3 h-3 text-red-500" /> The Founder
                                </span>
                            </div>
                        ) : isFounder ? (
                            <div className="absolute top-0 right-0 p-4">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-widest rounded-full border border-amber-500/20">
                                    <Shield className="w-3 h-3" /> Founder
                                </span>
                            </div>
                        ) : null}

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center border-4 border-neutral-950 shadow-xl shrink-0">
                                <User className="w-16 h-16 text-neutral-600" />
                            </div>

                            <div className="flex-1">
                                <h1 className="text-4xl font-bold mb-2">{profile.full_name || profile.username}</h1>
                                <p className="text-neutral-400 text-lg mb-6">@{profile.username}</p>

                                {profile.bio && (
                                    <p className="max-w-2xl text-neutral-300 leading-relaxed mb-6">
                                        {profile.bio}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-6 text-sm text-neutral-500">
                                    {profile.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {profile.location}
                                        </div>
                                    )}
                                    {profile.website && (
                                        <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                                            <Globe className="w-4 h-4" />
                                            Website
                                        </a>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Joined {new Date(profile.created_at || Date.now()).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Sections */}
                    <Section title="Real World Racing" icon={Award} data={profile.real_world_info} />
                    <Section title="Sim Racing (iRacing)" icon={Trophy} data={profile.driver_info} />
                    <Section title="Mechanic & Crew" icon={Wrench} data={profile.mechanic_info} />
                    <Section title="Physical Stats" icon={User} data={profile.physical_info} />
                    <Section title="Logistics" icon={Briefcase} data={profile.logistics_info} />

                    {/* Note: We do NOT show Emergency Contact publicly for privacy reasons */}
                </div>
            </div>
        </div>
    );
}
