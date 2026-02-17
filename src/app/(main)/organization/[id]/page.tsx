
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { MapPin, Globe, Trophy, Wrench, Flag, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: org } = await supabase.from('organizations').select('name').eq('id', id).single();

    return {
        title: org ? `${org.name} | GridPass` : 'Organization Not Found',
    };
}

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !org) {
        notFound();
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'track': return <Flag className="w-8 h-8 text-indigo-500" />;
            case 'shop': return <Wrench className="w-8 h-8 text-indigo-500" />;
            case 'team': return <Trophy className="w-8 h-8 text-indigo-500" />;
            default: return <Globe className="w-8 h-8 text-neutral-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans pt-24 pb-12">
            <div className="max-w-5xl mx-auto px-6">

                {/* Header / Hero */}
                <div className="mb-12 bg-neutral-900/50 border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[80px] rounded-full"></div>

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                        <div className="p-6 bg-neutral-900 rounded-2xl border border-white/5 shadow-2xl">
                            {/* Logo or Default Icon */}
                            {org.logo_url ? (
                                <img src={org.logo_url} alt={org.name} className="w-24 h-24 object-contain" />
                            ) : (
                                getIcon(org.type)
                            )}
                        </div>

                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-neutral-400">
                                    {org.type}
                                </span>
                                {org.status === 'verified' && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                                        Verified
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-4">{org.name}</h1>

                            {org.description && (
                                <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed">
                                    {org.description}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 min-w-[200px]">
                            {org.website && (
                                <a
                                    href={org.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 transition-colors"
                                >
                                    <Globe className="w-4 h-4" />
                                    Visit Website
                                </a>
                            )}
                            <button className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-800 border border-white/10 text-white rounded-xl font-bold hover:bg-neutral-700 transition-colors">
                                Claim Page
                            </button>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Info Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-neutral-400" />
                                Location
                            </h3>
                            <p className="text-neutral-300">
                                {org.location || 'Location not listed'}
                            </p>
                            {/* Map placeholder or integration could go here */}
                        </div>

                        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4">Contact</h3>
                            <div className="space-y-3">
                                {org.contact_email && (
                                    <div className="flex items-center gap-3 text-neutral-400">
                                        <Mail className="w-4 h-4" />
                                        <a href={`mailto:${org.contact_email}`} className="hover:text-white transition-colors">{org.contact_email}</a>
                                    </div>
                                )}
                                {org.phone && (
                                    <div className="flex items-center gap-3 text-neutral-400">
                                        <Phone className="w-4 h-4" />
                                        <span>{org.phone}</span>
                                    </div>
                                )}
                                {!org.contact_email && !org.phone && (
                                    <p className="text-neutral-500 italic">No contact info available.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area (Notes, services, jobs, etc) */}
                    <div className="md:col-span-2 space-y-8">
                        {org.notes && (
                            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-8">
                                <h3 className="text-xl font-bold mb-4">Notes & Details</h3>
                                <p className="text-neutral-400 leading-relaxed whitespace-pre-wrap">
                                    {org.notes}
                                </p>
                            </div>
                        )}

                        {/* Placeholder for future sections */}
                        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center py-16">
                            <h3 className="text-xl font-bold mb-2">Jobs & Opportunities</h3>
                            <p className="text-neutral-500 max-w-md mb-6">
                                No active job listings or side work opportunities posted yet.
                            </p>
                            <Link href="/network" className="text-indigo-400 font-bold hover:underline">
                                Back to Network
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
