"use client";

import React, { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { doc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { CommanderRig, CommanderSession, RadioTransmission, CommanderGridStartSequence } from "@/lib/types/commander";
import GridpassQRCode from "@/components/qr/GridpassQRCode";
import { useToast } from "@/components/ToastContext";
import {
  Trophy,
  Play,
  Clock,
  Zap,
  Users,
  QrCode,
  Maximize2,
  Minimize2,
  Tv,
  Radio,
  Sparkles,
  RotateCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Flame,
  Power,
  Activity,
  Layers,
  Coins,
  ShieldCheck,
  Eye,
  EyeOff,
  Flag
} from "lucide-react";

function SingleScreenOverlayHUDPageInnerContent() {
  const searchParams = useSearchParams();
  const rigId = searchParams.get("rigId") || "rig_development_1_nncx";
  const { showToast } = useToast();

  const [rig, setRig] = useState<CommanderRig | null>(null);
  const [sessions, setSessions] = useState<CommanderSession[]>([]);
  const [localTelem, setLocalTelem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDriveNowLoading, setIsDriveNowLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransparentMode, setIsTransparentMode] = useState(false);
  const [qrTargetUrl, setQrTargetUrl] = useState<string>(`/rigs/${rigId}/join`);
  const [activeRadioTx, setActiveRadioTx] = useState<RadioTransmission | null>(null);
  const [gridStart, setGridStart] = useState<CommanderGridStartSequence | null>(null);
  const [now, setNow] = useState(Date.now());

  // Determine dynamic local / LAN / production QR URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : "";
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        setQrTargetUrl(`http://192.168.86.135${port}/rigs/${rigId}/join`);
      } else {
        setQrTargetUrl(`${window.location.origin}/rigs/${rigId}/join`);
      }
    }
  }, [rigId]);

  // Telemetry Heartbeat
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Firestore Subscriptions for Rig & Queued Sessions
  useEffect(() => {
    if (!rigId) return;

    // 1. Rig Document Listener
    const unsubRig = onSnapshot(
      doc(db, "commander_rigs", rigId),
      (snap) => {
        if (snap.exists()) {
          setRig({ id: snap.id, ...(snap.data() as any) } as CommanderRig);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error for rig:", err);
        setLoading(false);
      }
    );

    // 2. Active & Queued Sessions Listener
    const qSessions = query(
      collection(db, "commander_rig_sessions"),
      where("rig_id", "==", rigId),
      where("status", "in", ["driving", "active", "queued"])
    );

    const unsubSessions = onSnapshot(
      qSessions,
      (snap) => {
        const list: CommanderSession[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        list.sort((a, b) => {
          if (a.status === "driving") return -1;
          if (b.status === "driving") return 1;
          if (a.status === "active") return -1;
          if (b.status === "active") return 1;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        setSessions(list);
      },
      (err) => {
        console.error("Firestore onSnapshot error for sessions:", err);
      }
    );

    // 3. Live Paddock Intercom & Pit Radio Transmission Listener
    const qRadio = query(collection(db, "commander_radio_transmissions"));
    const unsubRadio = onSnapshot(qRadio, (snap) => {
      let active: RadioTransmission | null = null;
      snap.forEach((d) => {
        const data = d.data() as RadioTransmission;
        if (data.is_transmitting && (Date.now() - (data.timestamp || 0)) < 10000) {
          if (
            data.channel === "broadcast" ||
            data.channel === "drivers_group" ||
            (data.channel === "direct" && (data.target_rig_id === rigId || data.sender_id === rigId))
          ) {
            active = data;
          }
        }
      });
      setActiveRadioTx(active);
    });

    // 4. Live FIA 5-Red-Light Grid Start Listener
    const unsubGridStart = onSnapshot(doc(db, "commander_race_control", "grid_start"), (snap) => {
      if (snap.exists()) {
        setGridStart(snap.data() as CommanderGridStartSequence);
      }
    });

    return () => {
      unsubRig();
      unsubSessions();
      unsubRadio();
      unsubGridStart();
    };
  }, [rigId]);

  // High-Speed Local Telemetry Polling (60Hz / 100ms fallback for smooth HUD gauges)
  useEffect(() => {
    let isMounted = true;
    const pollTelem = async () => {
      try {
        const res = await fetch(`/api/commander/telemetry?rigId=${rigId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.telemetry) {
            setLocalTelem(data.telemetry);
          }
        }
      } catch {}
    };

    const interval = setInterval(pollTelem, 120);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [rigId]);

  // Merge Firestore telemetry with high-speed local telemetry
  const telem = localTelem || rig?.telemetry;
  const speedMph = telem?.speed ? Math.round(telem.speed * 2.23694) : 0;
  const gear = telem?.gear === -1 ? "R" : telem?.gear === 0 ? "N" : telem?.gear || "N";
  const rpm = telem?.rpm ? Math.round(telem.rpm) : 0;
  const isOnTrack = telem?.is_on_track ?? false;
  const isInPit = telem?.is_in_pit_stall ?? false;
  const isSimOnline = (now - (telem?.timestamp || 0)) < 7000;

  // Active Driver & Queue
  const activeSession = sessions.find((s) => s.status === "driving" || s.status === "active") || (sessions.length > 0 ? sessions[0] : null);
  const isDriverDriving = activeSession?.status === "driving" || (isOnTrack && !isInPit);
  const queueList = sessions.filter((s) => s.id !== activeSession?.id && s.status === "queued");

  // Session Timer
  const sessionTimer = telem?.session_timer;
  const sessionTimerState = sessionTimer?.state || "IDLE";
  const timeRemainingSec = sessionTimer?.time_remaining_sec ?? 600;
  const formattedTimeRemaining = `${Math.floor(timeRemainingSec / 60).toString().padStart(2, "0")}:${Math.floor(timeRemainingSec % 60).toString().padStart(2, "0")}`;

  // Live Rig Status Badge Evaluation
  // Status: 🟢 RIG READY | ⏱️ SESSION IN PROGRESS | 🛑 DRIVER SWAP
  const getRigStatusBadge = () => {
    if (sessionTimerState === "EXPIRED" || (!isDriverDriving && activeSession && sessionTimerState === "IDLE" && sessions.length > 1)) {
      return {
        label: "🛑 DRIVER SWAP",
        bgColor: "bg-red-600/90 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)] text-white",
        dotColor: "bg-white animate-ping",
      };
    }
    if (isDriverDriving || sessionTimerState === "RUNNING" || sessionTimerState === "GRACE_PERIOD") {
      return {
        label: "⏱️ SESSION IN PROGRESS",
        bgColor: "bg-amber-500/90 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)] text-black font-black",
        dotColor: "bg-black animate-ping",
      };
    }
    return {
      label: "🟢 RIG READY",
      bgColor: "bg-emerald-600/90 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] text-white",
      dotColor: "bg-emerald-200 animate-pulse",
    };
  };

  const currentStatusBadge = getRigStatusBadge();

  // Fullscreen Handler
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

  // DRIVE NOW / START STINT Action Handler
  const handleDriveNow = async () => {
    setIsDriveNowLoading(true);
    showToast({
      title: "🏎️ LAUNCHING STINT",
      message: "Sending push-button ignition & enter car command to iRacing...",
      icon: "⚡",
    });

    try {
      const res = await fetch("/api/commander/drive-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rig_id: rigId,
          session_id: activeSession?.id || null,
          driver_name: activeSession?.driver_name || "Paddock Driver",
        }),
      });

      if (res.ok) {
        showToast({
          title: "🟢 GREEN FLAG!",
          message: "Driver stint started. Push the throttle!",
          icon: "🏁",
        });
      } else {
        const data = await res.json();
        showToast({
          title: "Launch Warning",
          message: data?.error || "Command queued to daemon",
          icon: "⚠️",
        });
      }
    } catch (e: any) {
      showToast({
        title: "Action Error",
        message: e?.message || "Failed to trigger /api/commander/drive-now",
        icon: "❌",
      });
    } finally {
      setTimeout(() => setIsDriveNowLoading(false), 1200);
    }
  };

  // Shift Light LED mapping (3500 to 7500 RPM)
  const rpmPct = Math.max(0, Math.min(1, (rpm - 3500) / 4000));
  const activeLeds = Math.round(rpmPct * 12);

  return (
    <div
      className={`min-h-screen w-screen overflow-x-hidden font-mono select-none pointer-events-none flex flex-col justify-between p-4 md:p-6 transition-colors duration-300 ${
        isTransparentMode
          ? "bg-transparent text-white"
          : "bg-[#08080a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-[#08080a] to-[#040405] text-white"
      }`}
    >
      {/* ========================================================================= */}
      {/* TOP BROADCAST BAR: RIG HEADER, LIVE STATUS BADGE, MINI TELEMETRY PILL */}
      {/* ========================================================================= */}
      <header className="flex flex-wrap items-center justify-between gap-4 bg-neutral-950/90 backdrop-blur-xl border border-neutral-800/90 rounded-3xl px-5 py-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] shrink-0">
        
        {/* Left: Rig Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)]">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 text-[10px] font-black uppercase tracking-wider">
                BROADCAST HUD • 100% CLICK-THROUGH
              </span>
              <span className="text-[11px] text-neutral-400 font-bold">
                {isSimOnline ? "🟢 60Hz Telemetry Live" : "⚪ Sim Offline"}
              </span>
            </div>
            <h1 className="text-sm md:text-base font-black uppercase tracking-tight text-white truncate">
              {rig?.name || "GridPass Sim Trailer - Pod #1"}
            </h1>
          </div>
        </div>

        {/* Center: Live Rig Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2 rounded-2xl border-2 text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2.5 transition-all ${currentStatusBadge.bgColor}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${currentStatusBadge.dotColor}`} />
            <span>{currentStatusBadge.label}</span>
          </div>
        </div>

        {/* Right: Live Mini Telemetry Pill */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mini Telemetry Capsule (Laps, Speed, Gear, Stint Time) */}
          <div className="hidden sm:flex items-center gap-3 bg-neutral-900/90 border border-neutral-800 rounded-2xl px-4 py-2 shadow-inner">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-neutral-500 uppercase">LAPS</span>
              <span className="text-sm font-black text-amber-400">
                {telem?.lap || activeSession?.laps_completed || 0}
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-800" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-neutral-500 uppercase">MPH</span>
              <span className="text-sm font-black text-emerald-400">{speedMph}</span>
            </div>
            <div className="w-px h-6 bg-neutral-800" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-neutral-500 uppercase">GEAR</span>
              <span className="text-sm font-black text-cyan-400">{gear}</span>
            </div>
            <div className="w-px h-6 bg-neutral-800" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-neutral-500 uppercase">TIME REMAINING</span>
              <span className={`text-base font-black tracking-tight ${
                timeRemainingSec <= 60
                  ? "text-red-400 animate-pulse"
                  : timeRemainingSec <= 180
                  ? "text-amber-400"
                  : "text-white"
              }`}>
                {formattedTimeRemaining}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* LIVE PIT RADIO / RACE CONTROL INCOMING AUDIO CALLOUT */}
      {activeRadioTx && (
        <div className="bg-amber-500 text-black py-2.5 px-5 rounded-2xl flex items-center justify-between shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-bounce font-black text-xs uppercase tracking-wider my-2 border-2 border-amber-300">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse text-black" />
            <span>📻 PIT RADIO: {activeRadioTx.sender_name} ({activeRadioTx.sender_role?.toUpperCase()} • {activeRadioTx.channel?.toUpperCase()})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-md font-mono font-bold">TRANSMITTING</span>
          </div>
        </div>
      )}

      {/* SYNCHRONIZED FIA 5-RED-LIGHT RACE START OVERLAY */}
      {gridStart && gridStart.state !== "idle" && (
        <div className={`p-4 sm:p-6 rounded-3xl border-2 my-3 transition-all shadow-2xl ${
          gridStart.state === "lights_out"
            ? "bg-emerald-950/95 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.8)] animate-pulse"
            : gridStart.state === "counting" || gridStart.state === "arming"
            ? "bg-black/95 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.7)]"
            : "bg-amber-950/95 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.6)]"
        }`}>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-300">
              <Flag className="w-4 h-4 text-red-500" />
              <span>{gridStart.session_name || "GRID START SEQUENCE"}</span>
            </div>

            {/* 5-Light FIA Gantry Bulbs */}
            <div className="grid grid-cols-5 gap-3 sm:gap-5">
              {[1, 2, 3, 4, 5].map((idx) => {
                const isRed = (gridStart.state === "counting" || gridStart.state === "arming") && gridStart.lights_lit >= idx;
                const isGreen = gridStart.state === "lights_out";
                const isAborted = gridStart.state === "aborted";

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 bg-neutral-900 border border-neutral-800 p-2 sm:p-3 rounded-2xl">
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 transition-all flex items-center justify-center ${
                      isRed
                        ? "bg-red-600 border-red-300 shadow-[0_0_25px_rgba(239,68,68,1)] scale-110"
                        : "bg-black/80 border-neutral-800 opacity-25"
                    }`}>
                      {isRed && <div className="w-2.5 h-2.5 bg-white rounded-full opacity-80" />}
                    </div>

                    <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 transition-all flex items-center justify-center ${
                      isGreen
                        ? "bg-emerald-500 border-emerald-200 shadow-[0_0_30px_rgba(16,185,129,1)] scale-110"
                        : isAborted
                        ? "bg-amber-500 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,1)] animate-ping"
                        : "bg-black/80 border-neutral-800 opacity-25"
                    }`}>
                      {isGreen && <div className="w-2.5 h-2.5 bg-white rounded-full opacity-90 animate-ping" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Banner Text */}
            <div className="text-center font-black uppercase tracking-wider">
              {gridStart.state === "lights_out" ? (
                <h2 className="text-2xl sm:text-4xl text-emerald-400 animate-bounce">
                  🟢 LIGHTS OUT AND AWAY WE GO!
                </h2>
              ) : gridStart.state === "counting" ? (
                <h2 className="text-xl sm:text-2xl text-red-500 animate-pulse">
                  HOLD REVS &amp; CLUTCH... COUNTDOWN: {gridStart.lights_lit} / 5
                </h2>
              ) : gridStart.state === "aborted" ? (
                <h2 className="text-xl sm:text-2xl text-amber-400">
                  ⚠️ START ABORTED • FULL COURSE YELLOW
                </h2>
              ) : (
                <h2 className="text-base text-neutral-400">STANDBY ON GRID</h2>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN HUD BODY: 3-COLUMN BROADCAST STAGING GRID */}
      {/* ========================================================================= */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-4 flex-1 items-stretch">
        
        {/* ========================================================================= */}
        {/* COLUMN 1 (Col 4): BIG SCANNABLE QR CODE CARD ("SCAN TO REGISTER & QUEUE") */}
        {/* ========================================================================= */}
        <section className="lg:col-span-4 bg-neutral-950/95 backdrop-blur-xl border border-neutral-800/90 rounded-3xl p-6 shadow-2xl flex flex-col justify-between items-center text-center relative overflow-hidden group">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1.5">
              <QrCode className="w-4 h-4" /> DRIVER INTAKE GATE
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-[9px] font-black uppercase text-red-400">
              FAST PASS
            </span>
          </div>

          {/* Centered QR Matrix */}
          <div className="my-auto py-3 flex flex-col items-center">
            <div className="p-3 bg-white rounded-3xl shadow-[0_0_35px_rgba(255,255,255,0.15)] border-4 border-neutral-900">
              <GridpassQRCode
                value={qrTargetUrl}
                size={230}
                ecc="H"
                className="w-full h-full"
              />
            </div>
            
            <div className="mt-4 space-y-1">
              <h2 className="text-base md:text-lg font-black uppercase tracking-tight text-white">
                SCAN TO REGISTER &amp; QUEUE TO DRIVE
              </h2>
              <p className="text-xs text-neutral-400 font-medium">
                Hold phone camera over code to join queue, stage profile &amp; track lap times
              </p>
            </div>
          </div>

          {/* Direct URL hint (Read-only) */}
          <div className="w-full pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
            <span className="truncate max-w-[220px] text-neutral-500 font-mono">
              {qrTargetUrl}
            </span>
            <span className="text-neutral-400 font-bold text-[10px] uppercase">
              Mobile Fast Pass
            </span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* COLUMN 2 (Col 5): ACTIVE DRIVER PROFILE CARD + LIVE STINT STATUS BANNER */}
        {/* ========================================================================= */}
        <section className="lg:col-span-5 bg-neutral-950/95 backdrop-blur-xl border border-neutral-800/90 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> ACTIVE DRIVER PROFILE
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
              isDriverDriving
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-400 animate-pulse"
                : "bg-neutral-900 border-neutral-700 text-neutral-400"
            }`}>
              {isDriverDriving ? "🟢 ON TRACK NOW" : "⚪ STAGED ON GRID"}
            </span>
          </div>

          {/* Driver Card Body */}
          <div className="my-auto py-4 space-y-4">
            <div className="flex items-center gap-4 bg-neutral-900/80 border border-neutral-800/90 rounded-2xl p-4 shadow-lg">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border-2 border-neutral-700 flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
                {activeSession?.driver_avatar_url ? (
                  <img
                    src={activeSession.driver_avatar_url}
                    alt={activeSession.driver_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(activeSession?.driver_name || "P")[0].toUpperCase()}</span>
                )}
              </div>

              {/* Driver Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white truncate">
                    {activeSession?.driver_name || "Paddock Guest Driver"}
                  </h3>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-neutral-400 font-bold truncate">
                  {activeSession?.driver_handle || "@driver"}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[11px]">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Driver
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-neutral-300 font-semibold">
                    {rig?.telemetry?.car_name || "Toyota GR86 Cup"}
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* GIANT STINT COUNTDOWN CLOCK & TIME REMAINING ENGINE */}
            {/* ========================================================================= */}
            <div className="bg-neutral-900/90 border-2 border-neutral-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-between w-full border-b border-neutral-800 pb-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>SESSION STINT TIME REMAINING</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                  sessionTimerState === "RUNNING"
                    ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                    : sessionTimerState === "GRACE_PERIOD"
                    ? "bg-amber-950/80 border-amber-500/50 text-amber-300 animate-pulse"
                    : sessionTimerState === "EXPIRED"
                    ? "bg-red-950/80 border-red-500/50 text-red-300 animate-pulse"
                    : "bg-neutral-800 border-neutral-700 text-neutral-400"
                }`}>
                  {sessionTimerState === "GRACE_PERIOD" ? "⏳ FINAL IN-LAP" : sessionTimerState}
                </span>
              </div>

              {/* Giant Glowing Countdown Digits */}
              <div className="my-1">
                <span className={`font-mono text-5xl sm:text-6xl font-black tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] ${
                  timeRemainingSec <= 60
                    ? "text-red-400 animate-pulse drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]"
                    : timeRemainingSec <= 180
                    ? "text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]"
                    : "text-white"
                }`}>
                  {formattedTimeRemaining}
                </span>
              </div>

              {/* Stint Progress Bar */}
              <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden mt-2 border border-neutral-700">
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (timeRemainingSec / ((rig?.session_max_minutes || 10) * 60)) * 100))}%`
                  }}
                  className={`h-full rounded-full transition-all duration-1000 ${
                    timeRemainingSec <= 60
                      ? "bg-red-500"
                      : timeRemainingSec <= 180
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  }`}
                />
              </div>
            </div>

            {/* Performance Laps & Best Lap Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Laps Completed */}
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-500">LAPS COMPLETED</span>
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-3xl font-black text-amber-400">
                    {telem?.lap || activeSession?.laps_completed || 0}
                  </span>
                  <span className="text-xs text-neutral-400 uppercase font-bold">Laps Run</span>
                </div>
              </div>

              {/* Personal Best Lap */}
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-500">PERSONAL BEST</span>
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                    {activeSession?.best_lap_formatted || (telem?.best_lap ? `${(telem.best_lap).toFixed(3)}s` : "--:--.---")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* READ-ONLY LIVE BROADCAST STATUS BANNER (ZERO CLICK INTERCEPTION) */}
          {/* ========================================================================= */}
          <div className="pt-2">
            <div
              className={`w-full min-h-[52px] py-3 px-6 rounded-2xl text-sm md:text-base font-black uppercase tracking-wider flex items-center justify-center gap-3 border-2 shadow-lg ${
                sessionTimerState === "EXPIRED"
                  ? "bg-red-950/90 border-red-500 text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse"
                  : isDriverDriving
                  ? "bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                  : "bg-neutral-900/90 border-neutral-700 text-neutral-300"
              }`}
            >
              {sessionTimerState === "EXPIRED" ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span>🛑 STINT EXPIRED • DRIVER SWAP IN PROGRESS</span>
                </>
              ) : isDriverDriving ? (
                <>
                  <Activity className="w-5 h-5 text-emerald-400 animate-bounce" />
                  <span>🟢 STINT ACTIVE • TELEMETRY RECORDING</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>⚪ DRIVER STAGED ON GRID • READY FOR GREEN FLAG</span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* COLUMN 3 (Col 3): NEXT UP IN LINE (LIVE QUEUE LIST) */}
        {/* ========================================================================= */}
        <section className="lg:col-span-3 bg-neutral-950/95 backdrop-blur-xl border border-neutral-800/90 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> NEXT UP IN LINE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-[9px] font-black text-amber-300">
              {queueList.length} QUEUED
            </span>
          </div>

          {/* Queue List / Standby State */}
          <div className="my-auto py-3 space-y-2.5 overflow-y-auto max-h-[380px] pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
            {queueList.length > 0 ? (
              queueList.map((driver, idx) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3 transition-all hover:border-neutral-700"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-xs shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black uppercase text-white truncate">
                        {driver.driver_name}
                      </h4>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {driver.driver_handle}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[9px] font-black uppercase shrink-0">
                    WAITING
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-10 px-3 bg-neutral-900/40 border border-dashed border-neutral-800 rounded-2xl space-y-2">
                <Users className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs font-black uppercase text-neutral-300">
                  QUEUE IS OPEN
                </p>
                <p className="text-[10px] text-neutral-500 leading-tight">
                  Scan QR code on left to be #1 next in line to drive!
                </p>
              </div>
            )}
          </div>

          {/* Footer Quick Action */}
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
            <span className="font-bold text-neutral-500">Auto Stint Queue</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span>FIFO Rotation</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </section>

      </main>

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER TICKER: TRACK, WEATHER, TIMING DATA */}
      {/* ========================================================================= */}
      <footer className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950/80 backdrop-blur-md border border-neutral-800/70 rounded-2xl px-5 py-2.5 text-xs text-neutral-400 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-white font-bold">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>{rig?.telemetry?.track_name || "Road America"}</span>
          </span>
          <span className="text-neutral-600">•</span>
          <span>{rig?.telemetry?.car_name || "Toyota GR86 Cup"}</span>
          <span className="text-neutral-600">•</span>
          <span>Session Cap: {rig?.session_max_minutes || 10} Mins</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-mono font-bold">
            Best Lap: {rig?.telemetry?.best_lap ? `${rig.telemetry.best_lap.toFixed(3)}s` : "--:--.---"}
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400 font-bold">
            Sim Paddock Pod #1
          </span>
        </div>
      </footer>

    </div>
  );
}

export default function SingleScreenOverlayHUDPage(props: any) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-8 font-mono text-xs">Loading...</div>}>
      <SingleScreenOverlayHUDPageInnerContent {...props} />
    </Suspense>
  );
}
