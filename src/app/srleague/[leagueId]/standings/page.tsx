"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { doc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueSeries, SRLeagueDriver } from "@/lib/types/league";
import {
  Trophy,
  ArrowLeft,
  Search,
  Plus,
  AlertCircle,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

export default function LeagueStandingsPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const [league, setLeague] = useState<SRLeague | null>(null);
  const [seriesList, setSeriesList] = useState<SRLeagueSeries[]>([]);
  const [drivers, setDrivers] = useState<SRLeagueDriver[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // 1. Fetch League
  useEffect(() => {
    if (!leagueId) return;
    const unsub = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });
    return () => unsub();
  }, [leagueId]);

  // 2. Fetch Series
  useEffect(() => {
    if (!leagueId) return;
    const q = query(collection(db, "sr_league_series"), where("league_id", "==", leagueId));
    const unsub = onSnapshot(q, (snap) => {
      const list: SRLeagueSeries[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setSeriesList(list);
    });
    return () => unsub();
  }, [leagueId]);

  // 3. Fetch Drivers
  useEffect(() => {
    if (!leagueId) return;
    const q = query(collection(db, "sr_league_drivers"), where("league_id", "==", leagueId));
    const unsub = onSnapshot(q, (snap) => {
      const list: SRLeagueDriver[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (b.points_total || 0) - (a.points_total || 0));
      setDrivers(list);
      setLoading(false);
    });
    return () => unsub();
  }, [leagueId]);

  const filteredDrivers = drivers.filter((d) => {
    if (selectedClass === "all") return true;
    return d.car_class?.toLowerCase() === selectedClass.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
      {/* TOP HEADER */}
      <header className="max-w-xl w-full mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <Link
              href={`/srleague/${leagueId}`}
              className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
                Standings
              </h1>
              <span className="text-xs font-mono text-neutral-500">
                {league?.name || "Championship"} • Points & Ranks
              </span>
            </div>
          </div>

          {seriesList.length > 0 && (
            <Link
              href={`/srleague/${leagueId}/roster/new`}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-mono font-bold uppercase rounded-2xl shadow-md shadow-red-600/20"
            >
              + Enroll Driver
            </Link>
          )}
        </div>
      </header>

      {/* MAIN STANDINGS LIST */}
      <main className="max-w-xl w-full mx-auto space-y-3 font-mono text-xs">
        {loading ? (
          <div className="p-12 text-center text-neutral-400">Loading Standings...</div>
        ) : seriesList.length === 0 ? (
          /* GATE: NO SERIES */
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto shadow-xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-black uppercase text-neutral-900">
                No Series Created Yet
              </h3>
              <p className="text-neutral-500 text-xs">
                You must create a championship series in this league before driver standings can be calculated.
              </p>
            </div>
            <Link
              href={`/srleague/${leagueId}/series/new`}
              className="inline-flex items-center justify-center px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-2xl shadow-md shadow-red-600/20"
            >
              + Create Series First
            </Link>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <Trophy className="w-10 h-10 text-neutral-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-black uppercase text-neutral-900">
                No Drivers in Standings
              </h3>
              <p className="text-neutral-500 text-xs">
                Enroll drivers to begin tracking points and podium finishes.
              </p>
            </div>
            <Link
              href={`/srleague/${leagueId}/roster/new`}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-xl shadow-xs"
            >
              + Enroll First Driver
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDrivers.map((d, idx) => (
              <div
                key={d.id}
                className={`p-4 rounded-2xl border transition shadow-xs flex items-center justify-between gap-3 ${
                  idx === 0
                    ? "bg-amber-50/70 border-amber-300"
                    : "bg-neutral-50 border-neutral-200"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white border border-neutral-200 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `P${idx + 1}`}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-black text-neutral-900 truncate">
                        {d.driver_name}
                      </strong>
                      <span className="text-[10px] bg-white text-neutral-700 font-bold px-1.5 py-0.5 rounded-md border border-neutral-200">
                        #{d.car_number}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-500 truncate block">
                      {d.team_name} • {d.car_model}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-black text-red-600 block leading-none">
                    {d.points_total || 0}
                  </span>
                  <span className="text-[9px] text-neutral-400 uppercase font-bold">Points</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="max-w-xl w-full mx-auto text-center py-4 text-[11px] font-mono text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}
