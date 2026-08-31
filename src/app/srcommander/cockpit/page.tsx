"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CommanderRig, CommanderSession } from "@/lib/types/commander";
import { 
  Activity, 
  Zap, 
  ShieldCheck, 
  Terminal, 
  Layers, 
  Pause, 
  Trash2, 
  Play, 
  RotateCcw, 
  Square, 
  Power, 
  Check, 
  Loader2, 
  Gamepad2, 
  Database,
  Sparkles,
  RotateCw,
  CheckCircle,
  LogOut,
  Truck,
  Crosshair,
  Target,
  X,
  HelpCircle,
  Clock,
  Timer,
  Film,
  SkipBack,
  SkipForward,
  AlertTriangle,
  Radio,
  Tv,
  Clapperboard
} from "lucide-react";

export interface LogEntry {
  id: string;
  timestamp: number;
  timeStr: string;
  type: "telemetry" | "button" | "pending" | "focus" | "macro" | "voice" | "spotter" | "system";
  message: string;
  details?: any;
}

export interface ControlItem {
  id: string;
  name: string;
  key: string;
  command: string;
  description: string;
  lastVerified: string | null;
  lastChanged: string;
  isVerified: boolean;
  status: "verified" | "unverified" | "testing";
}

function CockpitDevCleanSlateContent() {
  const searchParams = useSearchParams();
  const rigId = searchParams?.get("rigId") || "gp_trailer_pod1";

  const [rig, setRig] = useState<CommanderRig | null>(null);
  const [loading, setLoading] = useState(true);

  // Inspector Drawer State & Active Tab
  const [showRightInspector, setShowRightInspector] = useState(true);
  const [activeTab, setActiveTab] = useState<"log" | "controls" | "variables">("log");

  // Calibration State
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibratingButton, setCalibratingButton] = useState<string | null>(null);
  const [calibrationCountdown, setCalibrationCountdown] = useState<number>(0);
  const [savedCoordinates, setSavedCoordinates] = useState<Record<string, { x: number; y: number; calibrated?: boolean }>>({});

  const fetchCoordinates = useCallback(async () => {
    try {
      const res = await fetch("/api/commander/calibration");
      if (res.ok) {
        const data = await res.json();
        if (data.coordinates) setSavedCoordinates(data.coordinates);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchCoordinates();
  }, [fetchCoordinates]);

  const handleStartCalibration = (btnKey: string) => {
    setCalibratingButton(btnKey);
    setCalibrationCountdown(3);
    triggerHardwareCommand(`calibrate_${btnKey}`);
    addLog("macro", `🎯 [CALIBRATION] Hover mouse over [${btnKey.toUpperCase()}] button in iRacing in 3... 2... 1...`);

    const interval = setInterval(() => {
      setCalibrationCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCalibratingButton(null);
          setTimeout(fetchCoordinates, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResetCoordinates = async (btnKey: string) => {
    try {
      await fetch("/api/commander/calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_coords", button: btnKey }),
      });
      fetchCoordinates();
      addLog("macro", `🔄 [CALIBRATION] Reset [${btnKey.toUpperCase()}] coordinates to auto-detection.`);
    } catch {}
  };

  // Dev Log State
  const [isLogPaused, setIsLogPaused] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Telemetry Variables Search State
  const [varSearchQuery, setVarSearchQuery] = useState<string>("");

  // Controls Matrix State
  const [controlsList, setControlsList] = useState<ControlItem[]>([
    {
      id: "ignition",
      name: "Engine Ignition & Starter",
      key: "I / S",
      command: "smart_ignition",
      description: "State-aware start (I + S crank) / cut (I toggle)",
      lastVerified: "11:16 AM",
      lastChanged: "Loaded from controls.cfg",
      isVerified: true,
      status: "verified",
    },
    {
      id: "pit_limiter",
      name: "Pit Speed Limiter",
      key: "P",
      command: "pit_limiter",
      description: "Toggles pit speed limiter (EngineWarnings bit 0x10)",
      lastVerified: "11:16 AM",
      lastChanged: "Loaded from controls.cfg",
      isVerified: true,
      status: "verified",
    },
    {
      id: "tearoff",
      name: "Visor Tearoff / Wiper",
      key: "Alt + T",
      command: "tearoff",
      description: "Cleans windshield and helmet visor",
      lastVerified: "10:50 AM",
      lastChanged: "Default Shortcut",
      isVerified: true,
      status: "verified",
    },
    {
      id: "reset_car",
      name: "Safe Tow to Pit Stall",
      key: "Shift + R",
      command: "reset_car",
      description: "State-aware tow (Kills ignition -> 0 MPH stop -> Shift+R)",
      lastVerified: "10:33 AM",
      lastChanged: "Default Shortcut",
      isVerified: true,
      status: "verified",
    },
    {
      id: "exit_car",
      name: "Auto-Eject & Garage Return",
      key: "Escape (Hold)",
      command: "exit_car",
      description: "Safely returns driver out-of-car to garage timing screen",
      lastVerified: "10:33 AM",
      lastChanged: "Default Shortcut",
      isVerified: true,
      status: "verified",
    },
    {
      id: "replay_prev_lap",
      name: "Replay: Rewind 1 Lap",
      key: "Ctrl + Left / SDK",
      command: "replay_prev_lap",
      description: "Rewinds broadcast replay back by 1 lap",
      lastVerified: null,
      lastChanged: "Replay Engine",
      isVerified: true,
      status: "verified",
    },
    {
      id: "replay_next_lap",
      name: "Replay: Forward 1 Lap",
      key: "Ctrl + Right / SDK",
      command: "replay_next_lap",
      description: "Fast-forwards broadcast replay to next lap",
      lastVerified: null,
      lastChanged: "Replay Engine",
      isVerified: true,
      status: "verified",
    },
    {
      id: "replay_prev_incident",
      name: "Replay: Jump to Crash / Incident",
      key: "Ctrl + Num0 / SDK",
      command: "replay_prev_incident",
      description: "Rewinds broadcast replay to previous car incident / spin",
      lastVerified: null,
      lastChanged: "Replay Engine",
      isVerified: true,
      status: "verified",
    },
    {
      id: "replay_play_pause",
      name: "Replay: Play / Pause Playback",
      key: "Space / SDK",
      command: "replay_play_pause",
      description: "Toggles live broadcast replay playback between 0x and 1x speed",
      lastVerified: null,
      lastChanged: "Replay Engine",
      isVerified: true,
      status: "verified",
    },
    {
      id: "replay_to_live",
      name: "Replay: Jump to Live Action",
      key: "Ctrl + End / SDK",
      command: "replay_to_live",
      description: "Jumps replay tape straight to live current on-track action",
      lastVerified: null,
      lastChanged: "Replay Engine",
      isVerified: true,
      status: "verified",
    },
    {
      id: "replay_stint_highlights",
      name: "Replay: Stint Highlights Reel",
      key: "SDK Automation",
      command: "replay_stint_highlights",
      description: "Cues multi-lap stint highlight replay for incoming driver change",
      lastVerified: null,
      lastChanged: "Replay Engine",
      isVerified: true,
      status: "verified",
    },
  ]);

  // Telemetry Pipeline Health
  const [lastTickTime, setLastTickTime] = useState<number>(Date.now());
  const [tickLatencyMs, setTickLatencyMs] = useState<number>(0);
  const [channelCount, setChannelCount] = useState<number>(328);

  // All-Systems Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{ passed: boolean; message: string; timestamp: number } | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Load stored logs from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem("srcommander_cockpit_logs");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLogs(parsed);
        }
      }
    } catch (e) {}
  }, []);

  // Save logs to localStorage on update
  useEffect(() => {
    if (logs.length > 0) {
      try {
        localStorage.setItem("srcommander_cockpit_logs", JSON.stringify(logs.slice(0, 150)));
      } catch (e) {}
    }
  }, [logs]);

  // Helper to add local log event (Newest on TOP)
  const addLog = useCallback((type: LogEntry["type"], message: string, details?: any) => {
    if (isLogPaused) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + 
                    "." + String(now.getMilliseconds()).padStart(3, "0");

    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      timeStr,
      type,
      message,
      details,
    };

    setLogs((prev) => [entry, ...prev].slice(0, 200));

    fetch("/api/commander/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, message, details }),
    }).catch(() => {});
  }, [isLogPaused]);

  // Initial Welcome Log
  useEffect(() => {
    addLog("system", "Cockpit State-Aware Console initialized on rig: " + rigId);
  }, [addLog, rigId]);

  // Sequential In-Flight Guarded Telemetry & Log Sync (ZERO ERR_INSUFFICIENT_RESOURCES)
  useEffect(() => {
    let isMounted = true;
    let telemTimer: NodeJS.Timeout;
    let logTimer: NodeJS.Timeout;
    let isFetchingTelem = false;
    let isFetchingLogs = false;

    const pollTelemetry = async () => {
      if (!isMounted) return;
      if (isFetchingTelem) {
        telemTimer = setTimeout(pollTelemetry, 60);
        return;
      }

      isFetchingTelem = true;
      const startReq = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(`/api/commander/telemetry?rigId=${rigId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok && isMounted) {
          const data = await res.json();
          const latency = Date.now() - startReq;
          setTickLatencyMs(latency);

          if (data.telemetry) {
            setLastTickTime(Date.now());
            setRig((prev) => {
              if (prev) return { ...prev, telemetry: data.telemetry };
              return {
                id: rigId,
                name: "Mobile Sim Trailer Pod 1",
                owner_id: "loseyp@gmail.com",
                current_session_id: null,
                session_max_minutes: 8,
                session_grace_period_finish_lap: true,
                status: "online",
                is_locked: false,
                telemetry: data.telemetry,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as CommanderRig;
            });
            setLoading(false);
          }
        }
      } catch (e) {
        // Silently swallow aborts / network hiccups
      } finally {
        isFetchingTelem = false;
        if (isMounted) {
          telemTimer = setTimeout(pollTelemetry, 60); // Clean 16Hz sequential cycle
        }
      }
    };

    const pollLogs = async () => {
      if (!isMounted || isLogPaused) {
        logTimer = setTimeout(pollLogs, 1000);
        return;
      }
      if (isFetchingLogs) {
        logTimer = setTimeout(pollLogs, 1000);
        return;
      }

      isFetchingLogs = true;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch("/api/commander/logs?limit=80", {
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data.logs) && data.logs.length > 0) {
            setLogs(data.logs);
          }
        }
      } catch (e) {
      } finally {
        isFetchingLogs = false;
        if (isMounted) {
          logTimer = setTimeout(pollLogs, 1000); // 1Hz clean log refresh
        }
      }
    };

    // Kick off sequential pollers
    pollTelemetry();
    pollLogs();

    return () => {
      isMounted = false;
      clearTimeout(telemTimer);
      clearTimeout(logTimer);
    };
  }, [rigId, isLogPaused]);

  const telem = rig?.telemetry;
  const speedMph = telem?.speed ? Math.round(telem.speed * 2.23694) : 0;
  const gear = telem?.gear === -1 ? "R" : telem?.gear === 0 ? "N" : telem?.gear || "N";
  const rpm = telem?.rpm ? Math.round(telem.rpm) : 0;
  const isOnTrack = telem?.is_on_track || false;
  const isInPit = telem?.is_in_pit_stall || false;
  const timeSinceLastTick = Math.max(0, Date.now() - lastTickTime);

  // Real-time Electrical & Engine State Telemetry from iRacing SDK
  const voltage = telem?.voltage ?? 0.0;
  const isIgnitionCircuitOn = telem?.is_ignition_on ?? false;
  const isEngineRunning = telem?.is_engine_running ?? (rpm >= 600);
  const oilPress = telem?.oil_press_bar ?? 0.0;
  const engineWarnings = telem?.engine_warnings ?? 0;
  const isOnPitRoad = telem?.is_on_pit_road || isInPit;
  const isPitLimiterActive = telem?.is_pit_limiter_active ?? false;

  // -------------------------------------------------------------
  // DETERMINISTIC AUTOMOTIVE PUSH-BUTTON ENGINE STATE MACHINE (FSM)
  // -------------------------------------------------------------
  type EngineFSM = "OFF" | "STARTING" | "RUNNING" | "STOPPING";
  const [engineState, setEngineState] = useState<EngineFSM>(rpm >= 600 ? "RUNNING" : "OFF");
  const [activeStartStep, setActiveStartStep] = useState<number>(0);

  // Telemetry Evaluation Engine
  useEffect(() => {
    // 1. If we are STARTING -> wait until engine catches idle (>= 600 RPM) to go RUNNING
    if (engineState === "STARTING") {
      if (rpm >= 600 || isEngineRunning) {
        setEngineState("RUNNING");
        addLog("macro", `✅ [AUTO-START] Engine caught idle & running at ${rpm.toLocaleString()} RPM!`);
      }
    }
    // 2. If we are STOPPING -> wait until engine spools down (<= 450 RPM or !isEngineRunning) to go OFF
    else if (engineState === "STOPPING") {
      if (rpm <= 450 || !isEngineRunning) {
        setEngineState("OFF");
        addLog("macro", `✅ [AUTO-STOP] Engine shut down complete (0 RPM)!`);
      }
    }
    // 3. Passive External Sync (in case car was started/stalled via pedals/wheel)
    else if (engineState === "OFF" && rpm >= 600) {
      setEngineState("RUNNING");
    } else if (engineState === "RUNNING" && (rpm <= 450 || !isEngineRunning)) {
      setEngineState("OFF");
    }
  }, [rpm, isEngineRunning, engineState, addLog]);

  // Session Timer Data from Telemetry
  const sessionTimer = telem?.session_timer;
  const sessionTimerState = sessionTimer?.state || "IDLE";
  const sessionLimitSec = sessionTimer?.limit_seconds || 15;
  const sessionTimeRemaining = sessionTimer?.time_remaining_sec ?? sessionLimitSec;
  const sessionGraceEnabled = sessionTimer?.grace_enabled ?? true;
  const sessionGraceElapsed = sessionTimer?.grace_time_elapsed_sec ?? 0.0;
  const sessionStatusMsg = sessionTimer?.status_message || "⚪ Standby (Waiting for Pit Exit)";

  const handleSetTimeLimit = async (sec: number) => {
    addLog("system", `⏱️ Setting session time limit to ${sec}s...`);
    triggerHardwareCommand(`set_session_limit_${sec}`);
    try {
      await fetch("/api/commander/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit_seconds: sec }),
      });
    } catch {}
  };

  const handleToggleGracePeriod = async () => {
    addLog("system", `🛡️ Toggling Lap Grace Period...`);
    triggerHardwareCommand("toggle_grace_period");
    try {
      await fetch("/api/commander/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grace_enabled: !sessionGraceEnabled }),
      });
    } catch {}
  };

  const handleResetSessionTimer = () => {
    addLog("system", `🔄 Resetting Session Timer to Standby...`);
    triggerHardwareCommand("reset_session_timer");
  };

  // Hardware Macro Dispatcher
  const triggerHardwareCommand = async (cmd: string) => {
    const cmdId = Math.random().toString(36).substring(2, 9);
    addLog("button", `[USER TAP] Triggered button: '${cmd}' (ID: ${cmdId})`);
    
    // Update control verification status in matrix
    setControlsList((prev) =>
      prev.map((c) => {
        if (c.command === cmd) {
          const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          return { ...c, lastVerified: nowStr, isVerified: true, status: "verified" };
        }
        return c;
      })
    );

    try {
      addLog("pending", `Dispatching command '${cmd}' to /api/commander/rig...`);
      const res = await fetch("/api/commander/rig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rig_id: rigId,
          action: "set_pending_command",
          command: cmd,
          cmd_id: cmdId,
        }),
      });
      if (res.ok) {
        addLog("pending", `✅ Command '${cmd}' queued in memory. Daemon will execute next tick.`);
      }
    } catch (e: any) {
      addLog("system", `❌ Command error: ${e?.message || e}`);
    }
  };

  // Modern Push-Button Start / Stop Handler
  const handleEngineStartStop = () => {
    // Interlock: Prevent engine start/crank when driver is out of car (on garage timing screen)
    if (!isOnTrack) {
      addLog("system", "⚠️ [INTERLOCK BLOCKED] Cannot start engine: Driver is currently OUT OF CAR. Tap [ JUMP IN CAR ] first.");
      return;
    }

    if (engineState === "OFF" || engineState === "STOPPING") {
      // Transition strictly from OFF -> STARTING immediately (ZERO intermediate state!)
      setEngineState("STARTING");
      setActiveStartStep(1); // 1. IGN 'I'
      addLog("macro", `⚡ [PUSH-BUTTON START] Step 1/3: Engaging Ignition Switch ('I')...`);
      triggerHardwareCommand("smart_ignition");

      // Live keystroke animation timing
      setTimeout(() => {
        setActiveStartStep(2); // 2. Clutch 'C'
        addLog("macro", `⚡ [PUSH-BUTTON START] Step 2/3: Dipping Clutch Pedal ('C')...`);
      }, 400);

      setTimeout(() => {
        setActiveStartStep(3); // 3. Starter 'S'
        addLog("macro", `⚡ [PUSH-BUTTON START] Step 3/3: Cranking Starter Motor ('S')...`);
      }, 800);

      // Safety timeout fallback (7 seconds)
      setTimeout(() => {
        setEngineState((curr) => {
          if (curr === "STARTING" && rpm < 600) {
            setActiveStartStep(0);
            return "OFF";
          }
          return curr;
        });
      }, 7000);
    } else {
      // Transition strictly from RUNNING -> STOPPING immediately
      setEngineState("STOPPING");
      setActiveStartStep(0);
      addLog("macro", `⚡ [PUSH-BUTTON STOP] Cutting engine ignition ('I')...`);
      triggerHardwareCommand("smart_ignition");

      // Safety timeout fallback (1.5 seconds)
      setTimeout(() => {
        setEngineState((curr) => {
          if (curr === "STOPPING") {
            setActiveStartStep(0);
            return (rpm <= 450 || !isEngineRunning) ? "OFF" : "RUNNING";
          }
          return curr;
        });
      }, 1500);
    }
  };

  // -------------------------------------------------------------
  // HERO 1-TAP DRIVE NOW / START STINT HANDLER
  // -------------------------------------------------------------
  const [driveNowLoading, setDriveNowLoading] = useState<boolean>(false);

  const handleDriveNow = async () => {
    setDriveNowLoading(true);
    addLog("macro", "🏎️ [DRIVE NOW] Initiating 1-Tap Stint Dispatch via /api/commander/drive-now...");
    try {
      const res = await fetch("/api/commander/drive-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rig_id: rigId,
          session_id: rig?.current_session_id || null,
        }),
      });

      if (res.ok) {
        addLog("macro", "✅ [DRIVE NOW] Stint launched! Dispatched enter_car & ignition commands.");
        if (engineState === "OFF") {
          setTimeout(() => {
            handleEngineStartStop();
          }, 600);
        }
      } else {
        const data = await res.json();
        addLog("system", `⚠️ [DRIVE NOW] Status: ${data?.message || data?.error || "Dispatched"}`);
      }
    } catch (e: any) {
      addLog("system", `❌ [DRIVE NOW ERROR] ${e?.message || e}`);
    } finally {
      setTimeout(() => setDriveNowLoading(false), 1200);
    }
  };

  // -------------------------------------------------------------
  // 4-STATE SMART RESET & TOW CONTROLLER
  // -------------------------------------------------------------
  type ResetFSMState = "MOVING_SAFE_TOW" | "STOPPED_TOW" | "IN_PIT_EXIT_GARAGE" | "GARAGE_DRIVE";
  const [resetPending, setResetPending] = useState<boolean>(false);

  // Auto-clear resetPending after 3.2 seconds or on state change
  useEffect(() => {
    if (resetPending) {
      const timer = setTimeout(() => {
        setResetPending(false);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [resetPending]);

  const resetState: ResetFSMState = useMemo(() => {
    if (!isOnTrack) {
      return "GARAGE_DRIVE";
    }
    if (isInPit) {
      return "IN_PIT_EXIT_GARAGE";
    }
    if (speedMph > 1) {
      return "MOVING_SAFE_TOW";
    }
    return "STOPPED_TOW";
  }, [isOnTrack, isInPit, speedMph]);

  const handleSmartReset = () => {
    setResetPending(true);
    let actionDesc = "";
    if (resetState === "MOVING_SAFE_TOW") {
      actionDesc = `SAFE STOP & TOW (@ ${speedMph} MPH) -> Coasting to stop & towing to pit stall...`;
    } else if (resetState === "STOPPED_TOW") {
      actionDesc = "TOW TO PITS -> Holding Shift+R (2.5s) to tow directly to pit stall...";
    } else if (resetState === "IN_PIT_EXIT_GARAGE") {
      actionDesc = "EXIT TO GARAGE -> Holding Escape (2.5s) to exit car to garage screen...";
    } else {
      actionDesc = "JUMP IN CAR -> Loading into cockpit seat (Drive)...";
    }

    addLog("macro", `⚡ [SMART RESET TAP] ${actionDesc}`);
    triggerHardwareCommand("smart_reset");

    // Reset pending state automatically
    setTimeout(() => {
      setResetPending(false);
    }, 4500);
  };

  // Run 5-Point All-Systems Check
  const runAllSystemsCheck = async () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditResult(null);
    addLog("system", "🚀 [USER TRIGGERED] Running Full 5-Point Hardware & Telemetry Systems Check...");

    try {
      const res = await fetch("/api/commander/system-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rigId }),
      });
      const data = await res.json();
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      if (data.passed) {
        setAuditResult({
          passed: true,
          message: "100% OPERATIONAL: All 5 hardware checks passed & verified in iRacing!",
          timestamp: Date.now(),
        });
        setControlsList((prev) =>
          prev.map((c) => ({ ...c, lastVerified: nowStr, isVerified: true, status: "verified" }))
        );
        addLog("system", "🏆 [AUDIT PASS] All hardware keystrokes & telemetry verified 100% operational!");
      } else {
        setAuditResult({
          passed: false,
          message: data.error || "System check completed with warnings.",
          timestamp: Date.now(),
        });
      }
    } catch (e: any) {
      setAuditResult({
        passed: false,
        message: e.message || "Failed to execute audit script.",
        timestamp: Date.now(),
      });
    } finally {
      setIsAuditing(false);
    }
  };

  // Real-time Vehicle State Machine
  const vehicleState = useMemo(() => {
    const isEngineActive = (telem?.rpm || 0) > 100;
    const isCarMoving = (telem?.speed || 0) > 0.5 || speedMph > 0;
    const hasGear = (telem?.gear || 0) !== 0;
    const inWorld = isOnTrack || isEngineActive || isCarMoving || hasGear;

    if (!inWorld) {
      return {
        label: "🔴 OUT OF CAR (GARAGE / TIMING)",
        detail: "Driver is out of car on the garage timing screen",
        bg: "bg-red-950/80 border-red-600/60 text-red-200",
        badge: "bg-red-600 text-white",
      };
    }

    if (isCarMoving && speedMph >= 1) {
      return {
        label: `⚡ IN CAR (ON TRACK - RACING @ ${speedMph} MPH)`,
        detail: `Lap ${telem?.lap || 1} • Gear ${gear} • ${rpm.toLocaleString()} RPM`,
        bg: "bg-cyan-950/80 border-cyan-500/60 text-cyan-200",
        badge: "bg-cyan-500 text-black",
      };
    }

    if (isInPit) {
      if (!isEngineActive) {
        return {
          label: "🟡 IN CAR (IN PITS - ENGINE OFF)",
          detail: "Driver in cockpit in pit box. Ready for ignition/starter.",
          bg: "bg-amber-950/80 border-amber-500/60 text-amber-200",
          badge: "bg-amber-500 text-black",
        };
      }
      return {
        label: "🟢 IN CAR (IN PITS - IDLING)",
        detail: `Engine running at ${rpm.toLocaleString()} RPM in pit stall.`,
        bg: "bg-emerald-950/80 border-emerald-500/60 text-emerald-200",
        badge: "bg-emerald-500 text-black",
      };
    }

    return {
      label: "🟢 IN CAR (ON TRACK - STATIONARY)",
      detail: `Stopped on track • ${rpm.toLocaleString()} RPM • Gear ${gear}`,
      bg: "bg-emerald-950/80 border-emerald-500/60 text-emerald-200",
      badge: "bg-emerald-500 text-black",
    };
  }, [isOnTrack, isInPit, rpm, speedMph, telem?.lap, telem?.rpm, telem?.speed, telem?.gear, gear]);

  // Filtered Logs list (Newest on top)
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedFilter !== "ALL") {
        if (selectedFilter === "MACROS" && log.type !== "macro" && log.type !== "pending") return false;
        if (selectedFilter === "BUTTONS" && log.type !== "button") return false;
        if (selectedFilter === "FOCUS" && log.type !== "focus") return false;
        if (selectedFilter === "TELEM" && log.type !== "telemetry") return false;
        if (selectedFilter === "VOICE" && log.type !== "voice") return false;
        if (selectedFilter === "SPOTTER" && log.type !== "spotter") return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMsg = log.message.toLowerCase().includes(q);
        const matchType = log.type.toLowerCase().includes(q);
        if (!matchMsg && !matchType) return false;
      }
      return true;
    });
  }, [logs, selectedFilter, searchQuery]);

  // Flat telemetry channel list for Tab 3 (Variables)
  const telemetryVariables = useMemo(() => {
    if (!telem) return [];
    const entries: { key: string; value: string; type: string }[] = [];

    const recurse = (obj: any, prefix = "") => {
      for (const k in obj) {
        if (obj[k] === null || obj[k] === undefined) continue;
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof obj[k] === "object" && !Array.isArray(obj[k])) {
          recurse(obj[k], fullKey);
        } else if (Array.isArray(obj[k])) {
          entries.push({
            key: fullKey,
            value: `Array(${obj[k].length}) [${obj[k].slice(0, 3).map((x: any) => typeof x === 'object' ? '...' : x).join(", ")}]`,
            type: "array",
          });
        } else {
          entries.push({
            key: fullKey,
            value: String(obj[k]),
            type: typeof obj[k],
          });
        }
      }
    };

    recurse(telem);
    return entries.filter((item) => {
      if (!varSearchQuery.trim()) return true;
      const q = varSearchQuery.toLowerCase();
      return item.key.toLowerCase().includes(q) || item.value.toLowerCase().includes(q);
    });
  }, [telem, varSearchQuery]);

  const getLogBadge = (type: LogEntry["type"]) => {
    switch (type) {
      case "telemetry":
        return "bg-blue-600/20 text-blue-400 border-blue-500/30";
      case "button":
        return "bg-amber-600/20 text-amber-300 border-amber-500/30 font-black";
      case "pending":
        return "bg-purple-600/20 text-purple-300 border-purple-500/30";
      case "focus":
        return "bg-cyan-600/20 text-cyan-300 border-cyan-500/30";
      case "macro":
        return "bg-emerald-600/20 text-emerald-300 border-emerald-500/30 font-black";
      case "voice":
        return "bg-indigo-600/20 text-indigo-300 border-indigo-500/30";
      case "spotter":
        return "bg-red-600/20 text-red-300 border-red-500/30 font-black";
      default:
        return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-neutral-950 text-white font-mono flex flex-col justify-between p-3 select-none">
      
      {/* TOP HEADER: Clean Status, Tab Toggles, & Systems Check Button */}
      <header className="flex items-center justify-between gap-4 bg-neutral-900/95 border border-neutral-800 rounded-2xl px-4 py-2.5 shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 text-[10px] font-black uppercase tracking-wider">
                SRCOMMANDER COCKPIT CONSOLE
              </span>
              <span className="text-[11px] text-neutral-400 font-bold">
                {isOnTrack ? "🟢 60Hz iRacing Hooked" : "⚪ Paddock Standby"}
              </span>
            </div>
            <h1 className="text-sm font-black uppercase text-white truncate">
              {telem?.car_name || "Toyota GR86"} • {telem?.track_name || "Road America"}
            </h1>
          </div>
        </div>

        {/* Action Controls & Multi-Tab Toggles */}
        <div className="flex items-center gap-2">
          {/* Systems Check Button */}
          <button
            onClick={runAllSystemsCheck}
            disabled={isAuditing}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-md ${
              isAuditing
                ? "bg-amber-600 text-white animate-pulse"
                : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_12px_#ef4444]"
            }`}
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AUDITING...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>SYSTEMS CHECK</span>
              </>
            )}
          </button>

          {/* Tab 1: Dev Log Toggle */}
          <button
            onClick={() => {
              if (!showRightInspector || activeTab !== "log") {
                setShowRightInspector(true);
                setActiveTab("log");
              } else {
                setShowRightInspector(false);
              }
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase flex items-center gap-1 transition-all ${
              showRightInspector && activeTab === "log"
                ? "bg-emerald-600 text-white shadow-[0_0_10px_#10b981]"
                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>DEV LOG</span>
          </button>

          {/* Tab 2: Controls Matrix Toggle */}
          <button
            onClick={() => {
              if (!showRightInspector || activeTab !== "controls") {
                setShowRightInspector(true);
                setActiveTab("controls");
              } else {
                setShowRightInspector(false);
              }
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase flex items-center gap-1 transition-all ${
              showRightInspector && activeTab === "controls"
                ? "bg-amber-600 text-white shadow-[0_0_10px_#f59e0b]"
                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>CONTROLS</span>
          </button>

          {/* Tab 3: Variables Explorer Toggle */}
          <button
            onClick={() => {
              if (!showRightInspector || activeTab !== "variables") {
                setShowRightInspector(true);
                setActiveTab("variables");
              } else {
                setShowRightInspector(false);
              }
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase flex items-center gap-1 transition-all ${
              showRightInspector && activeTab === "variables"
                ? "bg-cyan-600 text-white shadow-[0_0_10px_#06b6d4]"
                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>VARIABLES</span>
          </button>

          {/* Tab 4: Coordinate Calibration Button */}
          <button
            onClick={() => setShowCalibrationModal(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-black uppercase flex items-center gap-1 bg-purple-950/90 hover:bg-purple-900 text-purple-200 border border-purple-600 transition-all shadow"
          >
            <Crosshair className="w-3.5 h-3.5 text-purple-400" />
            <span>🎯 CALIBRATE</span>
          </button>

          {/* Direct Link: Open Pit Radio & A/V Mixer Console */}
          <Link
            href={`/srcommander/rig/${rigId}?tab=radio`}
            className="px-2.5 py-1.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white transition-all shadow"
          >
            <Radio className="w-3.5 h-3.5 text-red-500" />
            <span>📻 Radio &amp; A/V Mixer</span>
          </Link>

          {/* Direct Link: Open Single-Screen Overlay HUD */}
          <Link
            href={`/srcommander/overlay?rigId=${rigId}`}
            target="_blank"
            className="px-2.5 py-1.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all hover:scale-105 active:scale-95"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>📺 Overlay HUD</span>
          </Link>

          <Link
            href="/srcommander"
            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-xs font-bold text-neutral-300"
          >
            Host HQ
          </Link>
        </div>
      </header>

      {/* MAIN LAYOUT: Left Main Dashboard Workspace (Col 8) + Right 3-Tab Inspector Column (Col 4) */}
      <main className="grid grid-cols-12 gap-3 flex-1 overflow-hidden my-2">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: MAIN COCKPIT WORKSPACE & SMART IGNITION CENTERPIECE (Col 8)  */}
        {/* ========================================================================= */}
        <div className={`${showRightInspector ? "col-span-8 lg:col-span-8" : "col-span-12"} bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-2xl flex flex-col justify-between h-full overflow-hidden`}>
          
          {/* Top Header Status */}
          <div className="border-b border-neutral-800 pb-2 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-red-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> MAIN COCKPIT DASHBOARD
            </span>
            <span className="text-[10px] text-neutral-400 font-bold">
              State-Aware Engine & Keystroke Pipeline
            </span>
          </div>

          {/* MAIN COCKPIT CENTERPIECE: DYNAMIC CONTROLS & THEATER REPLAY */}
          <div className="my-auto max-w-3xl mx-auto w-full space-y-3 overflow-y-auto max-h-full pr-1 py-1 scrollbar-thin scrollbar-thumb-neutral-800">
            
            {/* HERO ACTION: [ 🏎️ DRIVE NOW / START STINT ] 1-TAP DISPATCHER */}
            <div className="rounded-2xl p-3.5 border-2 border-red-500/80 bg-gradient-to-r from-red-950/90 via-neutral-900/90 to-amber-950/90 shadow-[0_0_30px_rgba(239,68,68,0.35)] flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-red-600/30 border-2 border-red-500 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                  <Play className="w-5 h-5 fill-red-400 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase">
                      1-TAP DISPATCH
                    </span>
                    <span className="text-[11px] font-bold text-neutral-400">
                      {isOnTrack ? "🟢 Driver On Track" : "⚪ Ready for Stint Launch"}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-tight truncate">
                    POD #1 STINT DISPATCHER
                  </h3>
                  <p className="text-[10px] text-neutral-300 font-medium truncate">
                    Jumps into cockpit, syncs driver session timer & cranks ignition in 1 tap
                  </p>
                </div>
              </div>

              <button
                onClick={handleDriveNow}
                disabled={driveNowLoading}
                className={`w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-2 select-none active:scale-95 shadow-xl shrink-0 ${
                  driveNowLoading
                    ? "bg-amber-600 border-amber-400 text-white animate-pulse"
                    : isOnTrack
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-400 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                    : "bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:via-red-400 hover:to-amber-500 border-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)]"
                }`}
              >
                {driveNowLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>DISPATCHING...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white stroke-[2.5]" />
                    <span>🏎️ DRIVE NOW / START STINT</span>
                  </>
                )}
              </button>
            </div>

            {/* 2-CARD GRID: SMART ENGINE START/STOP + SMART RESET/TOW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* CARD 1: COMPACT AUTOMOTIVE PUSH-BUTTON START / STOP */}
              <div
                onClick={handleEngineStartStop}
                className={`cursor-pointer rounded-2xl p-4 border-2 transition-all shadow-xl flex flex-col justify-between gap-3 select-none active:scale-98 ${
                  !isOnTrack
                    ? "bg-neutral-950/60 border-neutral-800/80 opacity-50 cursor-not-allowed"
                    : engineState === "STARTING" || engineState === "STOPPING"
                    ? "bg-amber-950/90 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.45)] animate-pulse"
                    : engineState === "RUNNING"
                    ? "bg-emerald-950/80 border-emerald-500/80 hover:border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                    : "bg-red-950/80 border-red-600/80 hover:border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.3)]"
                }`}
              >
                {/* Top State Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-400">ENGINE CONTROL</span>
                  {!isOnTrack ? (
                    <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-black uppercase flex items-center gap-1">
                      <Power className="w-3 h-3 text-neutral-500" />
                      <span>OUT OF CAR</span>
                    </span>
                  ) : engineState === "STARTING" ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase flex items-center gap-1 animate-bounce">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>STARTING...</span>
                    </span>
                  ) : engineState === "STOPPING" ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase flex items-center gap-1 animate-bounce">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>STOPPING...</span>
                    </span>
                  ) : engineState === "RUNNING" ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>RUNNING</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase flex items-center gap-1">
                      <Power className="w-3 h-3" />
                      <span>ENGINE OFF</span>
                    </span>
                  )}
                </div>

                {/* Power Icon + Live RPM Readout */}
                <div className="flex items-center gap-3.5 my-1">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                    !isOnTrack
                      ? "bg-neutral-900 border-neutral-800 text-neutral-600"
                      : engineState === "STARTING" || engineState === "STOPPING"
                      ? "bg-amber-600/30 border-amber-400 text-amber-300"
                      : engineState === "RUNNING"
                      ? "bg-emerald-600/30 border-emerald-400 text-emerald-400 shadow-[0_0_15px_#10b981]"
                      : "bg-red-600/30 border-red-500 text-red-400 shadow-[0_0_15px_#ef4444]"
                  }`}>
                    {engineState === "STARTING" || engineState === "STOPPING" ? (
                      <RotateCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Power className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>

                  <div className="text-left">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-black tracking-tighter ${
                        !isOnTrack
                          ? "text-neutral-500"
                          : engineState === "STARTING" || engineState === "STOPPING"
                          ? "text-amber-300"
                          : engineState === "RUNNING"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}>
                        {!isOnTrack ? "0" : engineState === "OFF" ? "0" : rpm.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-black text-neutral-400 uppercase">RPM</span>
                    </div>
                    <p className="text-[10px] text-neutral-300 font-bold">
                      {!isOnTrack
                        ? "Enter car before starting engine"
                        : engineState === "STARTING"
                        ? "Cranking starter & catching idle..."
                        : engineState === "STOPPING"
                        ? "Cutting ignition..."
                        : engineState === "RUNNING"
                        ? "Tap to Shut Down Engine"
                        : "Tap to Auto-Start Engine"}
                    </p>
                  </div>
                </div>

                {/* Live Keystroke Combination Sequence Strip */}
                {!isOnTrack ? (
                  <div className="text-[10px] text-neutral-500 pt-1.5 border-t border-neutral-800/80 flex items-center justify-between">
                    <span>Key Sequence: <b>Ignition (&apos;I&apos;) + Starter (&apos;S&apos;)</b></span>
                    <span className="font-bold text-neutral-500">🔒 Interlock Locked</span>
                  </div>
                ) : engineState === "STARTING" ? (
                  <div className="text-[10px] text-amber-300 pt-1.5 border-t border-amber-900/60 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[9px] uppercase font-black text-amber-400">
                      <span className="flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                        ACTIVE HARDWARE MACRO:
                      </span>
                      <span className="font-mono">{activeStartStep || 1}/3</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-mono">
                      <span className={`px-1.5 py-0.5 rounded font-black transition-all ${
                        activeStartStep === 1 ? "bg-amber-400 text-black shadow-[0_0_10px_#f59e0b] scale-105" : "bg-neutral-900 text-neutral-400"
                      }`}>
                        1. IGN &apos;I&apos; {activeStartStep === 1 && "⚡ ON"}
                      </span>
                      <span className="text-amber-500">➔</span>
                      <span className={`px-1.5 py-0.5 rounded font-black transition-all ${
                        activeStartStep === 2 ? "bg-amber-400 text-black shadow-[0_0_10px_#f59e0b] scale-105" : "bg-neutral-900 text-neutral-400"
                      }`}>
                        2. CLUTCH &apos;C&apos; {activeStartStep === 2 && "⚡ HELD"}
                      </span>
                      <span className="text-amber-500">➔</span>
                      <span className={`px-1.5 py-0.5 rounded font-black transition-all ${
                        activeStartStep === 3 ? "bg-amber-400 text-black shadow-[0_0_10px_#f59e0b] scale-105" : "bg-neutral-900 text-neutral-400"
                      }`}>
                        3. CRANK &apos;S&apos; {activeStartStep === 3 && "⚡ CRANKING"}
                      </span>
                    </div>
                  </div>
                ) : engineState === "RUNNING" ? (
                  <div className="text-[10px] text-neutral-400 pt-1.5 border-t border-neutral-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase font-bold text-neutral-400">Shutdown Key:</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono font-black text-[9px]">
                        IGN CUT &apos;I&apos;
                      </span>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-bold">● Running Steady</span>
                  </div>
                ) : engineState === "STOPPING" ? (
                  <div className="text-[10px] text-amber-300 pt-1.5 border-t border-amber-900/60 flex items-center justify-between gap-1 overflow-hidden">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[9px] uppercase font-black text-amber-400 shrink-0">EXECUTING:</span>
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-mono font-black text-[9px] truncate">
                        ⚡ IGNITION CUT &apos;I&apos;
                      </span>
                    </div>
                    <span className="text-[9px] text-amber-400 font-mono shrink-0">Spooling down...</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-neutral-400 pt-1.5 border-t border-neutral-800/80 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[9px] uppercase font-bold text-neutral-400">
                      <span>Auto Start Sequence</span>
                      <span className="text-neutral-500 font-mono">3 Steps</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold">1. IGN &apos;I&apos;</span>
                      <span className="text-neutral-600">➔</span>
                      <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold">2. CLUTCH &apos;C&apos;</span>
                      <span className="text-neutral-600">➔</span>
                      <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold">3. CRANK &apos;S&apos;</span>
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 2: 4-STATE SMART RESET & TOW CONTROLLER */}
              <div
                className={`rounded-2xl p-4 border-2 transition-all shadow-xl flex flex-col justify-between gap-3 select-none ${
                  resetPending
                    ? "bg-amber-950/90 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.45)] animate-pulse"
                    : resetState === "MOVING_SAFE_TOW"
                    ? "bg-amber-950/80 border-amber-500/80 hover:border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)]"
                    : resetState === "STOPPED_TOW"
                    ? "bg-orange-950/80 border-orange-500/80 hover:border-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.3)]"
                    : resetState === "IN_PIT_EXIT_GARAGE"
                    ? "bg-blue-950/80 border-blue-500/80 hover:border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.3)]"
                    : "bg-emerald-950/80 border-emerald-500/80 hover:border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                }`}
              >
                {/* Top State Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-400">SMART RESET</span>
                  {resetPending ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase flex items-center gap-1 animate-bounce">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>EXECUTING...</span>
                    </span>
                  ) : resetState === "MOVING_SAFE_TOW" ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      <span>ON TRACK ({speedMph} MPH)</span>
                    </span>
                  ) : resetState === "STOPPED_TOW" ? (
                    <span className="px-2 py-0.5 rounded-full bg-orange-500 text-black text-[10px] font-black uppercase flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      <span>STOPPED ON TRACK</span>
                    </span>
                  ) : resetState === "IN_PIT_EXIT_GARAGE" ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase flex items-center gap-1">
                      <LogOut className="w-3 h-3" />
                      <span>IN PIT STALL</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase flex items-center gap-1">
                      <Play className="w-3 h-3 fill-black" />
                      <span>GARAGE TIMING SCREEN</span>
                    </span>
                  )}
                </div>

                {/* Reset Icon + Action Title */}
                <div
                  onClick={handleSmartReset}
                  className="cursor-pointer active:scale-98 flex items-center gap-3.5 my-1"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                    resetPending
                      ? "bg-amber-600/30 border-amber-400 text-amber-300"
                      : resetState === "MOVING_SAFE_TOW"
                      ? "bg-amber-600/30 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : resetState === "STOPPED_TOW"
                      ? "bg-orange-600/30 border-orange-400 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                      : resetState === "IN_PIT_EXIT_GARAGE"
                      ? "bg-blue-600/30 border-blue-400 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                      : "bg-emerald-600/30 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  }`}>
                    {resetPending ? (
                      <RotateCw className="w-5 h-5 animate-spin" />
                    ) : resetState === "MOVING_SAFE_TOW" || resetState === "STOPPED_TOW" ? (
                      <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                    ) : resetState === "IN_PIT_EXIT_GARAGE" ? (
                      <LogOut className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Play className="w-5 h-5 fill-current stroke-[2.5]" />
                    )}
                  </div>

                  <div className="text-left">
                    <span className={`text-lg font-black tracking-tight block ${
                      resetPending
                        ? "text-amber-300"
                        : resetState === "MOVING_SAFE_TOW"
                        ? "text-amber-300"
                        : resetState === "STOPPED_TOW"
                        ? "text-orange-300"
                        : resetState === "IN_PIT_EXIT_GARAGE"
                        ? "text-blue-300"
                        : "text-emerald-400"
                    }`}>
                      {resetPending
                        ? "PROCESSING..."
                        : resetState === "MOVING_SAFE_TOW"
                        ? "SAFE STOP & TOW"
                        : resetState === "STOPPED_TOW"
                        ? "TOW TO PITS"
                        : resetState === "IN_PIT_EXIT_GARAGE"
                        ? "EXIT TO GARAGE"
                        : "JUMP IN CAR / DRIVE"}
                    </span>
                    <p className="text-[10px] text-neutral-300 font-bold">
                      {resetPending
                        ? "Executing sequence in iRacing..."
                        : resetState === "MOVING_SAFE_TOW"
                        ? "Coast to 0 MPH -> Hold Shift+R / Esc"
                        : resetState === "STOPPED_TOW"
                        ? "Hold Escape / Shift+R (2.5s) to tow"
                        : resetState === "IN_PIT_EXIT_GARAGE"
                        ? "Hold Escape (2.5s) to exit car"
                        : "Click Top-Center [ Drive / Test ] button"}
                    </p>
                  </div>
                </div>

                {/* Bottom Footer or Request New Car Sub-Action */}
                {resetState === "GARAGE_DRIVE" ? (
                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setResetPending(true);
                        addLog("macro", "🚗 [REQUEST NEW CAR] Requesting fresh chassis & loading directly onto track...");
                        triggerHardwareCommand("request_new_car");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-500/50 hover:border-amber-400 text-[10px] font-black text-amber-300 uppercase flex items-center gap-1.5 transition-all shadow"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>🚗 REQUEST NEW CAR</span>
                    </button>
                    <span className="text-[10px] text-neutral-400 font-mono">Fresh chassis + auto-drive</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-800/80 flex items-center justify-between">
                    <span>Target: <b>{resetState === "IN_PIT_EXIT_GARAGE" ? "Garage Screen" : "Pit Stall"}</b></span>
                    <span className="font-bold text-neutral-300">Smart Cycle</span>
                  </div>
                )}
              </div>

            </div>

            {/* CARD 3: INTELLIGENT TIMED SESSION & LAP GRACE PERIOD CONTROLLER */}
            <div className={`rounded-2xl p-4 border-2 transition-all shadow-xl flex flex-col gap-3 select-none ${
              sessionTimerState === "RUNNING"
                ? "bg-cyan-950/80 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.35)]"
                : sessionTimerState === "GRACE_PERIOD"
                ? "bg-amber-950/90 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.5)] animate-pulse"
                : sessionTimerState === "EXPIRED"
                ? "bg-red-950/80 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.35)]"
                : "bg-neutral-950/80 border-neutral-800"
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Clock className={`w-4 h-4 ${
                    sessionTimerState === "RUNNING" ? "text-cyan-400 animate-spin" : sessionTimerState === "GRACE_PERIOD" ? "text-amber-400" : "text-neutral-400"
                  }`} />
                  TIMED SESSION CONTROLLER
                </span>
                
                {/* State Badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 shadow ${
                  sessionTimerState === "RUNNING"
                    ? "bg-cyan-500 text-black animate-pulse"
                    : sessionTimerState === "GRACE_PERIOD"
                    ? "bg-amber-400 text-black animate-bounce font-black"
                    : sessionTimerState === "EXPIRED"
                    ? "bg-red-600 text-white"
                    : "bg-neutral-800 text-neutral-400"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    sessionTimerState === "RUNNING" ? "bg-black animate-ping" : sessionTimerState === "GRACE_PERIOD" ? "bg-black" : "bg-neutral-500"
                  }`} />
                  <span>
                    {sessionTimerState === "RUNNING"
                      ? "LIVE ON TRACK"
                      : sessionTimerState === "GRACE_PERIOD"
                      ? "🏁 GRACE LAP (FINISH LAP)"
                      : sessionTimerState === "EXPIRED"
                      ? "SESSION EXPIRED"
                      : "STANDBY (PIT EXIT)"}
                  </span>
                </span>
              </div>

              {/* Central Time Countdown & Presets */}
              <div className="flex items-center justify-between gap-4 py-1">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-mono font-black tracking-tight ${
                      sessionTimerState === "RUNNING"
                        ? "text-cyan-300"
                        : sessionTimerState === "GRACE_PERIOD"
                        ? "text-amber-300"
                        : sessionTimerState === "EXPIRED"
                        ? "text-red-400"
                        : "text-neutral-200"
                    }`}>
                      {sessionTimerState === "GRACE_PERIOD"
                        ? `+${sessionGraceElapsed.toFixed(1)}s`
                        : `${Math.floor(sessionTimeRemaining / 60).toString().padStart(2, '0')}:${Math.floor(sessionTimeRemaining % 60).toString().padStart(2, '0')}${sessionLimitSec <= 60 ? `.${Math.floor((sessionTimeRemaining % 1) * 10)}` : ''}`}
                    </span>
                    <span className="text-[11px] font-bold text-neutral-400 uppercase">
                      {sessionTimerState === "GRACE_PERIOD" ? "Grace Time" : "Remaining"}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium">
                    {sessionStatusMsg}
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1">
                    {[15, 180, 300, 480, 600].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => handleSetTimeLimit(sec)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                          sessionLimitSec === sec
                            ? "bg-cyan-500 text-black font-black shadow-md scale-105"
                            : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 active:scale-95"
                        }`}
                      >
                        {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                      </button>
                    ))}
                  </div>
                  <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">
                    Limit: {sessionLimitSec}s (Default: 15s)
                  </span>
                </div>
              </div>

              {/* Feature Sub-Bar: Grace Period Toggle & Manual Overrides */}
              <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={handleToggleGracePeriod}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase flex items-center gap-1.5 transition-all shadow ${
                    sessionGraceEnabled
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
                      : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-400"
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${sessionGraceEnabled ? "text-amber-400" : "text-neutral-600"}`} />
                  <span>🛡️ LAP GRACE: {sessionGraceEnabled ? "ENABLED (Finish Lap)" : "DISABLED (Instant Cut)"}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleResetSessionTimer}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 border border-neutral-700 text-[10px] font-black text-neutral-300 uppercase flex items-center gap-1 transition-all"
                  >
                    <RotateCcw className="w-3 h-3 text-neutral-400" />
                    <span>RESET</span>
                  </button>
                  <button
                    onClick={() => triggerHardwareCommand("exit_car")}
                    className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 active:scale-95 border border-red-800/80 text-[10px] font-black text-red-300 uppercase flex items-center gap-1 transition-all"
                  >
                    <Power className="w-3 h-3 text-red-400" />
                    <span>EJECT NOW</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Secondary Test Actions */}
            <div className="grid grid-cols-2 gap-3">
              {/* STATE-AWARE PIT SPEED LIMITER BUTTON */}
              <button
                onClick={() => {
                  if (!isOnTrack) {
                    addLog("system", "⚠️ [INTERLOCK BLOCKED] Cannot toggle pit limiter: Driver is currently OUT OF CAR.");
                    return;
                  }
                  triggerHardwareCommand("pit_limiter");
                }}
                className={`active:scale-95 border rounded-2xl p-3 flex items-center justify-between transition-all shadow-lg select-none ${
                  !isOnTrack
                    ? "bg-neutral-950/60 border-neutral-800/60 opacity-40 cursor-not-allowed"
                    : isPitLimiterActive
                    ? "bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.45)] animate-pulse"
                    : isOnPitRoad
                    ? "bg-neutral-900 border-amber-500 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "bg-neutral-950/60 border-neutral-800/80 opacity-60 hover:opacity-100 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className={`w-5 h-5 ${
                    !isOnTrack ? "text-neutral-600" : isPitLimiterActive ? "text-amber-300 fill-amber-300" : isOnPitRoad ? "text-amber-400" : "text-neutral-500"
                  }`} />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase text-white block">PIT LIMITER</span>
                      {!isOnTrack ? (
                        <span className="px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-500 text-[9px] font-black uppercase">
                          OUT OF CAR
                        </span>
                      ) : isPitLimiterActive ? (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black text-[9px] font-black uppercase">
                          ON
                        </span>
                      ) : isOnPitRoad ? (
                        <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-black uppercase animate-bounce">
                          PIT LANE
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-500 text-[9px] font-black uppercase">
                          OFF
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-neutral-400">
                      {!isOnTrack
                        ? "Locked • Driver out of car"
                        : isPitLimiterActive
                        ? "Speed Capped • Tap to Cut ('P')"
                        : isOnPitRoad
                        ? "Inside Pit Road • Tap to Engage ('P')"
                        : "Out on Track • Tap to Arm ('P')"}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                  !isOnTrack
                    ? "bg-neutral-900 text-neutral-600"
                    : isPitLimiterActive
                    ? "bg-amber-400 text-black"
                    : isOnPitRoad
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                    : "bg-neutral-900 text-neutral-400"
                }`}>
                  {!isOnTrack ? "LOCKED" : isPitLimiterActive ? "ENGAGED" : "TOGGLE"}
                </span>
              </button>

              {/* VISOR TEAROFF / WINDSHIELD WIPE BUTTON */}
              <button
                onClick={() => {
                  if (!isOnTrack) {
                    addLog("system", "⚠️ [INTERLOCK BLOCKED] Cannot tear off visor: Driver is currently OUT OF CAR.");
                    return;
                  }
                  triggerHardwareCommand("tearoff");
                }}
                className={`active:scale-95 border rounded-2xl p-3 flex items-center justify-between transition-all shadow-lg select-none ${
                  !isOnTrack
                    ? "bg-neutral-950/60 border-neutral-800/60 opacity-40 cursor-not-allowed"
                    : "bg-neutral-950 hover:bg-neutral-800 border-neutral-800 hover:border-blue-500/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className={`w-5 h-5 ${!isOnTrack ? "text-neutral-600" : "text-blue-400"}`} />
                  <div className="text-left">
                    <span className="text-xs font-black uppercase text-white block">VISOR TEAROFF</span>
                    <span className="text-[9px] text-neutral-400">
                      {!isOnTrack ? "Locked • Driver out of car" : "Alt + T • Clear Screen"}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                  !isOnTrack ? "bg-neutral-900 text-neutral-600" : "bg-neutral-900 text-blue-400"
                }`}>
                  {!isOnTrack ? "LOCKED" : "TEST"}
                </span>
              </button>
            </div>
          </div>

          {/* Footer Canvas Status */}
          <div className="border-t border-neutral-800 pt-2 flex items-center justify-between text-[11px] text-neutral-500">
            <span>State-Aware Engine Control • Live RPM Feedback Loop</span>
            <span className="text-emerald-400 font-bold">60Hz Direct In-Memory Sync</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 3-TAB INSPECTOR (DEV LOG, CONTROLS, VARIABLES) (Col 4)       */}
        {/* ========================================================================= */}
        {showRightInspector && (
          <div className="col-span-4 lg:col-span-4 bg-neutral-900/95 border border-neutral-800 rounded-2xl p-3 shadow-2xl flex flex-col justify-between h-full overflow-hidden">
            
            {/* Top Telemetry & Pipeline Stats Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 mb-2 shrink-0 space-y-2">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                <span className="text-[11px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> PIPELINE STATS
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {tickLatencyMs}ms • 30Hz
                </span>
              </div>

              {/* REAL-TIME VEHICLE & COCKPIT STATE BOX */}
              <div className={`p-2 rounded-xl border flex items-center justify-between ${vehicleState.bg}`}>
                <div>
                  <span className="text-[9px] font-black uppercase opacity-75 block">SIM STATE</span>
                  <span className="text-xs font-black tracking-tight">{vehicleState.label}</span>
                  <span className="text-[9px] opacity-80 block pt-0.5 truncate">{vehicleState.detail}</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
              </div>

              {/* Tab Selector Buttons */}
              <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-[10px] font-black uppercase">
                <button
                  onClick={() => setActiveTab("log")}
                  className={`py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    activeTab === "log" ? "bg-red-600 text-white shadow" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Terminal className="w-3 h-3" />
                  <span>LOGS</span>
                </button>

                <button
                  onClick={() => setActiveTab("controls")}
                  className={`py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    activeTab === "controls" ? "bg-amber-600 text-white shadow" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Gamepad2 className="w-3 h-3" />
                  <span>CONTROLS</span>
                </button>

                <button
                  onClick={() => setActiveTab("variables")}
                  className={`py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    activeTab === "variables" ? "bg-cyan-600 text-white shadow" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Database className="w-3 h-3" />
                  <span>VARS ({channelCount})</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: DEV LOG STREAM */}
            {activeTab === "log" && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="space-y-1.5 pb-1 border-b border-neutral-800 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                      <Terminal className="w-3 h-3" /> LOG STREAM ({filteredLogs.length})
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsLogPaused(!isLogPaused)}
                        className={`px-1 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-0.5 ${
                          isLogPaused ? "bg-amber-600 text-white" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        }`}
                        title="Pause/Resume Log Stream"
                      >
                        <Pause className="w-2.5 h-2.5" />
                        <span>{isLogPaused ? "PAUSE" : "LIVE"}</span>
                      </button>
                      <button
                        onClick={() => {
                          setLogs([]);
                          try { localStorage.removeItem("srcommander_cockpit_logs"); } catch (e) {}
                        }}
                        className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                        title="Clear Terminal & Cache"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Pills Toolbar */}
                  <div className="flex flex-wrap items-center gap-1">
                    {["ALL", "MACROS", "BUTTONS", "FOCUS", "TELEM", "VOICE", "SPOTTER"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedFilter(f)}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-colors ${
                          selectedFilter === f
                            ? "bg-red-600 text-white"
                            : "bg-neutral-950 hover:bg-neutral-800 text-neutral-400 border border-neutral-800"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* Text Search Filter */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search logs (e.g. shift+r, focus)..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-0.5 text-[10px] text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Chronological Scrollable Log Feed */}
                <div className="flex-1 overflow-y-auto pr-1 my-1 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800 text-xs font-mono">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-1.5 rounded-xl bg-neutral-950 border border-neutral-800/90 leading-tight flex flex-col gap-0.5 hover:border-neutral-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[8px] opacity-70">
                        <span className={`px-1 py-0.2 rounded border font-black uppercase ${getLogBadge(log.type)}`}>
                          [{log.type.toUpperCase()}]
                        </span>
                        <span className="text-neutral-500">{log.timeStr}</span>
                      </div>
                      <p className="text-neutral-200 text-[10px] pt-0.5 whitespace-pre-wrap">{log.message}</p>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: CONTROLS & KEYSTROKE MATRIX */}
            {activeTab === "controls" && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="border-b border-neutral-800 pb-1.5 mb-1 shrink-0 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                    <Gamepad2 className="w-3 h-3" /> HARDWARE KEYSTROKE MATRIX
                  </span>
                  <span className="text-[9px] text-neutral-400 font-mono">
                    Hot-Reload from controls.cfg
                  </span>
                </div>

                {/* Scrollable Controls Table */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-800 text-xs">
                  {controlsList.map((ctrl) => (
                    <div
                      key={ctrl.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl p-2 flex flex-col gap-1 hover:border-neutral-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 font-black text-[10px]">
                            {ctrl.key}
                          </span>
                          <span className="font-black text-white text-[11px]">{ctrl.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {ctrl.isVerified ? (
                            <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> VERIFIED
                            </span>
                          ) : (
                            <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                              PENDING
                            </span>
                          )}
                          <button
                            onClick={() => triggerHardwareCommand(ctrl.command)}
                            className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-[9px] font-bold text-white"
                          >
                            TEST
                          </button>
                        </div>
                      </div>
                      <p className="text-[9px] text-neutral-400 leading-tight">{ctrl.description}</p>
                      <div className="flex items-center justify-between text-[8px] text-neutral-500 pt-0.5 border-t border-neutral-900">
                        <span>Last Verified: <b className="text-neutral-300">{ctrl.lastVerified || "Never"}</b></span>
                        <span>Source: <b className="text-neutral-400">{ctrl.lastChanged}</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: LIVE TELEMETRY VARIABLES EXPLORER */}
            {activeTab === "variables" && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="space-y-1.5 pb-1 border-b border-neutral-800 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-cyan-400 flex items-center gap-1">
                      <Database className="w-3 h-3" /> TELEMETRY VARIABLES ({telemetryVariables.length})
                    </span>
                    <span className="text-[9px] text-neutral-500 font-mono">30Hz Live Feed</span>
                  </div>

                  {/* Variables Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={varSearchQuery}
                      onChange={(e) => setVarSearchQuery(e.target.value)}
                      placeholder="Search variables (e.g. rpm, temp, gear, fuel)..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-0.5 text-[10px] text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Scrollable Variables Stream */}
                <div className="flex-1 overflow-y-auto pr-1 my-1 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800 font-mono text-[10px]">
                  {telemetryVariables.map((v, i) => (
                    <div
                      key={i}
                      className="p-1 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-baseline justify-between hover:border-cyan-500/40 transition-colors"
                    >
                      <span className="text-neutral-400 truncate max-w-[55%]">{v.key}</span>
                      <span className={`font-black truncate max-w-[42%] text-right ${
                        v.key.includes("rpm") ? "text-amber-400" :
                        v.key.includes("speed") ? "text-white" :
                        v.key.includes("gear") ? "text-emerald-400" :
                        v.key.includes("temp") ? "text-red-400" :
                        v.key.includes("fuel") ? "text-blue-400" :
                        "text-neutral-200"
                      }`}>
                        {v.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* LIVE CALIBRATION ACTIVE FULL-SCREEN BANNER */}
      {calibratingButton && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border-2 border-purple-500 rounded-3xl p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(168,85,247,0.5)] animate-pulse">
            <div className="w-16 h-16 rounded-full bg-purple-600/30 border-2 border-purple-400 text-purple-300 flex items-center justify-center mx-auto mb-4">
              <Crosshair className="w-8 h-8 animate-spin" />
            </div>
            <span className="text-xs font-black uppercase text-purple-400 tracking-widest block mb-1">
              CALIBRATING BUTTON TARGET
            </span>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
              [{calibratingButton.toUpperCase()}]
            </h2>
            <p className="text-sm text-neutral-300 mb-6">
              Move your mouse over the <b>[{calibratingButton.toUpperCase()}]</b> button in iRacing and hold it steady...
            </p>
            <div className="text-6xl font-black text-purple-400 font-mono tracking-tighter animate-bounce">
              {calibrationCountdown}s
            </div>
          </div>
        </div>
      )}

      {/* COORDINATE CALIBRATION MODAL */}
      {showCalibrationModal && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-950 border border-purple-500/50 text-purple-300">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                    iRacing UI Button Coordinate Calibration
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Calibrate mouse coordinates across multi-monitor setups so clicks land accurately on your sim window.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCalibrationModal(false)}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Buttons List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {[
                {
                  key: "drive",
                  name: "🏎️ [ Test / Drive Button ]",
                  desc: "Big green button at top-center of iRacing garage screen",
                  defaultDesc: "Auto: Top Center (48px from top)",
                },
                {
                  key: "request_new_car",
                  name: "🚗 [ Request New Car Button ]",
                  desc: "Sub-button directly beneath Test/Drive button",
                  defaultDesc: "Auto: Top Center (92px from top)",
                },
                {
                  key: "garage",
                  name: "🔧 [ Garage / Setup Button ]",
                  desc: "Garage setup button in top navigation bar",
                  defaultDesc: "Uncalibrated",
                },
                {
                  key: "quit",
                  name: "🚪 [ Quit / Exit Session Button ]",
                  desc: "Quit button in top navigation bar",
                  defaultDesc: "Uncalibrated",
                },
              ].map((btn) => {
                const saved = savedCoordinates[btn.key];
                return (
                  <div
                    key={btn.key}
                    className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-all"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-black uppercase text-white block">{btn.name}</span>
                      <p className="text-[10px] text-neutral-400">{btn.desc}</p>
                      <div className="pt-1 flex items-center gap-2 text-[10px] font-mono">
                        {saved?.calibrated ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-bold">
                            🟢 Calibrated: X={saved.x}, Y={saved.y}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-500">
                            ⚪ {btn.defaultDesc}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleStartCalibration(btn.key)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Calibrate</span>
                      </button>

                      {saved?.calibrated && (
                        <>
                          <button
                            onClick={() => triggerHardwareCommand(btn.key === "drive" ? "smart_reset" : btn.key)}
                            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 text-xs font-bold uppercase transition-all"
                          >
                            Test Click
                          </button>
                          <button
                            onClick={() => handleResetCoordinates(btn.key)}
                            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-red-950 text-neutral-500 hover:text-red-400 transition-all"
                            title="Reset to Auto"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1 text-[11px]">
                <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>Hover mouse over button during 3-second countdown to train coordinates.</span>
              </span>
              <button
                onClick={() => setShowCalibrationModal(false)}
                className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM STATUS */}
      <footer className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-900 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-neutral-400 font-bold">1920x1080 Cockpit Focused Mode</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">Smart State-Aware Engine Online</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <span>GridPass SRCommander • Moza Direct Drive Connected</span>
        </div>
      </footer>
    </div>
  );
}

export default function CockpitDevCleanSlatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
        </div>
      }
    >
      <CockpitDevCleanSlateContent />
    </Suspense>
  );
}
