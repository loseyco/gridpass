"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, query, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { CommanderRig, CommanderLeaderboardEntry, CommanderGridStartSequence } from "@/lib/types/commander";
import GridpassQRCode from "@/components/qr/GridpassQRCode";
import {
  Trophy,
  Flag,
  Zap,
  Gauge,
  Flame,
  Wind,
  Maximize2,
  Minimize2,
  Tv,
  Users,
  Award,
  ChevronRight,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function CommanderVenueTVJumbotronPage() {
  const [rigs, setRigs] = useState<CommanderRig[]>([]);
  const [leaderboard, setLeaderboard] = useState<CommanderLeaderboardEntry[]>([]);
  const [gridStart, setGridStart] = useState<CommanderGridStartSequence | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [activeFlag, setActiveFlag] = useState<"GREEN" | "YELLOW" | "RED">("GREEN");
  const [trackProgressTick, setTrackProgressTick] = useState(0);

  // Periodic Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      setTrackProgressTick((p) => (p + 0.002) % 1);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // 1. Subscribe to Connected Sim Rigs
  useEffect(() => {
    const q = query(collection(db, "commander_rigs"));
    const unsub = onSnapshot(q, (snap) => {
      const list: CommanderRig[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setRigs(list);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Leaderboard Entries
  useEffect(() => {
    const q = query(collection(db, "commander_leaderboard"));
    const unsub = onSnapshot(q, (snap) => {
      const list: CommanderLeaderboardEntry[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (a.lap_time || a.fastest_lap_time || (a.best_lap_ms ? a.best_lap_ms / 1000 : 999)) - (b.lap_time || b.fastest_lap_time || (b.best_lap_ms ? b.best_lap_ms / 1000 : 999)));
      setLeaderboard(list.slice(0, 10));
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to 5-Light Grid Start Sequence
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "commander_race_control", "grid_start"), (snap) => {
      if (snap.exists()) {
        setGridStart(snap.data() as CommanderGridStartSequence);
      }
    });
    return () => unsub();
  }, []);

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Timing Tower Drivers
  const timingRows = useMemo(() => {
    const defaultList = [
      { pos: 1, name: "Marcus Vance", car: "Porsche 911 GT3 R", num: "44", gap: "LEADER", int: "LEADER", best: "1:42.890", isFastest: true, speed: 168, rpm: 8400, throttle: 0.95, brake: 0.0, gear: 5 },
      { pos: 2, name: "Sarah Koenig", car: "Ferrari 296 GT3", num: "77", gap: "+0.420", int: "+0.420", best: "1:43.012", isFastest: false, speed: 167, rpm: 8350, throttle: 0.92, brake: 0.0, gear: 5 },
      { pos: 3, name: "Dave Reynolds", car: "BMW M4 GT3", num: "19", gap: "+2.140", int: "+1.720", best: "1:43.950", isFastest: false, speed: 162, rpm: 7900, throttle: 0.85, brake: 0.1, gear: 4 },
      { pos: 4, name: "Steve Mercer", car: "Cadillac V-Series.R", num: "99", gap: "+3.850", int: "+1.710", best: "1:38.210", isFastest: false, speed: 194, rpm: 9100, throttle: 1.0, brake: 0.0, gear: 6 },
    ];

    if (rigs.length > 0) {
      return rigs.map((r, idx) => {
        const telem = r.telemetry;
        return {
          pos: idx + 1,
          name: r.current_driver?.name || `Pod Driver #${idx + 1}`,
          car: telem?.car_name || "GT3 Race Car",
          num: (idx + 1).toString().padStart(2, "0"),
          gap: idx === 0 ? "LEADER" : `+${(idx * 0.95).toFixed(3)}`,
          int: idx === 0 ? "LEADER" : `+${(0.42 + (idx % 2) * 0.5).toFixed(3)}`,
          best: telem?.best_lap ? `${telem.best_lap.toFixed(3)}s` : "1:43.200",
          isFastest: idx === 0,
          speed: telem?.speed ? Math.round(telem.speed * 2.23694) : 160,
          rpm: telem?.rpm || 7500,
          throttle: telem?.throttle ?? 0.8,
          brake: telem?.brake ?? 0.0,
          gear: telem?.gear || 4,
        };
      });
    }
    return defaultList;
  }, [rigs]);

  return (
    <div className="min-h-screen w-screen bg-[#060608] text-white font-sans select-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      
      {/* 1. HEADER: BRAND, TRACK WEATHER & CLOCK */}
      <header className="flex items-center justify-between bg-neutral-950/90 border border-neutral-800/90 rounded-3xl px-6 py-3.5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-red-600/40">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                SIM RACING COMMANDER • 4K JUMBOTRON
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-950 text-red-400 border border-red-500/40">
                LIVE ARENA FEED
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-bold">
              High-Speed Multi-Rig Telemetry • Live Timing Tower • GPS Radar
            </p>
          </div>
        </div>

        {/* Center: Live Flag & Weather */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-neutral-900 border border-neutral-800">
            <Wind className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-neutral-300">
              Track Temp: <strong className="text-white">84°F</strong> • Wind: <strong className="text-white">6 MPH WNW</strong>
            </span>
          </div>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider border ${
              activeFlag === "GREEN"
                ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                : activeFlag === "YELLOW"
                ? "bg-amber-950 text-amber-400 border-amber-500/40 animate-pulse"
                : "bg-red-950 text-red-400 border-red-500/40 animate-bounce"
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>TRACK STATUS: {activeFlag} FLAG</span>
          </div>
        </div>

        {/* Right: Race Clock & Fullscreen Toggle */}
        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <span className="text-[10px] text-neutral-400 block font-black uppercase">SESSION TIME</span>
            <span className="text-xl sm:text-2xl font-black text-white">
              {new Date(now).toLocaleTimeString()}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 transition cursor-pointer"
            title="Toggle 4K Fullscreen TV Mode"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 2. SYNCHRONIZED 5-RED-LIGHT GANTRY OVERLAY (IF ACTIVE) */}
      {gridStart && gridStart.state !== "idle" && (
        <div className="my-4 p-5 bg-neutral-950/95 border-2 border-red-600 rounded-3xl text-center space-y-3 shadow-[0_0_50px_rgba(239,68,68,0.4)] animate-in fade-in">
          <span className="text-xs font-mono font-black uppercase text-red-500 tracking-widest">
            🏁 FIA SYNCHRONIZED START GANTRY • ALL PODS ON GRID
          </span>
          <div className="flex items-center justify-center gap-6">
            {[1, 2, 3, 4, 5].map((idx) => {
              const isRed = (gridStart.state === "counting" || gridStart.state === "arming") && gridStart.lights_lit >= idx;
              const isGreen = gridStart.state === "lights_out";

              return (
                <div
                  key={idx}
                  className={`w-12 h-12 rounded-full border-4 transition-all duration-100 flex items-center justify-center ${
                    isRed
                      ? "bg-red-600 border-red-300 shadow-[0_0_30px_rgba(239,68,68,1)] scale-110"
                      : isGreen
                      ? "bg-emerald-500 border-emerald-200 shadow-[0_0_35px_rgba(16,185,129,1)] scale-115 animate-ping"
                      : "bg-neutral-900 border-neutral-800 opacity-30"
                  }`}
                >
                  {isRed && <div className="w-3 h-3 bg-white rounded-full opacity-80" />}
                </div>
              );
            })}
          </div>
          <h2 className="text-2xl font-black uppercase text-white tracking-wider">
            {gridStart.state === "lights_out"
              ? "🟢 LIGHTS OUT AND AWAY WE GO!"
              : `🔴 COUNTDOWN: ${gridStart.lights_lit} / 5`}
          </h2>
        </div>
      )}

      {/* 3. MAIN 3-COLUMN BROADCAST GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-4 flex-1 items-stretch">
        
        {/* COL 1 (Col 3): TIMING TOWER */}
        <section className="lg:col-span-3 bg-neutral-950/90 border-2 border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> LIVE TIMING TOWER
            </span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 font-mono text-[9px] font-bold">
              INTERVAL
            </span>
          </div>

          <div className="space-y-2 flex-1">
            {timingRows.map((r) => (
              <div
                key={r.pos}
                className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                  r.pos === 1
                    ? "bg-amber-500/10 border-amber-500/40"
                    : "bg-neutral-900/60 border-neutral-800/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs ${
                      r.pos === 1
                        ? "bg-amber-500 text-black"
                        : r.pos === 2
                        ? "bg-neutral-300 text-black"
                        : r.pos === 3
                        ? "bg-amber-800 text-white"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {r.pos}
                  </span>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white truncate max-w-[110px]">{r.name}</h4>
                    <span className="text-[9px] font-mono text-neutral-400 block truncate">{r.car}</span>
                  </div>
                </div>

                <div className="text-right font-mono text-[10px]">
                  <span className={`font-black ${r.pos === 1 ? "text-amber-400" : "text-neutral-300"}`}>
                    {r.gap}
                  </span>
                  <span className="text-neutral-500 block">{r.best}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COL 2 (Col 6): MOVING CIRCUIT MINIMAP & BATTLE BOX */}
        <section className="lg:col-span-6 bg-neutral-950/90 border-2 border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> LIVE CIRCUIT GPS RADAR • WATKINS GLEN
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[9px] font-black text-emerald-400">
              ● 60 HZ TELEMETRY
            </span>
          </div>

          {/* SVG Map */}
          <div className="h-64 bg-neutral-900/50 rounded-2xl flex items-center justify-center relative overflow-hidden border border-neutral-800/80">
            <svg viewBox="0 0 200 120" className="w-full h-full p-4">
              <path
                d="M 30,60 C 30,20 60,20 100,25 C 140,30 170,20 170,50 C 170,80 150,100 120,95 C 90,90 70,105 45,95 C 30,85 30,70 30,60 Z"
                fill="none"
                stroke="#333333"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 30,60 C 30,20 60,20 100,25"
                fill="none"
                stroke="#ef4444"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 100,25 C 140,30 170,20 170,50"
                fill="none"
                stroke="#eab308"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 170,50 C 170,80 150,100 120,95 C 90,90 70,105 45,95 C 30,85 30,70 30,60 Z"
                fill="none"
                stroke="#10b981"
                strokeWidth="8"
                strokeLinecap="round"
              />

              {/* Dynamic Car Dots */}
              <circle
                cx={30 + Math.sin(trackProgressTick * Math.PI * 2) * 60 + 70}
                cy={60 + Math.cos(trackProgressTick * Math.PI * 2) * 35}
                r="7"
                fill="#fbbf24"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <circle
                cx={30 + Math.sin((trackProgressTick - 0.04) * Math.PI * 2) * 60 + 70}
                cy={60 + Math.cos((trackProgressTick - 0.04) * Math.PI * 2) * 35}
                r="6"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Bottom Battle Box Callout */}
          <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-red-500 animate-pulse" />
              <div>
                <span className="text-xs font-black uppercase text-white block">
                  TOP BATTLE FOR THE LEAD: MARCUS VANCE VS SARAH KOENIG
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Gap: +0.420s • Speeds: 168 MPH vs 167 MPH
                </span>
              </div>
            </div>
            <span className="px-3 py-1 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md">
              LIVE FOCUS
            </span>
          </div>
        </section>

        {/* COL 3 (Col 3): DAILY BENCHMARK & QR FAST PASS */}
        <section className="lg:col-span-3 bg-neutral-950/90 border-2 border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> HALL OF FAME BENCHMARKS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 font-mono text-[9px] font-bold">
              TODAY
            </span>
          </div>

          <div className="space-y-2 flex-1">
            {leaderboard.length > 0 ? (
              leaderboard.slice(0, 5).map((entry, idx) => (
                <div
                  key={entry.id}
                  className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-neutral-500">#{idx + 1}</span>
                    <span className="font-bold text-white uppercase">{entry.driver_name}</span>
                  </div>
                  <span className="font-mono font-black text-amber-400">
                    {entry.best_lap_formatted || (entry.lap_time ? `${entry.lap_time.toFixed(3)}s` : "--:--.---")}
                  </span>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                {[
                  { pos: 1, name: "Marcus Vance", time: "1:42.890" },
                  { pos: 2, name: "Sarah Koenig", time: "1:43.012" },
                  { pos: 3, name: "Dave Reynolds", time: "1:43.950" },
                ].map((m) => (
                  <div key={m.pos} className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-neutral-500">#{m.pos}</span>
                      <span className="font-black uppercase text-white">{m.name}</span>
                    </div>
                    <span className="font-mono font-black text-amber-400">{m.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QR Fast Pass Card */}
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-red-500 block">
                📲 SCAN TO JOIN NEXT GRID
              </span>
              <p className="text-[10px] text-neutral-400 font-bold leading-tight">
                Instant queue registration on your smartphone.
              </p>
            </div>
            <div className="p-2 bg-white rounded-xl shrink-0">
              <GridpassQRCode value="/srcommander/queue" size={54} />
            </div>
          </div>
        </section>
      </main>

      {/* 4. FOOTER TICKER */}
      <footer className="flex items-center justify-between bg-neutral-950/90 border border-neutral-800 rounded-2xl px-6 py-2.5 text-xs font-mono text-neutral-400 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-red-500 font-black uppercase flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> SPONSOR REEL:
          </span>
          <span className="text-neutral-300">
            ⚡ GRIDPASS DIRECT DRIVE PODS • 🥤 ORDER DRINKS AT THE PADDOCK LOUNGE • 🏁 NEXT STINT IN 3 MINS
          </span>
        </div>

        <div className="flex items-center gap-2 font-bold">
          <span className="text-emerald-400">● 60 FPS 4K</span>
          <span>•</span>
          <span className="text-white">SIM ARENA 1</span>
        </div>
      </footer>
    </div>
  );
}
