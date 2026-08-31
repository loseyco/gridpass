"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ToastContext";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Radio,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Zap,
  Tv,
  Flame,
  Activity,
  Clock,
  Flag,
  Trophy,
  Shield,
  Sliders,
  Settings,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Camera,
  Sparkles,
  Check,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Monitor,
  Headphones,
  Users,
  Send,
  Share2,
  Compass,
  Eye,
  Layers,
  ExternalLink,
  MessageSquare,
  RadioTower,
  Cpu,
  Maximize2,
  ChevronDown,
  Loader2,
  HardDrive,
  Fuel,
  Disc,
  FastForward,
  Rewind,
  Volume1,
  Megaphone,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   TYPE DEFINITIONS
   ───────────────────────────────────────────────────────────── */
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
  driver_camera?: {
    active: boolean;
    frame_jpeg_b64?: string | null;
  };
}

interface ChatMessage {
  id: string;
  time: string;
  sender: string;
  num: string;
  channel: string;
  text: string;
  type: string;
  badge?: string;
}

/* ─────────────────────────────────────────────────────────────
   AUDIO SYNTHESIZER UTILITIES (Web Audio API)
   ───────────────────────────────────────────────────────────── */
function playMotorsportBeep(type: "ptt_on" | "ptt_off" | "steward_chime") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "ptt_on") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.06);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "ptt_off") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.05);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "steward_chime") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.setValueAtTime(880.0, now + 0.12);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, now);
      osc2.frequency.setValueAtTime(1318.51, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    }
  } catch (err) {
    console.warn("Audio synthesis:", err);
  }
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT INNER (STRICT ZERO SYNTHETIC FALLBACKS)
   ───────────────────────────────────────────────────────────── */
function SRCommanderCommsDesktopContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Navigation & Mode
  const [activeTab, setActiveTab] = useState<"comms" | "telemetry" | "hardware" | "broadcast">("comms");
  const [envMode, setEnvMode] = useState<"live" | "local">("live");
  const [unitSystem, setUnitSystem] = useState<"mph" | "kph">("mph");

  // WebSocket Live Connection to Python Daemon (ws://127.0.0.1:8080)
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [rawTelemetry, setRawTelemetry] = useState<LiveBridgePayload | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Tab 1: Paddock Comms & Team Radio State
  const [selectedChannel, setSelectedChannel] = useState<"car_radio" | "spotter" | "steward" | "paddock">("car_radio");
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [stewardAnnouncementText, setStewardAnnouncementText] = useState<string>("");
  const [chatInput, setChatInput] = useState<string>("");
  const [firestoreMessages, setFirestoreMessages] = useState<ChatMessage[]>([]);

  // Tab 3: Rig Hardware State
  const [fanPower, setFanPower] = useState<number>(0);
  const [isTestingFan, setIsTestingFan] = useState<boolean>(false);
  const [haloMode, setHaloMode] = useState<string>("OFF");
  const [haloBrightness, setHaloBrightness] = useState<number>(0);
  const [isTestingLed, setIsTestingLed] = useState<boolean>(false);

  // Tab 4: Broadcast Studio State
  const [activeCameraGroup, setActiveCameraGroup] = useState<string>("LIVE");

  /* ─────────────────────────────────────────────────────────────
     1. REAL-TIME FIRESTORE RADIO MESSAGES LISTENER
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    try {
      const q = query(
        collection(db, "paddock_messages"),
        orderBy("created_at", "desc"),
        limit(40)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          msgs.push({
            id: doc.id,
            time: d.created_at?.toDate
              ? d.created_at.toDate().toLocaleTimeString("en-US", { hour12: false })
              : new Date().toLocaleTimeString("en-US", { hour12: false }),
            sender: d.sender_name || "Unknown Driver",
            num: d.car_number || "00",
            channel: d.channel || "paddock",
            text: d.text || "",
            type: d.type || "text",
            badge: d.badge || (d.channel === "steward" ? "STEWARD" : "RADIO"),
          });
        });
        setFirestoreMessages(msgs.reverse());
      }, (err) => {
        console.warn("Firestore radio messages subscription:", err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firestore listener setup error:", err);
    }
  }, []);

  /* ─────────────────────────────────────────────────────────────
     2. WEBSOCKET CONNECTION TO PYTHON DAEMON
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;
    const connect = () => {
      try {
        const ws = new WebSocket("ws://127.0.0.1:8080");
        wsRef.current = ws;

        ws.onopen = () => {
          setIsWsConnected(true);
          ws.send(JSON.stringify({ action: "GET_RIG_CONFIG_AND_DEVICES" }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "RIG_CONFIG_AND_DEVICES" && data.config) {
              if (data.config.halo_led_mode) setHaloMode(data.config.halo_led_mode);
              if (data.config.halo_led_brightness) setHaloBrightness(data.config.halo_led_brightness);
            } else {
              setRawTelemetry(data);
            }
          } catch {}
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          reconnectTimer = setTimeout(connect, 2500);
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

  const sendWsCommand = useCallback((cmd: Record<string, any>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  }, []);

  // Keyboard Spacebar PTT Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsTransmitting(true);
        playMotorsportBeep("ptt_on");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsTransmitting(false);
        playMotorsportBeep("ptt_off");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  /* ─────────────────────────────────────────────────────────────
     3. STRICT RAW TELEMETRY EVALUATION (ZERO SYNTHETIC DATA)
     ───────────────────────────────────────────────────────────── */
  const telemetry = useMemo(() => {
    const isLive = Boolean(rawTelemetry?.connected && rawTelemetry.focused_car);
    const fc = rawTelemetry?.focused_car;
    const si = rawTelemetry?.session_info;

    return {
      isLive,
      carNum: fc?.num || "--",
      driverName: fc?.name || "No Driver Focused",
      carName: fc?.car_name || "No Vehicle Detected",
      trackName: si?.track_name || "No Active Sim Track",
      trackConfig: si?.track_config || "",
      sessionPhase: si?.session_type ? si.session_type.toUpperCase() : "STANDBY",
      sessionCountdown: si?.time_remaining_str || "--:--",
      flagState: si?.flag_state || "NONE",
      speedMph: fc ? Math.round(fc.speed_mph || 0) : 0,
      speedKph: fc ? Math.round(fc.speed_kph || 0) : 0,
      gear: fc ? (fc.gear === 0 ? "N" : fc.gear === -1 ? "R" : String(fc.gear || "N")) : "N",
      rpm: fc ? Math.round(fc.rpm || 0) : 0,
      rpmMax: fc?.rpm_max || 8000,
      throttlePct: fc ? Math.round((fc.throttle_pct || 0) * 100) : 0,
      brakePct: fc ? Math.round((fc.brake_pct || 0) * 100) : 0,
      steerDeg: fc ? Math.round(fc.steer_deg || 0) : 0,
      deltaBest: fc?.delta_best || 0,
      fuelLiters: fc?.fuel_liters || 0,
      bestLapStr: fc?.best_lap_str || "--:--.---",
      lastLapStr: fc?.last_lap_str || "--:--.---",
      pos: fc?.pos || 0,
      timingTower: rawTelemetry?.timing_tower || [],
    };
  }, [rawTelemetry]);

  /* ─────────────────────────────────────────────────────────────
     4. USER ACTIONS & FIRESTORE RADIO TRANSMISSION
     ───────────────────────────────────────────────────────────── */
  const handlePttToggle = (transmitting: boolean) => {
    setIsTransmitting(transmitting);
    playMotorsportBeep(transmitting ? "ptt_on" : "ptt_off");
  };

  const handleTriggerStewardChime = () => {
    playMotorsportBeep("steward_chime");
    sendWsCommand({ action: "STEWARD_CHIME" });
    showToast({
      title: "Steward Chime Broadcasted",
      message: "Priority radio alert sound dispatched to all drivers.",
      icon: "🔔",
    });
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const textToSend = chatInput.trim();
    setChatInput("");

    try {
      await addDoc(collection(db, "paddock_messages"), {
        sender_name: telemetry.driverName !== "No Driver Focused" ? telemetry.driverName : "Driver",
        car_number: telemetry.carNum !== "--" ? telemetry.carNum : "00",
        channel: selectedChannel,
        text: textToSend,
        type: "text",
        badge: selectedChannel === "car_radio" ? "CAR" : selectedChannel === "spotter" ? "SPOTTER" : "DRIVER",
        created_at: serverTimestamp(),
      });

      showToast({
        title: "Radio Transmission Logged",
        message: textToSend,
        icon: "🎙️",
      });
    } catch (err: any) {
      showToast({
        title: "Transmission Error",
        message: err?.message || "Failed to post message",
        icon: "⚠️",
      });
    }
  };

  const handleShareTelemetrySnippet = async (type: "delta" | "fuel") => {
    if (!telemetry.isLive) {
      showToast({
        title: "Sim Offline",
        message: "Connect iRacing to share real telemetry.",
        icon: "⚠️",
      });
      return;
    }

    let snippetText = "";
    if (type === "delta") {
      snippetText = `⏱️ Car #${telemetry.carNum} Lap Delta: ${telemetry.deltaBest < 0 ? "-" : "+"}${Math.abs(telemetry.deltaBest).toFixed(3)}s vs PB (${telemetry.bestLapStr})`;
    } else if (type === "fuel") {
      snippetText = `⛽ Car #${telemetry.carNum} Fuel Status: ${telemetry.fuelLiters.toFixed(1)}L remaining.`;
    }

    try {
      await addDoc(collection(db, "paddock_messages"), {
        sender_name: telemetry.driverName,
        car_number: telemetry.carNum,
        channel: selectedChannel,
        text: snippetText,
        type: "telemetry_share",
        badge: "TELEMETRY",
        created_at: serverTimestamp(),
      });

      showToast({
        title: "Telemetry Shared",
        message: snippetText,
        icon: "📡",
      });
    } catch (err: any) {
      showToast({
        title: "Share Error",
        message: err?.message || "Failed to share telemetry",
        icon: "⚠️",
      });
    }
  };

  const handleTestFanBurst = () => {
    setIsTestingFan(true);
    sendWsCommand({ action: "TEST_FAN", power: fanPower, duration: 5.0 });
    showToast({
      title: "Wind Sim Fan Burst Triggered",
      message: `Running fans at ${fanPower}% power for 5 seconds.`,
      icon: "💨",
    });
    setTimeout(() => setIsTestingFan(false), 5000);
  };

  const handleTestLedPattern = () => {
    setIsTestingLed(true);
    sendWsCommand({ action: "TEST_LED", mode: "REDLINE_SHIFT", duration: 4.0 });
    showToast({
      title: "Chassis Halo LED Test Active",
      message: "Testing sequential RPM shift light pattern.",
      icon: "💡",
    });
    setTimeout(() => setIsTestingLed(false), 4000);
  };

  const handleTriggerReplay = (seconds: number, speed: number = 0.5) => {
    sendWsCommand({ action: "TRIGGER_REPLAY", seconds, speed });
    showToast({
      title: `⏪ Slow-Mo Replay Triggered (-${seconds}s)`,
      message: `Jumping back ${seconds}s at ${speed}x slow-motion speed.`,
      icon: "🎬",
    });
  };

  const handleReturnToLive = () => {
    sendWsCommand({ action: "REPLAY_RETURN_TO_LIVE" });
    showToast({
      title: "Returned to Live Broadcast Feed",
      message: "Live telemetry and real-time tracking restored.",
      icon: "🔴",
    });
  };

  const rpmPct = telemetry.rpmMax > 0 ? Math.min(100, Math.max(0, (telemetry.rpm / telemetry.rpmMax) * 100)) : 0;
  const isRedline = rpmPct >= 94;

  const renderTachometerLeds = () => {
    const totalLeds = 16;
    const activeCount = Math.round((rpmPct / 100) * totalLeds);

    return (
      <div className="flex items-center justify-between gap-1 sm:gap-1.5 w-full">
        {Array.from({ length: totalLeds }).map((_, i) => {
          const isActive = i < activeCount && telemetry.isLive;
          let ledColorClass = "bg-neutral-200 border-neutral-300";

          if (isActive) {
            if (i < 4) {
              ledColorClass = "bg-emerald-500 border-emerald-600 shadow-xs shadow-emerald-500/50";
            } else if (i < 8) {
              ledColorClass = "bg-amber-400 border-amber-500 shadow-xs shadow-amber-400/50";
            } else if (i < 12) {
              ledColorClass = "bg-orange-500 border-orange-600 shadow-xs shadow-orange-500/50";
            } else {
              ledColorClass = isRedline
                ? "bg-red-600 border-red-700 animate-pulse shadow-sm shadow-red-600"
                : "bg-red-600 border-red-700 shadow-xs shadow-red-600/50";
            }
          }

          return (
            <div
              key={i}
              className={`h-4 sm:h-5 flex-1 rounded-sm border transition-all duration-75 ${ledColorClass}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between select-none">
      {/* ─────────────────────────────────────────────────────────────
          1. FRAMELESS MOTORSPORT TOP HEADER BAR
         ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand Beveled Badge */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center font-black text-white text-xl tracking-tighter shadow-md shadow-red-600/30 shrink-0">
                GP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black uppercase tracking-tight text-neutral-900 leading-none">
                    GRIDPASS // SIM COMMANDER
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-300 text-[10px] font-mono font-bold text-neutral-600">
                    v4.3.0
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-neutral-500">
                  <span className="font-bold text-neutral-800">{telemetry.trackName}</span>
                  <span>•</span>
                  <span>{telemetry.carName}</span>
                </div>
              </div>
            </div>

            {/* Mobile Status */}
            <div className="md:hidden">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                  telemetry.isLive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-neutral-100 text-neutral-600 border-neutral-200"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${telemetry.isLive ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
                <span>{telemetry.isLive ? "60 FPS" : "STANDBY"}</span>
              </span>
            </div>
          </div>

          {/* Center: Live iRacing Status + Session Phase Pill */}
          <div className="hidden md:flex items-center gap-3">
            <div
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider border flex items-center gap-2 shadow-2xs ${
                telemetry.isLive
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-neutral-100 text-neutral-600 border-neutral-300"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${telemetry.isLive ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
              <span>{telemetry.isLive ? "🟢 60 FPS LIVE" : "⚪ SIM STANDBY (WAITING FOR IRACING)"}</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-mono flex items-center gap-2 shadow-2xs">
              <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] uppercase">
                {telemetry.sessionPhase}
              </span>
              <span className="font-bold text-neutral-800">{telemetry.sessionCountdown}</span>
              <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-bold text-[10px] uppercase border border-neutral-300">
                FLAG: {telemetry.flagState}
              </span>
            </div>

            <button
              onClick={() => setEnvMode(envMode === "live" ? "local" : "live")}
              className="px-3 py-1.5 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-200 text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>{envMode === "live" ? "🌐 LIVE" : "💻 LOCAL DEV"}</span>
            </button>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Link
              href="/srcommander/overlay"
              target="_blank"
              className="px-3.5 py-2 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
            >
              <Monitor className="w-3.5 h-3.5 text-red-500" />
              <span>In-Game Overlay</span>
            </Link>

            <Link
              href="/srcommander/rig"
              className="px-3.5 py-2 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-red-600" />
              <span>Rig Manager</span>
            </Link>

            <Link
              href="/srcommander/studio"
              className="px-3.5 py-2 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-2xs"
            >
              <Tv className="w-3.5 h-3.5 text-red-600" />
              <span>TV Studio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. 4-TAB NAVIGATION RAIL
         ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4">
        <div className="bg-neutral-100 p-1.5 rounded-3xl border border-neutral-200 flex items-center gap-1 overflow-x-auto shadow-inner">
          <button
            onClick={() => setActiveTab("comms")}
            className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "comms"
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-white/60"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>🎙️ Paddock Comms &amp; Radio</span>
          </button>

          <button
            onClick={() => setActiveTab("telemetry")}
            className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "telemetry"
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-white/60"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>🏎️ Cockpit HUD &amp; Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab("hardware")}
            className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "hardware"
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-white/60"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>🎛️ Rig Hardware</span>
          </button>

          <button
            onClick={() => setActiveTab("broadcast")}
            className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "broadcast"
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-white/60"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>📺 Broadcast Studio</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN TAB CONTENT PANELS (ZERO SYNTHETIC DATA)
         ───────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* ═════════════════════════════════════════════════════════════
            TAB 1: 🎙️ PADDOCK COMMS & TEAM RADIO
           ═════════════════════════════════════════════════════════════ */}
        {activeTab === "comms" && (
          <div className="space-y-6">
            {/* Steward Priority Override Banner */}
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shadow-md shadow-red-600/30 shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-tight text-red-900">
                      Steward Priority Race Control Override
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-mono font-bold uppercase">
                      PRIORITY CHANNEL
                    </span>
                  </div>
                  <p className="text-xs text-red-700 font-sans mt-0.5">
                    Broadcasting overrides driver team channels with synchronized race control voice and audio tone.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleTriggerStewardChime}
                  className="px-4 py-2.5 rounded-2xl bg-white hover:bg-red-100 border border-red-300 text-red-700 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer w-full sm:w-auto"
                >
                  <Volume2 className="w-4 h-4 text-red-600" />
                  <span>🔔 Test Steward Chime</span>
                </button>
              </div>
            </div>

            {/* Radio Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Channels & PTT Engine */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                      Active Radio Channel
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      AES-256 ENCRYPTED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setSelectedChannel("car_radio")}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        selectedChannel === "car_radio"
                          ? "bg-white border-red-500 shadow-xs ring-2 ring-red-100"
                          : "bg-white/60 hover:bg-white border-neutral-200 text-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-bold text-xs">
                          #{telemetry.carNum !== "--" ? telemetry.carNum : "CAR"}
                        </div>
                        <div>
                          <strong className="text-xs font-black uppercase text-neutral-900 block">
                            Team Radio {telemetry.carNum !== "--" ? `Car #${telemetry.carNum}` : "(Assigned on Grid)"}
                          </strong>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            Private Driver &amp; Race Engineer Feed
                          </span>
                        </div>
                      </div>
                      {selectedChannel === "car_radio" && <Check className="w-4 h-4 text-red-600" />}
                    </button>

                    <button
                      onClick={() => setSelectedChannel("spotter")}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        selectedChannel === "spotter"
                          ? "bg-white border-red-500 shadow-xs ring-2 ring-red-100"
                          : "bg-white/60 hover:bg-white border-neutral-200 text-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold text-xs">
                          AI
                        </div>
                        <div>
                          <strong className="text-xs font-black uppercase text-neutral-900 block">
                            Spotter Whisper Channel
                          </strong>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            Low-latency AI tactical corner &amp; car proximity alerts
                          </span>
                        </div>
                      </div>
                      {selectedChannel === "spotter" && <Check className="w-4 h-4 text-red-600" />}
                    </button>

                    <button
                      onClick={() => setSelectedChannel("steward")}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        selectedChannel === "steward"
                          ? "bg-white border-red-500 shadow-xs ring-2 ring-red-100"
                          : "bg-white/60 hover:bg-white border-neutral-200 text-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-xs">
                          🛡️
                        </div>
                        <div>
                          <strong className="text-xs font-black uppercase text-neutral-900 block">
                            Steward Race Control Broadcast
                          </strong>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            League official race director announcements &amp; penalties
                          </span>
                        </div>
                      </div>
                      {selectedChannel === "steward" && <Check className="w-4 h-4 text-red-600" />}
                    </button>

                    <button
                      onClick={() => setSelectedChannel("paddock")}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        selectedChannel === "paddock"
                          ? "bg-white border-red-500 shadow-xs ring-2 ring-red-100"
                          : "bg-white/60 hover:bg-white border-neutral-200 text-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-700 flex items-center justify-center font-bold text-xs">
                          ☕
                        </div>
                        <div>
                          <strong className="text-xs font-black uppercase text-neutral-900 block">
                            Paddock Open Lounge
                          </strong>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            Open paddock channel for all drivers and marshals
                          </span>
                        </div>
                      </div>
                      {selectedChannel === "paddock" && <Check className="w-4 h-4 text-red-600" />}
                    </button>
                  </div>
                </div>

                {/* Push-To-Talk Indicator */}
                <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                      Push-To-Talk Engine
                    </span>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer ${
                        isMuted
                          ? "bg-red-100 text-red-700 border border-red-300"
                          : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                      }`}
                    >
                      {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{isMuted ? "MUTED" : "UNMUTED"}</span>
                    </button>
                  </div>

                  <button
                    onMouseDown={() => handlePttToggle(true)}
                    onMouseUp={() => handlePttToggle(false)}
                    onTouchStart={() => handlePttToggle(true)}
                    onTouchEnd={() => handlePttToggle(false)}
                    className={`w-full py-6 rounded-2xl font-black text-sm uppercase tracking-wider transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      isTransmitting
                        ? "bg-red-600 text-white ring-4 ring-red-200 shadow-lg shadow-red-600/40 animate-pulse"
                        : "bg-neutral-900 hover:bg-black text-white shadow-md shadow-neutral-900/20 active:scale-98"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Radio className={`w-5 h-5 ${isTransmitting ? "animate-bounce" : ""}`} />
                      <span>{isTransmitting ? "TRANSMITTING LIVE ON AIR" : "PUSH TO TALK (PTT)"}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-300 font-normal">
                      Hold Spacebar or Wheel Button 3 to broadcast
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Firestore Radio Chat Feed */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-xs flex flex-col h-[560px]">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-red-600" />
                      <strong className="text-xs font-black uppercase text-neutral-900">
                        {selectedChannel === "car_radio"
                          ? "Team Radio Channel"
                          : selectedChannel === "spotter"
                          ? "Spotter Tactical Channel"
                          : selectedChannel === "steward"
                          ? "Steward Dispatch Feed"
                          : "Paddock Open Chat"}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleShareTelemetrySnippet("delta")}
                        disabled={!telemetry.isLive}
                        className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg text-[10px] font-mono font-bold text-neutral-700 transition cursor-pointer shadow-2xs disabled:opacity-40"
                      >
                        + Share Delta
                      </button>
                      <button
                        onClick={() => handleShareTelemetrySnippet("fuel")}
                        disabled={!telemetry.isLive}
                        className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg text-[10px] font-mono font-bold text-neutral-700 transition cursor-pointer shadow-2xs disabled:opacity-40"
                      >
                        + Share Fuel
                      </button>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs">
                    {firestoreMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                        <Radio className="w-8 h-8 mb-2 text-neutral-300" />
                        <span className="text-xs font-bold uppercase">⚪ No Radio Messages Yet</span>
                        <p className="text-[11px] font-sans text-neutral-500 mt-1">
                          Hold PTT or type a message below to transmit to this channel.
                        </p>
                      </div>
                    ) : (
                      firestoreMessages.map((msg) => {
                        const isSteward = msg.channel === "steward" || msg.type === "steward_alert";
                        const isTelemetry = msg.type === "telemetry_share";

                        return (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-2xl border transition ${
                              isSteward
                                ? "bg-red-50/80 border-red-200 text-red-900"
                                : isTelemetry
                                ? "bg-purple-50/80 border-purple-200 text-purple-950"
                                : "bg-white border-neutral-200 text-neutral-800 shadow-2xs"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-white font-black text-[9px]">
                                  #{msg.num}
                                </span>
                                <strong className="font-bold text-[11px] text-neutral-900">
                                  {msg.sender}
                                </strong>
                                {msg.badge && (
                                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                                    msg.badge === "STEWARD"
                                      ? "bg-red-600 text-white"
                                      : msg.badge === "TELEMETRY"
                                      ? "bg-purple-600 text-white"
                                      : "bg-neutral-200 text-neutral-700"
                                  }`}>
                                    {msg.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-400">{msg.time}</span>
                            </div>
                            <p className="text-xs leading-relaxed font-sans text-neutral-800">{msg.text}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Chat Input Bar */}
                  <div className="pt-2 border-t border-neutral-200 flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendChatMessage();
                      }}
                      placeholder={`Transmit message to ${selectedChannel.replace("_", " ")}...`}
                      className="flex-1 px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-sans text-neutral-900 focus:outline-hidden focus:border-red-500 shadow-inner"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            TAB 2: 🏎️ COCKPIT HUD & LIVE TELEMETRY
           ═════════════════════════════════════════════════════════════ */}
        {activeTab === "telemetry" && (
          <div className="space-y-6">
            {/* Top 16-LED Sequential Shift RPM Tachometer Arch */}
            <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-xs text-center">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-500 font-bold uppercase tracking-wider">
                  Sequential Shift Tachometer (Live SDK Telemetry)
                </span>
                <span className="font-bold text-neutral-800">
                  {telemetry.isLive ? `${telemetry.rpm.toLocaleString()} / ${telemetry.rpmMax.toLocaleString()} RPM (${Math.round(rpmPct)}%)` : "⚪ Standby (0 RPM)"}
                </span>
              </div>

              {renderTachometerLeds()}
            </div>

            {/* Core Instrument Cluster: Big Gear, Speed & Lap Delta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Gear Indicator */}
              <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-2 shadow-xs text-center flex flex-col justify-center items-center">
                <span className="text-xs font-mono font-bold uppercase text-neutral-500">
                  Active Gear
                </span>
                <div className="text-7xl font-black font-mono text-neutral-950 tracking-tighter">
                  {telemetry.gear}
                </div>
                <span className="text-[11px] font-mono text-neutral-400">
                  Sequential Paddle Shift
                </span>
              </div>

              {/* Card 2: Live Speed Display */}
              <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-2 shadow-xs text-center flex flex-col justify-center items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase text-neutral-500">
                    Live Velocity
                  </span>
                  <button
                    onClick={() => setUnitSystem(unitSystem === "mph" ? "kph" : "mph")}
                    className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded text-[9px] font-mono font-bold uppercase text-neutral-700 cursor-pointer"
                  >
                    {unitSystem.toUpperCase()}
                  </button>
                </div>
                <div className="text-7xl font-black font-mono text-red-600 tracking-tighter">
                  {unitSystem === "mph" ? telemetry.speedMph : telemetry.speedKph}
                </div>
                <span className="text-[11px] font-mono text-neutral-500 font-bold uppercase">
                  {unitSystem.toUpperCase()} • GPS Ground Speed
                </span>
              </div>

              {/* Card 3: Session Lap Delta */}
              <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-2 shadow-xs text-center flex flex-col justify-center items-center">
                <span className="text-xs font-mono font-bold uppercase text-neutral-500">
                  Delta vs Session Best
                </span>
                <div className={`text-6xl font-black font-mono tracking-tighter ${
                  telemetry.isLive
                    ? telemetry.deltaBest < 0 ? "text-emerald-600" : "text-red-600"
                    : "text-neutral-400"
                }`}>
                  {telemetry.isLive
                    ? `${telemetry.deltaBest < 0 ? "-" : "+"}${Math.abs(telemetry.deltaBest).toFixed(3)}s`
                    : "0.000s"}
                </div>
                <span className="text-[11px] font-mono text-neutral-500">
                  Best: <strong className="text-neutral-900">{telemetry.bestLapStr}</strong> | Last: {telemetry.lastLapStr}
                </span>
              </div>
            </div>

            {/* Pedals & Inputs */}
            <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                  Pedals &amp; Steering Input Telemetry
                </span>
                <span className="text-[10px] font-mono font-bold text-neutral-600 bg-neutral-200 px-2 py-0.5 rounded">
                  DirectInput 250Hz
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-emerald-700">THROTTLE:</span>
                    <span className="font-bold text-neutral-900">{telemetry.throttlePct}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 h-3.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-75"
                      style={{ width: `${telemetry.throttlePct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-red-700">BRAKE PRESSURE:</span>
                    <span className="font-bold text-neutral-900">{telemetry.brakePct}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 h-3.5 rounded-full overflow-hidden">
                    <div
                      className="bg-red-600 h-full transition-all duration-75"
                      style={{ width: `${telemetry.brakePct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-neutral-600">
                  <span>Steering Angle:</span>
                  <strong className="text-neutral-900 font-bold">{telemetry.steerDeg}°</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            TAB 3: 🎛️ RIG HARDWARE
           ═════════════════════════════════════════════════════════════ */}
        {activeTab === "hardware" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wind Sim PWM Fans */}
            <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                    Dual Wind Sim Fan Pods
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-mono font-bold uppercase border border-cyan-300">
                  PWM 4-PIN @ COM4
                </span>
              </div>

              <p className="text-xs text-neutral-600 font-sans">
                Dynamic airspeed simulation matched to in-game telemetry speed with custom curve acceleration.
              </p>

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-neutral-200">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-neutral-700">Test Fan Power:</span>
                  <strong className="text-neutral-900">{fanPower}%</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fanPower}
                  onChange={(e) => setFanPower(parseInt(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <button
                  onClick={handleTestFanBurst}
                  disabled={isTestingFan}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <span>{isTestingFan ? "Running 5s Burst..." : "💨 Test 5-Second Fan Burst"}</span>
                </button>
              </div>
            </div>

            {/* Chassis Halo WS2812B RGB LEDs */}
            <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                    Chassis Halo RGB LEDs
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-mono font-bold uppercase border border-red-300">
                  WS2812B 60-LED ARCH
                </span>
              </div>

              <p className="text-xs text-neutral-600 font-sans">
                Chassis shift light bar and ambient racing flag illumination arch over primary monitor.
              </p>

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-neutral-200">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-neutral-700">Brightness:</span>
                  <strong className="text-neutral-900">{haloBrightness}%</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={haloBrightness}
                  onChange={(e) => setHaloBrightness(parseInt(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <button
                  onClick={handleTestLedPattern}
                  disabled={isTestingLed}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <span>{isTestingLed ? "Testing Shift Light..." : "💡 Test Sequential Shift Arch"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            TAB 4: 📺 BROADCAST STUDIO
           ═════════════════════════════════════════════════════════════ */}
        {activeTab === "broadcast" && (
          <div className="space-y-6">
            <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                    1-Click Instant Slow-Mo Replay Director
                  </h3>
                </div>
                <button
                  onClick={handleReturnToLive}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <span>🟢 RETURN TO LIVE</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => handleTriggerReplay(10, 0.5)}
                  className="p-4 bg-white hover:bg-red-50 border border-neutral-200 hover:border-red-300 rounded-2xl text-center space-y-1 transition cursor-pointer shadow-2xs"
                >
                  <Rewind className="w-5 h-5 text-red-600 mx-auto" />
                  <strong className="text-xs font-black uppercase text-neutral-900 block">
                    ⏪ Replay 10s
                  </strong>
                  <span className="text-[10px] text-neutral-500 font-mono">0.5x Slow-Mo</span>
                </button>

                <button
                  onClick={() => handleTriggerReplay(15, 0.25)}
                  className="p-4 bg-white hover:bg-red-50 border border-neutral-200 hover:border-red-300 rounded-2xl text-center space-y-1 transition cursor-pointer shadow-2xs"
                >
                  <Rewind className="w-5 h-5 text-red-600 mx-auto" />
                  <strong className="text-xs font-black uppercase text-neutral-900 block">
                    ⏪ Replay 15s
                  </strong>
                  <span className="text-[10px] text-neutral-500 font-mono">0.25x Super Slow</span>
                </button>

                <button
                  onClick={() => handleTriggerReplay(30, 1.0)}
                  className="p-4 bg-white hover:bg-red-50 border border-neutral-200 hover:border-red-300 rounded-2xl text-center space-y-1 transition cursor-pointer shadow-2xs"
                >
                  <Rewind className="w-5 h-5 text-red-600 mx-auto" />
                  <strong className="text-xs font-black uppercase text-neutral-900 block">
                    ⏪ Replay 30s
                  </strong>
                  <span className="text-[10px] text-neutral-500 font-mono">1.0x Realtime</span>
                </button>

                <Link
                  href="/srcommander/studio"
                  className="p-4 bg-neutral-900 hover:bg-black text-white rounded-2xl text-center space-y-1 transition flex flex-col items-center justify-center shadow-sm"
                >
                  <Tv className="w-5 h-5 text-red-500" />
                  <strong className="text-xs font-black uppercase block">
                    Open Full Studio →
                  </strong>
                  <span className="text-[10px] text-neutral-400 font-mono">Director Deck</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER
         ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 bg-neutral-50 px-4 sm:px-6 py-4 text-center text-xs font-mono text-neutral-500">
        GridPass.App SRCommander Ecosystem • Native Motorsport Desktop Command Center
      </footer>
    </div>
  );
}

export default function SRCommanderCommsDesktopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 font-mono text-xs">Loading Command Center...</div>}>
      <SRCommanderCommsDesktopContent />
    </Suspense>
  );
}
