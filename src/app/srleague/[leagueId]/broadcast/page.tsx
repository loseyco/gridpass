"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueBroadcastOverlayConfig } from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import {
  Tv,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Flag,
  Radio,
  Sliders,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

export default function LeagueBroadcastPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const { showToast } = useToast();
  const [league, setLeague] = useState<SRLeague | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeFlag, setActiveFlag] = useState<"GREEN" | "YELLOW" | "RED" | "CHECKERED">("GREEN");

  useEffect(() => {
    if (!leagueId) return;
    const unsub = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });
    return () => unsub();
  }, [leagueId]);

  const obsUrl = typeof window !== "undefined"
    ? `${window.location.origin}/srleague/overlay?leagueId=${leagueId}`
    : `/srleague/overlay?leagueId=${leagueId}`;

  const copyObsUrl = () => {
    navigator.clipboard.writeText(obsUrl);
    setCopied(true);
    showToast({
      title: "OBS URL Copied!",
      message: "Add as a Browser Source in OBS or vMix (1920x1080).",
      icon: "📺",
    });
    setTimeout(() => setCopied(false), 3000);
  };

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
                Broadcast Studio
              </h1>
              <span className="text-xs font-mono text-neutral-500">
                {league?.name || "Championship"} • Live Overlays
              </span>
            </div>
          </div>

          <Link
            href={`/srleague/overlay?leagueId=${leagueId}`}
            target="_blank"
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-mono font-bold uppercase rounded-2xl shadow-xs flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-neutral-600" />
            <span>Preview</span>
          </Link>
        </div>
      </header>

      {/* MAIN BROADCAST CONTROLS */}
      <main className="max-w-xl w-full mx-auto space-y-5 font-mono text-xs">
        
        {/* 1. PC TELEMETRY BRIDGE ENGINE (LOCAL WEBSOCKET) */}
        <div className="p-6 bg-neutral-900 text-white rounded-3xl space-y-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shadow-md shadow-red-600/30 shrink-0">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <strong className="text-sm font-black uppercase text-white block">
                  iRacing Telemetry PC Bridge
                </strong>
                <span className="text-[11px] text-neutral-400">
                  Runs locally on PC • 60 FPS Sub-5ms WebSocket Feed
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
              ws://127.0.0.1:8080
            </span>
          </div>

          <p className="text-xs text-neutral-300 font-sans leading-relaxed">
            Run the Python bridge on the PC running iRacing. It captures live positions, driver names, car numbers, speed, RPM tachometer, and throttle/brake traces directly from shared memory into OBS Studio.
          </p>

          <div className="p-3 bg-black/60 rounded-2xl border border-neutral-800 space-y-1.5 font-mono text-[11px]">
            <span className="text-[9px] uppercase font-bold text-neutral-500 block">Launch Command (Live iRacing):</span>
            <div className="flex items-center justify-between text-emerald-400 select-all break-all">
              <code>python scripts/gridpass_broadcast_bridge.py</code>
            </div>
            <span className="text-[9px] uppercase font-bold text-neutral-500 block pt-1">Or Simulate Test Telemetry:</span>
            <div className="flex items-center justify-between text-cyan-400 select-all break-all">
              <code>python scripts/gridpass_broadcast_bridge.py --mock</code>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText("python scripts/gridpass_broadcast_bridge.py");
                showToast({ title: "Command Copied!", message: "Paste into terminal to run bridge", icon: "📋" });
              }}
              className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Live Bridge Command</span>
            </button>
          </div>
        </div>

        {/* 2. OBS BROWSER SOURCE URL CARD */}
        <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/20 shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-sm font-black uppercase text-neutral-900 block">
                OBS Browser Source URL
              </strong>
              <span className="text-[11px] text-neutral-500">
                1920x1080 • Transparent Overlay
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-neutral-200 text-neutral-800 break-all select-all text-xs font-mono">
            {obsUrl}
          </div>

          <button
            type="button"
            onClick={copyObsUrl}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 active:scale-98 text-white font-black uppercase tracking-wider rounded-2xl transition shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Link Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy OBS Browser URL</span>
              </>
            )}
          </button>
        </div>

        {/* 2. RACE FLAGS OVERRIDE */}
        <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-neutral-600" />
            <strong className="text-sm font-black uppercase text-neutral-900">
              Live Race Flag Override
            </strong>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "GREEN", label: "🟢 Green Flag", bg: "bg-emerald-600 text-white border-emerald-600" },
              { id: "YELLOW", label: "🟡 Caution / SC", bg: "bg-amber-500 text-white border-amber-500" },
              { id: "RED", label: "🔴 Red Flag", bg: "bg-red-600 text-white border-red-600" },
              { id: "CHECKERED", label: "🏁 Checkered", bg: "bg-neutral-900 text-white border-neutral-900" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setActiveFlag(f.id as any);
                  showToast({ title: "Flag Updated", message: `Broadcast set to ${f.id}`, icon: "🚩" });
                }}
                className={`py-3 px-3 rounded-2xl border font-bold uppercase transition cursor-pointer text-center text-xs ${
                  activeFlag === f.id
                    ? `${f.bg} shadow-sm`
                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="max-w-xl w-full mx-auto text-center py-4 text-[11px] font-mono text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}
