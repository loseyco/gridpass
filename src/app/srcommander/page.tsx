"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import SRUserIdentityManager, { CommanderUserProfile } from "@/components/commander/SRUserIdentityManager";
import SRBusinessRigManager, { SRRigProfile } from "@/components/commander/SRBusinessRigManager";
import {
  Monitor,
  Zap,
  HardDrive,
  Loader2,
} from "lucide-react";

function SRCommanderCleanLandingContent() {
  const { user } = useAuth();
  const [telemetryLive, setTelemetryLive] = useState(false);
  const [activeProfile, setActiveProfile] = useState<CommanderUserProfile | null>(null);
  const [activeRig, setActiveRig] = useState<SRRigProfile | null>(null);

  // Check live telemetry polling
  useEffect(() => {
    const checkTelemetry = async () => {
      try {
        const rigId = activeRig ? activeRig.id : "rig_development_1_nncx";
        const res = await fetch(`/api/commander/telemetry?rig_id=${rigId}`);
        if (res.ok) {
          const data = await res.json();
          setTelemetryLive(Boolean(data.is_live || data.telemetry?.is_live || data.speed > 0));
        }
      } catch (e) {
        setTelemetryLive(false);
      }
    };

    checkTelemetry();
    const interval = setInterval(checkTelemetry, 2000);
    return () => clearInterval(interval);
  }, [activeRig]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR (WHITE, RED & CHARCOAL THEME)
         ───────────────────────────────────────────────────────────── */}
      <header className="max-w-4xl w-full mx-auto bg-neutral-50 border border-neutral-200 rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
        {/* LOGO & TITLE */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center font-black text-xl tracking-tighter text-white shadow-md shadow-red-600/30">
            GP
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight text-neutral-900 leading-none">
              GridPass Sim Commander
            </h1>
            <span className="text-[11px] font-mono text-neutral-500 font-bold">
              {activeRig ? activeRig.name : "Hardware Standby"}
            </span>
          </div>
        </div>

        {/* STATUS PILL */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
              telemetryLive
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-neutral-100 text-neutral-600 border-neutral-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                telemetryLive ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
              }`}
            />
            <span>{telemetryLive ? "60Hz Telemetry Live" : "Engine Standby"}</span>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. WORKSPACE: USER IDENTITY + BUSINESS & RIG FLEET
         ───────────────────────────────────────────────────────────── */}
      <main className="max-w-4xl w-full mx-auto space-y-6">
        {/* STEP 1: USER IDENTITY */}
        <SRUserIdentityManager onUserChange={(p) => setActiveProfile(p)} />

        {/* STEP 2: BUSINESS / VENUE & RIG FLEET */}
        <SRBusinessRigManager onActiveRigChange={(r) => setActiveRig(r)} />

        {/* STEP 3: COMMANDER TOOLS */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-2">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block font-mono">
            Commander Motorsport Tools:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Link
              href="/srcommander/results"
              className="p-3.5 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-2xl flex items-center justify-between transition shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-black uppercase text-neutral-900 block">
                    iRacing Results Reader & Telemetry
                  </strong>
                  <span className="text-[10px] text-neutral-500 font-sans block">
                    Inspect classifications, lap pace, incidents & iRating
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. MINIMAL FOOTER
         ───────────────────────────────────────────────────────────── */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-[11px] font-mono text-neutral-400 flex items-center justify-center gap-2">
        <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
        <span>GridPass Commander • 60Hz Motorsport Engine</span>
      </footer>
    </div>
  );
}

export default function SRCommanderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      }
    >
      <SRCommanderCleanLandingContent />
    </Suspense>
  );
}
