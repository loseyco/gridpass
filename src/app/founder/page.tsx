
import Link from 'next/link';
import Image from 'next/image';
import { Shield, CreditCard, ChevronRight, Zap, Star, Activity, Lock, Map, Wrench, Terminal, Database } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import LegalDisclaimer from './LegalDisclaimer';
import CategoryAccordion from './CategoryAccordion';

import { getFounderCount } from '@/utils/founders';

export default async function FounderPage() {
    const { remaining, limit } = await getFounderCount();

    const supabase = await createClient();
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

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-amber-500/30">

            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-neutral-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="font-bold text-xl tracking-tighter flex items-center gap-2">
                        <div className="w-8 h-8 relative rounded flex items-center justify-center font-bold text-black overflow-hidden">
                            <Image
                                src="/logo-square.png"
                                alt="GridPass Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        GridPass <span className="text-amber-500 text-xs uppercase tracking-widest border border-amber-500/20 px-2 py-0.5 rounded-full bg-amber-500/10">Founder</span>
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

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                        THE DIGITAL <br /> TRUTH.
                    </h1>

                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                        We are building the <span className="text-white font-bold">Single Source of Truth</span> for the automotive world.
                        <br />
                        <span className="text-amber-500 italic">"If it's not in GridPass, it didn't happen."</span>
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link href="/founder/register" className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-4 rounded-lg font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]">
                            <CreditCard className="w-5 h-5" />
                            Secure Lifetime Access ($1,500)
                        </Link>
                    </div>
                    <p className="mt-4 text-xs text-neutral-500 uppercase tracking-widest font-bold">
                        Only <span className="text-white">{remaining}</span> of {limit} Spots Remaining
                    </p>
                </div>

                {/* BG Effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
            </section>

            {/* The Pitch */}
            <section className="py-24 border-t border-white/5 bg-neutral-900/50">
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-6">The Operating System for Speed.</h2>
                        <p className="text-neutral-400 mb-8 leading-relaxed">
                            Spreadsheets are where data goes to die. GridPass is where data comes to life.
                            <br /><br />
                            A unified ecosystem for teams, shops, tracks, and energetic drivers. From **Crew Payroll** to **Tire Banking**, everything interacts in real-time.
                        </p>

                        <div className="space-y-4">
                            {[
                                "Verifiable Setup & Maintenance History",
                                "Digital Crew Logistics & Waivers",
                                "Shop Inventory & Part Tracking",
                                "Automated Job Listings & Hiring"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <ChevronRight className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <span className="font-medium text-neutral-200">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mockup */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-700 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative bg-neutral-950 border border-white/10 rounded-xl p-6 shadow-2xl">
                            {/* Fake UI */}
                            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-neutral-800" />
                                    <div>
                                        <div className="font-bold">Typescript Racing</div>
                                        <div className="text-xs text-neutral-500">Porsche 911 GT3 R</div>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                                    Ready to Race
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-neutral-900 p-3 rounded border border-white/5 text-center">
                                    <div className="text-xs text-neutral-500 uppercase">Engine</div>
                                    <div className="font-bold text-lg">94%</div>
                                </div>
                                <div className="bg-neutral-900 p-3 rounded border border-white/5 text-center">
                                    <div className="text-xs text-neutral-500 uppercase">Tires</div>
                                    <div className="font-bold text-lg">New</div>
                                </div>
                                <div className="bg-neutral-900 p-3 rounded border border-white/5 text-center">
                                    <div className="text-xs text-neutral-500 uppercase">Fuel</div>
                                    <div className="font-bold text-lg">110L</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 w-3/4" />
                                </div>
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-neutral-500 font-mono">
                                <span>Prep Progress</span>
                                <span>75%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Offer - MOVED UP */}
            <section className="py-24 px-6 relative">
                <div className="max-w-3xl mx-auto border border-amber-500/30 bg-gradient-to-b from-amber-900/20 to-neutral-950 p-12 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Shield className="w-64 h-64 rotate-12" />
                    </div>

                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-bold mb-2">The Founding Member Pass</h2>
                        <div className="text-amber-500 font-mono text-sm mb-8">LIMITED EDITION • 50 UNITS ONLY</div>

                        <div className="text-5xl font-black mb-2">$1,500 <span className="text-lg font-normal text-neutral-400">/ one-time</span></div>
                        <p className="text-neutral-400 text-sm mb-8">Standard Price will be $600/year. You pay once, forever.</p>

                        <ul className="text-left max-w-md mx-auto space-y-4 mb-10">
                            <li className="flex items-start gap-3">
                                <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-white">Lifetime Pro Access</span>
                                    <p className="text-sm text-neutral-400">Never pay a monthly subscription fee. Ever.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-white">Founding Member Status</span>
                                    <p className="text-sm text-neutral-400">Gold "Founder" Badge on your profile. Verified Status.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Activity className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-white">Advisory Council Seat</span>
                                    <p className="text-sm text-neutral-400">Direct line to the dev team. Vote on the roadmap.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Map className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-white">Priority On-Site Optimization</span>
                                    <p className="text-sm text-neutral-400">Request PJ (Founder) to fly out and optimize your workflow in person.</p>
                                </div>
                            </li>
                        </ul>

                        <Link href="/founder/register" className="w-full bg-white hover:bg-neutral-200 text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4" />
                            Claim Spot
                        </Link>
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
