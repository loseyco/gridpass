import Link from "next/link";
import {
    Activity,
    Zap,
    Globe,
    Shield,
    Smartphone,
    ArrowRight,
    LayoutDashboard,
    Cpu,
    Briefcase
} from "lucide-react";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Features - GridPass",
    description: "Explore the proprietary technology behind the GridPass Global ID system. From Realtime Telemetry to AI-Powered Resumes.",
};

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30 pb-24">

            {/* Header */}
            <div className="pt-24 px-6 max-w-5xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 mb-8 uppercase tracking-widest">
                    System Architecture
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
                    BUILT FOR <span className="text-indigo-500">SPEED</span>.
                </h1>
                <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                    GridPass isn't just a database. It's a high-performance operating system connecting your simulator, your career, and your team in realtime.
                </p>
            </div>

            {/* Feature Grid */}
            <div className="px-6 max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* FEATURE 1: COMMAND CENTER */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-40 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-all"></div>

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                        <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                            <Activity className="w-10 h-10" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                Command Center
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                                    Live
                                </span>
                            </h3>
                            <p className="text-neutral-400 mb-6 leading-relaxed">
                                Connect your simulator to the cloud with the desktop agent. Broadcast telemetry payload from iRacing directly to your dashboard with <strong>zero-latency WebSocket technology</strong>.
                            </p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-neutral-300 mb-8">
                                <li className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-500" /> Realtime RPM & Speed
                                </li>
                                <li className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-blue-500" /> Remote PC Control
                                </li>
                                <li className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-emerald-500" /> Cloud-Based Dashboard
                                </li>
                                <li className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-purple-500" /> Secure Handshake
                                </li>
                            </ul>
                            <Link href="/command-center" className="inline-flex items-center gap-2 bg-white text-neutral-950 px-6 py-3 rounded-xl font-bold hover:bg-neutral-200 transition-colors">
                                Launch Command Center <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* FEATURE 2: RESUME BUILDER */}
                <div className="col-span-1 lg:col-span-1 bg-neutral-900 p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-pink-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-32 bg-pink-500/5 blur-[60px] rounded-full group-hover:bg-pink-500/10 transition-all"></div>
                    <Briefcase className="w-10 h-10 text-pink-500 mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">Resume Builder</h3>
                    <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                        Stop using Word docs. Your GridPass profile automatically generates a pro-grade racing resume with your latest stats and verified wins.
                    </p>
                    <div className="flex items-center gap-2 text-pink-400 text-sm font-bold">
                        AI-Powered Optimization <Zap className="w-4 h-4" />
                    </div>
                </div>

                {/* FEATURE 3: SHOP OS */}
                <div className="col-span-1 bg-neutral-900 p-8 rounded-3xl border border-white/5 relative overflow-hidden opacity-80">
                    <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                        <span className="bg-neutral-900/90 text-neutral-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 shadow-lg">Coming Soon</span>
                    </div>
                    <LayoutDashboard className="w-10 h-10 text-emerald-500 mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">Shop OS</h3>
                    <p className="text-neutral-400 text-sm mb-4 leading-relaxed">
                        Complete management for your race shop. Inventory, parts tracking, and prep lists.
                    </p>
                </div>

                {/* FEATURE 4: GLOBAL ID */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-neutral-900 p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="absolute top-0 left-0 p-32 bg-amber-500/5 blur-[60px] rounded-full group-hover:bg-amber-500/10 transition-all"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <Shield className="w-10 h-10 text-amber-500" />
                            <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                Core Technology
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">The Global ID</h3>
                        <p className="text-neutral-400 text-sm mb-6 max-w-xl leading-relaxed">
                            One verified identity that travels with you. From entry lists to medical forms, your GridPass ID authenticates you instantly across the entire racing ecosystem.
                        </p>
                    </div>
                </div>

            </div>

            <div className="mt-20 text-center">
                <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/25">
                    Start Building Your Profile <ArrowRight className="w-5 h-5" />
                </Link>
            </div>

        </div>
    );
}
