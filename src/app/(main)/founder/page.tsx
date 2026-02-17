
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ChevronRight, Check, Shield, Users, Trophy, Radio, Lightbulb, Zap, Lock, Map, Activity, Star } from 'lucide-react';
import { FounderCard } from '@/components/launch/FounderCard';
import { ShareButton } from '@/components/launch/ShareButton';
import { DonationCard } from '@/components/launch/DonationCard';
import { createClient } from '@/utils/supabase/server';
import LegalDisclaimer from './LegalDisclaimer';
import CategoryAccordion from './CategoryAccordion';

import { getFounderCount } from '@/utils/founders';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Become a Founding Member",
    description: "Secure Lifetime Access and verified status on GridPass. Limited spots available.",
    openGraph: {
        title: "Become a Founding Member of GridPass",
        description: "Secure Lifetime Access and verified status. Limited spots available.",
    }
};

export default async function FounderPage() {
    const { remaining, limit } = await getFounderCount();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch Features for Roadmap
    const { data: features } = await supabase.from('features').select('*').order('created_at', { ascending: false });

    // Group features by Category
    const categories: Record<string, any[]> = {};
    features?.forEach(f => {
        const cat = f.category || 'General';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(f);
    });

    // Custom Order
    const ORDER = ['Team Management', 'Racing Operations', 'Classifieds Marketplace', 'Shop Ops', 'Logistics', 'Financial', 'Documents', 'Internal Tools', 'Growth', 'General'];
    const sortedCategories = Object.keys(categories).sort((a, b) => {
        const idxA = ORDER.indexOf(a);
        const idxB = ORDER.indexOf(b);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    let isFounder = false;
    let founderNumber = null;
    let profile = null;

    if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        profile = p;
        if (profile?.role === 'founder') {
            isFounder = true;
            founderNumber = profile.founder_number;
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-amber-500/30">

            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-neutral-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="font-bold text-xl tracking-tighter flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 relative rounded flex items-center justify-center font-bold text-black overflow-hidden">
                            <Image
                                src="/logo-square.png"
                                alt="GridPass Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        GridPass <span className="text-amber-500 text-xs uppercase tracking-widest border border-amber-500/20 px-2 py-0.5 rounded-full bg-amber-500/10">Founder</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <ShareButton />
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in">
                        <Star className="w-3 h-3 fill-amber-500" />
                        Exclusive Invitation
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent leading-[0.9]">
                        THE UNIVERSAL <br /> OPERATING SYSTEM.
                    </h1>

                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                        We manage the <span className="text-white font-bold">Track</span> to the <span className="text-white font-bold">Shop</span> to the <span className="text-white font-bold">Simulator</span>.
                        <br />
                        <span className="text-amber-500 italic">"If it has an engine, GridPass manages it."</span>
                    </p>

                    {/* Dynamic Pricing / Founder Status */}
                    <div className="flex flex-col items-center justify-center gap-4 animate-fade-in-up">
                        {isFounder ? (
                            <div className="bg-gradient-to-b from-neutral-800 to-neutral-900 border border-amber-500/50 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl shadow-amber-900/20">
                                <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/40">
                                    <Trophy className="w-8 h-8 text-black" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Welcome Back, Founder.</h3>
                                <p className="text-amber-500 font-mono text-sm uppercase tracking-widest mb-6">
                                    {founderNumber ? `Founder Spot #${founderNumber}` : 'Verified Founding Member'}
                                </p>
                                <div className="p-4 bg-neutral-950/50 rounded-xl border border-white/5 text-sm text-neutral-400">
                                    Your support is building this platform. Access your founder benefits in the dashboard.
                                </div>
                                <Link href="/dashboard" className="block mt-6 w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors">
                                    Go to Dashboard
                                </Link>
                            </div>
                        ) : (
                            <FounderCard soldCount={100 - remaining} />
                        )}
                    </div>

                </div>

                {/* BG Effects */}
                <div className="absolute inset-0 -z-10 opacity-30">
                    <Image src="/hero-launch-generic.png" alt="Background" fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"></div>
                </div>
            </section>

            {/* The Pitch */}
            {/* The Pitch - REMOVED per user request */}

            {/* The Vision & Deal */}

            {/* The Vision & Deal */}
            <section className="py-24 bg-neutral-900 border-y border-white/5">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Built by Racers. Funded by Believers.</h2>
                        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                            GridPass is <span className="text-white font-bold">free to use</span> because the racing world needs a standard.
                            Our "A La Carte" model means you only pay for advanced power when you need it.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 mb-16">
                        {/* Why Free? */}
                        <div>
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Users className="w-6 h-6 text-indigo-500" />
                                The Open Standard
                            </h3>
                            <p className="text-neutral-400 leading-relaxed mb-6">
                                We believe basic tools shouldn't be paywalled. Whether you are a Shop, a Team, or a Sim Racer, the core OS is free.
                                We charge enterprise teams for storage and compute, not for access.
                            </p>
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                <p className="text-sm text-indigo-300 font-bold">
                                    "We need to raise capital to test these systems at scale. That's where you come in."
                                </p>
                            </div>
                        </div>

                        {/* Why Founder? */}
                        <div>
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Trophy className="w-6 h-6 text-amber-500" />
                                The Founder's Advantage
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex gap-4">
                                    <div className="mt-1">
                                        <Radio className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <strong className="text-white block">Beta Access & Input</strong>
                                        <p className="text-sm text-neutral-400">test new features before the public. Your feedback steers the roadmap.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="mt-1">
                                        <Lightbulb className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <strong className="text-white block">Voting Power</strong>
                                        <p className="text-sm text-neutral-400">Your voice carries more weight in feature requests. We build what Founders need.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="mt-1">
                                        <Shield className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <strong className="text-white block">Permanent Legacy</strong>
                                        <p className="text-sm text-neutral-400">Get the <span className="text-amber-500">Gold Trim</span> and your verified <span className="text-amber-500">Badge Number</span> forever. Prove you were here at the start.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Not Ready? Donate. */}
                    <div id="donate" className="max-w-xl mx-auto border-t border-white/5 pt-16 animate-fade-in">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-white mb-2">Not Ready for a Pass?</h3>
                            <p className="text-neutral-400 text-sm">You can still fuel the mission. 100% of contributions go to server costs.</p>
                        </div>
                        <div className="flex justify-center">
                            <DonationCard userEmail={user?.email} profile={profile} />
                        </div>
                    </div>

                </div>
            </section>

            {/* Live Roadmap */}
            <section className="py-24 bg-neutral-950 border-t border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-widest mb-4">
                            <Activity className="w-3 h-3" />
                            Live System Status
                        </div>
                        <h2 className="text-4xl font-bold mb-4">Built in Public. Verified by Code.</h2>
                        <p className="text-neutral-400 max-w-2xl mx-auto">
                            The GridPass ecosystem is massive. Explore the modules below.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {sortedCategories.map(cat => (
                            <CategoryAccordion key={cat} title={cat} features={categories[cat]} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center text-neutral-600 text-sm border-t border-white/5">
                <p>&copy; {new Date().getFullYear()} GridPass. All rights reserved.</p>
                <div className="flex justify-center gap-6 mt-4">
                    <Link href="/" className="hover:text-white transition-colors">Home</Link>
                    <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                </div>
                <div className="mt-8">
                    <LegalDisclaimer />
                </div>
            </footer>
        </div>
    );
}
