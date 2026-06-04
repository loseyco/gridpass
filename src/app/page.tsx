'use client';

import Link from 'next/link';
import { 
  ArrowRight, QrCode, ShieldCheck, Activity, Heart, 
  Milestone, Printer, Building2, Flag, Eye, Check, Sparkles, Car 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  const roadmapPhases = [
    {
      phase: 'Phase 1',
      title: 'Digital Garage & Supporter Portal',
      status: 'Active',
      icon: Heart,
      color: 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5',
      desc: 'Build the core garage registry, optimize Reddit/SMS link-sharing meta cards, open waitlists, and launch the Original Supporter glowing gold avatar border profiles.'
    },
    {
      phase: 'Phase 2',
      title: 'Avery Sticker Studio & Customizer',
      status: 'Up Next',
      icon: Printer,
      color: 'border-red-500/20 text-red-500 bg-red-500/5',
      desc: 'Claim unclaimed tags and export high-resolution, print-at-home sticker sheets (round labels, square grids, keytags, or 8.5"x11" Cars & Coffee spec-sheet window posters).'
    },
    {
      phase: 'Phase 3',
      title: 'Vehicle Passports & CRM Integration',
      status: 'Scheduled',
      icon: Building2,
      color: 'border-neutral-800 text-neutral-400 bg-neutral-900/20',
      desc: 'Deploy dynamic context-aware profiles: Spectator Spec Sheets, Visitor scan maps showing where your car was scanned, and Dealership Sponsored Inventory feeds.'
    },
    {
      phase: 'Phase 4',
      title: 'Pit Lane Release & Tech Inspection',
      status: 'Scheduled',
      icon: Flag,
      color: 'border-neutral-800 text-neutral-400 bg-neutral-900/20',
      desc: 'Deploy barcode safety waivers, tech-inspection compliance stamps, and express lane check-ins to bypass registration trailer lines at events.'
    },
    {
      phase: 'Phase 5',
      title: 'Local Sightings & Rankings',
      status: 'Scheduled',
      icon: Eye,
      color: 'border-neutral-800 text-neutral-400 bg-neutral-900/20',
      desc: 'See photos of your car taken by spotters nearby, view map pins, and climb community points leaderboards to gamify car spotting.'
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
          One Tag.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#bd2925] via-rose-500 to-[#bd2925]">
            Your Vehicle&apos;s Passport.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed font-medium">
          Ditch the paper spec sheets at car meets. Create a dynamic digital passport for your vehicle completely free. Build your modifications catalog, link your socials, and tell your build's story. Place a custom QR decal on your windshield or helmet so spectators scan and view your specs instantly, while supporting racetracks and local detail shops log verified history directly onto your ledger.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full max-w-md">
          <Link href="/login?redirect=/dash" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#bd2925] hover:bg-[#bd2925]/90 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md shadow-[#bd2925]/20 text-lg btn-glow">
            Claim Free Passport <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/scan" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-white px-8 py-4 rounded-xl font-bold transition-all text-lg">
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
                Gridpass is crowdfunded by the automotive community. Back us today to secure a lifetime **Original Supporter badge** and a **glowing gold avatar border** for your digital garage passport.
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

      {/* Centered Vehicle & Supporting Infrastructure Section */}
      <section className="relative py-20 px-6 max-w-5xl mx-auto z-10 w-full space-y-12 border-t border-neutral-900/60">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono font-black uppercase tracking-widest text-[#bd2925]">
            <Car className="w-3.5 h-3.5 text-[#bd2925]" /> Ecosystem Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">Built for Vehicles, Supported by the Community</h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            The vehicle is the hero. Our entire network of independent service centers, dealerships, and racetracks exists to enrich and verify your vehicle&apos;s digital passport.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
            <span className="text-[10px] font-mono font-bold text-[#bd2925] tracking-widest uppercase">The Core Passport</span>
            <h3 className="text-lg font-black text-white uppercase">Your Vehicle&apos;s Digital Spec Sheet</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Log detailed specifications, custom wrap colors, engine modifications, parts brands, and linked social media profiles. Spectators scan the physical QR decal in the wild to view your setup instantly.
            </p>
          </div>
          
          <div className="glass-card p-8 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
            <span className="text-[10px] font-mono font-bold text-neutral-500 tracking-widest uppercase">Supporting Shops</span>
            <h3 className="text-lg font-black text-white uppercase">Verified Service History</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Mechanics and service centers update your passport with verified receipts and digital stamps. A verified service logbook boosts vehicle resale value and transfers with ownership.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
            <span className="text-[10px] font-mono font-bold text-neutral-500 tracking-widest uppercase">Supporting Tracks</span>
            <h3 className="text-lg font-black text-white uppercase">Cashless Waivers & Releases</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Event venues scan your vehicle tag at entrance gates and grid lanes. Instantly sign liability disclaimers, stamp safety tech inspections, and verify run groups to release you onto pit lane in seconds.
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
            Start free or secure premium upgrades tailored to your vehicle&apos;s journey. High-tier features are accessible via modular, a la carte unlocks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Free Tier */}
          <div className="glass-card p-8 rounded-3xl border border-neutral-900 bg-neutral-950/20 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-[#bd2925] uppercase tracking-widest">Base Identity</span>
              <h3 className="text-2xl font-black text-white uppercase">Free Passport</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                100% free forever. Create your vehicle profile, document specifications, build modification catalogs, and get your digital QR specs page.
              </p>
              <ul className="space-y-2 text-xs font-mono text-neutral-500 font-bold pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-500" /> Free Profile Hosting</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-500" /> Detailed Specifications Registry</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-500" /> Ownership Build Milestones</li>
              </ul>
            </div>
            <Link href="/login?redirect=/dash" className="w-full py-3 border border-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all text-center">
              Claim Free Passport
            </Link>
          </div>

          {/* Printable Avery sticker customize / vector export pack */}
          <div className="glass-card p-8 rounded-3xl border border-yellow-500/20 bg-yellow-500/[0.01] flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
              POPULAR
            </div>
            
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-yellow-500 uppercase tracking-widest">Sticker Studio</span>
              <h3 className="text-2xl font-black text-white uppercase">Print & Customize</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Design your physical connection. Download high-res vector formats matching standard Avery sheets completely free to print at home, or order shipped weather-proof vinyl decals.
              </p>
              <ul className="space-y-2 text-xs font-mono text-yellow-500 font-bold pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-yellow-500" /> Free Avery PDF & SVG Exports</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-yellow-500" /> Ad-Free Premium Profile Layout</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-yellow-500" /> Shipped Premium Vinyl Sticker Options</li>
              </ul>
            </div>
            <Link href="/pricing" className="w-full btn-glow py-3 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all text-center">
              Configure Decals
            </Link>
          </div>

          {/* B2B / Merchant Supporting Infrastructure */}
          <div className="glass-card p-8 rounded-3xl border border-neutral-900 bg-neutral-950/20 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-widest">Supporting Hubs</span>
              <h3 className="text-2xl font-black text-white uppercase">Merchant Portal</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                For detail shops, racetracks, and dealerships. Write verified logs to customer builds, list inventory, or set up track day waiver check-ins.
              </p>
              <ul className="space-y-2 text-xs font-mono text-neutral-500 font-bold pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-500" /> Verified Service Logs Writer ($49/mo)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-500" /> Dealer Inventory Lead CRM ($29/mo)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-500" /> Track waiver gate check-in splitting</li>
              </ul>
            </div>
            <Link href="/pricing" className="w-full py-3 border border-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all text-center">
              View B2B Features
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
