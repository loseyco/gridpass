import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, User, Star, Shield, Truck, Search, Wrench } from 'lucide-react';

export default async function PublicConciergePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const supabase = await createClient();

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (!profile) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-black text-white">
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden border-b border-neutral-900">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800/20 via-black to-black"></div>
                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <div className="flex justify-center mb-6">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name} className="w-24 h-24 rounded-full border-2 border-white/10" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-neutral-900 flex items-center justify-center border-2 border-white/10">
                                <User className="w-10 h-10 text-neutral-500" />
                            </div>
                        )}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
                        Automotive Management
                    </h1>
                    <p className="text-xl md:text-2xl text-neutral-400 font-light">
                        Curated by <span className="text-white font-medium">{profile.full_name || username}</span>
                    </p>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ServiceCard
                        icon={Search}
                        title="Sourcing & Acquisition"
                        description="Access to off-market vehicles, auction representation, and negotiation services for rare assets."
                    />
                    <ServiceCard
                        icon={Truck}
                        title="Global Logistics"
                        description="Secure transport, customs clearance, and delivery management for events and relocation."
                    />
                    <ServiceCard
                        icon={Wrench}
                        title="Fleet Maintenance"
                        description="Proactive service scheduling, restoration oversight, and detailing supervision."
                    />
                    <ServiceCard
                        icon={Shield}
                        title="Storage & Security"
                        description="Climate-controlled environment management and asset protection protocols."
                    />
                    <ServiceCard
                        icon={Star}
                        title="Event Concierge"
                        description="VIP access, transport, and management for Pebble Beach, Goodwood, and private track days."
                    />
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-neutral-900 border-y border-neutral-800 text-center px-6">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Elevate Your Collection</h2>
                    <p className="text-neutral-400 mb-8 text-lg">
                        Managing a collection shouldn't be a burden. Let us handle the details while you enjoy the drive.
                    </p>
                    <Link
                        href={`/contact?recipient=${username}&subject=Concierge%20Inquiry`} // Placeholder, could involve true messaging system later
                        className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform"
                    >
                        Inquire for Services
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>
        </main>
    );
}

function ServiceCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors">
            <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-6">
                <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-neutral-400 leading-relaxed">{description}</p>
        </div>
    );
}
