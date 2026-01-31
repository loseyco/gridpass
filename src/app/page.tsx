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
  Radio
} from "lucide-react";

import { createClient } from '@/utils/supabase/server';
import { getFounderCount } from "@/utils/founders"; // ... rest of imports

// ... metadata ...

export default async function Home() {
  const { count, remaining, limit } = await getFounderCount();

  // Check auth status & Fetch News
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let latestUpdate = null;
  try {
    const { data } = await supabase
      .from('changelogs') // Only works if table exists
      .select('*')
      .eq('is_public', true) // Filter public only
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
        {/* Hero Section */}
        <section className="px-6 pt-12 pb-8 max-w-md mx-auto md:max-w-4xl md:text-center md:py-20">
          {/* ... existing Hero content ... */}
          <div className="flex flex-col sm:flex-row gap-3 md:justify-center">
            {/* ... existing Link buttons ... */}
            {user ? (
              // ...
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              // ... (links) ...
              <>
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/members"
                  className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 rounded-2xl font-bold text-lg border border-white/10 transition-all active:scale-95"
                >
                  Browse Members
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 rounded-2xl font-bold text-lg border border-white/10 transition-all active:scale-95"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Latest News / Update Log */}
        {latestUpdate && (
          <section className="px-4 max-w-4xl mx-auto mb-12">
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
                  {latestUpdate.summary && (
                    <p className="text-neutral-400 text-sm mt-1 line-clamp-1">
                      {latestUpdate.summary}
                    </p>
                  )}
                </div>
                <div className="hidden md:block text-neutral-500 group-hover:text-white transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Founders Hero Section */}
        <section className="px-4 max-w-4xl mx-auto mb-16">
          {/* Latest Update / News (New Feature) */}
          {(() => {
            // We try to render this asynchronously inside the server component
            // But we can't use await here inside JSX easily without a wrapper component
            // So I will move the fetch logic up to the main component body
            return null;
          })()}

          <Link href="/founder" className="group relative block">
            {/* ... existing Founder Hero ... */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-700 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative bg-neutral-900 border border-amber-500/30 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">

              {/* Background Decoration */}
              <div className="absolute top-0 right-0 p-32 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none"></div>

              <div className="text-center md:text-left z-10">
                <div className="inline-flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Limited Availability
                </div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2">
                  THE FOUNDING 50
                </h2>
                <p className="text-neutral-400 text-sm max-w-sm">
                  Secure <span className="text-white font-bold">Lifetime Access</span> for a one-time payment. Help shape the Digital Truth.
                </p>
              </div>

              <div className="flex items-center gap-4 z-10">
                <div className="text-right hidden md:block">
                  <div className="text-2xl font-bold text-white">{remaining}/{limit}</div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">Spots Left</div>
                </div>
                <div className="bg-amber-500 text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 group-hover:bg-amber-400 transition-colors">
                  Claim Yours <ArrowRight className="w-4 h-4" />
                </div>
              </div>

            </div>
          </Link>
        </section>

        {/* The OS Grid (Bento Style) */}
        <section className="px-4 max-w-md mx-auto md:max-w-5xl">
          <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-6 px-2 md:text-center">
            System Modules
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {/* Wallet Module */}
            <div className="col-span-2 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 rounded-3xl border border-white/5 relative overflow-hidden group opacity-80">
              <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                <span className="bg-neutral-900/90 text-neutral-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 shadow-lg">Coming Soon</span>
              </div>
              <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[60px] rounded-full group-hover:bg-indigo-500/20 transition-all"></div>
              <Wallet className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-xl font-bold mb-1">Digital Wallet</h3>
              <p className="text-sm text-neutral-400">Your Licenses, Hard Cards, and Medical Credentials in one secure place.</p>
            </div>

            {/* Shop OS Module */}
            <div className="col-span-1 bg-neutral-900 p-5 rounded-3xl border border-white/5 flex flex-col justify-between group hover:border-indigo-500/30 transition-colors relative overflow-hidden opacity-80">
              <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                <span className="bg-neutral-900/90 text-neutral-300 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border border-white/10 shadow-lg text-center">Coming Soon</span>
              </div>
              <LayoutDashboard className="w-8 h-8 text-emerald-400" />
              <div>
                <h3 className="font-bold mt-4">Shop OS</h3>
                <p className="text-xs text-neutral-500 mt-1">CRM, Invoicing, Inventory.</p>
              </div>
            </div>

            {/* Garage Module */}
            <div className="col-span-1 bg-neutral-900 p-5 rounded-3xl border border-white/5 flex flex-col justify-between group hover:border-blue-500/30 transition-colors relative overflow-hidden opacity-80">
              <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                <span className="bg-neutral-900/90 text-neutral-300 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border border-white/10 shadow-lg text-center">Coming Soon</span>
              </div>
              <Wrench className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="font-bold mt-4">My Garage</h3>
                <p className="text-xs text-neutral-500 mt-1">Service History & Fleet.</p>
              </div>
            </div>

            {/* Events Module */}
            <div className="col-span-1 bg-neutral-900 p-5 rounded-3xl border border-white/5 flex flex-col justify-between group hover:border-orange-500/30 transition-colors relative overflow-hidden opacity-80">
              <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                <span className="bg-neutral-900/90 text-neutral-300 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border border-white/10 shadow-lg text-center">Coming Soon</span>
              </div>
              <Calendar className="w-8 h-8 text-orange-400" />
              <div>
                <h3 className="font-bold mt-4">Events</h3>
                <p className="text-xs text-neutral-500 mt-1">Tickets & Parking Passes.</p>
              </div>
            </div>

            {/* Resume Builder Module */}
            <div className="col-span-1 bg-neutral-900 p-5 rounded-3xl border border-white/5 flex flex-col justify-between group hover:border-pink-500/30 transition-colors relative overflow-hidden opacity-80">
              <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                <span className="bg-neutral-900/90 text-neutral-300 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border border-white/10 shadow-lg text-center">Coming Soon</span>
              </div>
              <Briefcase className="w-8 h-8 text-pink-400" />
              <div>
                <h3 className="font-bold mt-4">Resume Builder</h3>
                <p className="text-xs text-neutral-500 mt-1">AI-Powered Profiles.</p>
              </div>
            </div>

            {/* Racing Module */}
            <div className="col-span-2 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 rounded-3xl border border-white/5 relative overflow-hidden opacity-80">
              <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                <span className="bg-neutral-900/90 text-neutral-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 shadow-lg">Coming Soon</span>
              </div>
              <div className="absolute top-0 left-0 p-32 bg-yellow-500/5 blur-[60px] rounded-full"></div>
              <div className="flex items-start justify-between">
                <div>
                  <Trophy className="w-8 h-8 text-yellow-500 mb-4" />
                  <h3 className="text-xl font-bold mb-1">Race Teams</h3>
                  <p className="text-sm text-neutral-400">Logistics, Flights, and Setup Sheets.</p>
                </div>
                <div className="bg-yellow-500/10 px-3 py-1 rounded-full text-yellow-500 text-xs font-bold border border-yellow-500/20">
                  PRO
                </div>
              </div>
            </div>

            {/* Command Center Module (New) */}
            <Link href="/command-center" className="col-span-2 md:col-span-4 bg-gradient-to-r from-indigo-900/20 to-neutral-900 p-6 rounded-3xl border border-indigo-500/30 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
              <div className="absolute top-0 right-0 p-40 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
                    <Activity className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      Command Center
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </h3>
                    <p className="text-sm text-neutral-400 mt-1">
                      Realtime Telemetry & Remote Rig Control. <span className="text-indigo-400 font-bold">Zero Latency.</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
                    Live Beta
                  </span>
                  <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>

          </div>
        </section>

        {/* Social Proof / Stats */}
        <section className="mt-12 px-6 max-w-md mx-auto md:max-w-5xl md:text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-neutral-500">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">100%</span>
              <span className="text-xs uppercase tracking-wider">Mobile First</span>
            </div>
            <div className="w-px h-8 bg-white/10 hidden md:block"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">Global</span>
              <span className="text-xs uppercase tracking-wider">Identity</span>
            </div>
            <div className="w-px h-8 bg-white/10 hidden md:block"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">Secure</span>
              <span className="text-xs uppercase tracking-wider">Documents</span>
            </div>
          </div>
        </section>

      </main>
    </div >
  );
}
