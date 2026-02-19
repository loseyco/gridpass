
import { createClient } from '@/utils/supabase/server';
import { Briefcase, MapPin, Search, Star, ShieldCheck, Truck, Wrench, Plus, Home, Package } from 'lucide-react';
import Link from 'next/link';
import PostNeedButton from '@/components/network/PostNeedButton';

export const metadata = {
    title: 'The Network | GridPass',
    description: 'Find trusted motorsports professionals and services near you.'
};

export default async function ServicesPage() {
    const supabase = await createClient();

    // Fetch active gigs for "The Network" section
    const { data: gigs } = await supabase
        .from('os_gigs')
        .select('*')
        .eq('status', 'open')
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Hero / Search */}
            <div className="relative border-b border-white/10 bg-neutral-900/50">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-6">
                        THE <span className="text-blue-500">NETWORK</span>
                    </h1>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
                        The marketplace for motorsports. Hire trusted pros, find housing, or get a ride.
                    </p>

                    <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4 mb-8">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-3.5 h-5 w-5 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="What do you need? (e.g. Tire Specialist, Room at Sebring)"
                                className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex-1 relative">
                            <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Location (e.g. Charlotte, Indianapolis)"
                                className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-colors">
                            Search
                        </button>
                    </div>

                    <PostNeedButton />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-16">

                {/* Signature Services */}
                <div className="mb-20">
                    <div className="flex items-center gap-3 mb-8">
                        <ShieldCheck className="h-6 w-6 text-blue-500" />
                        <h2 className="text-2xl font-bold tracking-tight">SIGNATURE SERVICES</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 hover:bg-neutral-900 transition-colors p-8">
                            <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Verified
                            </div>
                            <Truck className="h-10 w-10 text-white mb-6 group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="text-xl font-bold mb-2">Logistics & Transport</h3>
                            <p className="text-neutral-400 mb-6">Professional hauling for cars, parts, and equipment. Licensed and insured carriers.</p>
                            <span className="text-blue-400 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                View Providers <Briefcase className="h-3 w-3" />
                            </span>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 hover:bg-neutral-900 transition-colors p-8">
                            <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Verified
                            </div>
                            <Wrench className="h-10 w-10 text-white mb-6 group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="text-xl font-bold mb-2">Paddock Works</h3>
                            <p className="text-neutral-400 mb-6">Turnkey garage management, setup help, and pit lane support for race weekends.</p>
                            <span className="text-blue-400 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                View Providers <Briefcase className="h-3 w-3" />
                            </span>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 hover:bg-neutral-900 transition-colors p-8">
                            <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Verified
                            </div>
                            <Star className="h-10 w-10 text-white mb-6 group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="text-xl font-bold mb-2">Driver Development</h3>
                            <p className="text-neutral-400 mb-6">Coaching, data analysis, and sim rig integration to shave tenths off your lap time.</p>
                            <span className="text-blue-400 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                View Providers <Briefcase className="h-3 w-3" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Live Gigs / Network */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <h2 className="text-2xl font-bold tracking-tight">LIVE NETWORK FEED</h2>
                        </div>
                        <Link href="/agency" className="text-sm text-neutral-400 hover:text-white transition-colors">
                            View All &rarr;
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gigs && gigs.length > 0 ? (
                            gigs.map(gig => (
                                <div key={gig.id} className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-white/20 transition-colors flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {gig.category === 'housing' && <Home size={16} className="text-purple-400" />}
                                            {gig.category === 'transport' && <Truck size={16} className="text-blue-400" />}
                                            {gig.category === 'parts' && <Package size={16} className="text-amber-400" />}
                                            {gig.category === 'equipment' && <Wrench size={16} className="text-cyan-400" />}
                                            {gig.category === 'personnel' && <Briefcase size={16} className="text-green-400" />}
                                            <span className="text-xs uppercase font-bold text-neutral-500">{gig.category}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {gig.duration_type === 'season' && (
                                                <div className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                                    SEASON
                                                </div>
                                            )}
                                            {gig.is_urgent && (
                                                <div className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 flex items-center gap-1">
                                                    URGENT
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-lg mb-1">{gig.title}</h3>
                                    <p className="text-sm text-neutral-300 mb-4 line-clamp-2">{gig.description || gig.role}</p>

                                    <div className="space-y-2 text-sm text-neutral-400 flex-grow">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            {gig.location || 'Remote/TBD'}
                                        </div>
                                        {/* <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" />
                                            {new Date(gig.start_date || gig.created_at).toLocaleDateString()}
                                        </div> */}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="font-medium text-white">
                                            {gig.daily_rate ? `${gig.currency} ${gig.daily_rate} / day` : (gig.budget_description || 'Negotiable')}
                                        </span>
                                        <button className="text-sm font-medium bg-white text-black px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors">
                                            Contact
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-neutral-500 border border-dashed border-white/10 rounded-xl">
                                No live gigs at the moment. Check back soon.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
