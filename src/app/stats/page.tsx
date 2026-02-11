
import { getPublicStats } from '@/app/actions/get-public-stats';
import { Metadata } from 'next';
import Link from 'next/link';
import { Users, Briefcase, ShoppingBag, Flag, Wrench, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Platform Stats | GridPass",
    description: "Real-time metrics for the GridPass platform.",
};

export default async function StatsPage() {
    const stats = await getPublicStats();

    const metrics = [
        {
            label: 'Drivers & Crew',
            value: stats.users,
            icon: Users,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20'
        },
        {
            label: 'Race Teams',
            value: stats.teams,
            icon: Flag,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20'
        },
        {
            label: 'Active Jobs',
            value: stats.jobs,
            icon: Briefcase,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20'
        },
        {
            label: 'Classifieds',
            value: stats.classifieds,
            icon: ShoppingBag,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20'
        },
        {
            label: 'Services Available',
            value: stats.services,
            icon: Wrench,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/20'
        }
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans overflow-hidden relative">

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
            <div className="absolute top-20 right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto px-6 py-24 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                        The Grid by the Numbers
                    </h1>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                        GridPass is the fastest growing network in sim racing. Here is the real-time scale of our ecosystem.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
                    {metrics.map((metric, index) => (
                        <div
                            key={metric.label}
                            className={`p-8 rounded-2xl border ${metric.border} ${metric.bg} backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <metric.icon className={`w-8 h-8 ${metric.color}`} />
                                <span className="text-4xl font-bold text-white tracking-tight">
                                    {metric.value.toLocaleString()}
                                </span>
                            </div>
                            <h3 className="text-lg font-medium text-neutral-300 group-hover:text-white transition-colors">
                                {metric.label}
                            </h3>

                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <div className="inline-block p-[2px] rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500">
                        <Link
                            href="/join"
                            className="block px-8 py-4 bg-neutral-950 rounded-full text-white font-bold hover:bg-neutral-900 transition-colors flex items-center gap-2 group"
                        >
                            Join the Grid
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
