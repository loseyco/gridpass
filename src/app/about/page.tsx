'use client';

import Link from 'next/link';
import { ArrowRight, Activity, Cpu, Wrench, Sparkles, Layers, ShieldCheck, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function About() {
  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden selection:bg-blue-500/30">
      {/* Ambient background glow */}
      <div className="mesh-glow" />

      {/* Global Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-12 px-6 max-w-5xl mx-auto text-center space-y-6 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          The Pedigree Behind the Protocol
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white leading-tight">
          From Trackside Paddock to<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            The Motorsports OS
          </span>
        </h1>

        <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          GridPass wasn&apos;t conceived in a vacuum. It was forged in the heat of IndyCar paddocks, engineered through high-voltage proton therapy networks, and designed in dealership service bays. Meet the founder.
        </p>

        <div className="flex justify-center pt-2">
          <Link 
            href="/u/pjlosey" 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/10 text-sm"
          >
            Launch Telemetry Profile <Activity className="w-4 h-4 animate-pulse" />
          </Link>
        </div>
      </section>

      {/* The Story Section */}
      <section className="py-16 border-t border-neutral-900 px-6 relative z-10">
        <div className="max-w-4xl mx-auto space-y-16">
          
          {/* Section 1: Intro */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">The Mission</h3>
              <h2 className="text-2xl font-black text-white tracking-tight mt-2">Why GridPass?</h2>
            </div>
            <div className="md:col-span-8 text-neutral-400 text-base leading-relaxed space-y-4">
              <p>
                In professional racing, every component has an immutable lifespan, a telemetry trail, and a verified setup map. Yet, outside the professional paddock, the grassroots motorsport and automotive ecosystems remain fragmented by paper records, manual entry forms, and legacy billing systems.
              </p>
              <p>
                GridPass is built to close this loop. By transforming any physical vehicle—car, bike, boat, or plane—into a connected digital asset with a single, permanent windshield or roll-bar QR tag, we give grassroots tracks and local service centers access to the same calibre of digital architecture that professional race teams rely on.
              </p>
            </div>
          </div>

          {/* Section 2: Heritage Grid */}
          <div className="border-t border-neutral-900/60 pt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-white tracking-tight">The Founder&apos;s Track Record</h2>
              <p className="text-neutral-500 text-sm max-w-lg mx-auto mt-2">
                Decades of telemetry engineering, electrical design, and mechanical service operations experience packed into one cohesive platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 rounded-2xl border border-neutral-900 hover:border-neutral-800 space-y-4">
                <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">IndyCar Telemetry</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Calibrating and optimizing high-performance powerplants at **Honda Racing Corporation** and diagnosing chassis data in **Pi Toolbox** and **MoTeC** gives GridPass its telemetry-first structural DNA.
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-neutral-900 hover:border-neutral-800 space-y-4">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Mil-Spec Harnessing</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Designing Mil-Spec wiring harnesses and programming ECUs/PDMs teaches absolute reliability. GridPass applies this bulletproof engineering to its digital security layers.
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-neutral-900 hover:border-neutral-800 space-y-4">
                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Service Operations</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Managing dealership service bays and MECP custom systems informs our grassroots booking architecture. We know the day-to-day workflow friction local auto mechanics face.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Vision Pillars */}
          <div className="border-t border-neutral-900/60 pt-16 space-y-8">
            <h2 className="text-2xl font-black text-white tracking-tight text-center md:text-left">Engineered for the Whole Ecosystem</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-start bg-neutral-950/40 border border-neutral-900 p-6 rounded-2xl hover:border-neutral-800/80 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                  <span className="text-xs font-bold">01</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    High-Tier Track Gate Logistics
                    <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">Coming Soon</span>
                  </h4>
                  <p className="text-neutral-400 text-sm">
                    Professional track days receive high-contrast gate-pass interfaces designed for instant marshal identification under 100,000 lux pad-side sunlight glare.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-neutral-950/40 border border-neutral-900 p-6 rounded-2xl hover:border-neutral-800/80 transition-colors">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-1">
                  <span className="text-xs font-bold">02</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    Grassroots MX & Offroad Open Lands
                    <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">Coming Soon</span>
                  </h4>
                  <p className="text-neutral-400 text-sm">
                    Enabling family-owned trails (like Mercer County Motorsports Park) to deploy cashless entry gates and digitize offroad safety waivers—bypassing logjams and collecting entry fees directly to Stripe.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-neutral-950/40 border border-neutral-900 p-6 rounded-2xl hover:border-neutral-800/80 transition-colors">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
                  <span className="text-xs font-bold">03</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Local Service Shop Invoicing & Bookings</h4>
                  <p className="text-neutral-400 text-sm">
                    Providing local independent mechanics (like Viola Auto Care & Muffler) with booking deposit scheduling portals and pre-authorized diagnostic road-testing waivers to automate operations and capture revenue upfront.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Outro CTA */}
          <div className="glass-card p-8 rounded-3xl border border-neutral-900 text-center space-y-6 bg-gradient-to-br from-neutral-950 via-neutral-900/40 to-neutral-950">
            <Sparkles className="w-8 h-8 text-yellow-400 mx-auto animate-pulse" />
            <h3 className="text-2xl font-black text-white tracking-tight">Inspect the Calibration</h3>
            <p className="text-neutral-400 text-sm max-w-lg mx-auto">
              Want to see the full professional qualifications and trackside engineering portfolio of Patrick &quot;PJ&quot; Losey? Explore the live interactive telemetry resume profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/u/pjlosey" 
                className="bg-white hover:bg-neutral-200 text-neutral-950 px-6 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-1.5"
              >
                View Founder Telemetry Profile <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/features" 
                className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white px-6 py-3 rounded-xl font-bold transition-all text-sm"
              >
                Explore Platform Features
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Global Footer */}
      <Footer />
    </main>
  );
}
