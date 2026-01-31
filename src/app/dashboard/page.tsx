import { createClient } from '@/utils/supabase/server';
import { Trophy, Shield, Activity, Star, Globe, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import QuickLogWidget from './quick-log-widget';
import PendingRecommendationsWidget from './pending-recommendations-widget';
import ProfileCompletionWidget from '@/components/dashboard/ProfileCompletionWidget';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

    // Fetch Founder Status
    const { data: founderRole } = await supabase
        .from('roles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('role', 'Founder')
        .single();

    const isFounder = !!founderRole || profile?.role?.toLowerCase() === 'founder';

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name?.split(' ')[0] || 'Racer'}.</h1>
                <p className="text-neutral-400">Here is your GridPass overview.</p>
            </div>

            {/* Founder Status Card */}
            {isFounder ? (
                <div className="bg-gradient-to-r from-amber-900/20 to-neutral-900 border border-amber-500/30 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-widest mb-4">
                                <Star className="w-3 h-3 fill-amber-500" />
                                Active Status
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1">Founding Member</h2>
                            <p className="text-amber-200/60 text-sm">Your lifetime access is active.</p>
                        </div>
                        <Shield className="w-12 h-12 text-amber-500 opacity-80" />
                    </div>
                </div>
            ) : (
                <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
                    <h2 className="text-xl font-bold mb-2">Upgrade to Founder</h2>
                    <p className="text-neutral-400 text-sm mb-4">Secure lifetime access and support the development.</p>
                    <Link href="/founder/register" className="inline-block bg-white text-black px-4 py-2 rounded font-bold text-sm hover:bg-neutral-200">
                        Become a Founder
                    </Link>
                </div>
            )}

            {/* Pending Recommendations Alert */}
            <PendingRecommendationsWidget />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Actions */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Completion - Primary Call to Action */}
                    <ProfileCompletionWidget profile={profile} />

                    {/* Quick Log Widget */}
                    <div className="bg-neutral-900 border border-white/5 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Activity className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Quick Log</h3>
                                <p className="text-neutral-400 text-sm">Record a session or update your status.</p>
                            </div>
                        </div>
                        <QuickLogWidget />
                    </div>
                </div>

                {/* Right Column: Status & Info */}
                <div className="space-y-6">
                    {/* Pass Status */}
                    <div className="bg-neutral-900 p-6 rounded-xl border border-white/5">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                            <Clock className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h3 className="font-bold mb-1">GridPass Member</h3>
                        <p className="text-sm text-neutral-500 mb-4">
                            Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                        </p>
                        <div className="text-xs text-neutral-600 font-mono bg-black/20 p-2 rounded">
                            ID: {user?.id.substring(0, 8)}...
                        </div>
                    </div>

                    {/* View Public Page Link (Small) */}
                    {profile?.username && (
                        <Link href={`/u/${profile.username}`} target="_blank" className="block p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-center text-sm font-bold text-neutral-400 hover:text-white">
                            View Public Profile <ArrowRight className="w-3 h-3 inline ml-1" />
                        </Link>
                    )}
                </div>

            </div>
        </div>
    );
}
