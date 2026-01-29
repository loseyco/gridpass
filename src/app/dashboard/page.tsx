import { createClient } from '@/utils/supabase/server';
import { Trophy, Shield, Activity, Star, Globe, Clock } from 'lucide-react';
import Link from 'next/link';

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
        .from('gp_roles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('role_type', 'Founder')
        .single();

    const isFounder = !!founderRole;

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

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Profile Card */}
                <div className="bg-neutral-900 p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors group">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                        <Globe className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="font-bold mb-1">Public Profile</h3>
                    <p className="text-sm text-neutral-500 mb-4">Manage how you appear to others on GridPass.</p>
                    {profile?.username ? (
                        <Link href={`/u/${profile.username}`} className="text-indigo-400 text-sm font-bold hover:underline">
                            View Public Page &rarr;
                        </Link>
                    ) : (
                        <Link href="/dashboard/profile" className="text-indigo-400 text-sm font-bold hover:underline">
                            Setup Profile &rarr;
                        </Link>
                    )}
                </div>

                {/* Account Age */}
                <div className="bg-neutral-900 p-6 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                        <Clock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="font-bold mb-1">Pass Age</h3>
                    <p className="text-sm text-neutral-500">
                        Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
