import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trophy, Users, Shield, Flag, ChevronRight } from "lucide-react";

export default function JoinPage() {
    return (
        <div className="min-h-screen bg-neutral-950 font-sans text-white selection:bg-indigo-500/30">

            {/* Background with Overlay */}
            <div className="fixed inset-0 z-0">
                <Image
                    src="/bg-join.png"
                    alt="Racetrack Background"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/40" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">

                {/* Header */}
                <header className="p-6 flex justify-center">
                    <div className="relative w-40 h-10 opacity-90">
                        <Image
                            src="/logo-text.png"
                            alt="GridPass"
                            fill
                            className="object-contain"
                        />
                    </div>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-lg mx-auto space-y-10 pb-12">

                    {/* Hero Text */}
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">Live Beta</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-2xl">
                            JOIN THE<br />GRID.
                        </h1>
                        <p className="text-lg text-neutral-400 font-medium max-w-xs mx-auto leading-relaxed">
                            The premium digital identity for the modern motorsport era.
                        </p>
                    </div>

                    {/* Cards Stack */}
                    <div className="w-full space-y-4">

                        {/* 1. Founder Card (Premium) */}
                        <Link
                            href="/founder/register"
                            className="group relative block w-full"
                        >
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-red-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-500"></div>
                            <div className="relative flex items-center justify-between p-6 bg-neutral-900 rounded-2xl border border-white/10 hover:bg-neutral-800/90 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-red-600 flex items-center justify-center shadow-lg shadow-amber-900/40">
                                        <Shield className="w-6 h-6 text-white fill-white/20" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-0.5">Limited Access</div>
                                        <h3 className="text-xl font-bold text-white">Founding 50</h3>
                                        <p className="text-neutral-400 text-xs">Lifetime Membership + Badge</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>

                        {/* 2. Driver Card (Standard) */}
                        <Link
                            href="/register"
                            className="group block w-full"
                        >
                            <div className="flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 hover:border-white/20 backdrop-blur-sm transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center border border-white/5">
                                        <Users className="w-6 h-6 text-neutral-300" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-0.5">Free Account</div>
                                        <h3 className="text-lg font-bold text-white">Driver Profile</h3>
                                        <p className="text-neutral-400 text-xs">Track stats & build career</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>

                    </div>

                    {/* Footer / Login */}
                    <div className="space-y-6 text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                            Already a member? <span className="font-bold text-white underline decoration-neutral-700 underline-offset-4">Log in</span>
                        </Link>

                        <div className="flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                            {/* Fake Partner Logos for Social Proof Aesthetic */}
                            <div className="h-4 w-12 bg-white/20 rounded-sm"></div>
                            <div className="h-5 w-16 bg-white/20 rounded-sm"></div>
                            <div className="h-3 w-10 bg-white/20 rounded-sm"></div>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
