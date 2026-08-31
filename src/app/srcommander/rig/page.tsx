"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastContext";
import {
  Sliders,
  Camera,
  Mic,
  Volume2,
  Wind,
  Zap,
  Sparkles,
  RefreshCw,
  Save,
  Tv,
  ExternalLink,
  Shield,
  Bot,
  Palette,
  Wrench,
  Check,
  AlertCircle,
  Play,
  Flame,
  Radio,
  Video,
  Activity,
  Cpu,
  Download,
  CheckCircle2,
  Power,
} from "lucide-react";

interface DeviceItem {
  id: string;
  name: string;
  channels?: number;
  index?: number;
}

interface ComPortItem {
  port: string;
  desc: string;
  hwid: string;
}

interface RigDevicesList {
  audio_inputs: DeviceItem[];
  audio_outputs: DeviceItem[];
  cameras: DeviceItem[];
  com_ports: ComPortItem[];
}

export default function SRCommanderRigManagerPage() {
  const { showToast } = useToast();
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [daemonVersion, setDaemonVersion] = useState<string>("4.3.0");
  const [updateStatus, setUpdateStatus] = useState<string>("Up to date");
  const [windowsStartup, setWindowsStartup] = useState<boolean>(false);

  // Hardware Devices
  const [devices, setDevices] = useState<RigDevicesList>({
    audio_inputs: [],
    audio_outputs: [],
    cameras: [],
    com_ports: [],
  });

  // Config State
  const [config, setConfig] = useState<Record<string, any>>({
    webcam_enabled: true,
    webcam_device_index: 0,
    webcam_fps: 30,
    mic_enabled: true,
    audio_input_device: "default",
    audio_output_device: "default",
    wind_fans_enabled: true,
    wind_fan_min_speed_mph: 15,
    wind_fan_max_speed_mph: 160,
    wind_fan_curve: "linear",
    halo_leds_enabled: true,
    halo_led_mode: "DYNAMIC_RACING",
    halo_led_redline_pct: 94,
    halo_led_brightness: 100,
    spotter_voice_enabled: true,
    spotter_volume: 100,
    spotter_frequency: "tactical",
    hardware_enabled: true,
    hardware_port: "auto",
  });

  // Live Telemetry & Status
  const [liveTelemetry, setLiveTelemetry] = useState<any>(null);
  const [testFanPower, setTestFanPower] = useState<number>(75);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to Local Daemon WebSocket
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;
    const connect = () => {
      try {
        const ws = new WebSocket("ws://127.0.0.1:8080");
        wsRef.current = ws;

        ws.onopen = () => {
          setIsWsConnected(true);
          // Request current config, devices, and daemon version
          ws.send(JSON.stringify({ action: "GET_RIG_CONFIG_AND_DEVICES" }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "RIG_CONFIG_AND_DEVICES") {
              if (msg.config) setConfig((prev) => ({ ...prev, ...msg.config }));
              if (msg.devices) setDevices(msg.devices);
              if (msg.daemon_version) setDaemonVersion(msg.daemon_version);
              if (msg.status?.update_status) setUpdateStatus(msg.status.update_status);
              if (msg.windows_startup !== undefined) setWindowsStartup(msg.windows_startup);
            } else if (msg.type === "WINDOWS_STARTUP_STATUS") {
              setWindowsStartup(msg.enabled);
              showToast({
                title: "Windows Startup",
                message: msg.enabled ? "Auto-start enabled on PC boot" : "Auto-start disabled",
                icon: "🚀",
              });
            } else if (msg.type === "CONFIG_SAVED") {
              showToast({ title: "Config Saved", message: "Hardware settings updated live with zero restarts", icon: "💾" });
            } else if (msg.type === "UPDATE_CHECK_RESULT") {
              setIsCheckingUpdate(false);
              setUpdateStatus(msg.status || "Up to date");
              showToast({
                title: "GridPass Auto-Updater",
                message: `Engine v${msg.current_version} is ${msg.status.toLowerCase()}`,
                icon: "🚀",
              });
            } else if (msg.type === "SYNC_RESULT") {
              showToast({
                title: `Sync Complete: ${msg.target.toUpperCase()}`,
                message: `Synced ${msg.count} championship items to Documents/iRacing`,
                icon: "🎨",
              });
            } else {
              setLiveTelemetry(msg);
              if (msg.daemon_version) setDaemonVersion(msg.daemon_version);
            }
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

  const sendCommand = useCallback((cmd: Record<string, any>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  }, []);

  const handleSaveConfig = () => {
    setIsSaving(true);
    sendCommand({ action: "SAVE_RIG_CONFIG", config });
    setTimeout(() => setIsSaving(false), 600);
  };

  const handleCheckForUpdates = () => {
    setIsCheckingUpdate(true);
    sendCommand({ action: "CHECK_FOR_UPDATES", force: false });
    setTimeout(() => setIsCheckingUpdate(false), 2000);
  };

  const handleToggleWindowsStartup = () => {
    sendCommand({ action: "SET_WINDOWS_STARTUP", enabled: !windowsStartup });
  };

  const handleTestFan = () => {
    sendCommand({ action: "TEST_FAN", power: testFanPower, duration: 5.0 });
    showToast({ title: "💨 Testing Fans", message: `Running fans at ${testFanPower}% power for 5s`, icon: "💨" });
  };

  const handleTestLed = (mode: string) => {
    sendCommand({ action: "TEST_LED", mode, duration: 5.0 });
    showToast({ title: "💡 Testing LEDs", message: `Mode: ${mode} active for 5s`, icon: "💡" });
  };

  const handleTestAudio = () => {
    sendCommand({ action: "TEST_AUDIO" });
    showToast({ title: "🔊 Testing Headset", message: "Played 48kHz radio chime in headset", icon: "🔊" });
  };

  const handleTestSpotter = () => {
    sendCommand({ action: "TEST_SPOTTER" });
    showToast({ title: "🗣️ Testing AI Spotter", message: "Voice callout triggered", icon: "🗣️" });
  };

  const handleForcePaints = () => {
    sendCommand({ action: "FORCE_SYNC_PAINTS" });
    showToast({ title: "🎨 Syncing Liveries", message: "Scanning paint directory...", icon: "🎨" });
  };

  const handleForceSetups = () => {
    sendCommand({ action: "FORCE_SYNC_SETUPS" });
    showToast({ title: "⚙️ Syncing Setups", message: "Scanning championship setups...", icon: "⚙️" });
  };

  const handleRescanCom = () => {
    sendCommand({ action: "RESCAN_COM_PORTS" });
    sendCommand({ action: "GET_RIG_CONFIG_AND_DEVICES" });
    showToast({ title: "🔄 Rescanning Hardware", message: "Enumerating COM ports and audio sinks...", icon: "🔄" });
  };

  const micDb = liveTelemetry?.hardware_state?.mic_level_db ?? -60;
  const micPct = Math.min(100, Math.max(0, ((micDb + 60) / 60) * 100));
  const driverCam = liveTelemetry?.driver_camera;

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 font-sans select-none flex flex-col justify-between p-4 sm:p-6 space-y-6">
      
      {/* ─────────────────────────────────────────────────────────────
          MASTER HEADER BAR
         ───────────────────────────────────────────────────────────── */}
      <header className="max-w-7xl w-full mx-auto bg-[#111113] border border-neutral-800 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-red-600/40 shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-none">
                GridPass.App SRCommander • Local Rig Manager
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                isWsConnected
                  ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                  : "bg-amber-950 text-amber-400 border-amber-500/40 animate-pulse"
              }`}>
                {isWsConnected ? "● DAEMON CONNECTED" : "⚪ STANDBY"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-[10px] font-mono font-bold text-neutral-300">
                v{daemonVersion}
              </span>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Pre-Race Sync Active • Download Once, Update Forever • Hardware Actuators &amp; AV
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleCheckForUpdates}
            disabled={isCheckingUpdate}
            className="min-h-[44px] px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-2xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isCheckingUpdate ? "animate-spin" : ""}`} />
            <span>{isCheckingUpdate ? "Checking..." : "Check Updates"}</span>
          </button>

          <Link
            href="/srcommander/studio"
            className="min-h-[44px] px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-2xl text-xs font-mono font-bold uppercase transition flex items-center gap-2"
          >
            <Tv className="w-4 h-4 text-red-400" />
            <span>TV Studio</span>
          </Link>

          <Link
            href="/srleague/overlay?local=true"
            target="_blank"
            className="min-h-[44px] px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-2xl text-xs font-mono font-bold uppercase transition flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4 text-purple-400" />
            <span>OBS Overlay</span>
          </Link>

          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="min-h-[44px] px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "SAVING..." : "SAVE & HOT-RELOAD"}</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          4-CARD INTERACTIVE RIG CONTROL GRID
         ───────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: AV & INTERCOM MATRIX */}
        <div className="bg-[#111113] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-red-500" />
              <strong className="text-xs font-black uppercase tracking-wider text-white">
                1. AV &amp; Intercom Matrix (Camera, Mic &amp; Headset)
              </strong>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">WASAPI &amp; DirectShow</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Camera Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                USB Face-Cam Device:
              </label>
              <select
                value={config.webcam_device_index}
                onChange={(e) => setConfig({ ...config, webcam_device_index: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white font-mono font-bold focus:border-red-500 focus:outline-none"
              >
                {devices.cameras.length > 0 ? (
                  devices.cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <option value={0}>Auto-Detect USB Webcam (Index 0)</option>
                )}
              </select>
            </div>

            {/* Live Camera Preview */}
            {driverCam?.active && driverCam.frame_jpeg_b64 ? (
              <div className="relative aspect-video w-full rounded-2xl bg-black border border-neutral-800 overflow-hidden shadow-inner flex items-center justify-center">
                <img
                  src={`data:image/jpeg;base64,${driverCam.frame_jpeg_b64}`}
                  alt="Driver Face-Cam"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[9px] font-mono font-bold text-emerald-400 border border-emerald-500/40">
                  ● LIVE 30 FPS FEED
                </div>
              </div>
            ) : (
              <div className="h-28 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500 font-mono text-[11px]">
                ⚪ Camera Feed Standby (Select USB Cam Above)
              </div>
            )}

            {/* Microphone Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                Driver Microphone Input:
              </label>
              <select
                value={config.audio_input_device}
                onChange={(e) => setConfig({ ...config, audio_input_device: e.target.value })}
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white font-mono font-bold focus:border-red-500 focus:outline-none"
              >
                <option value="default">Default Windows System Microphone</option>
                {devices.audio_inputs.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>

              {/* Live VU Audio Level Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400">
                  <span>Live Mic Level:</span>
                  <span className={micPct > 50 ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                    {micDb.toFixed(1)} dB
                  </span>
                </div>
                <div className="w-full h-2 rounded-md bg-neutral-950 overflow-hidden border border-neutral-800">
                  <div
                    className={`h-full transition-all duration-75 ${
                      micPct > 75 ? "bg-red-500" : micPct > 40 ? "bg-emerald-500" : "bg-neutral-600"
                    }`}
                    style={{ width: `${micPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Headset Audio Output */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold uppercase text-neutral-400">
                  Headset Audio Playback Output:
                </label>
                <button
                  type="button"
                  onClick={handleTestAudio}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                  <span>Test Chime</span>
                </button>
              </div>
              <select
                value={config.audio_output_device}
                onChange={(e) => setConfig({ ...config, audio_output_device: e.target.value })}
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white font-mono font-bold focus:border-red-500 focus:outline-none"
              >
                <option value="default">Default Windows System Headset</option>
                {devices.audio_outputs.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CARD 2: DUAL WIND SIM & FAN CURVES */}
        <div className="bg-[#111113] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              <strong className="text-xs font-black uppercase tracking-wider text-white">
                2. Dual Wind Sim &amp; Dynamic Fan Power Curves
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, wind_fans_enabled: !config.wind_fans_enabled })}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border transition cursor-pointer ${
                config.wind_fans_enabled
                  ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                  : "bg-neutral-800 text-neutral-400 border-neutral-700"
              }`}
            >
              {config.wind_fans_enabled ? "FANS ON" : "FANS OFF"}
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Speed Sliders */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                  Min Speed Cut-In:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={config.wind_fan_min_speed_mph}
                    onChange={(e) => setConfig({ ...config, wind_fan_min_speed_mph: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                  <span className="text-sm font-black font-mono text-cyan-400 w-12 text-right">
                    {config.wind_fan_min_speed_mph} MPH
                  </span>
                </div>
              </div>

              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                  Top Speed (100%):
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="80"
                    max="220"
                    value={config.wind_fan_max_speed_mph}
                    onChange={(e) => setConfig({ ...config, wind_fan_max_speed_mph: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                  <span className="text-sm font-black font-mono text-cyan-400 w-14 text-right">
                    {config.wind_fan_max_speed_mph} MPH
                  </span>
                </div>
              </div>
            </div>

            {/* Power Curve Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                Airflow Velocity Curve:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, wind_fan_curve: "linear" })}
                  className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                    config.wind_fan_curve === "linear"
                      ? "bg-cyan-950 text-cyan-300 border-cyan-500"
                      : "bg-neutral-900 text-neutral-400 border-neutral-800"
                  }`}
                >
                  <span>Linear (Smooth)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, wind_fan_curve: "exponential" })}
                  className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                    config.wind_fan_curve === "exponential"
                      ? "bg-cyan-950 text-cyan-300 border-cyan-500"
                      : "bg-neutral-900 text-neutral-400 border-neutral-800"
                  }`}
                >
                  <span>Exponential (High-Speed Blast)</span>
                </button>
              </div>
            </div>

            {/* Manual Fan Test Slider */}
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400">
                  Manual Bench Test:
                </span>
                <span className="text-xs font-black font-mono text-cyan-400">
                  {testFanPower}% Power
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={testFanPower}
                onChange={(e) => setTestFanPower(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <button
                type="button"
                onClick={handleTestFan}
                className="w-full min-h-[44px] py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Wind className="w-4 h-4" />
                <span>Spin Fans at {testFanPower}% (5s Test)</span>
              </button>
            </div>
          </div>
        </div>

        {/* CARD 3: CHASSIS RGB HALO LEDS & SHIFT LIGHTS */}
        <div className="bg-[#111113] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <strong className="text-xs font-black uppercase tracking-wider text-white">
                3. Chassis RGB Halo LEDs &amp; Shift Light Studio
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, halo_leds_enabled: !config.halo_leds_enabled })}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border transition cursor-pointer ${
                config.halo_leds_enabled
                  ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                  : "bg-neutral-800 text-neutral-400 border-neutral-700"
              }`}
            >
              {config.halo_leds_enabled ? "LEDS ON" : "LEDS OFF"}
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* LED Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                Chassis Ambient Pattern Mode:
              </label>
              <select
                value={config.halo_led_mode}
                onChange={(e) => setConfig({ ...config, halo_led_mode: e.target.value })}
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white font-mono font-bold focus:border-red-500 focus:outline-none"
              >
                <option value="DYNAMIC_RACING">Dynamic Racing (Ambient White + Flag Reactions + Shift Lights)</option>
                <option value="REDLINE_SHIFT">Redline Shift Lights Only</option>
                <option value="SOLID_WHITE">Solid Clean White Studio Glow</option>
                <option value="SOLID_RED">Solid GridPass Crimson Accent</option>
              </select>
            </div>

            {/* Redline Shift % RPM */}
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400">
                  Redline Shift Threshold:
                </span>
                <span className="text-xs font-black font-mono text-purple-400">
                  {config.halo_led_redline_pct}% RPM
                </span>
              </div>
              <input
                type="range"
                min="80"
                max="99"
                value={config.halo_led_redline_pct}
                onChange={(e) => setConfig({ ...config, halo_led_redline_pct: Number(e.target.value) })}
                className="w-full accent-purple-400"
              />
            </div>

            {/* Manual Test LED Mode Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">
                Bench Test LED Patterns:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleTestLed("FLASH_YELLOW")}
                  className="min-h-[44px] p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🟡 Caution</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTestLed("SOLID_RED")}
                  className="min-h-[44px] p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-xl text-[11px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🔴 Red Flag</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTestLed("REDLINE_SHIFT")}
                  className="min-h-[44px] p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-[11px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🟣 Shift Cue</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: AI SPOTTER, HARDWARE COM, AUTO-START & LIVERY SYNC */}
        <div className="bg-[#111113] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <strong className="text-xs font-black uppercase tracking-wider text-white">
                4. AI Spotter, Windows Auto-Start &amp; Livery Sync
              </strong>
            </div>
            <button
              type="button"
              onClick={handleRescanCom}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Rescan COM</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Windows Auto-Start Toggle */}
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Power className="w-4 h-4 text-emerald-400" />
                  <strong className="text-xs font-black uppercase text-white">Start with Windows (Boot)</strong>
                </div>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Runs silently in the background when your PC boots up.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleWindowsStartup}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                  windowsStartup
                    ? "bg-emerald-950 text-emerald-400 border-emerald-500/50 shadow-xs"
                    : "bg-neutral-800 text-neutral-400 border-neutral-700"
                }`}
              >
                {windowsStartup ? "ENABLED" : "DISABLED"}
              </button>
            </div>

            {/* AI Spotter Voice Settings */}
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400">
                  Apex Chief AI Voice Spotter:
                </span>
                <button
                  type="button"
                  onClick={handleTestSpotter}
                  className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/50 rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                >
                  <span>🗣️ Test Voice</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400">
                  <span>Spotter Volume:</span>
                  <span className="text-white font-bold">{config.spotter_volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.spotter_volume}
                  onChange={(e) => setConfig({ ...config, spotter_volume: Number(e.target.value) })}
                  className="w-full accent-purple-400"
                />
              </div>
            </div>

            {/* Serial COM Port Status */}
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400">
                  Arduino / Teensy Actuator Pod:
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  liveTelemetry?.hardware_state?.connected
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                    : "bg-neutral-800 text-neutral-400"
                }`}>
                  {liveTelemetry?.hardware_state?.port || "Auto-Scanning"}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono">
                Auto-binds to MKR1000 / Teensy 4.0 / CH340 on 115200 baud for sub-5ms fan PWM and LED data.
              </p>
            </div>

            {/* Force Sync Liveries & Setups */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleForcePaints}
                className="min-h-[44px] py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5 text-red-400" />
                <span>Sync Liveries</span>
              </button>

              <button
                type="button"
                onClick={handleForceSetups}
                className="min-h-[44px] py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Sync Setups</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
