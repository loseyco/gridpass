"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastContext";
import {
  Lightbulb,
  ArrowLeft,
  Sliders,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  Flag,
  Sun,
  ShieldCheck,
  Power,
  RotateCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function LightingToolContent() {
  const { showToast } = useToast();
  const rigId = "rig_development_1_nncx";

  const [beaconActive, setBeaconActive] = useState(false);
  const [activeCursor, setActiveCursor] = useState(65);
  const [c1, setC1] = useState(45);
  const [c2, setC2] = useState(65);
  const [c3, setC3] = useState(137);
  const [c4, setC4] = useState(156);
  const [c5, setC5] = useState(228);
  const [masterBrightness, setMasterBrightness] = useState(255);
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);

  const stepCursor = (delta: number) => {
    const next = Math.max(0, Math.min(300, activeCursor + delta));
    setActiveCursor(next);
    sendCalibrationUpdate(next, beaconActive);
  };

  const sendCalibrationUpdate = async (cursor: number, beacon: boolean) => {
    try {
      await fetch("/api/commander/calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rig_id: rigId,
          cursor_index: cursor,
          beacon_active: beacon,
          corner_1: c1,
          corner_2: c2,
          corner_3: c3,
          corner_4: c4,
          corner_5: c5,
        }),
      });
    } catch (e) {}
  };

  const testAnimation = async (name: string, overrideEvent: string) => {
    setActiveAnimation(name);
    showToast({
      title: `💡 LED Test: ${name}`,
      message: "Sending lighting command to Halo Canopy...",
      icon: "✨",
    });

    try {
      await fetch("/api/commander/lights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rig_id: rigId,
          override_event: overrideEvent,
        }),
      });
    } catch (e) {} finally {
      setTimeout(() => setActiveAnimation(null), 3000);
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

          <span className="px-3 py-1 rounded-full bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-700/50 text-[11px] font-mono uppercase font-bold">
            TOOL 01 • CORNER LED SETUP
          </span>
        </div>

        {/* TITLE */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-fuchsia-600/20 border border-fuchsia-500/40 flex items-center justify-center">
              <Lightbulb className="w-7 h-7 text-fuchsia-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-white tracking-tight">
                WS2812B Corner LED & Canopy Setup
              </h1>
              <p className="text-xs text-neutral-400">
                Calibrate physical corner coordinates and test live track lighting effects.
              </p>
            </div>
          </div>
        </div>

        {/* 1. PHYSICAL 4-CORNER CALIBRATION */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-tight">
                Physical Corner Calibration
              </h2>
              <p className="text-xs text-neutral-400">
                Move the blinking calibration beacon around the canopy to find exact corner LED indexes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !beaconActive;
                setBeaconActive(next);
                sendCalibrationUpdate(activeCursor, next);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                beaconActive
                  ? "bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/40"
                  : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{beaconActive ? "Beacon: BLINKING" : "Turn Beacon ON"}</span>
            </button>
          </div>

          {/* STEPPER CONTROLS & SLIDER */}
          <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 space-y-5 text-center">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-neutral-500 uppercase block">Active Blinking LED Pin</span>
              <div className="text-5xl font-black font-mono text-fuchsia-400 tracking-wider">
                #{activeCursor}
              </div>
            </div>

            {/* STEPPERS */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => stepCursor(-10)}
                className="px-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-mono font-bold text-sm rounded-xl cursor-pointer"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => stepCursor(-1)}
                className="px-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-mono font-bold text-sm rounded-xl cursor-pointer"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => stepCursor(1)}
                className="px-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-mono font-bold text-sm rounded-xl cursor-pointer"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => stepCursor(10)}
                className="px-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-mono font-bold text-sm rounded-xl cursor-pointer"
              >
                +10
              </button>
            </div>

            {/* RANGE SLIDER */}
            <div className="px-4">
              <input
                type="range"
                min="0"
                max="300"
                value={activeCursor}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setActiveCursor(val);
                  sendCalibrationUpdate(val, beaconActive);
                }}
                className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1">
                <span>0</span>
                <span>75</span>
                <span>150</span>
                <span>225</span>
                <span>300</span>
              </div>
            </div>

            {/* 5 INSTANT ASSIGN BUTTONS */}
            <div className="pt-3 border-t border-neutral-800/80">
              <span className="text-[11px] font-mono text-neutral-400 block mb-2 font-bold uppercase">
                Assign Current Pin #{activeCursor} to Corner:
              </span>
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => { setC1(activeCursor); showToast({ title: "Corner 1 Set", message: `Rear-Left = Pin #${activeCursor}`, icon: "📍" }); }}
                  className="py-2.5 px-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Set C1 ({c1})
                </button>
                <button
                  type="button"
                  onClick={() => { setC2(activeCursor); showToast({ title: "Corner 2 Set", message: `Front-Left = Pin #${activeCursor}`, icon: "📍" }); }}
                  className="py-2.5 px-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Set C2 ({c2})
                </button>
                <button
                  type="button"
                  onClick={() => { setC3(activeCursor); showToast({ title: "Corner 3 Set", message: `Front-Right = Pin #${activeCursor}`, icon: "📍" }); }}
                  className="py-2.5 px-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Set C3 ({c3})
                </button>
                <button
                  type="button"
                  onClick={() => { setC4(activeCursor); showToast({ title: "Corner 4 Set", message: `Rear-Right = Pin #${activeCursor}`, icon: "📍" }); }}
                  className="py-2.5 px-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Set C4 ({c4})
                </button>
                <button
                  type="button"
                  onClick={() => { setC5(activeCursor); showToast({ title: "Corner 5 Set", message: `End Rear-Left = Pin #${activeCursor}`, icon: "📍" }); }}
                  className="py-2.5 px-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Set C5 ({c5})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. LIVE LIGHTING ANIMATION TEST BUTTONS */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="space-y-1 pb-2 border-b border-neutral-800">
            <h2 className="text-lg font-black uppercase text-white tracking-tight">
              Test Live Halo Animations
            </h2>
            <p className="text-xs text-neutral-400">
              Click any effect to broadcast the animation directly to your physical LED canopy.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => testAnimation("Solid White Flood", "flood_white")}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-white text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Sun className="w-4 h-4 text-amber-300" />
              <span>100% White Dome</span>
            </button>

            <button
              type="button"
              onClick={() => testAnimation("Green Flag Launch", "green_flag")}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500 text-emerald-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Flag className="w-4 h-4" />
              <span>Green Flag</span>
            </button>

            <button
              type="button"
              onClick={() => testAnimation("Yellow Caution Hazard", "yellow_caution")}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500 text-amber-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Flag className="w-4 h-4" />
              <span>Yellow Caution</span>
            </button>

            <button
              type="button"
              onClick={() => testAnimation("Red Flag Strobe", "red_flag")}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-red-500 text-red-500 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Flag className="w-4 h-4" />
              <span>Red Flag</span>
            </button>

            <button
              type="button"
              onClick={() => testAnimation("Checkered Victory", "checkered")}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Flag className="w-4 h-4" />
              <span>Checkered Flag</span>
            </button>

            <button
              type="button"
              onClick={() => testAnimation("Blue Passing Advisory", "blue_flag")}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-blue-500 text-blue-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Flag className="w-4 h-4" />
              <span>Blue Flag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LightingToolPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-fuchsia-600" />
        </div>
      }
    >
      <LightingToolContent />
    </Suspense>
  );
}
