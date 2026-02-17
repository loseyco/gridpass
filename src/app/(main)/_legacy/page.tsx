import Link from "next/link";
import {
  Wallet,
  Wrench,
  LayoutDashboard,
  Calendar,
  Trophy,
  Users,
  Briefcase,
  ArrowRight,
  Activity,
  Radio,
  Lightbulb
} from "lucide-react";

import { createClient } from '@/utils/supabase/server';
import { getFounderCount } from "@/utils/founders";
import { FounderCard } from "@/components/launch/FounderCard";
import { DonationCard } from "@/components/launch/DonationCard";

// ... metadata ...

export default async function Home() {
  const { count, remaining, limit } = await getFounderCount();

  // Check auth status & Fetch News
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let latestUpdate = null;
  try {
    const { data } = await supabase
      .from('changelogs')
      .select('*')
      .eq('is_public', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .single();
    latestUpdate = data;
  } catch (e) {
    // Table likely doesn't exist yet, ignore
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30">

      {/* Mobile Header */}
      <main className="pb-24">
        {/* Revenue-First Hero Section */}
        <section className="relative w-full bg-black overflow-hidden mb-24">
          <div className="absolute inset-0 opacity-40">
            <img src="/hero-launch-generic.png" alt="GridPass Engineer - Managing High Stakes" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left Col: Messaging */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/50 bg-indigo-500/20 text-indigo-300 text-xs font-mono uppercase tracking-widest mb-6 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                Launch Event Live
              </div>

              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white mb-6 leading-[0.9] drop-shadow-2xl pb-2 pr-2">
                FROM THE TRACK <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600 pr-2">TO YOUR SHOP</span>
              </h1>

              <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium drop-shadow-md">
                We manage the <strong className="text-white">Track</strong> to the <strong className="text-white">Shop</strong> to the <strong className="text-white">Simulator</strong>.
                Whether it's <strong className="text-white">Pro Level</strong>, <strong className="text-white">Grass Roots</strong>, <strong className="text-white">Sim</strong> or <strong className="text-white">RC</strong>.
                <span className="block mt-2 text-sm text-neutral-400">Built by Patrick "PJ" Losey.</span>
              </p>

              {/* Hero CTA */}
              {!user && (
                <div className="flex flex-wrap gap-4 mb-10 justify-center lg:justify-start">
                  <Link
                    href="/resume-builder"
                    className="px-8 py-4 bg-white text-black font-bold text-sm uppercase tracking-widest rounded-full hover:bg-neutral-200 transition-colors flex items-center gap-2"
                  >
                    <Briefcase className="w-4 h-4" /> Build Free Resume
                  </Link>
                  <Link
                    href="https://discord.gg/gridpass"
                    target="_blank"
                    className="px-8 py-4 bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 font-bold text-sm uppercase tracking-widest rounded-full hover:bg-indigo-600/40 transition-colors flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" /> Join Discord
                  </Link>
                </div>
              )}

              {/* Social Proof / Trust */}
              <div className="flex flex-col items-center lg:items-start gap-4 mb-10">
                <div className="text-xs font-mono uppercase tracking-widest text-neutral-500">Trusted Engineering Pedigree</div>
                <div className="flex items-center gap-6 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                  <span className="font-bold text-neutral-400 border-b border-indigo-500/30 pb-1 cursor-default" title="Honda Racing Corporation">HRC US</span>
                  <span className="h-4 w-px bg-neutral-700"></span>
                  <span className="font-bold text-neutral-400 border-b border-indigo-500/30 pb-1 cursor-default" title="NTT IndyCar Series">INDYCAR</span>
                  <span className="h-4 w-px bg-neutral-700"></span>
                  <span className="font-bold text-neutral-400 border-b border-indigo-500/30 pb-1 cursor-default" title="IMSA SportsCar Championship">IMSA</span>
                  <span className="h-4 w-px bg-neutral-700"></span>
                  <span className="font-bold text-neutral-400 border-b border-indigo-500/30 pb-1 cursor-default" title="SRO World Challenge">SRO AMERICA</span>
                </div>
              </div>

            </div>

            {/* Right Col: The Offer (Founder Card) */}
            <div className="flex justify-center lg:justify-end">
              <FounderCard soldCount={count || 12} /> {/* Mocking 12 sold for visual validation if 0 */}
            </div>

          </div>
        </section>

        {/* The Strategic Master Plan (Grid-to-Grass) */}
        <section className="bg-neutral-900 border-y border-white/5 py-24 mb-24">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Built by Racers. Funded by Believers.</h2>
              <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                GridPass is <span className="text-white font-bold">free to use</span> because the racing world needs a standard.
                Our "A La Carte" model means you only pay for advanced power when you need it.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* The Open Standard */}
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-500" />
                  The Open Standard
                </h3>
                <p className="text-neutral-400 leading-relaxed mb-6">
                  We believe basic tools shouldn't be paywalled. Whether you are a Shop, a Team, or a Sim Racer, the core OS is free.
                  We charge enterprise teams for storage and compute, not for access.
                </p>
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <p className="text-sm text-indigo-300 font-bold italic">
                    "We need to raise capital to test these systems at scale. That's where you come in."
                  </p>
                </div>
              </div>

              {/* Founder's Advantage */}
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  The Founder's Advantage
                </h3>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="mt-1">
                      <Radio className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <strong className="text-white block">Beta Access & Input</strong>
                      <p className="text-sm text-neutral-400">test new features before the public. Your feedback steers the roadmap.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="mt-1">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <strong className="text-white block">Voting Power</strong>
                      <p className="text-sm text-neutral-400">Your voice carries more weight in feature requests. We build what Founders need.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="mt-1">
                      <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <strong className="text-white block">Permanent Legacy</strong>
                      <p className="text-sm text-neutral-400">Get the <span className="text-amber-500">Gold Trim</span> and your verified <span className="text-amber-500">Badge Number</span> forever. Prove you were here at the start.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Request CTA (Secondary) */}
        <section className="px-6 max-w-xl mx-auto mb-16 text-center">
          <Link href="/features" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm group">
            <Lightbulb className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <span>Have an idea? <span className="underline decoration-white/20 underline-offset-4 group-hover:decoration-white/50">Add it to our requested features.</span></span>
          </Link>
        </section>

        {/* The OS Grid (Refocused) */}
        <section className="px-4 max-w-md mx-auto md:max-w-5xl mb-16">
          <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-6 px-2 md:text-center">
            Platform Capabilities
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {/* Resume Builder Module (Active & Prominent) */}
            <Link href={user ? "/dashboard/profile" : "/resume-builder"} className="col-span-2 md:col-span-2 row-span-2 bg-gradient-to-br from-indigo-900/40 to-neutral-950 p-8 rounded-[2.5rem] border border-indigo-500/50 flex flex-col justify-between group hover:border-indigo-500 transition-colors relative overflow-hidden shadow-2xl shadow-indigo-900/20 block">
              <div className="absolute top-0 right-0 p-40 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all"></div>

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-black italic tracking-tight text-white mb-2">RESUME BUILDER</h3>
                <p className="text-indigo-200 text-lg leading-relaxed max-w-sm">
                  The only resume system designed specifically for the motorsports industry.
                </p>
              </div>

              <div className="relative z-10 mt-8">
                <div className="flex gap-2 mb-4">
                  <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2 py-1 rounded border border-indigo-500/20">Live Sync</span>
                  <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2 py-1 rounded border border-indigo-500/20">PDF Export</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  Start Building <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Wallet Module */}
            <div className="col-span-1 bg-neutral-900/50 p-5 rounded-3xl border border-white/5 flex flex-col justify-between group opacity-60 hover:opacity-100 transition-opacity">
              <div className="mb-4">
                <Wallet className="w-6 h-6 text-neutral-500 mb-3" />
                <h3 className="font-bold text-neutral-400">Digital Wallet</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-neutral-600 bg-neutral-900 px-2 py-1 rounded w-fit border border-white/5">Coming Soon</span>
            </div>

            {/* Shop OS Module */}
            <div className="col-span-1 bg-neutral-900/50 p-5 rounded-3xl border border-white/5 flex flex-col justify-between group opacity-60 hover:opacity-100 transition-opacity">
              <div className="mb-4">
                <LayoutDashboard className="w-6 h-6 text-neutral-500 mb-3" />
                <h3 className="font-bold text-neutral-400">Shop OS</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-neutral-600 bg-neutral-900 px-2 py-1 rounded w-fit border border-white/5">Coming Soon</span>
            </div>

            {/* Garage Module */}
            <div className="col-span-1 bg-neutral-900/50 p-5 rounded-3xl border border-white/5 flex flex-col justify-between group opacity-60 hover:opacity-100 transition-opacity">
              <div className="mb-4">
                <Wrench className="w-6 h-6 text-neutral-500 mb-3" />
                <h3 className="font-bold text-neutral-400">My Garage</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-neutral-600 bg-neutral-900 px-2 py-1 rounded w-fit border border-white/5">Coming Soon</span>
            </div>

            {/* Events Module */}
            <div className="col-span-1 bg-neutral-900/50 p-5 rounded-3xl border border-white/5 flex flex-col justify-between group opacity-60 hover:opacity-100 transition-opacity">
              <div className="mb-4">
                <Calendar className="w-6 h-6 text-neutral-500 mb-3" />
                <h3 className="font-bold text-neutral-400">Events</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-neutral-600 bg-neutral-900 px-2 py-1 rounded w-fit border border-white/5">Coming Soon</span>
            </div>

            {/* Racing Module */}
            <div className="col-span-1 bg-neutral-900/50 p-5 rounded-3xl border border-white/5 flex flex-col justify-between group opacity-60 hover:opacity-100 transition-opacity">
              <div className="mb-4">
                <Trophy className="w-6 h-6 text-neutral-500 mb-3" />
                <h3 className="font-bold text-neutral-400">Race Teams</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-neutral-600 bg-neutral-900 px-2 py-1 rounded w-fit border border-white/5">Coming Soon</span>
            </div>

            {/* Command Center Module */}
            <div className="col-span-1 bg-neutral-900/50 p-5 rounded-3xl border border-white/5 flex flex-col justify-between group opacity-60 hover:opacity-100 transition-opacity">
              <div className="mb-4">
                <Activity className="w-6 h-6 text-neutral-500 mb-3" />
                <h3 className="font-bold text-neutral-400">Command</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-neutral-600 bg-neutral-900 px-2 py-1 rounded w-fit border border-white/5">Coming Soon</span>
            </div>

          </div>
        </section>

        {/* Latest News / Update Log (Moved down) */}
        {latestUpdate && (
          <section className="px-4 max-w-4xl mx-auto mb-16">
            <Link href="/changelog" className="block group">
              <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-4 md:p-6 flex items-start md:items-center gap-4 hover:bg-neutral-900 hover:border-amber-500/30 transition-all">
                <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500 shrink-0">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Latest Transmission</span>
                    <span className="text-xs text-neutral-500">• {new Date(latestUpdate.published_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">
                    {latestUpdate.title} <span className="text-neutral-500 font-mono text-sm ml-2">{latestUpdate.version}</span>
                  </h3>
                </div>
                <div className="hidden md:block text-neutral-500 group-hover:text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Donation Opportunity */}
        <section className="px-4 max-w-4xl mx-auto mb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Fuel the Vision</h2>
            <p className="text-neutral-400">Not ready for a Founder Pass? You can still help keep the servers running.</p>
          </div>
          <div className="flex justify-center">
            <DonationCard userEmail={user?.email} profile={null} />
          </div>
        </section>

        {/* Founders Hero Section (Preserved but lower priority) */}
        <section className="px-4 max-w-4xl mx-auto mb-16 opacity-75 hover:opacity-100 transition-opacity">
          <Link href="/founder" className="group relative block">
            <div className="relative bg-neutral-950 border border-amber-500/10 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden hover:border-amber-500/30 transition-colors">
              <div className="text-center md:text-left z-10">
                <div className="inline-flex items-center gap-2 text-amber-500/50 text-xs font-bold uppercase tracking-widest mb-2">
                  Founder Program
                </div>
                <h2 className="text-2xl font-black text-white italic tracking-tighter mb-1">
                  THE FOUNDING 100
                </h2>
                <p className="text-neutral-500 text-sm max-w-sm">
                  Limited lifetime access slots remaining.
                </p>
              </div>

              <div className="flex items-center gap-4 z-10">
                <div className="text-amber-500/50 font-bold flex items-center gap-2 group-hover:text-amber-500 transition-colors text-sm">
                  View Offer <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        </section>

      </main>
    </div >
  );
}
