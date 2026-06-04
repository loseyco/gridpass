'use client';

import Link from 'next/link';
import { ArrowRight, QrCode, ShieldCheck, Activity } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden selection:bg-blue-500/30">
      {/* Dynamic ambient background glow */}
      <div className="mesh-glow" />

      {/* Navigation header */}
      <Navbar />


      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden max-w-5xl mx-auto text-center space-y-8 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
          <span className="flex h-2 w-2 rounded-full bg-[#bd2925] animate-pulse" />
          Gridpass Engine is Online
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[1.05]">
          One Tag.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#bd2925] via-rose-500 to-[#bd2925]">
            Infinite Possibilities.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed font-medium">
          GridPass lets you scan a sticker on any car, boat, or bike to see its service history, mods, and owner details on the spot. For less than the price of a cup of coffee or a Monster Energy drink per month ($1.99/mo), a single, permanent QR code acts as the universal key for check-ins, trail passes, and instant ownership transfers to give your rig a permanent, verified digital identity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/pricing" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#bd2925] hover:bg-[#bd2925]/90 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md shadow-[#bd2925]/20 text-lg">
            Get Your Dynamic Gridpass Tag <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/scan" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white px-8 py-4 rounded-xl font-bold transition-all text-lg">
            Scan & Claim Tag
          </Link>
        </div>

        <div className="pt-8 flex flex-col items-center gap-6 max-w-md mx-auto w-full">
          <Link href="/u/pjlosey" className="group block w-full glass-card p-6 rounded-3xl border-red-500/10 hover:border-[#bd2925]/30 bg-neutral-950/40 transition-all text-left relative overflow-hidden">
            {/* Ambient subtle glow hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#bd2925]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="flex items-start gap-4">
              {/* Avatar placeholder with wrench icon */}
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
                  Founder of GridPass. From Engines to Protons, if it has an engine or motor, I&apos;m involved.
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

          {/* Homepage Back the Cause card */}
          <div className="w-full glass-card p-6 rounded-3xl border-yellow-500/10 bg-neutral-950/40 text-left relative overflow-hidden space-y-4">
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full" />
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wider">Back the Cause</span>
            </div>
            <h3 className="text-lg font-black text-white uppercase">Become an Original Supporter</h3>
            <p className="text-xs text-neutral-450 leading-relaxed">
              Gridpass is crowdfunded by the automotive and racing community. Back the project today to secure a lifetime **Original Supporter badge** and a **glowing HSL gold avatar border** for your profiles.
            </p>
            <div className="flex justify-between items-center pt-2">
              <Link href="/login?redirect=/dash" className="btn-glow px-5 py-2.5 bg-yellow-500 hover:bg-yellow-450 text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1">
                Back Gridpass <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">Tiers from $5</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid props */}
      <section className="py-24 bg-[#040406] border-t border-neutral-900 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">How the Network Works</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto font-medium">The physical GridPass tag stays with the unit forever. The digital context dynamically adapts to whoever scans it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-[#bd2925]/10 border border-[#bd2925]/20 rounded-xl flex items-center justify-center text-[#bd2925]">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Zero-Hardware Decal ID</h3>
              <p className="text-neutral-400 leading-relaxed text-sm">
                Affix your permanent tag to your chassis, windshield, or roll bar—or print trackside codes onto large entry signs, banners, or wristbands. Standard smartphones and tablets act as scanners. Absolutely no custom hardware needed.
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Verified Service Logs</h3>
              <p className="text-neutral-400 leading-relaxed text-sm">
                Authorize mechanics and tracks to record tamper-proof maintenance logs, safety passes, or time slips. The next buyer sees a transparent, dealer-backed history, maximizing resale value.
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-[#bd2925]/10 border border-[#bd2925]/20 rounded-xl flex items-center justify-center text-[#bd2925]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Easy QR Routing & Links</h3>
              <p className="text-neutral-400 leading-relaxed text-sm">
                Your physical sticker is a permanent, flexible dynamic redirection asset. Instantly unlink and re-route it to any asset (car, boat, bike, dog collar) on the fly! For less than the price of a cup of coffee per month, securing your rig&apos;s verified digital identity is an absolute no-brainer. Plus, leverage our 30-second scan-to-activate onboarding loop to dynamically register new enthusiasts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

    </main>
  );
}
