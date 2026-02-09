
import { createClient } from '@/utils/supabase/server';
import { getEffectiveUserId } from '@/utils/rbac';
import { notFound } from 'next/navigation';
import {
    Shield, Calendar, MapPin, Globe, User, Briefcase, Trophy
} from 'lucide-react';
import Link from 'next/link';
import { SCHEMA_CATEGORIES } from '@/lib/profile-schema';
import ProfileActions from './profile-actions';
import { ShareCard } from '@/components/ShareCard';
import RecommendationSection from '@/components/profile/RecommendationSection';
import { CareerEntry } from '@/types/career';

import { createAdminClient } from '@/utils/supabase/admin';
import { getServices } from '@/app/actions/services';
import { ServiceCard } from '@/components/services/ServiceCard';
import { getGarage } from '@/app/dashboard/profile/garage-actions';
import VehicleCard from '@/components/profile/VehicleCard';
import ToolCard from '@/components/profile/ToolCard';
import { Vehicle, Tool } from '@/types/garage';

// Force dynamic rendering since we rely on DB data for slugs
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params, searchParams }: { params: Promise<{ username: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const supabase = await createClient();
    const { username } = await params;
    const { action } = await searchParams;

    let profile = null;
    let isShadow = false;

    // 1. Try fetching real profile
    const { data: realProfile } = await supabase
        .from('profiles')
        .select('full_name, username, bio, avatar_url')
        .ilike('username', username)
        .single();

    profile = realProfile;

    // 2. Fallback to Shadow Profile (Leads)
    if (!profile) {
        const supabaseAdmin = createAdminClient();
        // Query leads by username in contact_info JSON
        const { data: lead } = await supabaseAdmin
            .from('leads')
            .select('*')
            // This is a bit tricky with JSONB in simple query, but Supabase supports arrow operators in filter
            // .imatch won't work on jsonb field easily without casting?
            // "contact_info"->>'username' = username
            .eq('contact_info->>username', username)
            .single();

        if (lead) {
            isShadow = true;
            profile = {
                username: lead.contact_info?.username || 'user',
                full_name: lead.name,
                bio: lead.contact_info?.bio || `Profile for ${lead.name}`,
                avatar_url: lead.contact_info?.avatar_url,
                role: lead.role?.toLowerCase() || 'member'
            };
        }
    }

    if (!profile) {
        return {
            title: 'Profile Not Found | GridPass'
        };
    }

    const displayName = profile.full_name || profile.username;

    // ... rest of metadata logic (keep existing simple return if possible or adapt)
    if (action === 'recommend') {
        return {
            title: `Recommendation Request from ${displayName}`,
            description: `I'm building my racing profile on GridPass and would love your recommendation. Click to write a review.`,
            openGraph: {
                title: `I need your recommendation! | ${displayName}`,
                description: `Vouch for ${displayName} on GridPass to help them build their racing reputation.`,
                type: 'profile',
                username: profile.username,
                images: profile.avatar_url ? [profile.avatar_url] : [],
            }
        };
    }

    return {
        title: `${displayName} (@${profile.username}) ${isShadow ? '(Unclaimed)' : ''}`,
        description: profile.bio || `Check out ${displayName}'s racing profile on GridPass.`,
        openGraph: {
            title: `${displayName} (@${profile.username}) - GridPass Racer`,
            description: profile.bio || `Check out ${displayName}'s racing profile on GridPass.`,
            type: 'profile',
            username: profile.username,
        }
    };
}

export default async function PublicProfilePage({ params, searchParams }: { params: Promise<{ username: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const supabase = await createClient();
    const { username } = await params;
    const { action } = await searchParams;

    // 1. Fetch Profile
    let profile = null;
    let isShadowProfile = false;
    let claimToken = null;

    // 1. Fetch Profile
    const { data: realProfile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .single();

    profile = realProfile;

    // 2. Shadow Profile Fallback
    if (!profile) {
        const supabaseAdmin = createAdminClient();
        const { data: lead } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('contact_info->>username', username)
            .single();

        if (lead) {
            isShadowProfile = true;
            // Map Lead to Profile
            profile = {
                id: 'shadow-' + lead.id,
                username: lead.contact_info?.username,
                full_name: lead.name,
                role: lead.role, // 'driver' etc
                bio: lead.contact_info?.bio,
                avatar_url: lead.contact_info?.avatar_url,
                location: lead.contact_info?.location,
                website: lead.contact_info?.profile_link,
                created_at: lead.created_at,
                // Map skills to tags if possible, or assume empty
                skills: lead.skills,
                // Map Contact Info Career to Schema if possible
                career_history: lead.contact_info?.career_history || [],
                // Default empty for others
                basic_info: {},
                driver_info: lead.contact_info?.driver_info || {},
                social_links: lead.contact_info?.social_links || [],
                sim_racing: {},
                setup_specialist: {},
                engineer_info: {},
                team_owner_info: {},
                mechanic_info: {},
                instructor_info: {},
                photographer_info: {},
                commentator_info: {},
                painter_info: {}
            };

            // Fetch Claim Token
            const { data: tokenData } = await supabaseAdmin
                .from('claim_tokens')
                .select('token')
                .eq('entity_id', lead.id)
                .single();

            if (tokenData) {
                claimToken = tokenData.token;
            }
        }
    }

    if (!profile) {
        notFound();
    }

    // 2. Fetch Profile Role directly (no need for separate table now)
    const isFounder = profile.role === 'founder';
    const isProfileSuperAdmin = profile.role === 'superadmin';

    // Check ownership
    const effectiveUserId = await getEffectiveUserId();
    const isOwner = effectiveUserId === profile.id;

    // 3. Check if *current user* is Super Admin (for Edit Button)
    // We must use the REAL user ID, not effective ID, to ensure Admins can still see this button even if impersonating.
    let isViewerSuperAdmin = false;
    const { data: { user: realUser } } = await supabase.auth.getUser();

    if (realUser) {
        const { data: myProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', realUser.id)
            .single();

        isViewerSuperAdmin = myProfile?.role === 'superadmin';
    }

    // 4. Fetch Services
    const services = await getServices({ userId: profile.id });

    // 5. Fetch Garage
    let garage: { vehicles: Vehicle[], tools: Tool[] } = { vehicles: [], tools: [] };
    try {
        // Only fetch if it's a real profile (not shadow) or if we want to support it for shadow later
        if (!isShadowProfile) {
            garage = await getGarage(profile.id);
        }
    } catch (e) {
        console.error('Failed to fetch garage', e);
    }

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
                        <div className="flex items-center gap-4">
                            <Link href="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors">
                                &larr; Back to GridPass
                            </Link>
                            {isViewerSuperAdmin && (
                                <Link
                                    href={`/admin/users/${profile.id}`}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600/10 text-red-500 hover:bg-red-600/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-red-900/50"
                                >
                                    <Shield className="w-3 h-3" />
                                    Edit (Admin)
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <ShareCard
                                url={`https://gridpass.app/u/${profile.username}`}
                                title={`@${profile.username}`}
                                subtitle="GridPass Racing Profile"
                            />
                            <ProfileActions
                                isOwner={isOwner}
                                recipientName={profile.full_name || profile.username}
                                recipientUsername={profile.username}
                            />
                        </div>
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
                            {isProfileSuperAdmin ? (
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
                                            {/* Social Links (Shadow Profile) */}
                                            {profile.social_links && profile.social_links.length > 0 && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    {profile.social_links.map((link: string, i: number) => {
                                                        const getIcon = (url: string) => {
                                                            if (url.includes('instagram')) return 'Instagram';
                                                            if (url.includes('twitter') || url.includes('x.com')) return 'X';
                                                            if (url.includes('linkedin')) return 'LinkedIn';
                                                            return 'Link';
                                                        };
                                                        return (
                                                            <a key={i} href={link} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white transition-colors text-xs border border-white/10 px-2 py-1 rounded-md">
                                                                {getIcon(link)}
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skills Section */}
                    {profile.skills && profile.skills.length > 0 && (
                        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 md:p-8 mb-6 animate-fade-in break-inside-avoid print:bg-white print:border-none print:p-0 print:mb-6">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5 print:border-gray-300 print:mb-3 print:pb-2">
                                <div className="p-2 bg-neutral-800 rounded-lg print:hidden">
                                    <Trophy className="w-5 h-5 text-neutral-300" />
                                </div>
                                <h3 className="text-xl font-bold print:text-black print:uppercase print:tracking-widest print:text-sm">Skills & Expertise</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 bg-neutral-800 text-neutral-200 rounded-lg text-sm font-medium border border-white/5 print:bg-gray-100 print:text-black print:border-gray-300">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Services Section */}
                    {services.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <h3 className="text-xl font-bold text-white">Services Offered</h3>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {services.map(service => (
                                    <ServiceCard key={service.id} service={service} showOwner={false} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Garage Section */}
                    {(garage.vehicles.length > 0 || garage.tools.length > 0) && (
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <h3 className="text-xl font-bold text-white">Garage</h3>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>

                            {garage.vehicles.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Vehicles</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {garage.vehicles.map(vehicle => (
                                            <VehicleCard key={vehicle.id} vehicle={vehicle} readOnly />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {garage.tools.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Tools & Equipment</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {garage.tools.map(tool => (
                                            <ToolCard key={tool.id} tool={tool} readOnly />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

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

                    {/* Recommendations Section */}
                    <div className="mb-6">
                        <RecommendationSection
                            targetUserId={profile.id}
                            targetName={profile.full_name || profile.username}
                            autoOpen={action === 'recommend'}
                        />
                    </div>

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
            {/* Shadow Profile Claim Banner */}
            {
                isShadowProfile && claimToken && (
                    <div className="fixed bottom-0 left-0 right-0 bg-indigo-600/95 backdrop-blur-md border-t border-indigo-500/50 p-4 md:p-6 z-50 animate-slide-up print:hidden">
                        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">Is this you?</h3>
                                    <p className="text-indigo-100 text-sm">
                                        Claim this profile to verify your stats, upload media, and get hired.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <Link
                                    href={`/claim/${claimToken}`}
                                    className="flex-1 md:flex-none px-6 py-3 bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-lg transition-colors text-center shadow-lg"
                                >
                                    Claim Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}


