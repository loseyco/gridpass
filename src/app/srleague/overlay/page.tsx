"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague } from "@/lib/types/league";
import {
  Trophy,
  Clock,
  Radio,
  Flame,
  RotateCcw,
  Sparkles,
  Flag,
} from "lucide-react";

interface LiveTelemetryPayload {
  connected: boolean;
  source: string;
  timestamp: number;
  session_info?: {
    track_name: string;
    track_config: string;
    session_type: string;
    session_name: string;
    session_state: string;
    flag_state: "GREEN" | "YELLOW" | "RED" | "CHECKERED" | "WHITE";
    time_remaining_str: string;
    laps_remaining: number;
    track_temp_f: number;
    air_temp_f: number;
  } | null;
  focused_car?: {
    car_idx: number;
    name: string;
    num: string;
    team?: string;
    car_name?: string;
    pos: number;
    best_lap_str: string;
    last_lap_str: string;
    laps_completed: number;
    dist_pct: number;
    track_status: string;
    in_pit: boolean;
    is_player: boolean;
    speed_mph: number;
    speed_kph: number;
    gear: number;
    rpm: number;
    rpm_max: number;
    throttle_pct: number;
    brake_pct: number;
    steer_deg: number;
    fuel_liters?: number;
    delta_best: number;
  } | null;
  timing_tower?: Array<{
    car_idx: number;
    pos: number;
    name: string;
    num: string;
    team: string;
    car_name: string;
    class_name: string;
    lap: number;
    dist_pct: number;
    best_lap_str: string;
    last_lap_str: string;
    gap_str: string;
    in_pit: boolean;
    is_fastest: boolean;
    is_focused: boolean;
  }>;
  fastest_lap?: {
    driver_idx: number;
    lap_time_str: string;
  } | null;
  replay_state?: {
    is_replaying: boolean;
    replay_speed: number;
    seconds_back: number;
    last_command: string;
    timestamp: number;
  };
  overlay_overrides?: Record<string, any>;
  driver_camera?: {
    active: boolean;
    frame_jpeg_b64?: string | null;
  };
}

function SRLeagueBroadcastOverlayPageInnerContent() {
  const searchParams = useSearchParams();
  const leagueId = searchParams.get("leagueId") || "";
  const wsPort = searchParams.get("port") || "8080";

  const [league, setLeague] = useState<SRLeague | null>(null);
  const [liveBridgeData, setLiveBridgeData] = useState<LiveTelemetryPayload | null>(null);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. League Metadata Subscription
  useEffect(() => {
    if (!leagueId) return;
    const unsub = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });
    return () => unsub();
  }, [leagueId]);

  // 2. Fallback Cloud Telemetry Subscription
  useEffect(() => {
    if (!leagueId) return;
    const unsub = onSnapshot(doc(db, "sr_league_live_sessions", leagueId), (snap) => {
      if (snap.exists() && !isWsConnected) {
        setLiveBridgeData(snap.data() as LiveTelemetryPayload);
      }
    });
    return () => unsub();
  }, [leagueId, isWsConnected]);

  // 3. Local High-Speed WebSocket Connection (ws://127.0.0.1:8080)
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        const wsUrl = `ws://127.0.0.1:${wsPort}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data: LiveTelemetryPayload = JSON.parse(event.data);
            setLiveBridgeData(data);
          } catch {}
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 2000);
        };

        ws.onerror = () => {
          setIsWsConnected(false);
          ws.close();
        };
      } catch {
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearTimeout(reconnectTimeout);
    };
  }, [wsPort]);

  // Extract raw timing tower
  const rawTimingTower = liveBridgeData?.timing_tower || [];

  // Timing Tower Splitting Memo
  const { topRows, hasSplit, focusRows } = useMemo(() => {
    if (rawTimingTower.length <= 12) {
      return { topRows: rawTimingTower, hasSplit: false, focusRows: [] };
    }

    const focusedIdx = rawTimingTower.findIndex((r) => r.is_focused);

    if (focusedIdx < 8) {
      return { topRows: rawTimingTower.slice(0, 12), hasSplit: false, focusRows: [] };
    }

    const leaders = rawTimingTower.slice(0, 5);
    const startIdx = Math.max(5, focusedIdx - 2);
    const endIdx = Math.min(rawTimingTower.length, focusedIdx + 3);
    const battleGroup = rawTimingTower.slice(startIdx, endIdx);

    return {
      topRows: leaders,
      hasSplit: true,
      focusRows: battleGroup,
    };
  }, [rawTimingTower]);

  const isSimActive = Boolean(
    liveBridgeData &&
    liveBridgeData.connected === true &&
    liveBridgeData.session_info &&
    liveBridgeData.session_info.track_name &&
    liveBridgeData.session_info.track_name !== "Standby"
  );

  const session = liveBridgeData?.session_info;
  const focusedCar = liveBridgeData?.focused_car;
  const activeFlag = session?.flag_state || "GREEN";
  const isReplay = liveBridgeData?.replay_state?.is_replaying || false;
  const replaySpeed = liveBridgeData?.replay_state?.replay_speed || 1.0;
  const overrides = liveBridgeData?.overlay_overrides || {};
  const showTower = overrides.show_timing_tower !== false;
  const customBanner = overrides.custom_banner || "";
  const showDriverCam = overrides.show_driver_cam !== false;
  const driverCamera = liveBridgeData?.driver_camera;

  const flagMeta = useMemo(() => {
    switch (activeFlag) {
      case "GREEN":
        return { text: "TRACK CLEAR • GREEN FLAG", bg: "bg-emerald-600", pulse: false };
      case "YELLOW":
        return { text: "FULL COURSE CAUTION • SAFETY CAR", bg: "bg-amber-500 text-black", pulse: true };
      case "RED":
        return { text: "SESSION STOPPED • RED FLAG", bg: "bg-red-600 text-white", pulse: true };
      case "WHITE":
        return { text: "FINAL LAP • WHITE FLAG", bg: "bg-white text-black", pulse: false };
      case "CHECKERED":
        return { text: "RACE FINISH • CHECKERED FLAG", bg: "bg-neutral-900 text-white border-2 border-white", pulse: false };
      default:
        return { text: "LIVE SESSION", bg: "bg-emerald-600", pulse: false };
    }
  }, [activeFlag]);

  const rpmPercent = focusedCar && focusedCar.rpm_max > 0
    ? Math.min(100, Math.max(0, ((focusedCar.rpm || 0) / focusedCar.rpm_max) * 100))
    : 0;

  const renderDriverRow = (row: typeof rawTimingTower[0]) => (
    <div
      key={row.car_idx}
      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all duration-150 text-xs ${
        row.is_focused
          ? "bg-red-600 text-white font-black shadow-md shadow-red-600/30 scale-101 border border-red-400"
          : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
            row.pos === 1
              ? "bg-amber-400 text-black font-black"
              : row.pos === 2
              ? "bg-neutral-300 text-black font-black"
              : row.pos === 3
              ? "bg-amber-700 text-white font-black"
              : "bg-neutral-800 text-neutral-400"
          }`}
        >
          {row.pos}
        </span>

        <span className="font-black text-xs text-white/90 w-6 text-center shrink-0">
          #{row.num}
        </span>

        <div className="truncate min-w-0">
          <span className="font-bold text-xs truncate block leading-tight">
            {row.name}
          </span>
          <span className="text-[8px] text-neutral-400 block truncate leading-none">
            {row.car_name} {row.lap > 0 ? `• L${row.lap}` : ""}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0 flex items-center gap-1.5">
        {row.is_fastest && (
          <span className="px-1 py-0.5 rounded bg-purple-900/90 border border-purple-500 text-[8px] font-black text-purple-200 uppercase">
            FL
          </span>
        )}
        <span className="font-mono font-bold text-xs text-neutral-200">
          {row.gap_str || row.best_lap_str}
        </span>
      </div>
    </div>
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none font-sans p-6 pointer-events-none">
      
      {/* ─────────────────────────────────────────────────────────────
          STANDBY STATE
         ───────────────────────────────────────────────────────────── */}
      {!isSimActive && (
        <div className="fixed top-4 left-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-950/90 backdrop-blur-md border border-neutral-800 text-white shadow-2xl">
          <div className="w-3 h-3 rounded-full bg-neutral-500 animate-pulse" />
          <div className="space-y-0.5">
            <strong className="text-xs font-black uppercase text-neutral-300 block">
              ⚪ iRacing Simulator: Standby
            </strong>
            <span className="text-[10px] text-neutral-500 font-sans block">
              {isWsConnected
                ? "WebSocket Connected (ws://127.0.0.1:8080) • Waiting for active session..."
                : "WebSocket Disconnected • Launch GridPass.App SRCommander daemon"}
            </span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          LIVE BROADCAST CONTENT
         ───────────────────────────────────────────────────────────── */}
      {isSimActive && session && (
        <>
          {/* 1. TOP BROADCAST HEADER (SESSION METADATA & FLAGS) */}
          <div className="fixed top-6 left-6 right-6 z-40 flex items-center justify-between">
            
            {/* Brand & Track Badge */}
            <div className="flex items-center gap-3 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 rounded-2xl px-4 py-2.5 shadow-2xl">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-red-600/30">
                GP
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">
                  {league?.name || "GRIDPASS SIM RACING"}
                </span>
                <strong className="text-xs font-black uppercase text-white tracking-tight block">
                  {session.session_type.toUpperCase()} • {session.track_name} {session.track_config ? `(${session.track_config})` : ""} • <span className="text-amber-400 font-mono">🌡️ {session.track_temp_f}°F Track</span>
                </strong>
              </div>
            </div>

            {/* Flag Banner */}
            <div
              className={`px-5 py-2 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl transition-all duration-300 ${
                flagMeta.bg
              } ${flagMeta.pulse ? "animate-pulse" : ""}`}
            >
              <Flag className="w-4 h-4" />
              <span>{flagMeta.text}</span>
            </div>

            {/* Replay Watermark Bug */}
            {isReplay && (
              <div className="px-4 py-2 rounded-2xl bg-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl animate-pulse">
                <RotateCcw className="w-4 h-4" />
                <span>⏪ INSTANT REPLAY • {replaySpeed}X SLOW MOTION</span>
              </div>
            )}

            {/* Session Timer */}
            <div className="flex items-center gap-4 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 rounded-2xl px-4 py-2.5 shadow-2xl">
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-neutral-400 block">
                  {session.session_type} • {rawTimingTower.length} Drivers on Grid
                </span>
                <strong className="text-sm font-black text-white font-mono flex items-center justify-end gap-1">
                  <Clock className="w-3.5 h-3.5 text-red-500" />
                  <span>{session.time_remaining_str || "--:--"}</span>
                </strong>
              </div>

              <div className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 bg-emerald-950/80 text-emerald-400 border border-emerald-500/50">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>60 FPS LIVE</span>
              </div>
            </div>
          </div>

          {/* 2. LEFT LIVE TIMING TOWER (TOGGLEABLE) */}
          {showTower && rawTimingTower.length > 0 && (
            <div className="fixed top-20 left-6 z-40 w-80 space-y-1">
              <div className="bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-t-2xl px-3 py-2 flex items-center justify-between text-white text-[10px] font-black uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>{session.session_type.toUpperCase()} LEADERBOARD</span>
                </span>
                <span className="text-neutral-400 font-normal">
                  {rawTimingTower.length} Drivers
                </span>
              </div>

              <div className="space-y-0.5 bg-neutral-950/90 backdrop-blur-md border-x border-b border-neutral-800 rounded-b-2xl p-1 shadow-2xl max-h-[60vh] overflow-y-auto">
                {topRows.map(renderDriverRow)}

                {hasSplit && (
                  <div className="py-1 px-3 flex items-center justify-center gap-2 text-[8px] font-black tracking-widest text-neutral-500 uppercase my-0.5">
                    <span className="h-[1px] flex-1 bg-neutral-800" />
                    <span className="text-amber-400/90 font-bold">⋯ ON-TRACK BATTLE ⋯</span>
                    <span className="h-[1px] flex-1 bg-neutral-800" />
                  </div>
                )}

                {hasSplit && focusRows.map(renderDriverRow)}
              </div>
            </div>
          )}

          {/* 3. FOCUSED DRIVER COCKPIT CARD (RICH TELEMETRY) */}
          {focusedCar && (
            <div className="fixed bottom-8 right-6 z-40 w-96 bg-neutral-950/95 backdrop-blur-xl border-2 border-neutral-800 rounded-3xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-3">
              {/* Driver Identity */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-red-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-red-600/40">
                    #{focusedCar.num}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-amber-400 text-[9px] font-black">
                        P{focusedCar.pos}
                      </span>
                      <h3 className="text-sm font-black uppercase text-white leading-none truncate max-w-[180px]">
                        {focusedCar.name}
                      </h3>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-sans block truncate max-w-[200px] mt-0.5">
                      {focusedCar.car_name} {focusedCar.team && focusedCar.team !== "Independent" ? `• ${focusedCar.team}` : ""}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      focusedCar.in_pit
                        ? "bg-amber-950/80 text-amber-400 border-amber-500/40 animate-pulse"
                        : "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                    }`}
                  >
                    {focusedCar.track_status || "ON TRACK"}
                  </span>
                </div>
              </div>

              {/* Lap Performance */}
              <div className="grid grid-cols-3 gap-2 bg-white/5 rounded-2xl p-2.5 border border-white/5 text-center">
                <div>
                  <span className="text-[8px] uppercase font-bold text-neutral-400 block">Best Lap</span>
                  <strong className="text-xs font-black font-mono text-purple-400 block">
                    {focusedCar.best_lap_str || "--:--.---"}
                  </strong>
                </div>

                <div>
                  <span className="text-[8px] uppercase font-bold text-neutral-400 block">Last Lap</span>
                  <strong className="text-xs font-black font-mono text-neutral-200 block">
                    {focusedCar.last_lap_str || "--:--.---"}
                  </strong>
                </div>

                <div>
                  <span className="text-[8px] uppercase font-bold text-neutral-400 block">Laps Done</span>
                  <strong className="text-xs font-black font-mono text-amber-400 block">
                    {focusedCar.laps_completed ?? 0} LAPS
                  </strong>
                </div>
              </div>

              {/* Driving Telemetry */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white tracking-tighter">
                      {focusedCar.speed_mph || 0}
                    </span>
                    <span className="text-xs font-bold text-neutral-400">MPH</span>
                    <span className="text-[10px] text-neutral-500 ml-1">({focusedCar.speed_kph || 0} KM/H)</span>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border-2 border-red-600 text-white font-black text-xl flex items-center justify-center shadow-inner">
                    {focusedCar.gear === 0 ? "N" : focusedCar.gear === -1 ? "R" : focusedCar.gear || "N"}
                  </div>
                </div>

                {/* RPM Tachometer */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-neutral-400">
                    <span>RPM: {focusedCar.rpm || 900}</span>
                    <span className="text-red-500 font-black">REDLINE {focusedCar.rpm_max || 8200}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-lg bg-neutral-900 overflow-hidden border border-neutral-800 p-0.5">
                    <div
                      className={`h-full rounded transition-all duration-75 ${
                        rpmPercent > 92
                          ? "bg-red-500 animate-pulse"
                          : rpmPercent > 75
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${rpmPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Pedals */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-neutral-800 text-[10px] font-bold">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400">THROTTLE</span>
                    <span className="text-white">{Math.round(focusedCar.throttle_pct || 0)}%</span>
                  </div>
                  <div className="h-2 rounded-md bg-neutral-900 border border-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${focusedCar.throttle_pct || 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400">BRAKE</span>
                    <span className="text-white">{Math.round(focusedCar.brake_pct || 0)}%</span>
                  </div>
                  <div className="h-2 rounded-md bg-neutral-900 border border-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-75"
                      style={{ width: `${focusedCar.brake_pct || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

                    {/* DRIVER RIG FACE-CAM PiP */}
          {showDriverCam && driverCamera?.active && driverCamera.frame_jpeg_b64 && (
            <div className="fixed bottom-[340px] right-6 z-40 w-64 rounded-2xl overflow-hidden border-2 border-red-600 shadow-2xl bg-black animate-in fade-in">
              <img
                src={`data:image/jpeg;base64,${driverCamera.frame_jpeg_b64}`}
                alt="Driver Rig Face-Cam"
                className="w-full h-auto object-cover"
              />
              <div className="px-3 py-1 bg-black/90 text-[10px] font-black text-white uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  DRIVER CAM
                </span>
                <span className="text-amber-400">#{focusedCar?.num || "LIVE"}</span>
              </div>
            </div>
          )}

          {/* 4. CUSTOM LOWER-THIRD ANNOUNCEMENT BANNER */}
          {customBanner && (
            <div className="fixed bottom-8 left-6 right-[420px] z-40 bg-neutral-950/95 backdrop-blur-xl border-2 border-red-500 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shrink-0 shadow-lg shadow-red-600/40">
                📢
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-red-400 block tracking-wider">
                  RACE STEWARDS &amp; RACE CONTROL
                </span>
                <h4 className="text-base font-black uppercase text-white leading-tight">
                  {customBanner}
                </h4>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SRLeagueBroadcastOverlayPage(props: any) {
  return (
    <React.Suspense fallback={<div className="bg-transparent text-white p-6">Loading Broadcast Overlay...</div>}>
      <SRLeagueBroadcastOverlayPageInnerContent />
    </React.Suspense>
  );
}
