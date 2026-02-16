import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Trophy, Calendar, Flag, Shield, Zap } from 'lucide-react';

export default function LeagueLandingPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black">
            {/* Hero Section */}
            <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Background Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black z-10" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black z-0" />
                    {/* Placeholder for a cool racing video or image */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                </div>

                <div className="container relative z-20 px-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-cyan-400 text-sm font-medium mb-6 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        Season 1 Registration Open
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl">
                        GRIDPASS <span className="text-cyan-500 block md:inline">OFFICIAL</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                        The premium sim racing league ecosystem. Professional stewarding, broadcasted races, and a <span className="text-green-400 font-bold">$10,000</span> prize pool.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/league/join">
                            <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg px-8 py-6 h-auto rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all hover:scale-105">
                                Join Season 1
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="#schedule">
                            <Button variant="outline" size="lg" className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium text-lg px-8 py-6 h-auto rounded-xl backdrop-blur-sm">
                                View Schedule
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-black relative">
                <div className="container px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Shield className="h-8 w-8 text-cyan-500" />}
                            title="Pro Stewarding"
                            description="Fair racing guaranteed. Our dedicated stewards review all incidents post-race to ensure clean competition."
                        />
                        <FeatureCard
                            icon={<Zap className="h-8 w-8 text-purple-500" />}
                            title="Automated Scoring"
                            description="Instant results. Points, standings, and safety ratings are updated automatically the moment the checkered flag waves."
                        />
                        <FeatureCard
                            icon={<Trophy className="h-8 w-8 text-yellow-500" />}
                            title="Cash Prizes"
                            description="Race for real money. Top finishers in each division take home a share of the season's prize pool."
                        />
                    </div>
                </div>
            </section>

            {/* Schedule Preview */}
            <section id="schedule" className="py-24 bg-zinc-900/50 relative border-t border-white/5">
                <div className="container px-4">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-4xl font-bold mb-2">Season Calendar</h2>
                            <p className="text-gray-400">12 Rounds of intense competition across the world's best circuits.</p>
                        </div>
                        <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">Detailed Schedule &rarr;</Button>
                    </div>

                    <div className="grid gap-4">
                        {[
                            { round: 1, date: 'Feb 16, 2026', track: 'Daytona International Speedway', type: 'ROAD' },
                            { round: 2, date: 'Feb 23, 2026', track: 'Sebring International Raceway', type: 'ROAD' },
                            { round: 3, date: 'Mar 02, 2026', track: 'Circuit of the Americas', type: 'ROAD' },
                            { round: 4, date: 'Mar 09, 2026', track: 'Road Atlanta', type: 'ROAD' },
                        ].map((event) => (
                            <div key={event.round} className="group flex items-center bg-black/40 border border-white/5 p-6 rounded-2xl hover:border-cyan-500/30 transition-all hover:bg-white/5">
                                <div className="flex-shrink-0 w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center font-mono text-2xl font-bold text-zinc-500 group-hover:text-cyan-400 transition-colors">
                                    R{event.round}
                                </div>
                                <div className="ml-6 flex-grow">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold">Grand Prix of {event.track.split(' ')[0]}</h3>
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/10 text-white/60">{event.type}</span>
                                    </div>
                                    <p className="text-gray-400 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> {event.date} @ 8:00 PM EST
                                    </p>
                                </div>
                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary">Race Info</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="p-8 bg-zinc-900/50 border-white/5 backdrop-blur hover:bg-zinc-900 transition-colors group">
            <div className="mb-6 p-4 rounded-2xl bg-black w-fit group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-lg">
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed">
                {description}
            </p>
        </Card>
    );
}
