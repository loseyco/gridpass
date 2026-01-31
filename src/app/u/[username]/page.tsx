
import { createClient } from '@/utils/supabase/server';
import { getEffectiveUserId } from '@/utils/rbac';
import { notFound } from 'next/navigation';
import {
    Shield, Calendar, MapPin, Globe, User, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { SCHEMA_CATEGORIES } from '@/lib/profile-schema';
import ProfileActions from './profile-actions';
import { CareerEntry } from '@/types/career';

// Force dynamic rendering since we rely on DB data for slugs
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { username: string } }) {
    const supabase = await createClient();
    const { username } = await params;

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, bio, avatar_url')
        .ilike('username', username)
        .single();

    if (!profile) {
        return {
            title: 'Profile Not Found | GridPass'
        };
    }

    const displayName = profile.full_name || profile.username;

    return {
        title: `${displayName} (@${profile.username})`,
        description: profile.bio || `Check out ${displayName}'s racing profile on GridPass.`,
        openGraph: {
            title: `${displayName} (@${profile.username}) - GridPass Racer`,
            description: profile.bio || `Check out ${displayName}'s racing profile on GridPass.`,
            type: 'profile',
            username: profile.username,
        }
    };
}

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
    const supabase = await createClient();
    const { username } = await params;

    // 1. Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*') // Wildcard is fine here since we want everything, but good to be explicit usually.
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
    // Check ownership
    const effectiveUserId = await getEffectiveUserId();
    const isOwner = effectiveUserId === profile.id;

    const isSuperAdmin = roles?.some(r => r.role === 'Super Admin');

    // Helper to format values
    const formatValue = (val: any) => {
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        return val;
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-4 md:p-8 print:bg-white print:text-black print:p-0">
            <div className="max-w-5xl mx-auto print:max-w-none">
                <div className="mb-8 print:mb-4">
                    <div className="flex justify-between items-center mb-8 print:hidden">
                        <Link href="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors">
                            &larr; Back to GridPass
                        </Link>


                        <ProfileActions
                            isOwner={isOwner}
                            recipientName={profile.full_name || profile.username}
                            recipientUsername={profile.username}
                        />
                    </div>

                    {/* Header Card */}
                    <div className="relative mb-8 rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 print:border-none print:shadow-none print:bg-white print:overflow-visible">

                        {/* Cover Image Banner */}
                        <div className="h-48 md:h-64 w-full bg-neutral-800 relative">
                            {profile.cover_image_url ? (
                                <img src={profile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-r from-neutral-800 to-neutral-900 flex items-center justify-center">
                                    <div className="opacity-10 pointer-events-none select-none text-9xl font-black text-white overflow-hidden whitespace-nowrap">
                                        RACE . WIN . REPEAT
                                    </div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-90"></div>
                        </div>

                        {/* Profile Info Overlay */}
                        <div className="px-8 pb-8 relative -mt-16 md:-mt-20 print:mt-0 print:px-0 print:pb-0">
                            {isSuperAdmin ? (
                                <div className="absolute top-4 right-4 md:top-20 md:right-8 print:hidden">
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-500 text-xs font-bold uppercase tracking-widest rounded-full border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                        <Shield className="w-3 h-3 text-red-500" /> The Founder
                                    </span>
                                </div>
                            ) : isFounder ? (
                                <div className="absolute top-4 right-4 md:top-20 md:right-8 print:hidden">
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-widest rounded-full border border-amber-500/20">
                                        <Shield className="w-3 h-3" /> Founder
                                    </span>
                                </div>
                            ) : null}

                            <div className="flex flex-col md:flex-row gap-8 items-start print:items-center print:flex-row print:gap-6">
                                {/* Avatar - Hide in print if generic or keep small */}
                                <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center border-4 border-neutral-950 shadow-xl shrink-0 print:border-gray-200 print:w-24 print:h-24 print:bg-gray-100 overflow-hidden relative">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 text-neutral-600 print:text-gray-400" />
                                    )}
                                </div>

                                <div className="flex-1 print:text-left">
                                    <h1 className="text-4xl font-bold mb-2 print:text-black print:text-3xl">{profile.full_name || profile.username}</h1>

                                    <div className="print:flex print:justify-between print:items-start">
                                        <div>
                                            <p className="text-neutral-400 text-lg mb-4 print:text-gray-600 print:mb-2">@{profile.username}</p>

                                            {profile.bio && (
                                                <p className="max-w-2xl text-neutral-300 leading-relaxed mb-6 print:text-black print:text-sm print:mb-4">
                                                    {profile.bio}
                                                </p>
                                            )}
                                        </div>

                                        {/* Contact Info for Resume (Right aligned in print?) */}
                                        <div className="flex flex-wrap gap-6 text-sm text-neutral-500 print:block print:text-right print:space-y-1 print:text-xs">
                                            {profile.location && (
                                                <div className="flex items-center gap-2 print:justify-end">
                                                    <MapPin className="w-4 h-4 print:w-3 print:h-3" />
                                                    {profile.location}
                                                </div>
                                            )}
                                            {profile.website && (
                                                <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-indigo-400 transition-colors print:justify-end print:text-black">
                                                    <Globe className="w-4 h-4 print:w-3 print:h-3" />
                                                    {profile.website.replace(/^https?:\/\//, '')}
                                                </a>
                                            )}
                                            <div className="flex items-center gap-2 print:justify-end">
                                                <Calendar className="w-4 h-4 print:w-3 print:h-3" />
                                                Member since {new Date(profile.created_at || Date.now()).getFullYear()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Career History Section */}
                    {profile.career_history && (profile.career_history as CareerEntry[]).length > 0 && (
                        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 md:p-8 mb-6 animate-fade-in break-inside-avoid print:bg-white print:border-none print:p-0 print:mb-6">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5 print:border-gray-300 print:mb-3 print:pb-2">
                                <div className="p-2 bg-neutral-800 rounded-lg print:hidden">
                                    <Briefcase className="w-5 h-5 text-neutral-300" />
                                </div>
                                <h3 className="text-xl font-bold print:text-black print:uppercase print:tracking-widest print:text-sm">Career & Race History</h3>
                            </div>

                            <div className="space-y-6 print:space-y-4">
                                {(profile.career_history as CareerEntry[])
                                    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                                    .map(entry => (
                                        <div key={entry.id} className="relative pl-0 md:pl-0">
                                            <div className="flex flex-col md:flex-row justify-between mb-1 print:flex-row">
                                                <div>
                                                    <h4 className="font-bold text-lg text-white print:text-black print:text-sm">{entry.title}</h4>
                                                    <div className="text-neutral-400 text-sm mb-1 print:text-gray-700">
                                                        <span className="font-medium text-neutral-300 print:text-black">{entry.organization}</span>
                                                        {entry.vehicle_info && <span className="text-neutral-400 print:text-black"> • {entry.vehicle_info}</span>}
                                                        {entry.event_name && <span className="text-amber-500 print:text-black"> @ {entry.event_name}</span>}
                                                        {entry.location && <span className="hidden print:inline"> • {entry.location}</span>}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-mono text-neutral-500 whitespace-nowrap print:text-xs print:text-right print:pt-1">
                                                    {entry.start_date} {entry.is_current ? '- Present' : entry.end_date ? `to ${entry.end_date}` : ''}
                                                    <span className={`ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded print:hidden
                                                    ${entry.type === 'event' ? 'bg-amber-500/10 text-amber-500' :
                                                            entry.type === 'contract' ? 'bg-purple-500/10 text-purple-500' :
                                                                'bg-blue-500/10 text-blue-500'}`}>
                                                        {entry.type}
                                                    </span>
                                                </div>
                                            </div>
                                            {entry.description && (
                                                <p className="text-neutral-300 text-sm leading-relaxed max-w-3xl print:text-black print:text-xs text-justify">
                                                    {entry.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Info Sections */}
                    <div className="space-y-6 print:space-y-4">
                        {SCHEMA_CATEGORIES.map(cat => {
                            // Skip Basic (header) and Emergency (private)
                            if (cat.id === 'basic' || cat.id === 'emergency') return null;

                            const sectionData = profile[cat.db_column];
                            if (!sectionData || Object.keys(sectionData).length === 0) return null;

                            // Filter keys that have values
                            const validFields = cat.fields.filter(field => {
                                const val = sectionData[field.key];
                                return val !== undefined && val !== '' && val !== null;
                            });

                            if (validFields.length === 0) return null;

                            const Icon = cat.icon;

                            return (
                                <div key={cat.id} className="bg-neutral-900 border border-white/5 rounded-2xl p-6 md:p-8 animate-fade-in break-inside-avoid print:bg-white print:border-none print:p-0 print:mb-6">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5 print:border-gray-300 print:mb-3 print:pb-2">
                                        <div className="p-2 bg-neutral-800 rounded-lg print:hidden">
                                            <Icon className="w-5 h-5 text-neutral-300" />
                                        </div>
                                        <h3 className="text-xl font-bold print:text-black print:uppercase print:tracking-widest print:text-sm">{cat.title}</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 print:grid-cols-2 print:gap-y-2 print:gap-x-4">
                                        {validFields.map(field => (
                                            <div key={field.key}>
                                                <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1 print:text-gray-500 print:text-[10px]">
                                                    {field.label}
                                                </div>
                                                <div className="text-neutral-200 print:text-black print:text-sm font-medium">
                                                    {formatValue(sectionData[field.key])}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}


