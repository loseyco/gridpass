"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastContext";
import {
  Tv,
  Radio,
  Video,
  Camera,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Trophy,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
  Bot,
  Layers,
  Copy,
  ExternalLink,
  Check,
  ChevronRight,
  Shield,
  Eye,
  EyeOff,
  Zap,
  Activity,
  Sliders,
  Volume2,
  Mic,
  MicOff,
  RefreshCw,
  X,
  Plus,
  Compass,
  Users,
  Megaphone,
} from "lucide-react";

interface DriverRow {
  car_idx: number;
  pos: number;
  name: string;
  num: string;
  team: string;
  car_name: string;
  speed_mph: number;
  speed_kph: number;
  gear?: number;
  rpm?: number;
  throttle_pct?: number;
  brake_pct?: number;
  best_lap_str: string;
  last_lap_str: string;
  gap_str: string;
  in_pit: boolean;
  is_fastest: boolean;
  is_focused: boolean;
}

interface LiveBridgePayload {
  connected: boolean;
  source: string;
  timestamp: number;
  session_info?: {
    track_name: string;
    track_config: string;
    session_type: string;
    session_name: string;
    session_state: string;
    flag_state: string;
    time_remaining_str: string;
    laps_remaining: number;
    track_temp_f: number;
    air_temp_f: number;
  };
  focused_car?: {
    car_idx: number;
    name: string;
    num: string;
    team: string;
    car_name: string;
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
    fuel_liters: number;
    delta_best: number;
  };
  timing_tower?: DriverRow[];
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
  paddock_attendance?: {
    total_connected: number;
    on_track_count: number;
    in_pit_count: number;
    session_phase: string;
    phase_countdown_str: string;
    gridding_status: string;
  };
}

const CAMERA_ANGLES = [
  { id: "TV1", label: "TV1 Trackside", icon: "🎥", desc: "Official Trackside Broadcast" },
  { id: "TV2", label: "TV2 Dynamic", icon: "🎬", desc: "Scenic Corner & Action Cam" },
  { id: "Blimp", label: "Heli / Blimp", icon: "🚁", desc: "Aerial Overhead Tracking" },
  { id: "Cockpit", label: "Cockpit / Gyro", icon: "🏎️", desc: "Driver POV & Gyro Cam" },
  { id: "Chase", label: "Chase Cam", icon: "💨", desc: "Third-Person Rear Follow" },
  { id: "Pit", label: "Pit Lane", icon: "⛽", desc: "Pit Road & Box Cameras" },
];

export default function SRCommanderBroadcastStudioPage({
  leagueId = "",
}: {
  leagueId?: string;
}) {
  const { showToast } = useToast();
  const [telemetry, setTelemetry] = useState<LiveBridgePayload | null>(null);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeAngle, setActiveAngle] = useState<string>("TV1");
  const [aiDirectorEnabled, setAiDirectorEnabled] = useState<boolean>(false);
  const [aiLogs, setAiLogs] = useState<Array<{ id: string; time: string; text: string }>>([]);

  // Push-to-Talk Intercom State
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Graphic Controls State
  const [showTower, setShowTower] = useState<boolean>(true);
  const [showDriverCam, setShowDriverCam] = useState<boolean>(true);
  const [customBannerText, setCustomBannerText] = useState<string>("");
  const [activeBanner, setActiveBanner] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);

  // 1. Establish High-Speed WebSocket Connection to Python Daemon (ws://127.0.0.1:8080)
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;
    const connect = () => {
      try {
        const ws = new WebSocket("ws://127.0.0.1:8080");
        wsRef.current = ws;

        ws.onopen = () => {
          setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data: LiveBridgePayload = JSON.parse(event.data);
            setTelemetry(data);
          } catch {}
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          reconnectTimer = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          setIsWsConnected(false);
          ws.close();
        };
      } catch {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Helper to Send WS Command to Daemon
  const sendCommand = useCallback((cmd: Record<string, any>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  }, []);

  // Drivers from live telemetry or fallback preview
  const timingTower = useMemo(() => {
    return telemetry?.timing_tower || [];
  }, [telemetry]);

  const focusedCar = useMemo(() => {
    return telemetry?.focused_car || null;
  }, [telemetry]);

  const sessionInfo = useMemo(() => {
    return telemetry?.session_info || null;
  }, [telemetry]);

  const isReplay = useMemo(() => {
    return telemetry?.replay_state?.is_replaying || false;
  }, [telemetry]);

  const driverCamera = useMemo(() => {
    return telemetry?.driver_camera || null;
  }, [telemetry]);

  const paddock = useMemo(() => {
    return telemetry?.paddock_attendance || {
      total_connected: timingTower.length,
      on_track_count: timingTower.filter((d) => !d.in_pit).length,
      in_pit_count: timingTower.filter((d) => d.in_pit).length,
      session_phase: sessionInfo?.session_type?.toUpperCase() || "PRACTICE",
      phase_countdown_str: sessionInfo?.time_remaining_str || "--:--",
      gridding_status: `${timingTower.length} Drivers Active`,
    };
  }, [telemetry, timingTower, sessionInfo]);

  // Push-to-Talk Steward Voice Ingestion
  const startPushToTalk = async () => {
    try {
      sendCommand({ action: "STEWARD_CHIME" });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 48000, channelCount: 1 } });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 48000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(1024, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const buffer = new ArrayBuffer(inputData.length * 4);
        const view = new Float32Array(buffer);
        view.set(inputData);
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);
        sendCommand({ action: "STEWARD_AUDIO_CHUNK", pcm_b64: b64 });
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      setIsTalking(true);

      showToast({
        title: "🎙️ STEWARD ON-AIR",
        message: "Broadcasting directly into driver headset...",
        icon: "🎙️",
      });
    } catch (err: any) {
      showToast({
        title: "Microphone Error",
        message: "Please allow browser microphone access for Steward Intercom",
        icon: "⚠️",
      });
    }
  };

  const stopPushToTalk = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsTalking(false);
    showToast({
      title: "Intercom Released",
      message: "Radio channel closed",
      icon: "🔇",
    });
  };

  // Broadcast Automated Announcement Preset
  const handleAnnouncePreset = (text: string, label: string) => {
    sendCommand({ action: "ANNOUNCE_RACE_CONTROL", text });
    showToast({
      title: `📢 Announcement Sent`,
      message: label,
      icon: "📢",
    });
  };

  // Actions
  const handleCutCameraPos = (pos: number) => {
    sendCommand({ action: "SWITCH_CAM_POS", pos: pos, group: activeAngle });
    const targetDriver = timingTower.find((d) => d.pos === pos);
    showToast({
      title: `Camera Cut to P${pos}`,
      message: targetDriver ? `#${targetDriver.num} ${targetDriver.name} (${activeAngle})` : `Position P${pos}`,
      icon: "🎥",
    });
  };

  const handleCutCameraNum = (carNum: string, driverName: string) => {
    sendCommand({ action: "SWITCH_CAM_NUM", car_num: carNum, group: activeAngle });
    showToast({
      title: `Camera Cut: #${carNum}`,
      message: `${driverName} (${activeAngle})`,
      icon: "🎥",
    });
  };

  const handleSelectAngle = (angleId: string, angleLabel: string) => {
    setActiveAngle(angleId);
    sendCommand({ action: "SWITCH_CAM_GROUP", group: angleId });
    showToast({
      title: `Camera Angle: ${angleLabel}`,
      message: `Switched perspective to ${angleLabel}`,
      icon: "📐",
    });
  };

  const handleReplayJump = (seconds: number) => {
    sendCommand({ action: "TRIGGER_REPLAY", seconds: seconds, speed: 0.5 });
    showToast({
      title: `⏪ Instant Replay -${seconds}s`,
      message: "0.5x Slow-Motion Replay Triggered on Stream",
      icon: "⏪",
    });
  };

  const handleReturnToLive = () => {
    sendCommand({ action: "REPLAY_RETURN_TO_LIVE" });
    showToast({
      title: "🔴 ON-AIR LIVE",
      message: "Exited replay mode. Feed returned to live racing.",
      icon: "🔴",
    });
  };

  const handleReplayPause = () => {
    sendCommand({ action: "REPLAY_PAUSE" });
    showToast({ title: "Replay Paused", message: "Frame freeze active", icon: "⏸️" });
  };

  const handleReplayPlay = (speed: number) => {
    sendCommand({ action: "REPLAY_PLAY", speed: speed });
    showToast({ title: `Replay Speed: ${speed}x`, message: `Playback speed set to ${speed}x`, icon: "▶️" });
  };

  // Push Graphic Overrides
  const pushGraphicOverrides = (overrides: Record<string, any>) => {
    sendCommand({ action: "OVERLAY_OVERRIDE", overrides: overrides });
  };

  const handlePushCustomBanner = () => {
    if (!customBannerText.trim()) return;
    setActiveBanner(customBannerText.trim());
    pushGraphicOverrides({ custom_banner: customBannerText.trim() });
    showToast({ title: "Banner Pushed", message: customBannerText.trim(), icon: "📢" });
  };

  const handleClearBanner = () => {
    setActiveBanner("");
    setCustomBannerText("");
    pushGraphicOverrides({ custom_banner: "" });
    showToast({ title: "Banner Cleared", message: "Removed ticker from broadcast overlay", icon: "✖️" });
  };

  // AI Race Director Auto Loop
  useEffect(() => {
    if (!aiDirectorEnabled || timingTower.length < 2) return;

    const interval = setInterval(() => {
      const p1 = timingTower[0];
      const p2 = timingTower[1];
      if (p1 && p2) {
        handleCutCameraPos(2);
        const log = {
          id: String(Date.now()),
          time: new Date().toLocaleTimeString(),
          text: `Auto-cut to P2 #${p2.num} ${p2.name} battling P1 #${p1.num} (Interval: ${p2.gap_str})`,
        };
        setAiLogs((prev) => [log, ...prev.slice(0, 9)]);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [aiDirectorEnabled, timingTower]);

  const obsOverlayUrl = typeof window !== "undefined"
    ? `${window.location.origin}/srleague/overlay?local=true`
    : `/srleague/overlay?local=true`;

  const copyObsUrl = () => {
    navigator.clipboard.writeText(obsOverlayUrl);
    setCopied(true);
    showToast({ title: "OBS URL Copied!", message: "Paste into OBS Browser Source (1920x1080)", icon: "📺" });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 font-sans select-none flex flex-col justify-between p-4 sm:p-6 space-y-6">
      
      {/* ─────────────────────────────────────────────────────────────
          MASTER HEADER BAR
         ───────────────────────────────────────────────────────────── */}
      <header className="max-w-7xl w-full mx-auto bg-[#111113] border border-neutral-800 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-red-600/40 shrink-0">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-none">
                GridPass.App SRCommander • TV Director Deck
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                isWsConnected
                  ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                  : "bg-amber-950 text-amber-400 border-amber-500/40 animate-pulse"
              }`}>
                {isWsConnected ? "● LIVE 60 FPS BRIDGE" : "⚪ DAEMON STANDBY"}
              </span>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {sessionInfo ? `${sessionInfo.track_name} • ${sessionInfo.session_type}` : "1-Click Direct Daemon Broadcast Deck"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/srcommander/rig"
            className="min-h-[44px] px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-2xl text-xs font-mono font-bold uppercase transition flex items-center gap-2"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Rig Manager</span>
          </Link>

          <button
            type="button"
            onClick={copyObsUrl}
            className="min-h-[44px] px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-2xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
            <span>{copied ? "Copied OBS URL" : "Copy OBS URL"}</span>
          </button>

          <Link
            href="/srleague/overlay?local=true"
            target="_blank"
            className="min-h-[44px] px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-2xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-purple-400" />
            <span>Open Overlay</span>
          </Link>

          <button
            type="button"
            onClick={handleReturnToLive}
            className={`min-h-[44px] px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-98 ${
              !isReplay
                ? "bg-emerald-600/20 text-emerald-400 border-2 border-emerald-500/50"
                : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/40 animate-pulse border-2 border-red-400"
            }`}
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>{!isReplay ? "● ON-AIR LIVE" : "🔴 RETURN TO LIVE"}</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          PADDOCK ATTENDANCE & SESSION TRANSITION RADAR BAR
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl w-full mx-auto bg-[#111113] border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            <strong className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              Live League Paddock &amp; Session Transition Radar
            </strong>
          </div>

          {/* Phase Countdown Badge */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-mono font-bold text-white flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Phase Timer: <strong className="text-amber-400">{paddock.phase_countdown_str}</strong></span>
            </span>
          </div>
        </div>

        {/* 4-Stage Session Progress Radar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className={`p-3 rounded-2xl border transition ${
            paddock.session_phase === "PRACTICE"
              ? "bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-md"
              : "bg-neutral-900 border-neutral-800 text-neutral-400"
          }`}>
            <span className="text-[9px] uppercase font-bold block">1. OPEN PRACTICE</span>
            <strong className="text-sm font-black block mt-0.5">
              {paddock.session_phase === "PRACTICE" ? `● ACTIVE (${paddock.phase_countdown_str})` : "COMPLETED"}
            </strong>
          </div>

          <div className={`p-3 rounded-2xl border transition ${
            paddock.session_phase.includes("QUAL")
              ? "bg-purple-950/70 border-purple-500 text-purple-200 shadow-md"
              : "bg-neutral-900 border-neutral-800 text-neutral-400"
          }`}>
            <span className="text-[9px] uppercase font-bold block">2. QUALIFYING</span>
            <strong className="text-sm font-black block mt-0.5">
              {paddock.session_phase.includes("QUAL") ? `● FLYING LAPS` : "NEXT UP"}
            </strong>
          </div>

          <div className={`p-3 rounded-2xl border transition ${
            paddock.session_phase.includes("WARM") || paddock.session_phase.includes("GRID")
              ? "bg-amber-950/70 border-amber-500 text-amber-200 shadow-md"
              : "bg-neutral-900 border-neutral-800 text-neutral-400"
          }`}>
            <span className="text-[9px] uppercase font-bold block">3. GRIDDING WINDOW</span>
            <strong className="text-sm font-black block mt-0.5">
              {paddock.gridding_status}
            </strong>
          </div>

          <div className={`p-3 rounded-2xl border transition ${
            paddock.session_phase === "RACE"
              ? "bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-md"
              : "bg-neutral-900 border-neutral-800 text-neutral-400"
          }`}>
            <span className="text-[9px] uppercase font-bold block">4. GREEN FLAG RACE</span>
            <strong className="text-sm font-black block mt-0.5">
              {paddock.session_phase === "RACE" ? "● RACING ON-AIR" : "STANDBY"}
            </strong>
          </div>
        </div>

        {/* Live Attendance Breakdown Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-neutral-900/90 border border-emerald-500/40 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black uppercase text-emerald-400">On Track Now</span>
            </div>
            <strong className="text-base font-black font-mono text-white">{paddock.on_track_count} Cars</strong>
          </div>

          <div className="p-3 bg-neutral-900/90 border border-amber-500/40 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-black uppercase text-amber-400">In Pit / Garage</span>
            </div>
            <strong className="text-base font-black font-mono text-white">{paddock.in_pit_count} Cars</strong>
          </div>

          <div className="p-3 bg-neutral-900/90 border border-neutral-700 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black uppercase text-neutral-300">Total in Sim Server</span>
            </div>
            <strong className="text-base font-black font-mono text-white">{paddock.total_connected} Drivers</strong>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          MAIN 2-COLUMN BROADCAST DIRECTOR GRID
         ───────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PROGRAM MONITOR, DRIVER FACE-CAM & CAMERA SWITCHER */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION 1: LIVE PROGRAM MONITOR & DRIVER WEBCAM PiP */}
          <div className="bg-[#111113] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-red-500" />
                <strong className="text-xs font-black uppercase tracking-wider text-white">
                  Section 1: Live Program Monitor &amp; Active Focus
                </strong>
              </div>

              <span className="text-xs font-mono text-neutral-400">
                {sessionInfo?.flag_state || "GREEN"} FLAG • {timingTower.length} Drivers Active
              </span>
            </div>

            {/* Simulated / Embedded Program Viewport */}
            <div className="relative aspect-video w-full rounded-2xl bg-neutral-950 border-2 border-neutral-800 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
              
              {/* Top Viewport Status */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-white text-[11px] font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  <span>
                    PROGRAM OUT: {focusedCar ? `#${focusedCar.num} ${focusedCar.name}` : "Awaiting iRacing Focus"}
                  </span>
                </div>

                {isReplay ? (
                  <div className="px-3 py-1 rounded-xl bg-amber-500 text-black font-black text-xs uppercase flex items-center gap-1.5 animate-pulse shadow-lg">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>INSTANT REPLAY ({telemetry?.replay_state?.replay_speed || 0.5}x)</span>
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-xl bg-red-600 text-white font-black text-xs uppercase flex items-center gap-1.5 shadow-lg">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>LIVE ON-AIR</span>
                  </div>
                )}
              </div>

              {/* Viewport Center Graphic */}
              <div className="my-auto text-center space-y-1.5 z-10">
                <span className="text-2xl sm:text-3xl font-black text-white/50 tracking-widest uppercase block">
                  {activeAngle.toUpperCase()} CAMERA FEED
                </span>
                <p className="text-xs text-neutral-400 font-mono">
                  {sessionInfo ? `${sessionInfo.track_name} • ${sessionInfo.session_type}` : "Connecting to ws://127.0.0.1:8080"}
                </p>
              </div>

              {/* Driver Face-Cam PiP Window (if active) */}
              {driverCamera?.active && driverCamera.frame_jpeg_b64 && (
                <div className="absolute top-14 right-4 z-20 w-44 rounded-xl overflow-hidden border-2 border-red-500 shadow-2xl bg-black">
                  <img
                    src={`data:image/jpeg;base64,${driverCamera.frame_jpeg_b64}`}
                    alt="Driver Rig Face-Cam"
                    className="w-full h-auto object-cover"
                  />
                  <div className="px-2 py-0.5 bg-black/90 text-[9px] font-black text-white uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      DRIVER CAM
                    </span>
                    <span className="text-amber-400">#{focusedCar?.num || "LIVE"}</span>
                  </div>
                </div>
              )}

              {/* Bottom Program Overlay Pill */}
              <div className="flex items-center justify-between z-10 flex-wrap gap-2">
                {focusedCar ? (
                  <div className="flex items-center gap-3 bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-neutral-800 text-xs font-mono">
                    <span className="text-amber-400 font-bold">P{focusedCar.pos}</span>
                    <span className="text-white font-bold">{focusedCar.speed_mph} MPH</span>
                    <span className="text-neutral-400">GEAR {focusedCar.gear || "N"}</span>
                    <span className="text-emerald-400 font-bold">{focusedCar.rpm} RPM</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      focusedCar.in_pit ? "bg-amber-950 text-amber-400" : "bg-emerald-950 text-emerald-400"
                    }`}>
                      {focusedCar.track_status}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500 font-mono">
                    Launch python scripts/gridpass_core_daemon.py
                  </div>
                )}

                <div className="px-3 py-1.5 rounded-xl bg-black/80 border border-neutral-800 text-[11px] font-mono font-bold text-neutral-300">
                  Angle: <span className="text-red-400 uppercase">{activeAngle}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: INTERACTIVE CAMERA SWITCHER MATRIX */}
          <div className="bg-[#111113] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-red-500" />
                <strong className="text-xs font-black uppercase tracking-wider text-white">
                  Section 2: Camera Switcher Matrix
                </strong>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">Click to Cut Live in iRacing</span>
            </div>

            {/* P1-P10 Quick-Cut Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                Leaderboard Quick-Cut Buttons (1-Tap Switch):
              </span>
              {timingTower.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {timingTower.slice(0, 10).map((d) => {
                    const isFocused = d.is_focused || (focusedCar?.car_idx === d.car_idx);
                    return (
                      <button
                        key={d.car_idx}
                        type="button"
                        onClick={() => handleCutCameraPos(d.pos)}
                        className={`min-h-[54px] p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isFocused
                            ? "bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/30 scale-102"
                            : "bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-neutral-200"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                              d.pos === 1
                                ? "bg-amber-400 text-black"
                                : d.pos === 2
                                ? "bg-neutral-300 text-black"
                                : d.pos === 3
                                ? "bg-amber-700 text-white"
                                : "bg-neutral-800 text-neutral-400"
                            }`}
                          >
                            {d.pos}
                          </span>
                          <span className="text-[10px] font-mono font-bold">#{d.num}</span>
                        </div>
                        <div className="truncate text-xs font-black uppercase mt-1 leading-tight">
                          {d.name}
                        </div>
                        <div className="text-[9px] font-mono text-neutral-400 mt-0.5 truncate">
                          {d.gap_str || d.best_lap_str}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-center text-xs text-neutral-400 font-mono">
                  ⚪ Waiting for iRacing telemetry feed on ws://127.0.0.1:8080...
                </div>
              )}
            </div>

            {/* 6 Master Camera Angles */}
            <div className="pt-3 border-t border-neutral-800 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                Camera Angle Selector:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CAMERA_ANGLES.map((cam) => {
                  const isActive = activeAngle.toLowerCase() === cam.id.toLowerCase();
                  return (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => handleSelectAngle(cam.id, cam.label)}
                      className={`min-h-[48px] p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                        isActive
                          ? "bg-neutral-800 border-red-500 text-white shadow-md"
                          : "bg-neutral-900 hover:bg-neutral-800/80 border-neutral-800 text-neutral-300"
                      }`}
                    >
                      <span className="text-lg">{cam.icon}</span>
                      <div className="min-w-0">
                        <strong className="text-xs font-black uppercase block leading-tight truncate">
                          {cam.label}
                        </strong>
                        <span className="text-[9px] text-neutral-400 block truncate">{cam.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERCOM, VOICE DISPATCHER, REPLAY & GRAPHICS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SECTION 3: STEWARD PUSH-TO-TALK & AUTOMATED RACE CONTROL ANNOUNCEMENTS */}
          <div className="bg-[#111113] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-red-500" />
                <strong className="text-xs font-black uppercase tracking-wider text-white">
                  Section 3: Race Control Intercom &amp; Voice Dispatcher
                </strong>
              </div>

              <span className="text-[10px] font-mono font-bold uppercase text-neutral-400">
                Direct In-Ear Radio
              </span>
            </div>

            {/* Push-to-Talk Big Red Button */}
            <div className="space-y-3">
              <button
                type="button"
                onMouseDown={startPushToTalk}
                onMouseUp={stopPushToTalk}
                onTouchStart={startPushToTalk}
                onTouchEnd={stopPushToTalk}
                className={`w-full min-h-[64px] rounded-2xl font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-3 cursor-pointer shadow-xl active:scale-98 ${
                  isTalking
                    ? "bg-red-600 text-white border-2 border-red-400 shadow-red-600/50 animate-pulse"
                    : "bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white"
                }`}
              >
                {isTalking ? <Mic className="w-6 h-6 animate-bounce" /> : <MicOff className="w-6 h-6 text-neutral-400" />}
                <span>{isTalking ? "● ON-AIR • SPEAKING TO DRIVER" : "HOLD TO TALK (STEWARD RADIO)"}</span>
              </button>

              {/* 1-Click Automated Voice Dispatch Presets */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-800">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                  1-Click Automated Steward Announcements:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAnnouncePreset("Attention all drivers: Practice session is closing in one minute. Prepare for qualifying.", "Practice 1m Warning")}
                    className="min-h-[40px] p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-[11px] font-bold text-left transition text-neutral-200 cursor-pointer flex items-center gap-1.5 truncate"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">"1 Min to Qual"</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnnouncePreset("Gridding window is now open. All drivers report to the starting grid immediately.", "Gridding Window Call")}
                    className="min-h-[40px] p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-[11px] font-bold text-left transition text-neutral-200 cursor-pointer flex items-center gap-1.5 truncate"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">"Report to Grid"</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnnouncePreset("The pace car is rolling. Maintain your double file grid position.", "Pace Car Rolling")}
                    className="min-h-[40px] p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-[11px] font-bold text-left transition text-neutral-200 cursor-pointer flex items-center gap-1.5 truncate"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">"Pace Car Rolling"</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnnouncePreset("Caution flag is out! Full course yellow. Slow down and maintain position.", "Full Course Yellow")}
                    className="min-h-[40px] p-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl text-[11px] font-bold text-left transition text-amber-300 cursor-pointer flex items-center gap-1.5 truncate"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">"Caution / Safety Car"</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: INSTANT REPLAY & INCIDENTS */}
          <div className="bg-[#111113] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-500" />
                <strong className="text-xs font-black uppercase tracking-wider text-white">
                  Section 4: Instant Replay Engine
                </strong>
              </div>

              <button
                type="button"
                onClick={() => handleReplayJump(10)}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer"
              >
                + Quick 0.5x Replay (-10s)
              </button>
            </div>

            {/* Replay Transport Controls */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                Rewind &amp; Scrub Controls:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleReplayJump(15)}
                  className="min-h-[44px] py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-2xl text-xs font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>⏪ -15s</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReplayJump(10)}
                  className="min-h-[44px] py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-2xl text-xs font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>⏪ -10s</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReplayJump(5)}
                  className="min-h-[44px] py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-2xl text-xs font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>⏪ -5s</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleReplayPause}
                  className="min-h-[44px] py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-2xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReplayPlay(0.5)}
                  className="min-h-[44px] py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-2xl text-xs font-black uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>⏯️ 0.5x Slow</span>
                </button>
                <button
                  type="button"
                  onClick={handleReturnToLive}
                  className="min-h-[44px] py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>🔴 Go Live</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 5: BROADCAST GRAPHIC MASTER CONTROLS */}
          <div className="bg-[#111113] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-500" />
                <strong className="text-xs font-black uppercase tracking-wider text-white">
                  Section 5: Broadcast Graphic Master Controls
                </strong>
              </div>
            </div>

            {/* Timing Tower & Driver Cam Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                  Timing Tower:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !showTower;
                    setShowTower(next);
                    pushGraphicOverrides({ show_timing_tower: next });
                  }}
                  className={`w-full min-h-[44px] py-2 px-3 rounded-xl font-bold text-xs uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                    showTower ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {showTower ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{showTower ? "Tower Visible" : "Tower Hidden"}</span>
                </button>
              </div>

              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                  Driver Face-Cam PiP:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !showDriverCam;
                    setShowDriverCam(next);
                    pushGraphicOverrides({ show_driver_cam: next });
                  }}
                  className={`w-full min-h-[44px] py-2 px-3 rounded-xl font-bold text-xs uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                    showDriverCam ? "bg-purple-600 text-white" : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>{showDriverCam ? "Cam Visible" : "Cam Hidden"}</span>
                </button>
              </div>
            </div>

            {/* Lower-Third Custom Banner */}
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400">
                  Custom Lower-Third Announcement:
                </span>
                {activeBanner && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[9px] font-black uppercase">
                    ● ON BROADCAST
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  value={customBannerText}
                  onChange={(e) => setCustomBannerText(e.target.value)}
                  placeholder="e.g. Stewards Investigation: Turn 1 Contact"
                  className="w-full px-3 py-2 bg-black border border-neutral-700 rounded-xl text-white font-bold placeholder-neutral-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePushCustomBanner}
                  className="flex-1 min-h-[44px] py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Show Banner</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearBanner}
                  className="min-h-[44px] px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 6: AI RACE DIRECTOR */}
          <div className="bg-[#111113] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <strong className="text-xs font-black uppercase tracking-wider text-white">
                  Section 6: AI Race Director (Autonomous Mode)
                </strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !aiDirectorEnabled;
                  setAiDirectorEnabled(next);
                  showToast({
                    title: next ? "🤖 AI Director: ACTIVE" : "AI Director: OFF",
                    message: next ? "Auto-cutting on battles & incidents" : "Manual Director Mode",
                    icon: "🤖",
                  });
                }}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-2xl font-black text-xs uppercase transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  aiDirectorEnabled
                    ? "bg-purple-600 text-white border border-purple-400 animate-pulse"
                    : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-700"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiDirectorEnabled ? "AI ACTIVE" : "AI DISABLED"}</span>
              </button>
            </div>
            
            {aiLogs.length > 0 && (
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 max-h-32 overflow-y-auto text-[11px] font-mono">
                {aiLogs.map((log) => (
                  <div key={log.id} className="text-neutral-400">
                    <span className="text-neutral-600">[{log.time}]</span> {log.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
