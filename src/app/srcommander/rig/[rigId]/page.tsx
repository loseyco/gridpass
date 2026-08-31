"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ToastContext";
import {
  Monitor,
  Laptop,
  ArrowLeft,
  User,
  HardDrive,
  Cpu,
  Building2,
  CheckCircle2,
  Play,
  RotateCcw,
  Gauge,
  Flag,
  Car,
  MapPin,
  Flame,
  Thermometer,
  Zap,
  Activity,
  Radio,
  Timer,
  Code,
  Search,
  ChevronDown,
} from "lucide-react";

interface PageProps {
  params: Promise<{ rigId: string }>;
}

export default function CleanRigLandingPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const rigId = unwrappedParams?.rigId || "rig_rjhfri1";

  const { user } = useAuth();
  const { showToast } = useToast();

  const [rig, setRig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [now, setNow] = useState(Date.now());
  const [showVariableInspector, setShowVariableInspector] = useState(false);
  const [varSearchQuery, setVarSearchQuery] = useState("");

  // 1. Heartbeat interval
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  // 2. Listen to Rig Profile from Firestore
  useEffect(() => {
    if (!rigId) return;
    const unsub = onSnapshot(
      doc(db, "commander_rigs", rigId),
      (snap) => {
        if (snap.exists()) {
          setRig({ id: snap.id, ...snap.data() });
        } else {
          setRig(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Rig fetch error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [rigId]);

  // 3. Fast Telemetry Polling (Every 250ms for live responsive HUD)
  useEffect(() => {
    let isMounted = true;
    const checkTelemetry = async () => {
      try {
        const res = await fetch(`/api/commander/telemetry?rig_id=${rigId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.telemetry) {
            setTelemetry(data.telemetry);
          } else if (isMounted && !data.telemetry) {
            setTelemetry(null);
          }
        }
      } catch (e) {
        if (isMounted) setTelemetry(null);
      }
    };

    checkTelemetry();
    const interval = setInterval(checkTelemetry, 250);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [rigId]);

  // Is iRacing currently running & streaming active telemetry?
  const isTelemetryLive = Boolean(
    telemetry &&
    telemetry.timestamp &&
    now - telemetry.timestamp < 3500 &&
    (Boolean(telemetry.car_name) || Boolean(telemetry.track_name) || telemetry.speed !== undefined)
  );

  // Helper formatting for lap time
  const formatTime = (sec?: number) => {
    if (!sec || sec <= 0 || sec > 3600) return "--:--.---";
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(3);
    const padded = Number(s) < 10 ? `0${s}` : s;
    return `${m}:${padded}`;
  };

  // Car State determination (Checking is_on_track first!)
  const getCarStatus = () => {
    if (!isTelemetryLive) {
      return { label: "OFFLINE / STANDBY", color: "bg-neutral-100 text-neutral-600 border-neutral-200" };
    }
    // If not in car (sitting at garage/replay menu)
    if (!telemetry?.is_on_track) {
      return { label: "OUT OF CAR (GARAGE / REPLAY)", color: "bg-neutral-100 text-neutral-800 border-neutral-300" };
    }
    // If on track and on pit road
    if (telemetry?.is_on_pit_road || telemetry?.is_in_pit_stall) {
      return { label: "IN PIT LANE", color: "bg-amber-50 text-amber-700 border-amber-300" };
    }
    // Actively driving on racing surface
    return { label: "ON TRACK (DRIVING)", color: "bg-emerald-50 text-emerald-700 border-emerald-300" };
  };

  const status = getCarStatus();

  // Speed in MPH
  const speedMph = telemetry?.speed ? Math.round(Number(telemetry.speed) * 2.23694) : 0;
  const rpm = telemetry?.rpm ? Math.round(Number(telemetry.rpm)) : 0;
  const gear = telemetry?.gear === -1 ? "R" : telemetry?.gear === 0 ? "N" : telemetry?.gear || "N";
  const throttlePct = Math.round((Number(telemetry?.throttle) || 0) * 100);
  const brakePct = Math.round((Number(telemetry?.brake) || 0) * 100);

  // Filtered raw telemetry keys for inspector
  const telemetryKeys = telemetry ? Object.keys(telemetry).sort() : [];
  const filteredKeys = telemetryKeys.filter((k) =>
    k.toLowerCase().includes(varSearchQuery.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION & SUB-PAGES BAR
         ───────────────────────────────────────────────────────────── */}
      <header className="max-w-4xl w-full mx-auto space-y-4">
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Link
              href="/srcommander"
              className="p-2.5 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 transition flex items-center justify-center shadow-xs"
              title="Back to All Rigs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black uppercase tracking-tight text-neutral-900 leading-none">
                  {rig?.name || "Rig 1"}
                </h1>
                <span className="text-[10px] font-mono uppercase bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full font-bold">
                  {rig?.venue_name || "GridPass"}
                </span>
              </div>
              <span className="text-xs font-mono text-neutral-500">
                Host: {rig?.pc_hostname || "GridPassRIgt1"}
              </span>
            </div>
          </div>

          {/* TELEMETRY ENGINE STATUS */}
          <div
            className={`px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 ${status.color}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isTelemetryLive ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
              }`}
            />
            <span>{status.label}</span>
          </div>
        </div>

        {/* SUB-SECTION TOOL BAR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono font-bold uppercase">
          <span className="px-4 py-2 rounded-2xl bg-red-600 text-white shadow-xs shrink-0">
            📊 Live HUD / Overview
          </span>
          <Link
            href={`/srcommander/rig/${rigId}/controls`}
            className="px-4 py-2 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition shrink-0"
          >
            🎛️ Smart Controls
          </Link>
        </div>
      </header>



      {/* ─────────────────────────────────────────────────────────────
          2. MAIN RIG HUD & SIMULATOR TELEMETRY
         ───────────────────────────────────────────────────────────── */}
      <main className="max-w-4xl w-full mx-auto space-y-6">
        
        {/* IF IRACING IS NOT RUNNING / LOADED */}
        {!isTelemetryLive ? (
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 sm:p-10 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-white border border-neutral-200 flex items-center justify-center mx-auto text-neutral-400 shadow-xs">
              <Activity className="w-8 h-8" />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-black tracking-wider block">
                Simulator Telemetry Link
              </span>
              <h2 className="text-xl font-black uppercase text-neutral-900 tracking-tight">
                iRacing Standby (Not Loaded)
              </h2>
              <p className="text-xs font-mono text-neutral-500">
                iRacing is not loaded or streaming on machine <strong>{rig?.pc_hostname || "GridPassRIgt1"}</strong>. Launch a test drive or race in iRacing to see live telemetry.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-neutral-200 text-xs font-mono text-neutral-600 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <span>Background daemon listening on COM7 & 60Hz Shared Memory</span>
            </div>
          </div>
        ) : (
          /* IF IRACING IS ACTIVE & LOADED: GORGEOUS HUD */
          <div className="space-y-6">
            
            {/* CAR & TRACK OVERVIEW BANNER */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-600/30">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-red-600 font-black tracking-wider block">
                      Active Simulator Vehicle
                    </span>
                    <h2 className="text-xl font-black uppercase text-neutral-900 tracking-tight">
                      {telemetry?.car_name || "iRacing Vehicle"}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowVariableInspector(true)}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Code className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Raw Variables ({telemetryKeys.length})</span>
                  </button>

                  <span className="text-xs font-mono font-bold bg-white px-3 py-2 rounded-xl border border-neutral-200 text-neutral-700 shadow-xs">
                    {telemetry?.source || "iRacing 60Hz"}
                  </span>
                </div>
              </div>

              {/* TRACK & CONDITIONS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Track Name</span>
                  </span>
                  <strong className="text-sm font-black text-neutral-900 block truncate">
                    {telemetry?.track_name || "Unknown Circuit"}
                  </strong>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Layout / Config</span>
                  </span>
                  <strong className="text-sm font-black text-neutral-900 block truncate">
                    {telemetry?.track_layout && telemetry?.track_layout !== "None" ? telemetry?.track_layout : "Oval / Short Track"}
                  </strong>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Track & Air Temp</span>
                  </span>
                  <strong className="text-sm font-black text-neutral-900 block truncate">
                    Track: {telemetry?.track_temp_c ? `${Math.round(telemetry.track_temp_c)}°C` : "--"} • Air: {telemetry?.air_temp_c ? `${Math.round(telemetry.air_temp_c)}°C` : "--"}
                  </strong>
                </div>
              </div>
            </div>

            {/* LIVE COCKPIT TELEMETRY METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* SPEED */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-sm text-center space-y-1">
                <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block">
                  Speed
                </span>
                <div className="text-4xl font-black font-mono text-neutral-900">
                  {speedMph}
                </div>
                <span className="text-xs font-mono font-bold text-red-600">MPH</span>
              </div>

              {/* GEAR */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-sm text-center space-y-1">
                <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block">
                  Gear
                </span>
                <div className="text-4xl font-black font-mono text-red-600">
                  {gear}
                </div>
                <span className="text-xs font-mono font-bold text-neutral-500">Transmission</span>
              </div>

              {/* RPM */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-sm text-center space-y-1">
                <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block">
                  Engine RPM
                </span>
                <div className="text-4xl font-black font-mono text-neutral-900 truncate">
                  {rpm.toLocaleString()}
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden mt-1">
                  <div
                    className="bg-red-600 h-full transition-all duration-75"
                    style={{ width: `${Math.min(100, (rpm / 8000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* PEDALS (THROTTLE / BRAKE) */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-2">
                <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block text-center">
                  Pedal Inputs
                </span>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                    <span className="text-emerald-700">THR: {throttlePct}%</span>
                    <div className="w-20 bg-neutral-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${throttlePct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                    <span className="text-red-700">BRK: {brakePct}%</span>
                    <div className="w-20 bg-neutral-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-red-600 h-full" style={{ width: `${brakePct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LAP & STINT CLOCK BAR */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-red-600 shadow-xs">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block">
                    Lap Timing & Position
                  </span>
                  <div className="text-sm font-black text-neutral-900 font-mono">
                    Current: Lap {telemetry?.lap || 1} • Best: {formatTime(telemetry?.best_lap)}
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono font-bold text-neutral-600 bg-white px-4 py-2 rounded-2xl border border-neutral-200 shadow-xs">
                Last Lap: {formatTime(telemetry?.lap_time)}
              </div>
            </div>

          </div>
        )}

        {/* RIG & PHYSICAL HARDWARE BASICS (COLLAPSIBLE / CLEAN) */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-red-600 shadow-xs">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-red-600 font-bold block">
                  Hardware Profile
                </span>
                <h3 className="text-base font-black uppercase text-neutral-900">
                  {rig?.pc_hostname || "GridPassRIgt1"}
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono text-neutral-500 font-bold">
              ID: {rigId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-neutral-600">
            <div className="p-3 bg-white rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-400 block uppercase font-bold">Processor & RAM</span>
              <strong className="text-neutral-900">{rig?.pc_specs || "Intel Core i7-9700K • 32 GB RAM"}</strong>
            </div>
            <div className="p-3 bg-white rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-400 block uppercase font-bold">Assigned Venue</span>
              <strong className="text-neutral-900">{rig?.venue_name || "GridPass"}</strong>
            </div>
          </div>
        </div>

      </main>

      {/* ─────────────────────────────────────────────────────────────
          RAW TELEMETRY VARIABLE INSPECTOR MODAL
         ───────────────────────────────────────────────────────────── */}
      {showVariableInspector && telemetry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-neutral-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 relative max-h-[85vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowVariableInspector(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-800 text-xs font-mono font-bold uppercase p-2"
            >
              ✕ Close
            </button>

            <div className="flex items-center gap-3 border-b border-neutral-200 pb-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-neutral-900">
                  Live iRacing Raw Telemetry Inspector
                </h3>
                <p className="text-xs font-mono text-neutral-500">
                  Streaming 60Hz directly from C-Memory Shared Buffer on {rig?.pc_hostname || "this PC"}.
                </p>
              </div>
            </div>

            {/* SEARCH FILTER */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Filter variables (e.g. speed, track, temp, is_on_track)..."
                value={varSearchQuery}
                onChange={(e) => setVarSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-red-600 focus:bg-white"
              />
            </div>

            {/* VARIABLES TABLE */}
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 font-mono text-xs">
              {filteredKeys.map((key) => {
                const val = telemetry[key];
                const isBool = typeof val === "boolean";
                const isNum = typeof val === "number";
                return (
                  <div
                    key={key}
                    className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3 hover:bg-neutral-100 transition"
                  >
                    <span className="font-bold text-neutral-700">{key}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-black text-right truncate max-w-xs ${
                        isBool
                          ? val
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-neutral-200 text-neutral-600"
                          : isNum
                          ? "text-red-600"
                          : "text-neutral-900"
                      }`}
                    >
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. MINIMAL FOOTER
         ───────────────────────────────────────────────────────────── */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-[11px] font-mono text-neutral-400 flex items-center justify-center gap-2">
        <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
        <span>GridPass Commander • 60Hz Telemetry HUD</span>
      </footer>
    </div>
  );
}
