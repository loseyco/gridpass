"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague } from "@/lib/types/league";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Trophy,
  Plus,
  Search,
  ChevronRight,
  HardDrive,
  Users,
  Flag,
  Tv,
  Newspaper,
  Download,
  Sliders,
} from "lucide-react";

export default function SRLeagueMasterHubPage() {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<SRLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Real-time Firestore Subscription for Leagues (STRICT ZERO FAKE DATA)
  useEffect(() => {
    const q = query(collection(db, "sr_leagues"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: SRLeague[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setLeagues(list);
        setLoading(false);
      },
      () => {
        setLeagues([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const filteredLeagues = leagues.filter((l) => {
    return (
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.tagline && l.tagline.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.car_classes && l.car_classes.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  });

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. MOBILE-FIRST TOP HEADER BAR
         ───────────────────────────────────────────────────────────── */}
      <header className="max-w-3xl w-full mx-auto space-y-4">
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center font-black text-white text-xl shadow-md shadow-red-600/20 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
                  League Manager
                </h1>
              </div>
              <p className="text-xs font-mono text-neutral-500 mt-1">
                Championships • Standings • Rosters • Stewarding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Link
              href="/srleague/download"
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4 text-red-600" />
              <span>Download Engine</span>
            </Link>

            <Link
              href="/srleague/news"
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Newspaper className="w-4 h-4 text-red-600" />
              <span>News & Updates</span>
            </Link>

            <Link
              href="/srleague/new"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create League</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN LEAGUES DIRECTORY (MOBILE FIRST)
         ───────────────────────────────────────────────────────────── */}
      <main className="max-w-3xl w-full mx-auto space-y-4">
        
        {loading ? (
          <div className="p-12 text-center text-neutral-400 font-mono text-xs">
            Loading Leagues from database...
          </div>
        ) : leagues.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-white border border-neutral-200 flex items-center justify-center mx-auto text-neutral-300 shadow-xs">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-lg font-black uppercase text-neutral-900 tracking-tight">
                No Leagues Registered Yet
              </h3>
              <p className="text-xs font-mono text-neutral-500">
                You haven't created any championship leagues yet. Launch your first league to manage seasons, drivers, and points.
              </p>
            </div>

            <Link
              href="/srleague/new"
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-2xl shadow-lg shadow-red-600/20 transition"
            >
              + Create Your First League
            </Link>
          </div>
        ) : (
          /* ACTIVE LEAGUES LIST */
          <div className="space-y-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search leagues by name or car class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-2xl pl-10 pr-4 py-3 text-sm font-mono text-neutral-900 focus:outline-hidden focus:border-red-600 focus:bg-white transition"
              />
            </div>

            <div className="space-y-3">
              {filteredLeagues.map((l) => (
                <Link
                  key={l.id}
                  href={`/srleague/${l.id}`}
                  className="block p-5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 rounded-3xl transition shadow-sm group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Logo or Badge */}
                      <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                        {l.logo_url ? (
                          <img src={l.logo_url} alt={l.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-red-600 text-white font-black text-xs flex items-center justify-center tracking-tight">
                            {l.short_name || l.name.slice(0, 3).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-base font-black uppercase tracking-tight text-neutral-900 group-hover:text-red-600 transition truncate">
                          {l.name}
                        </h3>
                        {l.short_name && (
                          <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block">
                            {l.short_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 group-hover:text-red-600 transition shrink-0 shadow-xs">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. MINIMAL FOOTER
         ───────────────────────────────────────────────────────────── */}
      <footer className="max-w-3xl w-full mx-auto text-center py-4 text-[11px] font-mono text-neutral-400 flex items-center justify-center gap-2">
        <Trophy className="w-3.5 h-3.5 text-neutral-400" />
        <span>GridPass • Sim Racing League Manager</span>
      </footer>
    </div>
  );
}
