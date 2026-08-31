"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ToastContext";
import {
  ArrowLeft,
  RotateCcw,
  Power,
  Zap,
  ShieldCheck,
  Eye,
  LogOut,
  Terminal,
  HardDrive,
  Loader2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Car,
  Activity,
} from "lucide-react";

interface PageProps {
  params: Promise<{ rigId: string }>;
}

export default function RigControlsPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const rigId = unwrappedParams?.rigId || "rig_rjhfri1";

  const { user } = useAuth();
  const { showToast } = useToast();

  const [rig, setRig] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [now, setNow] = useState(Date.now());
  const [isExecutingCmd, setIsExecutingCmd] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<Array<{ id: string; time: string; msg: string; type: string }>>([]);

  // 1. Heartbeat
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  // 2. Listen to Rig Profile
  useEffect(() => {
    if (!rigId) return;
    const unsub = onSnapshot(doc(db, "commander_rigs", rigId), (snap) => {
      if (snap.exists()) {
        setRig({ id: snap.id, ...snap.data() });
      }
    });
    return () => unsub();
  }, [rigId]);

  // 3. Fast Telemetry Polling (Every 200ms)
  useEffect(() => {
    let isMounted = true;
    const checkTelemetry = async () => {
      try {
        const res = await fetch(`/api/commander/telemetry?rig_id=${rigId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.telemetry) {
            setTelemetry(data.telemetry);
          }
        }
      } catch (e) {}
    };

    checkTelemetry();
    const interval = setInterval(checkTelemetry, 200);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [rigId]);

  // Telemetry evaluations
  const isTelemetryLive = Boolean(
    telemetry && telemetry.timestamp && now - telemetry.timestamp < 3500
  );

  // In-Car state
  const isInCar = Boolean(isTelemetryLive && telemetry?.is_on_track);
  
  // Engine RPM and running state (>350 RPM = running)
  const rpm = telemetry?.rpm ? Math.round(Number(telemetry.rpm)) : 0;
  const isEngineRunning = Boolean(isInCar && rpm > 350);
  const speedMph = telemetry?.speed ? Math.round(Number(telemetry.speed) * 2.23694) : 0;
  
  // Pit limiter active state
  const isPitLimiterActive = Boolean(
    telemetry?.is_pit_limiter_active ||
    (telemetry?.EngineWarnings && (Number(telemetry.EngineWarnings) & 0x01) !== 0)
  );

  // Dispatch hardware command to localhost daemon
  const triggerCommand = async (cmd: string, label: string) => {
    setIsExecutingCmd(cmd);
    const logEntry = {
      id: Math.random().toString(36).substring(2, 7),
      time: new Date().toLocaleTimeString(),
      msg: `Dispatched '${label}' to simulator DirectInput daemon.`,
      type: "cmd",
    };
    setRecentLogs((prev) => [logEntry, ...prev.slice(0, 10)]);

    try {
      const res = await fetch("/api/commander/rig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rig_id: rigId,
          command: cmd,
          pending_command: cmd,
        }),
      });

      if (res.ok) {
        showToast({
          title: "Command Sent",
          message: `Executed: ${label}`,
          icon: "⚡",
        });
      } else {
        throw new Error("Failed to dispatch");
      }
    } catch (err: any) {
      showToast({
        title: "Dispatch Error",
        message: err.message || "Could not reach local daemon.",
        icon: "❌",
      });
    } finally {
      setTimeout(() => setIsExecutingCmd(null), 500);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION & SUB-PAGES BAR
         ───────────────────────────────────────────────────────────── */}
      <header className="max-w-4xl w-full mx-auto space-y-4">
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Link
              href={`/srcommander/rig/${rigId}`}
              className="p-2.5 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 transition flex items-center justify-center shadow-xs"
              title="Back to Rig Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black uppercase tracking-tight text-neutral-900 leading-none">
                  {rig?.name || "Rig 1"} Controls
                </h1>
                <span className="text-[10px] font-mono uppercase bg-red-600 text-white px-2 py-0.5 rounded-full font-bold shadow-xs">
                  Smart Button Box
                </span>
              </div>
              <span className="text-xs font-mono text-neutral-500">
                Host: {rig?.pc_hostname || "GridPassRIgt1"} • {telemetry?.car_name || "iRacing"}
              </span>
            </div>
          </div>

          <div
            className={`px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
              !isTelemetryLive
                ? "bg-neutral-100 text-neutral-600 border-neutral-200"
                : isInCar
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-amber-50 text-amber-700 border-amber-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !isTelemetryLive
                  ? "bg-neutral-400"
                  : isInCar
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-500"
              }`}
            />
            <span>
              {!isTelemetryLive
                ? "Offline / Standby"
                : isInCar
                ? "In Car (Controls Active)"
                : "Out of Car (Controls Locked)"}
            </span>
          </div>
        </div>

        {/* SUB-SECTION TOOL BAR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono font-bold uppercase">
          <Link
            href={`/srcommander/rig/${rigId}`}
            className="px-4 py-2 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition shrink-0"
          >
            📊 Live HUD / Overview
          </Link>
          <span className="px-4 py-2 rounded-2xl bg-red-600 text-white shadow-xs shrink-0">
            🎛️ Smart Controls
          </span>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN TACTILE SMART BUTTON BOX GRID
         ───────────────────────────────────────────────────────────── */}
      <main className="max-w-4xl w-full mx-auto space-y-6">
        
        {/* OUT OF CAR ALERT BANNER (IF DRIVER IS SITTING IN GARAGE / REPLAY) */}
        {isTelemetryLive && !isInCar && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-4 sm:p-5 flex items-center gap-3.5 text-amber-900 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono">
              <strong className="block text-sm font-bold uppercase tracking-tight text-amber-950">
                Driver Currently Out of Car
              </strong>
              In-car cockpit controls (Ignition, Starter, Tow, Exit Car, Pit Limiter) are locked until you enter the car in iRacing.
            </div>
          </div>
        )}

        {/* TACTILE HARDWARE BUTTON BOX GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* 1. SMART IGNITION / ENGINE START & KILL SWITCH */}
          <button
            type="button"
            disabled={isExecutingCmd !== null || !isInCar}
            onClick={() =>
              triggerCommand(
                "smart_ignition",
                isEngineRunning ? "Kill Engine / Cut Ignition" : "Start Engine (Ignition + Starter)"
              )
            }
            className={`p-6 rounded-3xl border transition text-left space-y-3.5 shadow-sm group relative overflow-hidden ${
              !isInCar
                ? "bg-neutral-100 border-neutral-200 opacity-60 cursor-not-allowed"
                : isEngineRunning
                ? "bg-emerald-50/80 hover:bg-red-50 border-emerald-300 hover:border-red-400 cursor-pointer active:scale-98"
                : "bg-red-50/80 hover:bg-emerald-50 border-red-300 hover:border-emerald-400 cursor-pointer active:scale-98"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs transition group-hover:scale-105 ${
                  !isInCar
                    ? "bg-neutral-200 border-neutral-300 text-neutral-400"
                    : isEngineRunning
                    ? "bg-white border-emerald-200 text-emerald-600 group-hover:text-red-600 group-hover:border-red-200"
                    : "bg-white border-red-200 text-red-600 group-hover:text-emerald-600 group-hover:border-emerald-200"
                }`}
              >
                {isExecutingCmd === "smart_ignition" ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Power className="w-7 h-7" />
                )}
              </div>

              {/* STATE BADGE */}
              <span
                className={`text-[10px] font-mono uppercase font-black px-2.5 py-1 rounded-full border ${
                  !isInCar
                    ? "bg-neutral-200 text-neutral-500 border-neutral-300"
                    : isEngineRunning
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-red-100 text-red-800 border-red-300 animate-pulse"
                }`}
              >
                {!isInCar ? "Locked" : isEngineRunning ? "Running" : "Engine Off"}
              </span>
            </div>

            <div>
              <strong className="text-base font-black text-neutral-900 uppercase block">
                {!isInCar
                  ? "Ignition & Starter"
                  : isEngineRunning
                  ? "Engine Running (Click to Kill)"
                  : "Start Engine (Ignition On)"}
              </strong>
              <span className="text-xs font-mono text-neutral-500 block">
                {!isInCar
                  ? "Must be seated in car to operate ignition."
                  : isEngineRunning
                  ? `Idling at ${rpm.toLocaleString()} RPM. Click to cut ignition.`
                  : "Engine is stopped. Click to auto-engage starter & crank engine."}
              </span>
            </div>
          </button>

          {/* 2. ENGINE STARTER CRANK */}
          <button
            type="button"
            disabled={isExecutingCmd !== null || !isInCar || isEngineRunning}
            onClick={() => triggerCommand("starter", "Engine Starter Crank")}
            className={`p-6 rounded-3xl border transition text-left space-y-3.5 shadow-sm group ${
              !isInCar || isEngineRunning
                ? "bg-neutral-100 border-neutral-200 opacity-60 cursor-not-allowed"
                : "bg-neutral-50 hover:bg-emerald-50 border-neutral-200 hover:border-emerald-400 cursor-pointer active:scale-98"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs transition group-hover:scale-105 ${
                  !isInCar || isEngineRunning
                    ? "bg-neutral-200 border-neutral-300 text-neutral-400"
                    : "bg-white border-neutral-200 text-emerald-600"
                }`}
              >
                {isExecutingCmd === "starter" ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Zap className="w-7 h-7" />
                )}
              </div>

              {isEngineRunning && (
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-600">
                  Active
                </span>
              )}
            </div>

            <div>
              <strong className="text-base font-black text-neutral-900 uppercase block">
                Starter Motor
              </strong>
              <span className="text-xs font-mono text-neutral-500 block">
                {isEngineRunning
                  ? "Disabled while engine is actively running."
                  : "Manual starter crank ('S' key) + clutch disengage."}
              </span>
            </div>
          </button>

          {/* 3. TOW TO PITS / RESET CAR (IN-CAR ONLY) */}
          <button
            type="button"
            disabled={isExecutingCmd !== null || !isInCar}
            onClick={() => triggerCommand("reset", "Tow to Pits / Reset Car")}
            className={`p-6 rounded-3xl border transition text-left space-y-3.5 shadow-sm group ${
              !isInCar
                ? "bg-neutral-100 border-neutral-200 opacity-60 cursor-not-allowed"
                : "bg-neutral-50 hover:bg-amber-50 border-neutral-200 hover:border-amber-400 cursor-pointer active:scale-98"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs transition group-hover:scale-105 ${
                  !isInCar
                    ? "bg-neutral-200 border-neutral-300 text-neutral-400"
                    : "bg-white border-neutral-200 text-amber-600"
                }`}
              >
                {isExecutingCmd === "reset" ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <RotateCcw className="w-7 h-7" />
                )}
              </div>

              {isInCar && speedMph > 5 && (
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                  {speedMph} MPH
                </span>
              )}
            </div>

            <div>
              <strong className="text-base font-black text-neutral-900 uppercase block">
                Tow to Pits (Reset)
              </strong>
              <span className="text-xs font-mono text-neutral-500 block">
                {!isInCar
                  ? "Requires active in-car session."
                  : "Holds Shift+R to tow car to pit stall (remains in cockpit)."}
              </span>
            </div>
          </button>

          {/* 4. EXIT CAR (TO GARAGE TIMING SCREEN) */}
          <button
            type="button"
            disabled={isExecutingCmd !== null || !isInCar}
            onClick={() => triggerCommand("exit_car", "Exit Car (To Garage)")}
            className={`p-6 rounded-3xl border transition text-left space-y-3.5 shadow-sm group ${
              !isInCar
                ? "bg-neutral-100 border-neutral-200 opacity-60 cursor-not-allowed"
                : "bg-neutral-50 hover:bg-red-50 border-neutral-200 hover:border-red-400 cursor-pointer active:scale-98"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs transition group-hover:scale-105 ${
                  !isInCar
                    ? "bg-neutral-200 border-neutral-300 text-neutral-400"
                    : "bg-white border-neutral-200 text-red-600"
                }`}
              >
                {isExecutingCmd === "exit_car" ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <LogOut className="w-7 h-7" />
                )}
              </div>

              <span
                className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md border ${
                  !isInCar
                    ? "bg-neutral-200 text-neutral-500 border-neutral-300"
                    : "bg-red-100 text-red-800 border-red-300"
                }`}
              >
                {!isInCar ? "At Garage" : "In Cockpit"}
              </span>
            </div>

            <div>
              <strong className="text-base font-black text-neutral-900 uppercase block">
                Exit Car (To Garage)
              </strong>
              <span className="text-xs font-mono text-neutral-500 block">
                {!isInCar
                  ? "Driver is already outside car at garage screen."
                  : "Holds Escape (2.6s) to exit cockpit back to garage."}
              </span>
            </div>
          </button>

          {/* 5. PIT SPEED LIMITER */}
          <button
            type="button"
            disabled={isExecutingCmd !== null || !isInCar}
            onClick={() => triggerCommand("pit_limiter", "Toggle Pit Speed Limiter")}
            className={`p-6 rounded-3xl border transition text-left space-y-3.5 shadow-sm group ${
              !isInCar
                ? "bg-neutral-100 border-neutral-200 opacity-60 cursor-not-allowed"
                : isPitLimiterActive
                ? "bg-blue-50 border-blue-300 hover:border-blue-400 cursor-pointer active:scale-98"
                : "bg-neutral-50 hover:bg-blue-50 border-neutral-200 hover:border-blue-400 cursor-pointer active:scale-98"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs transition group-hover:scale-105 ${
                  !isInCar
                    ? "bg-neutral-200 border-neutral-300 text-neutral-400"
                    : isPitLimiterActive
                    ? "bg-white border-blue-300 text-blue-600"
                    : "bg-white border-neutral-200 text-blue-600"
                }`}
              >
                {isExecutingCmd === "pit_limiter" ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <ShieldCheck className="w-7 h-7" />
                )}
              </div>

              {isInCar && (
                <span
                  className={`text-[10px] font-mono uppercase font-black px-2.5 py-1 rounded-full border ${
                    isPitLimiterActive
                      ? "bg-blue-100 text-blue-800 border-blue-300 animate-pulse"
                      : "bg-neutral-200 text-neutral-600 border-neutral-300"
                  }`}
                >
                  {isPitLimiterActive ? "Active" : "Off"}
                </span>
              )}
            </div>

            <div>
              <strong className="text-base font-black text-neutral-900 uppercase block">
                Pit Speed Limiter
              </strong>
              <span className="text-xs font-mono text-neutral-500 block">
                {!isInCar
                  ? "Requires active in-car session."
                  : isPitLimiterActive
                  ? "Limiter engaged. Click to disengage for racing."
                  : "Toggles speed limiter ('P' key) for pit entry."}
              </span>
            </div>
          </button>

          {/* 6. VISOR TEAROFF */}
          <button
            type="button"
            disabled={isExecutingCmd !== null || !isInCar}
            onClick={() => triggerCommand("tearoff", "Visor Tearoff")}
            className={`p-6 rounded-3xl border transition text-left space-y-3.5 shadow-sm group ${
              !isInCar
                ? "bg-neutral-100 border-neutral-200 opacity-60 cursor-not-allowed"
                : "bg-neutral-50 hover:bg-purple-50 border-neutral-200 hover:border-purple-400 cursor-pointer active:scale-98"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs transition group-hover:scale-105 ${
                  !isInCar
                    ? "bg-neutral-200 border-neutral-300 text-neutral-400"
                    : "bg-white border-neutral-200 text-purple-600"
                }`}
              >
                {isExecutingCmd === "tearoff" ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Eye className="w-7 h-7" />
                )}
              </div>
            </div>

            <div>
              <strong className="text-base font-black text-neutral-900 uppercase block">
                Visor Tearoff
              </strong>
              <span className="text-xs font-mono text-neutral-500 block">
                {!isInCar
                  ? "Requires active in-car session."
                  : "Pulls windshield / visor tearoff (Alt+T) to clear grime."}
              </span>
            </div>
          </button>

        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. REAL-TIME EXECUTION LOG STREAM
           ───────────────────────────────────────────────────────────── */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-neutral-600" />
              <span className="text-xs font-mono font-bold uppercase text-neutral-700">
                DirectInput Execution Feed
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              Sub-50ms Response Time
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs max-h-40 overflow-y-auto">
            {recentLogs.length === 0 ? (
              <p className="text-neutral-400 py-2 text-center text-xs">
                No commands dispatched yet. Click any button above to trigger hardware macros.
              </p>
            ) : (
              recentLogs.map((l) => (
                <div
                  key={l.id}
                  className="p-2 bg-white rounded-xl border border-neutral-200 flex items-center justify-between shadow-xs"
                >
                  <span className="text-neutral-800 font-medium">{l.msg}</span>
                  <span className="text-neutral-400 text-[10px]">{l.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          4. MINIMAL FOOTER
         ───────────────────────────────────────────────────────────── */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-[11px] font-mono text-neutral-400 flex items-center justify-center gap-2">
        <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
        <span>GridPass Commander • State-Aware Hardware Engine</span>
      </footer>
    </div>
  );
}
