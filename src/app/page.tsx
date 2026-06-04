'use client';

import Link from 'next/link';
import { ArrowRight, QrCode, ShieldCheck, Activity, Heart } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden selection:bg-[#bd2925]/30 flex flex-col">
      {/* Carbon/Crimson ambient background glow */}
      <div className="mesh-glow" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden max-w-5xl mx-auto text-center space-y-8 z-10 flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
          <span className="flex h-2 w-2 rounded-full bg-[#bd2925] animate-pulse" />
          Gridpass Ecosystem Online
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[1.05] uppercase">
          One Tag.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#bd2925] via-rose-500 to-[#bd2925]">
            Infinite Rigs.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed font-medium">
          Gridpass lets you scan a sticker on any car, boat, or bike to see its service history, mods, and owner details on the spot. For less than the price of a Monster Energy drink per month ($1.99/mo), a single, permanent QR code acts as the universal key for check-ins, trail passes, and instant ownership transfers to give your rig a permanent, verified digital identity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full max-w-md">
          <Link href="/pricing" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#bd2925] hover:bg-[#bd2925]/90 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md shadow-[#bd2925]/20 text-lg btn-glow">
            Get Gridpass Tag <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/scan" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white px-8 py-4 rounded-xl font-bold transition-all text-lg">
            <QrCode className="w-5 h-5 text-rose-500" /> Scan Tag
          </Link>
        </div>

        <div className="pt-8 flex flex-col items-center gap-6 max-w-md mx-auto w-full">
          {/* Founder Live Profile Box */}
          <Link href="/u/pjlosey" className="group block w-full glass-card p-6 rounded-3xl border-red-500/10 hover:border-[#bd2925]/30 bg-neutral-950/40 transition-all text-left relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#bd2925]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#bd2925] to-rose-500 p-0.5 shadow-md shadow-[#bd2925]/10 shrink-0 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#09090d] flex items-center justify-center">
                  <span className="font-mono text-white text-xs font-black">PL</span>
                </div>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-[#bd2925] tracking-wider uppercase">Live Network Demo</span>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase flex items-center gap-1">
                    Verify Profile <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
                <h3 className="text-lg font-black text-white leading-tight">PJ LOSEY</h3>
                <p className="text-xs text-neutral-400 font-medium leading-normal line-clamp-2">
                  Founder of Gridpass. From IndyCar telemetry systems to Proton Therapy control boards, if it has an engine or runs on electric, I build it.
                </p>
                <div className="pt-2 flex items-center gap-4 text-[10px] font-mono text-neutral-500 font-bold">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Jeep Wrangler
                  </span>
                  <span>📍 Grayslake, IL</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Back the Cause Supporter Box */}
          <div className="w-full glass-card p-6 rounded-3xl border-yellow-500/10 bg-neutral-950/40 text-left relative overflow-hidden space-y-4">
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full" />
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-yellow-500 fill-yellow-500/10" />
              <span className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wider">Back the Cause</span>
            </div>
            <h3 className="text-lg font-black text-white uppercase">Become an Original Supporter</h3>
            <p className="text-xs text-neutral-405 leading-relaxed">
              Gridpass is crowdfunded by the automotive community. Back us today to secure a lifetime **Original Supporter badge** and a **glowing HSL gold avatar border** for your digital garage passport.
            </p>
            <div className="flex justify-between items-center pt-2">
              <Link href="/login?redirect=/dash" className="btn-glow px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1">
                Back Gridpass <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">Tiers from $5</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
