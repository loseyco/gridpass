import Link from 'next/link';
import {
    Check,
    ArrowRight,
    Database,
    ClipboardCheck,
    Smartphone,
    BarChart3,
    Trophy,
    Infinity,
    Shield
} from 'lucide-react';
import { getPlatformStats } from '@/app/collections/actions';
import { createClient } from '@/utils/supabase/server';

export const metadata = {
    title: 'Collectors Edition | GridPass',
    description: 'Professional grade software for automotive collections, museums, and racing fleets. Track value, service history, and logistics in one digital vault.',
    openGraph: {
        title: 'Collectors Edition | GridPass',
        description: 'Professional grade software for automotive collections, museums, and racing fleets. Track value, service history, and logistics.',
        url: 'https://gridpass.app/collectors',
        siteName: 'GridPass',
        images: [
            {
                url: '/hero-launch-generic.png',
                width: 1200,
                height: 630,
                alt: 'GridPass Collectors Edition',
            },
        ],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Collectors Edition | GridPass',
        description: 'Professional grade software for automotive collections, museums, and racing fleets.',
        images: ['/hero-launch-generic.png'],
    },
};

export default async function CollectorsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const stats = await getPlatformStats();

    const mainCtaLink = user ? '/collections' : '/join';
    const mainCtaText = user ? 'Go to Collections' : 'Start Free Trial';

    // Format value (e.g. 1.2M, 450K)
    const formatValue = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M+`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}K+`;
        return `$${val}`;
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/50 to-black z-10"></div>
                    {/* Abstract tech background */}
                    <div className="absolute top-0 right-0 p-96 bg-indigo-600/10 blur-[150px] rounded-full"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-neutral-400 text-xs font-mono uppercase tracking-widest mb-8">
                        For Private Collectors & Fleets
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white mb-8 leading-tight">
                        MANAGE YOUR <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">COLLECTION.</span>
                    </h1>
                    <p className="text-xl text-neutral-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                        Don't let your assets rot in a spreadsheet. <br />
                        Track value, service history, and logistics in one digital vault.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href={mainCtaLink}
                            className="px-8 py-4 bg-white text-black font-bold text-sm uppercase tracking-widest rounded-full hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                        >
                            {mainCtaText}
                        </Link>
                        <Link
                            href="/u/pjlosey/services/8d17b905-9dc2-4a8c-8e0a-738f6584bfc8"
                            className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold text-sm uppercase tracking-widest rounded-full hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                        >
                            Hire a Manager
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="border-y border-white/5 bg-neutral-900/30 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex justify-center text-center">
                        <div>
                            <div className="text-3xl md:text-5xl font-black text-white mb-2">{stats.vehicleCount > 0 ? stats.vehicleCount : '1,200+'}</div>
                            <div className="text-sm uppercase tracking-widest text-neutral-500 font-bold">Vehicles Tracked</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-neutral-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Feature 1 */}
                        <div>
                            <div className="w-12 h-12 bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-400">
                                <Database className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Digital Provenance</h3>
                            <p className="text-neutral-400 leading-relaxed">
                                Create an immutable digital record for every chassis. Store build sheets,
                                restoration photos, auction results, and ownership history in one secure vault.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div>
                            <div className="w-12 h-12 bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-400">
                                <ClipboardCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Maintenance Tracking</h3>
                            <p className="text-neutral-400 leading-relaxed">
                                Never miss a service interval. Track fluid changes, component hours,
                                and restoration milestones. Assign tasks to mechanics and track completion.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div>
                            <div className="w-12 h-12 bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-400">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">QR Asset Tags</h3>
                            <p className="text-neutral-400 leading-relaxed">
                                Tag every vehicle with a durable QR code. Mechanics can scan to view
                                history or log new work instantly from their mobile device.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Concierge Service Highlight - "The Side Hustle" */}
            <section className="py-24 bg-neutral-900 border-y border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-64 bg-amber-500/5 blur-[120px] rounded-full"></div>
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-widest mb-6">
                            Concierge Services
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black italic mb-6 text-white">
                            NEED A HAND? <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500">WE'LL MANAGE IT FOR YOU.</span>
                        </h2>
                        <p className="text-xl text-neutral-400 mb-8 leading-relaxed">
                            Don't want to deal with the logistics? Our team of professional collection managers can handle everything from
                            transport coordination to maintenance scheduling.
                        </p>

                        <div className="mb-8 p-6 bg-indigo-900/20 border border-indigo-500/30 rounded-xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                            <div className="absolute top-0 right-0 p-12 bg-indigo-500/10 blur-xl rounded-full"></div>
                            <h3 className="text-indigo-400 font-bold mb-2 flex items-center gap-2 relative z-10">
                                <Trophy className="w-5 h-5" /> RACE TEAMS & FLEETS
                            </h3>
                            <p className="text-neutral-300 text-sm leading-relaxed relative z-10">
                                Built for the paddock. This software is the foundation of our upcoming
                                <span className="text-white font-bold"> Team Manager Suite</span>.
                                Track chassis mileage, component lifecycles, and setups today.
                            </p>
                        </div>

                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-3 text-lg text-neutral-300">
                                <Check className="w-5 h-5 text-amber-500" /> Remote Management & Advisory
                            </li>
                            <li className="flex items-center gap-3 text-lg text-neutral-300">
                                <Check className="w-5 h-5 text-amber-500" /> Auction Representation
                            </li>
                            <li className="flex items-center gap-3 text-lg text-neutral-300">
                                <Check className="w-5 h-5 text-amber-500" /> Logistics & Transport
                            </li>
                        </ul>
                        <Link
                            href="/u/pjlosey/services/8d17b905-9dc2-4a8c-8e0a-738f6584bfc8"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm uppercase tracking-widest rounded-full transition-colors shadow-lg shadow-amber-500/20"
                        >
                            Inquire About Management <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="relative">
                        <div className="bg-neutral-950 border border-white/10 rounded-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="w-full h-full bg-neutral-700 items-center justify-center flex text-xs font-bold text-neutral-500">PJ</div>
                                </div>
                                <div>
                                    <div className="font-bold text-white">PJ Losey</div>
                                    <div className="text-sm text-amber-500 font-mono">Head Concierge</div>
                                </div>
                            </div>
                            <p className="text-neutral-400 italic mb-6">
                                "Managing a fleet takes more than just software. It takes boots on the ground and experience.
                                Let me handle the headache so you can just drive."
                            </p>
                            <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 uppercase tracking-widest">
                                <Shield className="w-4 h-4" />
                                Verified Partner
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Pricing Section */}
            <section className="py-24 border-y border-white/5 bg-neutral-900/20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
                        <p className="text-neutral-400">Software-only plans. Concierge services quoted separately.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Free Tier */}
                        <div className="bg-neutral-900 rounded-2xl p-8 border border-white/5 flex flex-col">
                            <div className="mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 bg-neutral-800 px-2 py-1 rounded">Starter</span>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">$0</span>
                                <span className="text-neutral-500">/month</span>
                            </div>
                            <p className="text-neutral-400 mb-8 flex-1">Perfect for enthusiasts tracking their weekend toys.</p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm text-neutral-300">
                                    <Check className="w-4 h-4 text-neutral-500" /> Up to 5 Vehicles
                                </li>
                                <li className="flex items-center gap-3 text-sm text-neutral-300">
                                    <Check className="w-4 h-4 text-neutral-500" /> Basic Maintenance Logs
                                </li>
                                <li className="flex items-center gap-3 text-sm text-neutral-300">
                                    <Check className="w-4 h-4 text-neutral-500" /> Public Profile
                                </li>
                            </ul>
                            <Link href={mainCtaLink} className="block w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold text-center transition-colors">
                                {user ? 'View Dashboard' : 'Get Started'}
                            </Link>
                        </div>

                        {/* Founder Tier */}
                        <div className="bg-neutral-900 rounded-2xl p-8 border border-amber-500/30 relative flex flex-col transform md:-translate-y-4 shadow-2xl shadow-amber-900/10">
                            <div className="absolute top-0 right-0 p-3">
                                <Trophy className="w-6 h-6 text-amber-500" />
                            </div>
                            <div className="mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">Founder</span>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">$249</span>
                                <span className="text-neutral-500">/one-time</span>
                            </div>
                            <p className="text-amber-200/80 mb-8 flex-1">Lifetime access for early believers. Best value.</p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm text-white font-bold">
                                    <Infinity className="w-4 h-4 text-amber-500" /> Unlimited Vehicles
                                </li>
                                <li className="flex items-center gap-3 text-sm text-white">
                                    <Check className="w-4 h-4 text-amber-500" /> Priority Support
                                </li>
                                <li className="flex items-center gap-3 text-sm text-white">
                                    <Check className="w-4 h-4 text-amber-500" /> Founder Badge
                                </li>
                                <li className="flex items-center gap-3 text-sm text-white">
                                    <Check className="w-4 h-4 text-amber-500" /> Early Feature Access
                                </li>
                            </ul>
                            <Link href="/founder" className="block w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black rounded-lg font-bold text-center transition-all shadow-lg shadow-amber-500/20">
                                Become a Founder
                            </Link>
                        </div>

                        {/* Enterprise Tier */}
                        <div className="bg-neutral-900 rounded-2xl p-8 border border-white/5 flex flex-col">
                            <div className="mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">Enterprise</span>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">Custom</span>
                            </div>
                            <p className="text-neutral-400 mb-8 flex-1">For museums, racing teams, and large collections.</p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm text-neutral-300">
                                    <Check className="w-4 h-4 text-indigo-500" /> Multi-User Team Access
                                </li>
                                <li className="flex items-center gap-3 text-sm text-neutral-300">
                                    <Check className="w-4 h-4 text-indigo-500" /> API Access
                                </li>
                                <li className="flex items-center gap-3 text-sm text-neutral-300">
                                    <Check className="w-4 h-4 text-indigo-500" /> Concierge Support
                                </li>
                                <li className="flex items-center gap-3 text-sm text-neutral-300">
                                    <Check className="w-4 h-4 text-indigo-500" /> Dedicated Account Mgr
                                </li>
                            </ul>
                            <Link href="mailto:sales@gridpass.app" className="block w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-bold text-center transition-colors">
                                Contact Sales
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-4xl font-bold mb-8">Professional Grade. <br />Built for Scale.</h2>
                        <ul className="space-y-6">
                            {[
                                "Museum-grade archiving standards",
                                "Valuation tracking and insurance reporting",
                                "Multi-user access rights (Owner, Manager, Mechanic)",
                                "Document management (Titles, registrations, COAs)",
                                "Private marketplace integration"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="mt-1 bg-green-500/10 p-1 rounded-full text-green-500">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className="text-lg text-neutral-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full"></div>
                        <div className="relative bg-neutral-900 border border-white/10 rounded-2xl p-8 aspect-square flex flex-col justify-center items-center text-center">
                            <BarChart3 className="w-24 h-24 text-indigo-500 mb-6 opacity-80" />
                            <h3 className="text-2xl font-bold text-white mb-2">Asset Value Analytics</h3>
                            <p className="text-neutral-500">Real-time portfolio valuation.</p>
                            <div className="mt-8 w-full h-32 bg-neutral-800/50 rounded-xl flex items-end justify-between px-4 pb-4 gap-2">
                                {[40, 60, 45, 70, 65, 85, 80].map((h, i) => (
                                    <div key={i} style={{ height: `${h}%` }} className="w-full bg-indigo-500/40 rounded-t-sm hover:bg-indigo-500 transition-colors"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 text-center bg-gradient-to-b from-black to-neutral-900">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-black italic mb-8">READY TO LEGITIMIZE YOUR OPERATION?</h2>
                    <p className="text-xl text-neutral-400 mb-10">
                        Join the private beta. Secure your spot in the future of collection management.
                    </p>
                    <Link
                        href={mainCtaLink}
                        className="inline-flex items-center gap-2 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg uppercase tracking-widest rounded-full transition-all hover:scale-105 shadow-xl shadow-indigo-500/20"
                    >
                        {user ? 'Manage Collections' : 'Get Founder Access'} <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
}

