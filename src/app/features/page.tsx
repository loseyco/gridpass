'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  QrCode, 
  Car, 
  Coins, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  MapPin, 
  Activity, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Database,
  Lock,
  Layers,
  Gauge
} from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  const [activeSegment, setActiveSegment] = useState<'members' | 'tracks' | 'swarm'>('members');

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden flex flex-col pt-24">
      {/* Ambient background glows */}
      <div className="mesh-glow" />

      <Navbar />

      <section className="relative max-w-7xl mx-auto px-6 py-12 flex-1 z-10 w-full space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            Gridpass Ecosystem Modules
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Connected Vehicles.<br />
            <span className="text-gradient">Automated Venues.</span>
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg font-medium leading-relaxed">
            Discover the unified visual platform transforming physical enthusiast vehicles into connected digital profiles with integrated payment gates, digital garages, and automated operations.
          </p>
        </div>

        {/* Feature Grid: 2x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: Rugged QR Tags */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5 border-neutral-800 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">Physical QR Window Stickers</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                High-durability holographic window decals that act as direct portal keys. Dynamic redirect parameters bridge physical cars to digital wallets, access portals, and maintenance logs in one scan.
              </p>
            </div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider bg-neutral-950 border border-neutral-900 px-3 py-1 rounded-full w-fit">
              Holographic Tag Bridging
            </div>
          </div>

          {/* Card 2: Digital Garages */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5 border-neutral-800 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Car className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">Digital Vehicle Garages</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Comprehensive profile databases. Track modifications, engine specs, dyno graphs, and track safety logs. Tag scans display safety approvals instantly, saving hours during morning track check-ins.
              </p>
            </div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider bg-neutral-950 border border-neutral-900 px-3 py-1 rounded-full w-fit">
              Lifetime Records Store
            </div>
          </div>

          {/* Card 3: Split Payments Connect */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5 border-neutral-800 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Coins className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white group-hover:text-purple-400 transition-colors flex items-center gap-2">
                Stripe Connected split Payouts
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">Coming Soon</span>
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Autonomous ticketing splits. Racetracks and trail networks deploy Stripe Express onboarding to sell Day Passes at the gate. Admissions automatically divide, sending 90% direct to the venue.
              </p>
            </div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider bg-neutral-950 border border-neutral-900 px-3 py-1 rounded-full w-fit">
              FinOps Automation
            </div>
          </div>

          {/* Card 4: Automated Operations Engine */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5 border-neutral-800 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors">Automated Operations Engine</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Integrated operational automations working under your governance. Manages leads, logs system activity, checks checkout routers, audits databases, and publishes logs seamlessly.
              </p>
            </div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider bg-neutral-950 border border-neutral-900 px-3 py-1 rounded-full w-fit">
              SaaS Automation
            </div>
          </div>

          {/* Card 5: Geolocation Resolver */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5 border-neutral-800 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors">Universal Scan Claim Onboarding</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Highly responsive gate routes (/join). Detects geolocation telemetry, parses scanning browser agents, logs entries to central databases, and claim-links physical stickers inline with zero friction.
              </p>
            </div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider bg-neutral-950 border border-neutral-900 px-3 py-1 rounded-full w-fit">
              Dynamic UX Resolver
            </div>
          </div>

          {/* Card 6: Hotfix Dispatch Queue */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5 border-neutral-800 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-500" />
            <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white group-hover:text-yellow-400 transition-colors">Continuous Feedback Dispatch</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Integrated customer hotfix portal (/feedback). Direct writing to Firestore&apos;s task queue. The system platform automatically queues feedback, flags visual issues, and helps process updates quickly.
              </p>
            </div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider bg-neutral-950 border border-neutral-900 px-3 py-1 rounded-full w-fit">
              Self-Healing Integration
            </div>
          </div>
        </div>

        {/* Interactive Showcase Tabs Panel */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border-neutral-800 space-y-8 bg-neutral-900/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight">Interactive Module Architectures</h3>
              <p className="text-xs text-neutral-500 font-medium">Toggle segments to preview live data schemas, gate scanners, and telemetry views.</p>
            </div>
            <div className="flex gap-2 bg-neutral-950 p-1 rounded-xl border border-neutral-900 w-fit">
              <button
                onClick={() => setActiveSegment('members')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeSegment === 'members' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Member Garage
              </button>
              <button
                onClick={() => setActiveSegment('tracks')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeSegment === 'tracks' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Track Gate Scanner (Coming Soon)
              </button>
              <button
                onClick={() => setActiveSegment('swarm')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeSegment === 'swarm' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Platform telemetry
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Column: Visual Mockup Displays */}
            <div className="flex justify-center">
              {activeSegment === 'members' && (
                <div className="w-full max-w-sm bg-[#040406] border border-neutral-900 rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-6">
                  {/* Decorative phone camera notch */}
                  <div className="w-24 h-4 bg-neutral-900 rounded-full mx-auto -mt-2 mb-4" />
                  
                  {/* Garage Header */}
                  <div className="flex items-center justify-between border-b border-neutral-900/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Digital Garage</h4>
                        <h3 className="text-sm font-black text-white">Porsche 911 GT3 RS</h3>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">ACTIVE PASSPORT</span>
                  </div>

                  {/* Vehicle Spec Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-900 space-y-0.5">
                      <span className="text-[9px] text-neutral-500 block uppercase font-bold tracking-wider">Horsepower</span>
                      <span className="text-white font-black flex items-center gap-1">518 HP <Gauge className="w-3 h-3 text-emerald-400" /></span>
                    </div>
                    <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-900 space-y-0.5">
                      <span className="text-[9px] text-neutral-500 block uppercase font-bold tracking-wider">Dyno Verified</span>
                      <span className="text-white font-black">465 lb-ft torque</span>
                    </div>
                    <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-900 space-y-0.5 col-span-2">
                      <span className="text-[9px] text-neutral-500 block uppercase font-bold tracking-wider">Gate Safety Waiver</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        SIGNED & VALID (Expires 12/26)
                      </span>
                    </div>
                  </div>

                  {/* Holographic QR Tag simulation */}
                  <div className="border-t border-neutral-900/60 pt-4 text-center space-y-2">
                    <span className="text-[9px] text-neutral-500 font-bold block uppercase tracking-wider">Linked physical decal id</span>
                    <div className="inline-flex items-center gap-2 bg-neutral-950 px-3.5 py-1.5 rounded-xl border border-neutral-900 text-[10px] font-mono text-neutral-400 select-all font-bold">
                      <QrCode className="w-3.5 h-3.5 text-neutral-500" />
                      GP-TAG-911-GT3-2026
                    </div>
                  </div>
                </div>
              )}

              {activeSegment === 'tracks' && (
                <div className="w-full max-w-sm bg-[#040406] border border-neutral-900 rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-6">
                  {/* Top notch decorative bar */}
                  <div className="w-24 h-4 bg-neutral-900 rounded-full mx-auto -mt-2 mb-4" />
                  
                  {/* Gate Scanner Header */}
                  <div className="flex items-center justify-between border-b border-neutral-900/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Gate check-in</h4>
                        <h3 className="text-sm font-black text-white">Laguna Seca Gate A</h3>
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  {/* Live admission split scan */}
                  <div className="bg-neutral-950/80 border border-neutral-900 rounded-2xl p-4 font-mono text-[11px] leading-relaxed text-indigo-300 space-y-2.5 shadow-inner">
                    <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                      <span className="text-neutral-500">TAG ID</span>
                      <span className="text-white font-bold">GP-TAG-911-GT3</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                      <span className="text-neutral-500">WAIVER STATUS</span>
                      <span className="text-emerald-400 font-bold">SIGNED (VERIFIED)</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                      <span className="text-neutral-500">ADMISSION TICKET</span>
                      <span className="text-white font-bold">Track Day Pass</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-neutral-500">STRIPE SPLIT</span>
                      <span className="text-emerald-400 font-bold">$27.00 Track / $2.99 Fee</span>
                    </div>
                  </div>

                  {/* Scan CTA button status */}
                  <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                    ACCESS APPROVED (SCAN COMPLETE)
                  </button>
                </div>
              )}

              {activeSegment === 'swarm' && (
                <div className="w-full max-w-sm bg-[#040406] border border-neutral-900 rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-6">
                  {/* Top notch bar */}
                  <div className="w-24 h-4 bg-neutral-900 rounded-full mx-auto -mt-2 mb-4" />
                  
                  {/* Telemetry Header */}
                  <div className="flex items-center justify-between border-b border-neutral-900/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Cpu className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Platform telemetry</h4>
                        <h3 className="text-sm font-black text-white">System Iteration 6</h3>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">LIVE</span>
                  </div>

                  {/* Simulated terminal lines */}
                  <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 font-mono text-[9px] text-neutral-400 space-y-1.5 h-36 overflow-hidden flex flex-col justify-end">
                    <div>[10:32:00] [SCHEDULER-CRON] ACTIVE System Iteration 6 heartbeats...</div>
                    <div className="text-blue-400">[10:32:02] [LEAD-ENGINE] indexing leads.csv directory: verified 52 leads.</div>
                    <div className="text-purple-400">[10:32:45] [DATASYNC] hard_check_rules: Auth cookie encryption rules verified secure.</div>
                    <div className="text-cyan-400">[10:32:53] [COMPILER] compiling static paths for /features page...</div>
                    <div className="text-emerald-400">[10:32:54] [SYS-MONITOR] Telemetry clean: 100% liveness check nominal.</div>
                  </div>

                  {/* Active metric display */}
                  <div className="grid grid-cols-2 gap-3 text-center text-xs">
                    <div className="bg-neutral-900/50 p-2.5 border border-neutral-900 rounded-xl space-y-0.5">
                      <span className="text-[8px] text-neutral-500 font-bold block uppercase tracking-wider">Active Services</span>
                      <span className="text-white font-black">4 Online</span>
                    </div>
                    <div className="bg-neutral-900/50 p-2.5 border border-neutral-900 rounded-xl space-y-0.5">
                      <span className="text-[8px] text-neutral-500 font-bold block uppercase tracking-wider">Firestore dispatch</span>
                      <span className="text-emerald-400 font-black">0 Errors</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Architectural Highlights Description */}
            <div className="space-y-6">
              {activeSegment === 'members' && (
                <div className="space-y-5">
                  <h4 className="text-2xl font-black text-white">Digital Vehicle Garage passports</h4>
                  <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                    Gridpass provides car enthusiasts with a premium digital hub to present their vehicles, performance specifications, and signed waivers in one place. 
                  </p>
                  
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-blue-400 shrink-0 font-bold text-xs">
                        ✓
                      </div>
                      <div className="text-xs text-neutral-300">
                        <span className="font-bold text-white block">Specs & Dyno Sheets</span>
                        Log verified horsepower ratings, modifications list, and engine setups visible to anyone scanning the vehicle.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-blue-400 shrink-0 font-bold text-xs">
                        ✓
                      </div>
                      <div className="text-xs text-neutral-300">
                        <span className="font-bold text-white block">Digital Gate Admission & Passes</span>
                        Buy admissions tickets, store track gate passes directly in your secure wallet, and verify access codes.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-blue-400 shrink-0 font-bold text-xs">
                        ✓
                      </div>
                      <div className="text-xs text-neutral-300">
                        <span className="font-bold text-white block">Signed waivers validation</span>
                        Verify active track rules and safety waivers online, speeding up event entry checkpoints significantly.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSegment === 'tracks' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-2xl font-black text-white">Automated admissions & Gate check-ins</h4>
                    <span className="text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-black uppercase px-2.5 py-1 rounded-full tracking-widest shadow-md">COMING SOON</span>
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                    We empower tracks and organizers to eliminate paperwork bottlenecks, automate gate scans, and collect admissions instantly at the gate using zero proprietary hardware.
                  </p>
                  
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-purple-400 shrink-0 font-bold text-xs">
                        ✓
                      </div>
                      <div className="text-xs text-neutral-300">
                        <span className="font-bold text-white block">Use Standard Phones & Tablets as Scanners</span>
                        No expensive custom barcode readers or specialized gate scanners required. Any mobile device or tablet acts as a scanner instantly in the field.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-purple-400 shrink-0 font-bold text-xs">
                        ✓
                      </div>
                      <div className="text-xs text-neutral-300">
                        <span className="font-bold text-white block">Print QR Codes on Banners, signs, or Sheets</span>
                        Need a big sign? Print your check-in QR codes onto massive gate banners, paddock flyers, windshield cards, or wristbands so drivers can scan themselves.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-purple-400 shrink-0 font-bold text-xs">
                        ✓
                      </div>
                      <div className="text-xs text-neutral-300">
                        <span className="font-bold text-white block">Stripe Connected Instant split Payouts</span>
                        Connect bank details in 2 minutes via Stripe Express. When drivers and spectators check in and pay admissions, funds split and land in your account immediately.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSegment === 'swarm' && (
                <div className="space-y-5">
                  <h4 className="text-2xl font-black text-white">Self-sustaining automated services</h4>
                  <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                    Gridpass is operated under your governance by specialized, cooperative automated processes, maintaining lead generation and system hotfixes on autopilot.
                  </p>
                  
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-cyan-400 shrink-0 font-bold text-xs">
                        ✓
                      </div>
                      <div className="text-xs text-neutral-300">
                        <span className="font-bold text-white block">Automated Lead Indexing</span>
                        The background manager sweeps mapping indices for tracks, clubs, and venues, populating `leads.csv` contact rosters continuously.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-cyan-400 shrink-0 font-bold text-xs">
                        ✓
                      </div>
                      <div className="text-xs text-neutral-300">
                        <span className="font-bold text-white block">Self-healing Firestore Hotfixes</span>
                        The logging service listens to the feedback queue. Product changes, bug fixes, or layout optimizations are logged and executed automatically.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-cyan-400 shrink-0 font-bold text-xs">
                        ✓
                      </div>
                      <div className="text-xs text-neutral-300">
                        <span className="font-bold text-white block">100% Governance control</span>
                        You are the CEO. The platform executes operations automatically, but checks critical moves under your full dashboard control.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Call to action section */}
        <div className="glass-card p-8 rounded-3xl border-neutral-800 bg-neutral-950/40 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="text-2xl font-black text-white">Experience Gridpass today</h3>
            <p className="text-neutral-400 text-xs sm:text-sm font-medium leading-relaxed">
              Link physical window tags to dynamic digital profiles, sign track waivers instantly, or connect your venue to start selling split-admissions Day Passes at the gate.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link 
              href="/login" 
              className="btn-glow inline-flex items-center gap-2 px-8 py-4 bg-white text-neutral-950 font-bold rounded-2xl shadow-lg hover:bg-neutral-200 transition-all text-xs sm:text-sm uppercase tracking-wider"
            >
              Sign Up Inline
              <ArrowRight className="w-4 h-4 text-neutral-950" />
            </Link>
            <Link 
              href="/join" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold rounded-2xl transition-all text-xs sm:text-sm uppercase tracking-wider"
            >
              <QrCode className="w-4 h-4 text-blue-400" />
              Scan decald tag
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
