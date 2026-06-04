'use client';

import Link from 'next/link';
import { 
  ArrowRight, QrCode, ShieldCheck, Activity, Heart, 
  Milestone, Printer, Building2, Flag, Eye, Check, Sparkles, HelpCircle 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  const roadmapPhases = [
    {
      phase: 'Phase 1',
      title: 'Support Portal & Gold Rings',
      status: 'Active',
      icon: Heart,
      color: 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5',
      desc: 'Deploy core routing sitemaps, optimize social/Reddit metatag cards, open waitlists, and launch the Original Supporter Gold HSL border ring profiles.'
    },
    {
      phase: 'Phase 2',
      title: 'Avery Sticker Studio & Customizer',
      status: 'Up Next',
      icon: Printer,
      color: 'border-red-500/20 text-red-500 bg-red-500/5',
      desc: 'Claim unclaimed tags and export 300-DPI printable Avery sheets (round labels, square grids, keytags, or 8.5"x11" Cars & Coffee spec-sheet window posters).'
    },
    {
      phase: 'Phase 3',
      title: 'Passports & B2B CRM',
      status: 'Scheduled',
      icon: Building2,
      color: 'border-neutral-800 text-neutral-400 bg-neutral-900/20',
      desc: 'Launch dynamic context-aware profiles: Spectator Spec Sheets, Owner Telemetry coordinate logs, and Dealership Sponsored Inventory CRMs.'
    },
    {
      phase: 'Phase 4',
      title: 'Gatekeeper Release & Track Ops',
      status: 'Scheduled',
      icon: Flag,
      color: 'border-neutral-800 text-neutral-400 bg-neutral-900/20',
      desc: 'Deploy barcode safety waivers, tech-inspection compliance stamps, and the Grid Marshall पिट lane release terminal to bypass registration trailer cues.'
    },
    {
      phase: 'Phase 5',
      title: 'Local Sightings & Rankings',
      status: 'Scheduled',
      icon: Eye,
      color: 'border-neutral-800 text-neutral-400 bg-neutral-900/20',
      desc: 'Query location-aware "Spotted Near You" camera feeds, map pins, and community points leaderboards to gamify car spotting.'
    }
  ];

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden selection:bg-[#bd2925]/30 flex flex-col">
      {/* Carbon/Crimson ambient background glow */}
      <div className="mesh-glow" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-16 px-6 overflow-hidden max-w-5xl mx-auto text-center space-y-8 z-10 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
          <span className="flex h-2 w-2 rounded-full bg-[#bd2925] animate-pulse" />
          Gridpass Engine Online
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[1.05] uppercase">
          No Gridpass.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#bd2925] via-rose-500 to-[#bd2925]">
            No Track.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-neutral-450 max-w-2xl mx-auto leading-relaxed font-medium">
          Your vehicle&apos;s dynamic passport is now your entrance ticket. Ditch the paper waivers and long registration lines. A single QR decal on your window or helmet unlocks cashless waiver signing, digital tech inspection stamps, and instant pit lane release. Spectators scan your tag to view your specs, mods, and build journey, turning your rig into a self-propagating digital profile.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full max-w-md">
          <Link href="/pricing" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#bd2925] hover:bg-[#bd2925]/90 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md shadow-[#bd2925]/20 text-lg btn-glow">
            Get Gridpass Tag <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/scan" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white px-8 py-4 rounded-xl font-bold transition-all text-lg">
            <QrCode className="w-5 h-5 text-rose-500" /> Scan Tag
          </Link>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-stretch gap-6 max-w-4xl mx-auto w-full text-left">
          {/* Founder Live Profile Box */}
          <Link href="/u/pjlosey" className="group flex-1 glass-card p-6 rounded-3xl border-red-500/10 hover:border-[#bd2925]/30 bg-neutral-950/40 transition-all relative overflow-hidden flex flex-col justify-between">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#bd2925]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="space-y-4">
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
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex items-center gap-4 text-[10px] font-mono text-neutral-500 font-bold border-t border-neutral-900/60 mt-4">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Jeep Wrangler
              </span>
              <span>📍 Grayslake, IL</span>
            </div>
          </Link>

          {/* Back the Cause Supporter Box */}
          <div className="flex-1 glass-card p-6 rounded-3xl border-yellow-500/10 bg-neutral-950/40 relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-yellow-500 fill-yellow-500/10" />
                <span className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wider">Back the Cause</span>
              </div>
              <h3 className="text-lg font-black text-white uppercase">Become an Original Supporter</h3>
              <p className="text-xs text-neutral-405 leading-relaxed">
                Gridpass is crowdfunded by the automotive community. Back us today to secure a lifetime **Original Supporter badge** and a **glowing HSL gold avatar border** for your digital garage passport.
              </p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-neutral-900/60">
              <Link href="/login?redirect=/dash" className="btn-glow px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1">
                Back Gridpass <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">Tiers from $5</span>
            </div>
          </div>
        </div>
      </section>

      {/* Moving Billboard Features Section */}
      <section className="relative py-20 px-6 max-w-5xl mx-auto z-10 w-full space-y-12 border-t border-neutral-900/60">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono font-black uppercase tracking-widest text-[#bd2925]">
            <Sparkles className="w-3.5 h-3.5 text-[#bd2925]" /> Viral Ecosystem Mechanics
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">The Moving Billboard Loop</h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Every physical Gridpass tag functions as an offline referral link, bridging real-world rigs with high-value digital operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-8 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
            <span className="text-[10px] font-mono font-bold text-[#bd2925] tracking-widest uppercase">For Rig Owners</span>
            <h3 className="text-xl font-black text-white uppercase">Passive Engagement & Specs</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Showcase mod lists, sponsorships, dyno ratings, and social handles cleanly at car meets. Bypass standing around all day explaining your build—spectators scan your window or helmet decal to check out the rig and earn points on your spotted feed.
            </p>
          </div>
          
          <div className="glass-card p-8 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
            <span className="text-[10px] font-mono font-bold text-[#bd2925] tracking-widest uppercase">For Automotive Shops & Dealers</span>
            <h3 className="text-xl font-black text-white uppercase">Sponsored Inventory & Lead Ingress</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Deploy custom logo QRs on sold vehicles or serviced rigs. When scanned in the wild by local enthusiasts, the top profile header acts as a promotional banner: *"Sold & Serviced by [Shop Name] - View Similar Stock."* Direct leads pipe instantly into your CRM.
            </p>
          </div>
        </div>
      </section>

      {/* Development Roadmap Section */}
      <section className="relative py-20 px-6 max-w-5xl mx-auto z-10 w-full space-y-12 border-t border-neutral-900/60">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono font-black uppercase tracking-widest text-[#bd2925]">
            <Milestone className="w-3.5 h-3.5" /> Development Timeline
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">The Gridpass Roadmap</h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            We are building a robust, unified vehicle passport infrastructure. Explore our phased rollout plan from launch to geolocated discoveries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {roadmapPhases.map((phase, idx) => {
            const Icon = phase.icon;
            return (
              <div 
                key={idx} 
                className={`glass-card p-6 rounded-3xl border flex flex-col justify-between relative overflow-hidden transition-all ${
                  phase.status === 'Active' 
                    ? 'border-[#bd2925]/30 bg-[#bd2925]/5 shadow-[#bd2925]/5 shadow-xl' 
                    : phase.status === 'Up Next'
                    ? 'border-yellow-500/20 bg-yellow-500/5'
                    : 'border-neutral-900 bg-neutral-950/20'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">{phase.phase}</span>
                    <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                      phase.status === 'Active' 
                        ? 'bg-[#bd2925] text-white' 
                        : phase.status === 'Up Next'
                        ? 'bg-yellow-500 text-black animate-pulse'
                        : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                    }`}>
                      {phase.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${phase.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase leading-tight line-clamp-1">{phase.title}</h4>
                    </div>
                    <p className="text-[11px] text-neutral-405 leading-relaxed">
                      {phase.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Plan Details Summary Section */}
      <section className="relative py-20 px-6 max-w-5xl mx-auto z-10 w-full space-y-12 border-t border-neutral-900/60">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">Passport Tiers & Pricing</h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Start free or secure premium upgrades tailored to your rig&apos;s journey. High-tier features are accessible via modular, a la carte unlocks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Free Tier */}
          <div className="glass-card p-8 rounded-3xl border border-neutral-900 bg-neutral-950/20 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-[#bd2925] uppercase tracking-widest">Base Identity</span>
              <h3 className="text-2xl font-black text-white uppercase">Free Passport</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Perfect for casual owners. Create a permanent QR-mapped profile to log basic specifications, active mod sheets, and contact links.
              </p>
              <ul className="space-y-2 text-xs font-mono text-neutral-500 font-bold pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-500" /> 1 Registered Vehicle</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-500" /> Public Modifications Spec Sheet</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-500" /> Basic Ownership Registry</li>
              </ul>
            </div>
            <Link href="/login" className="w-full py-3 border border-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all text-center">
              Claim Free Tag
            </Link>
          </div>

          {/* Early Backer / Supporter */}
          <div className="glass-card p-8 rounded-3xl border border-yellow-500/20 bg-yellow-500/[0.01] flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
              POPULAR
            </div>
            
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-yellow-500 uppercase tracking-widest">Crowdfunded Backer</span>
              <h3 className="text-2xl font-black text-white uppercase">Original Supporter</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Back Gridpass development. Secure a permanent supporter badge and the animated glowing gold avatar ring on your profile garage.
              </p>
              <ul className="space-y-2 text-xs font-mono text-neutral-500 font-bold pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-yellow-500" /> Glowing Gold HSL Avatar Ring</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-yellow-500" /> &quot;Original Supporter&quot; Profile Banner</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-yellow-500" /> Future Beta Feature Testing Access</li>
              </ul>
            </div>
            <Link href="/login?redirect=/dash" className="w-full btn-glow py-3 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all text-center">
              Pledge Support (From $5)
            </Link>
          </div>

          {/* A La Carte Upgrades */}
          <div className="glass-card p-8 rounded-3xl border border-neutral-900 bg-neutral-950/20 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-widest">Modular Options</span>
              <h3 className="text-2xl font-black text-white uppercase">A La Carte Unlocks</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Only pay for what you actually use. Add advanced features to your rigs as needed with low one-time or monthly unlocks.
              </p>
              <ul className="space-y-2 text-xs font-mono text-neutral-500 font-bold pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-500" /> Geolocation Scan Maps ($0.99/mo)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-500" /> Provenance Ledger Receipts ($9.99)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-500" /> Vector Sticker Customizer ($4.99)</li>
              </ul>
            </div>
            <Link href="/pricing" className="w-full py-3 border border-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all text-center">
              Configure Upgrades
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
