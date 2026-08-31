"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastContext";
import {
  Wind,
  ArrowLeft,
  Sliders,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Gauge,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

function WindToolContent() {
  const { showToast } = useToast();
  const rigId = "rig_development_1_nncx";

  const [masterPower, setMasterPower] = useState(100);
  const [minSpeedMph, setMinSpeedMph] = useState(10);
  const [maxSpeedMph, setMaxSpeedMph] = useState(130);
  const [curve, setCurve] = useState<"linear" | "aggressive" | "smooth">("aggressive");
  const [testingFan, setTestingFan] = useState<string | null>(null);

  const testFanBlast = async (side: "both" | "left" | "right", label: string) => {
    setTestingFan(side);
    showToast({
      title: `🌪️ Fan Test: ${label}`,
      message: "Sending 100% PWM speed burst to Arduino pins 2 & 3...",
      icon: "💨",
    });

    try {
      await fetch("/api/commander/lights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rig_id: rigId,
          override_event: `fan_${side}_100`,
        }),
      });
    } catch (e) {} finally {
      setTimeout(() => setTestingFan(null), 3000);
    }
  };

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

          <span className="px-3 py-1 rounded-full bg-blue-950 text-blue-400 border border-blue-700/50 text-[11px] font-mono uppercase font-bold">
            TOOL 03 • DUAL WIND CONTROLLER
          </span>
        </div>

        {/* TITLE */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
              <Wind className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-white tracking-tight">
                Dual Wind Fan Simulation Tuner
              </h1>
              <p className="text-xs text-neutral-400">
                Calibrate 4-pin PWM aerodynamic wind speed curves and yaw angle directional drafts.
              </p>
            </div>
          </div>
        </div>

        {/* 1. MASTER POWER & SPEED CURVE */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1 pb-2 border-b border-neutral-800">
            <h2 className="text-lg font-black uppercase text-white tracking-tight">
              Master Fan Output & Aerodynamics
            </h2>
            <p className="text-xs text-neutral-400">
              Adjust peak wind power and speed activation thresholds.
            </p>
          </div>

          <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 space-y-6 text-center">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-neutral-500 uppercase block">Master Fan Power Output</span>
              <div className="text-5xl font-black font-mono text-blue-400 tracking-wider">
                {masterPower}%
              </div>
            </div>

            <div className="px-4">
              <input
                type="range"
                min="0"
                max="100"
                value={masterPower}
                onChange={(e) => setMasterPower(parseInt(e.target.value))}
                className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1">
                <span>0% (OFF)</span>
                <span>50% (Breeze)</span>
                <span>100% (Full Storm)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setCurve("linear")}
                className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                  curve === "linear" ? "bg-blue-950 border-blue-500 text-white" : "bg-neutral-900 border-neutral-800 text-neutral-400"
                }`}
              >
                <strong className="text-xs font-black uppercase block">Linear Curve</strong>
                <span className="text-[10px] block text-neutral-400">Direct 1:1 speed ratio.</span>
              </button>

              <button
                type="button"
                onClick={() => setCurve("aggressive")}
                className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                  curve === "aggressive" ? "bg-blue-950 border-blue-500 text-white" : "bg-neutral-900 border-neutral-800 text-neutral-400"
                }`}
              >
                <strong className="text-xs font-black uppercase block">Aggressive High-Speed</strong>
                <span className="text-[10px] block text-neutral-400">Exponential blast &gt;60 MPH.</span>
              </button>

              <button
                type="button"
                onClick={() => setCurve("smooth")}
                className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                  curve === "smooth" ? "bg-blue-950 border-blue-500 text-white" : "bg-neutral-900 border-neutral-800 text-neutral-400"
                }`}
              >
                <strong className="text-xs font-black uppercase block">Smooth Oval Cruise</strong>
                <span className="text-[10px] block text-neutral-400">Gentle cockpit airflow.</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. TEST BLAST BUTTONS */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="space-y-1 pb-2 border-b border-neutral-800">
            <h2 className="text-lg font-black uppercase text-white tracking-tight">
              Test Physical Fan Blasts
            </h2>
            <p className="text-xs text-neutral-400">
              Trigger instant 3-second hardware bursts on Arduino PWM pins 2 & 3.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <button
              type="button"
              onClick={() => testFanBlast("left", "Left Fan (Pin 2)")}
              className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Wind className="w-5 h-5 text-blue-400" />
              <span>Left Fan (100%)</span>
            </button>

            <button
              type="button"
              onClick={() => testFanBlast("both", "Dual Fans (100%)")}
              className="p-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <Wind className="w-5 h-5 fill-white" />
              <span>Dual Full Blast (100%)</span>
            </button>

            <button
              type="button"
              onClick={() => testFanBlast("right", "Right Fan (Pin 3)")}
              className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Wind className="w-5 h-5 text-blue-400" />
              <span>Right Fan (100%)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WindToolPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <WindToolContent />
    </Suspense>
  );
}
