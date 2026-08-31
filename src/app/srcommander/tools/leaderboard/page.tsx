"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import {
  Trophy,
  ArrowLeft,
  Timer,
  Car,
  MapPin,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  RotateCcw,
  Loader2,
} from "lucide-react";

function LeaderboardToolContent() {
  const rigId = "rig_development_1_nncx";
  const [laps, setLaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "commander_laps"),
      where("rig_id", "==", rigId),
      orderBy("created_at", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setLaps(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Laps error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [rigId]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 sm:p-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <Link
            href="/srcommander"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-white transition px-4 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Toolbox</span>
          </Link>

          <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-700/50 text-[11px] font-mono uppercase font-bold">
            TOOL 04 • LAP LEADERBOARD
          </span>
        </div>

        {/* TITLE */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-white tracking-tight">
                Live Lap Records & Leaderboards
              </h1>
              <p className="text-xs text-neutral-400">
                Real-time sub-millisecond lap timing with personal best badges and top speeds.
              </p>
            </div>
          </div>
        </div>

        {/* LIVE LAPS TABLE */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="space-y-1 pb-2 border-b border-neutral-800">
            <h2 className="text-lg font-black uppercase text-white tracking-tight">Recent Stint Laps</h2>
            <p className="text-xs text-neutral-400">Updated automatically over 60Hz telemetry as you cross the start/finish line.</p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
              <span>Fetching live lap records...</span>
            </div>
          ) : laps.length === 0 ? (
            <div className="py-12 text-center space-y-2 bg-neutral-950 rounded-2xl border border-neutral-800 p-6">
              <Timer className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-sm font-black uppercase text-neutral-400">No Laps Recorded Yet</p>
              <p className="text-xs text-neutral-600">Jump on track and complete a flying lap to set the first record!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {laps.map((lap, idx) => (
                <div
                  key={lap.id}
                  className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center font-mono font-black text-xs text-amber-400">
                      P{idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <strong className="text-sm font-black text-white block">
                        {lap.driver_name || "Track Driver"}
                      </strong>
                      <span className="text-[11px] font-mono text-neutral-500 block">
                        {lap.car_name || "Mini Stock"} @ {lap.track_name || "South Boston Speedway"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5 font-mono">
                    <div className="text-base font-black text-emerald-400">
                      {typeof lap.lap_time === "number" ? lap.lap_time.toFixed(3) : lap.lap_time}s
                    </div>
                    {lap.top_speed_mph && (
                      <span className="text-[10px] text-neutral-500 block">
                        Top Speed: {lap.top_speed_mph.toFixed(1)} MPH
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardToolPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <LeaderboardToolContent />
    </Suspense>
  );
}
