"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { doc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueProtest } from "@/lib/types/league";
import {
  Scale,
  ArrowLeft,
  Plus,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

export default function LeagueStewardingPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const [league, setLeague] = useState<SRLeague | null>(null);
  const [protests, setProtests] = useState<SRLeagueProtest[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch League
  useEffect(() => {
    if (!leagueId) return;
    const unsub = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });
    return () => unsub();
  }, [leagueId]);

  // 2. Fetch Protests
  useEffect(() => {
    if (!leagueId) return;
    const q = query(collection(db, "sr_league_protests"), where("league_id", "==", leagueId));
    const unsub = onSnapshot(q, (snap) => {
      const list: SRLeagueProtest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setProtests(list);
      setLoading(false);
    });
    return () => unsub();
  }, [leagueId]);

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
                Stewarding
              </h1>
              <span className="text-xs font-mono text-neutral-500">
                {league?.name || "Championship"} • {protests.length} Inquiries
              </span>
            </div>
          </div>

          <Link
            href={`/srleague/${leagueId}/stewarding/new`}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-mono font-bold uppercase rounded-2xl shadow-md shadow-red-600/20"
          >
            + File Inquiry
          </Link>
        </div>
      </header>

      {/* MAIN INQUIRIES LIST */}
      <main className="max-w-xl w-full mx-auto space-y-3 font-mono text-xs">
        {loading ? (
          <div className="p-12 text-center text-neutral-400">Loading Stewarding Logs...</div>
        ) : protests.length === 0 ? (
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <Scale className="w-10 h-10 text-neutral-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-black uppercase text-neutral-900">
                No Inquiries Filed
              </h3>
              <p className="text-neutral-500 text-xs">
                When on-track incidents or collisions occur, competitors can file protest inquiries for steward review.
              </p>
            </div>
            <Link
              href={`/srleague/${leagueId}/stewarding/new`}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-xl shadow-xs"
            >
              + File First Inquiry
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {protests.map((p) => (
              <div
                key={p.id}
                className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-neutral-200">
                  <strong className="text-sm font-black text-neutral-900">
                    {p.submitting_driver_name} vs {p.accused_driver_name}
                  </strong>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                    {p.status}
                  </span>
                </div>

                <p className="text-neutral-600 text-xs">
                  {p.description}
                </p>

                <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-bold pt-1">
                  <span>Lap {p.incident_lap || 1}</span>
                  <span>•</span>
                  <span>{p.incident_turn || "Turn 1"}</span>
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
