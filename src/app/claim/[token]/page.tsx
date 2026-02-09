import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { notFound, redirect } from 'next/navigation';
import { claimEntity } from '../actions';
import Link from 'next/link';
import {
    Check, ShieldCheck, User, Briefcase, ChevronRight, Globe, Lock, Shield,
    Calendar, MapPin, Share
} from 'lucide-react';
import { SCHEMA_CATEGORIES } from '@/lib/profile-schema';
import { CareerEntry } from '@/types/career';

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
    const supabase = await createClient(); // For User Session

    // Use Admin Client for Data Fetching (Bypass RLS)
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { token } = await params;

    // 1. Fetch Token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('claim_tokens')
        .select('*')
        .eq('token', token)
        .single();

    if (tokenError || !tokenData) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
                    <p className="text-neutral-400 mb-6">This claim code does not exist.</p>
                    <Link href="/" className="px-4 py-2 bg-neutral-800 rounded text-white hover:bg-neutral-700">Return Home</Link>
                </div>
            </div>
        );
    }

    // 2. Fetch Entity Data for Preview
    let entityPreview: any = null;
    let mockProfile: any = {};

    if (tokenData.entity_type === 'lead') {
        const { data: lead } = await supabaseAdmin.from('leads').select('*').eq('id', tokenData.entity_id).single();
        if (lead) {
            entityPreview = lead;

            // MOCK PROFILE DATA FROM LEAD (using contact_info extensions)
            const ci = lead.contact_info || {};

            mockProfile = {
                id: 'unclaimed',
                username: lead.name.toLowerCase().replace(/\s+/g, '-'),
                full_name: lead.name,
                role: ci.role || lead.role,
                bio: ci.bio || `Professional ${lead.role} looking for new opportunities. This profile is automatically generated based on public records. Claim to verify details.`,
                avatar_url: ci.avatar_url || null,
                cover_image_url: ci.cover_image_url || null,
                location: ci.location || 'Global',
                created_at: new Date().toISOString(),
                // Mock Schema Fields
                driver_info: ci.driver_info || {
                    primary_discipline: lead.primary_skill,
                    license_class: 'Pending Verification',
                    years_experience: 'Verified from Public Reocrds',
                },
                mechanic_info: ci.mechanic_info || {
                    primary_specialty: lead.primary_skill
                },
                career_history: (ci.career_history || [
                    {
                        id: 'mock-1',
                        title: lead.role,
                        organization: 'Currently Independent',
                        start_date: '2024',
                        is_current: true,
                        type: 'contract',
                        description: `Available for ${lead.role} positions. Specializing in ${lead.skills?.join(', ') || 'motorsport'}.`
                    }
                ]) as CareerEntry[]
            };
        }
    } else {
        return notFound(); // Job profiles not fully supported in this view yet
    }

    if (!entityPreview) return notFound();

    // 3. User State
    const { data: { user } } = await supabase.auth.getUser();

    // Render Logic (Mirrors PublicProfilePage)
    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans pb-32"> {/* Extra padding for sticky footer */}

            {/* Nav / Top Bar */}
            <div className="border-b border-white/5 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="font-bold text-lg tracking-tight">GridPass <span className="text-indigo-500 text-xs uppercase ml-2 bg-indigo-500/10 px-2 py-1 rounded">Profile Preview</span></div>
                    {user ? (
                        <div className="text-xs text-neutral-400">Viewing as <span className="text-white">{user.email}</span></div>
                    ) : (
                        <Link href="/login" className="text-sm text-neutral-400 hover:text-white">Sign In</Link>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-8">

                {/* Header Card (From Public Page) */}
                <div className="relative mb-8 rounded-2xl overflow-hidden bg-neutral-900 border border-white/5">
                    {/* Cover Image Banner */}
                    <div className="h-48 md:h-64 w-full bg-neutral-800 relative">
                        <div className="w-full h-full bg-gradient-to-r from-neutral-800 to-neutral-900 flex items-center justify-center">
                            <div className="opacity-10 pointer-events-none select-none text-9xl font-black text-white overflow-hidden whitespace-nowrap">
                                RACE . WIN . REPEAT
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-90"></div>
                    </div>

                    {/* Profile Info Overlay */}
                    <div className="px-8 pb-8 relative -mt-16 md:-mt-20">
                        {/* Unverified Badge */}
                        <div className="absolute top-4 right-4 md:top-20 md:right-8">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-400 text-xs font-bold uppercase tracking-widest rounded-full border border-white/10">
                                <Lock className="w-3 h-3" /> Unverified Member
                            </span>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Avatar */}
                            <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center border-4 border-neutral-950 shadow-xl shrink-0 overflow-hidden relative">
                                <User className="w-16 h-16 text-neutral-600" />
                            </div>

                            <div className="flex-1">
                                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                    {mockProfile.full_name}
                                    <span title="Unverified" className="inline-flex items-center justify-center">
                                        <ShieldCheck className="w-6 h-6 text-neutral-600 tooltip" />
                                    </span>
                                </h1>

                                <div>
                                    <p className="text-neutral-400 text-lg mb-4">@{mockProfile.username} • {mockProfile.role}</p>

                                    <p className="max-w-2xl text-neutral-300 leading-relaxed mb-6">
                                        {mockProfile.bio}
                                    </p>

                                    {/* Contact Info */}
                                    <div className="flex flex-wrap gap-6 text-sm text-neutral-500">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {mockProfile.location}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Joined {new Date(mockProfile.created_at).getFullYear()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Claim CTA Inline */}
                <div className="mb-6 bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-white font-bold text-lg mb-1">Is this you?</h3>
                        <p className="text-indigo-200 text-sm">Claim this profile to verify your identity, edit your history, and apply for jobs.</p>
                    </div>
                </div>

                {/* Career History Section (Rendered) */}
                <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden">
                    {/* Blur Overlay */}
                    <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none">
                        {/* Content is partially visible */}
                    </div>
                    <div className="absolute inset-0 z-20 flex items-center justify-center">
                        <div className="bg-black/80 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
                            <Lock className="w-4 h-4 text-neutral-400" />
                            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wide">Detailed History Locked</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5 opacity-50">
                        <div className="p-2 bg-neutral-800 rounded-lg">
                            <Briefcase className="w-5 h-5 text-neutral-300" />
                        </div>
                        <h3 className="text-xl font-bold">Career & Race History</h3>
                    </div>

                    <div className="space-y-6 opacity-30 blur-sm select-none">
                        {(mockProfile.career_history as CareerEntry[])
                            .map(entry => (
                                <div key={entry.id} className="relative pl-0 md:pl-0">
                                    <div className="flex flex-col md:flex-row justify-between mb-1">
                                        <div>
                                            <h4 className="font-bold text-lg text-white">{entry.title}</h4>
                                            <div className="text-neutral-400 text-sm mb-1">
                                                <span className="font-medium text-neutral-300">{entry.organization}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Additional Details (Rendered from Schema if available) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 pointer-events-none">
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4">Driver Info</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs uppercase text-neutral-500 font-bold">Discipline</label>
                                <div className="text-neutral-300">{mockProfile.driver_info?.primary_discipline || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Sticky Footer CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/90 backdrop-blur-xl border-t border-white/10 p-4 z-50 transition-transform duration-500 translate-y-0">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                        <h3 className="text-white font-bold">Claim this Profile</h3>
                        <p className="text-xs text-neutral-400">Verifying ownership of <span className="text-white font-mono">@{mockProfile.username}</span></p>
                    </div>

                    {user ? (
                        <form action={claimEntity.bind(null, token)} className="w-full md:w-auto">
                            <button type="submit" className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                                Confirm & Claim <ChevronRight className="w-5 h-5" />
                            </button>
                        </form>
                    ) : (
                        <div className="flex gap-2 w-full md:w-auto">
                            <Link
                                href={`/register?next=/claim/${token}`}
                                className="flex-1 md:flex-none px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors text-center"
                            >
                                Create Account
                            </Link>
                            <Link
                                href={`/login?next=/claim/${token}`}
                                className="flex-1 md:flex-none px-6 py-3 bg-neutral-800 text-white font-bold rounded-lg hover:bg-neutral-700 transition-colors border border-white/5 text-center"
                            >
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
