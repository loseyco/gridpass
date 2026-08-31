"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastContext";
import {
  Download,
  CheckCircle2,
  Sliders,
  Tv,
  Wind,
  Zap,
  Camera,
  Mic,
  RefreshCw,
  Layers,
  Terminal,
  Play,
  Shield,
  ExternalLink,
  ChevronRight,
  Flame,
  Sparkles,
} from "lucide-react";

export default function SRCommanderDownloadPage() {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleDownloadLauncher = () => {
    setDownloading(true);

    // Download Launcher .bat
    const linkBat = document.createElement("a");
    linkBat.href = "/api/srcommander/launcher";
    linkBat.download = "Launch_GridPass_Apex_Core.bat";
    document.body.appendChild(linkBat);
    linkBat.click();
    document.body.removeChild(linkBat);

    // Download Core Daemon .py
    setTimeout(() => {
      const linkPy = document.createElement("a");
      linkPy.href = "/api/srcommander/download";
      linkPy.download = "gridpass_core_daemon.py";
      document.body.appendChild(linkPy);
      linkPy.click();
      document.body.removeChild(linkPy);
      
      setDownloading(false);
      showToast({
        title: "Download Complete!",
        message: "Double-click Launch_GridPass_Apex_Core.bat to start. Zero installation needed!",
        icon: "🏎️",
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans select-none flex flex-col justify-between p-4 sm:p-8 space-y-8">
      
      {/* ─────────────────────────────────────────────────────────────
          HEADER
         ───────────────────────────────────────────────────────────── */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#ff3b30] flex items-center justify-center font-black text-xl text-white shadow-lg shadow-red-500/30">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-neutral-950 leading-none">
              GridPass.App SRCommander
            </h1>
            <span className="text-xs font-mono text-neutral-500">
              Zero-Install PC Companion • v4.3.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/srcommander/rig"
            className="min-h-[44px] px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2"
          >
            <Sliders className="w-4 h-4 text-red-600" />
            <span>Open Rig Manager</span>
          </Link>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          HERO & 1-CLICK DOWNLOAD
         ───────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl w-full mx-auto py-6 space-y-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-mono font-black uppercase shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Zero-Install • Portable • Auto-Updating</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 leading-tight">
            The All-In-One Sim Racing PC Engine
          </h2>

          <p className="text-sm sm:text-base text-neutral-600 font-mono leading-relaxed">
            Zero installer wizards. Zero registry clutter. Docks directly into your Windows taskbar by the clock for 60 FPS iRacing telemetry, wind sim fans, chassis halo LEDs, and steward radio.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleDownloadLauncher}
              disabled={downloading}
              className="w-full sm:w-auto min-h-[56px] px-8 py-3.5 bg-[#ff3b30] hover:bg-red-700 active:scale-98 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-3 shadow-xl shadow-red-500/30 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>{downloading ? "STARTING DOWNLOAD..." : "DOWNLOAD SRCOMMANDER (v4.3.0)"}</span>
            </button>

            <Link
              href="/srcommander/studio"
              className="w-full sm:w-auto min-h-[56px] px-6 py-3.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 rounded-2xl font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <Tv className="w-4 h-4 text-neutral-600" />
              <span>TV Director Studio</span>
            </Link>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3-STEP ZERO-INSTALL QUICK START
           ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-300 text-red-600 flex items-center justify-center font-black font-mono text-base">
              1
            </div>
            <strong className="text-sm font-black uppercase text-neutral-950 block">
              1. Download &amp; Save
            </strong>
            <p className="text-xs text-neutral-600 font-mono leading-relaxed">
              Place both downloaded files in any folder (e.g. <code className="text-neutral-900 bg-neutral-200 px-1.5 py-0.5 rounded font-bold">C:\GridPass</code> or Desktop).
            </p>
          </div>

          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-300 text-blue-600 flex items-center justify-center font-black font-mono text-base">
              2
            </div>
            <strong className="text-sm font-black uppercase text-neutral-950 block">
              2. Double-Click to Run
            </strong>
            <p className="text-xs text-neutral-600 font-mono leading-relaxed">
              Double-click <code className="text-neutral-900 bg-neutral-200 px-1.5 py-0.5 rounded font-bold">Launch_GridPass_Apex_Core.bat</code>. It auto-configures drivers and appears in your taskbar by the clock.
            </p>
          </div>

          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center font-black font-mono text-base">
              3
            </div>
            <strong className="text-sm font-black uppercase text-neutral-950 block">
              3. Automatic Updates
            </strong>
            <p className="text-xs text-neutral-600 font-mono leading-relaxed">
              The daemon auto-checks for updates on boot and before every race. You never have to manually install anything again!
            </p>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            FEATURE HIGHLIGHTS
           ───────────────────────────────────────────────────────────── */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <h3 className="text-base font-black uppercase tracking-wider text-neutral-950">
            Included Zero-Install Capabilities
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center gap-3 shadow-xs">
              <Zap className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <strong className="text-neutral-950 block font-bold">60 FPS Physics HUD</strong>
                <span className="text-neutral-500 text-[11px]">Filtered RPM, gear, throttle &amp; brake traces</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center gap-3 shadow-xs">
              <Wind className="w-5 h-5 text-cyan-600 shrink-0" />
              <div>
                <strong className="text-neutral-950 block font-bold">Dual Wind Sim Fans</strong>
                <span className="text-neutral-500 text-[11px]">Velocity-matched airflow with custom PWM curves</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center gap-3 shadow-xs">
              <Camera className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <strong className="text-neutral-950 block font-bold">Driver Face-Cam PiP</strong>
                <span className="text-neutral-500 text-[11px]">DirectShow 30 FPS USB camera stream</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center gap-3 shadow-xs">
              <Mic className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <strong className="text-neutral-950 block font-bold">In-Ear Steward Intercom</strong>
                <span className="text-neutral-500 text-[11px]">Sub-20ms push-to-talk race director radio</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center gap-3 shadow-xs">
              <RefreshCw className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-neutral-950 block font-bold">Pre-Race Auto-Sync</strong>
                <span className="text-neutral-500 text-[11px]">Auto-updates when connecting to iRacing</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center gap-3 shadow-xs">
              <Shield className="w-5 h-5 text-neutral-800 shrink-0" />
              <div>
                <strong className="text-neutral-950 block font-bold">Taskbar System Tray App</strong>
                <span className="text-neutral-500 text-[11px]">Right-click menu by the Windows clock</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER
         ───────────────────────────────────────────────────────────── */}
      <footer className="max-w-5xl w-full mx-auto text-center text-xs font-mono text-neutral-500 pt-8 border-t border-neutral-200">
        GridPass.App SRCommander Ecosystem • Direct Sim Integration
      </footer>
    </div>
  );
}
