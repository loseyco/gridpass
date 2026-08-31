"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastContext";
import {
  Gamepad2,
  ArrowLeft,
  Play,
  RotateCcw,
  Zap,
  Flame,
  LogOut,
  Sliders,
  Sparkles,
  CheckCircle2,
  Tv,
  Camera,
  Layers,
  Loader2,
  ShieldCheck,
} from "lucide-react";

function ControlsToolContent() {
  const { showToast } = useToast();
  const rigId = "rig_development_1_nncx";
  const [triggeringCmd, setTriggeringCmd] = useState<string | null>(null);

  const triggerCmd = async (command: string, label: string) => {
    setTriggeringCmd(command);
    showToast({
      title: `⚡ ${label}`,
      message: "Executing DirectInput macro on sim rig...",
      icon: "🏎️",
    });

    try {
      await fetch("/api/commander/controls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rig_id: rigId,
          command: command,
        }),
      });
    } catch (e) {} finally {
      setTimeout(() => setTriggeringCmd(null), 1500);
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

          <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-700/50 text-[11px] font-mono uppercase font-bold">
            TOOL 02 • BUTTON BOX & MACROS
          </span>
        </div>

        {/* TITLE */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center">
              <Gamepad2 className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-white tracking-tight">
                Smart Cockpit Button Box & Macros
              </h1>
              <p className="text-xs text-neutral-400">
                1-tap hardware automation: Drive Now, Ignition, Starter, Safe Tow, and Camera switching.
              </p>
            </div>
          </div>
        </div>

        {/* PRIMARY INTAKE / DRIVE BUTTON */}
        <div className="bg-neutral-900 border-2 border-red-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-center">
          <span className="text-[11px] font-mono text-red-400 uppercase font-bold tracking-wider">
            Primary Driver Intake Action
          </span>

          <button
            type="button"
            onClick={() => triggerCmd("enter_car", "Drive Now (Enter Car)")}
            disabled={triggeringCmd === "enter_car"}
            className="w-full py-6 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-black text-xl sm:text-2xl uppercase tracking-widest rounded-3xl transition shadow-2xl shadow-red-600/40 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {triggeringCmd === "enter_car" ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin" />
                <span>Entering Car...</span>
              </>
            ) : (
              <>
                <Play className="w-7 h-7 fill-white" />
                <span>DRIVE NOW (ENTER CAR)</span>
              </>
            )}
          </button>
          <p className="text-xs text-neutral-400">
            Memorizes mouse cursor ➔ Clicks <strong>Request New Car</strong> ➔ Clicks <strong>Test/Drive</strong> ➔ Restores mouse instantly.
          </p>
        </div>

        {/* HARDWARE MACRO GRID */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="space-y-1 pb-2 border-b border-neutral-800">
            <h2 className="text-lg font-black uppercase text-white tracking-tight">Cockpit Macros & Controls</h2>
            <p className="text-xs text-neutral-400">DirectInput keystroke macros injected with 0ms delay into iRacing.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {/* IGNITION */}
            <button
              type="button"
              onClick={() => triggerCmd("ignition", "Toggle Ignition ('I')")}
              className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500 text-left space-y-2 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <Flame className="w-6 h-6 text-amber-400 group-hover:scale-110 transition" />
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-md">KEY: I</span>
              </div>
              <strong className="text-sm font-black uppercase text-white block">Smart Ignition</strong>
              <span className="text-xs text-neutral-400 block">Toggles engine electronic ignition ON/OFF.</span>
            </button>

            {/* STARTER */}
            <button
              type="button"
              onClick={() => triggerCmd("starter", "Crank Starter ('S')")}
              className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500 text-left space-y-2 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <Zap className="w-6 h-6 text-amber-400 group-hover:scale-110 transition" />
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-md">KEY: S</span>
              </div>
              <strong className="text-sm font-black uppercase text-white block">Starter Motor</strong>
              <span className="text-xs text-neutral-400 block">Cranks engine starter for 1.2 seconds.</span>
            </button>

            {/* SAFE TOW / RESET */}
            <button
              type="button"
              onClick={() => triggerCmd("smart_reset", "Safe Tow / Reset (Shift+R)")}
              className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-cyan-500 text-left space-y-2 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <RotateCcw className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition" />
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-md">KEY: Shift+R</span>
              </div>
              <strong className="text-sm font-black uppercase text-white block">Safe Tow / Reset</strong>
              <span className="text-xs text-neutral-400 block">Brakes to 0 MPH then resets car to pit stall.</span>
            </button>

            {/* DRIVER EJECT */}
            <button
              type="button"
              onClick={() => triggerCmd("eject", "Driver Eject (Escape Hold)")}
              className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-red-500 text-left space-y-2 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <LogOut className="w-6 h-6 text-red-400 group-hover:scale-110 transition" />
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-md">KEY: Escape</span>
              </div>
              <strong className="text-sm font-black uppercase text-white block">Driver Eject</strong>
              <span className="text-xs text-neutral-400 block">Holds Escape for 2.5s to exit to garage screen.</span>
            </button>

            {/* PIT LIMITER */}
            <button
              type="button"
              onClick={() => triggerCmd("pit_limiter", "Toggle Pit Limiter (''')")}
              className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500 text-left space-y-2 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <Sliders className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition" />
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-md">KEY: '</span>
              </div>
              <strong className="text-sm font-black uppercase text-white block">Pit Road Limiter</strong>
              <span className="text-xs text-neutral-400 block">Engages/disengages pit speed limiter.</span>
            </button>

            {/* VISOR TEAROFF */}
            <button
              type="button"
              onClick={() => triggerCmd("tearoff", "Visor Tearoff (Alt+T)")}
              className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-blue-500 text-left space-y-2 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <Sparkles className="w-6 h-6 text-blue-400 group-hover:scale-110 transition" />
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-md">KEY: Alt+T</span>
              </div>
              <strong className="text-sm font-black uppercase text-white block">Visor Tearoff</strong>
              <span className="text-xs text-neutral-400 block">Cleans windshield / visor immediately.</span>
            </button>
          </div>
        </div>

        {/* CAMERAS */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="space-y-1 pb-2 border-b border-neutral-800">
            <h2 className="text-lg font-black uppercase text-white tracking-tight">Camera & Broadcast Viewers</h2>
            <p className="text-xs text-neutral-400">Switch simulator display angles instantly.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <button
              type="button"
              onClick={() => triggerCmd("cam_cockpit", "Cockpit Camera")}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-white text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Cockpit</span>
            </button>
            <button
              type="button"
              onClick={() => triggerCmd("cam_chase", "Chase Camera")}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-white text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Chase</span>
            </button>
            <button
              type="button"
              onClick={() => triggerCmd("cam_tv1", "TV Scenic Camera")}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-white text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Tv className="w-4 h-4 text-fuchsia-400" />
              <span>TV Broadcast</span>
            </button>
            <button
              type="button"
              onClick={() => triggerCmd("replay_highlights", "Stint Replay")}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-white text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Replay Highlights</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ControlsToolPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <ControlsToolContent />
    </Suspense>
  );
}
