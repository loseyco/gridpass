"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ToastContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import {
  Monitor,
  CheckCircle2,
  Loader2,
  Sparkles,
  Lock,
  User as UserIcon,
  Link2,
  ArrowRight,
  ArrowLeft,
  Tv,
  Plus,
  RefreshCw,
  Zap,
  MapPin,
  Clock,
  ShieldCheck,
  Smartphone,
  HardDrive,
  Cpu,
  Layers,
} from "lucide-react";

function SRCommanderSetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"pair" | "manual" | "fleet">("pair");
  const [pairingPin, setPairingPin] = useState<string>("");
  const [pinLoading, setPinLoading] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  // Manual / Rig Config Form State
  const [rigName, setRigName] = useState("Pod 1 - Motion Rig");
  const [venueName, setVenueName] = useState("Apex Sim Racing Lounge");
  const [stintDuration, setStintDuration] = useState("8");
  const [sessionMode, setSessionMode] = useState<"time" | "laps" | "unlimited">("time");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Host's Existing Rigs
  const [hostRigs, setHostRigs] = useState<any[]>([]);
  const [loadingRigs, setLoadingRigs] = useState(false);
  const [activeRigId, setActiveRigId] = useState<string>("rig_development_1_nncx");

  // Load existing local rig config
  useEffect(() => {
    fetch("/api/commander/link/poll?code=current")
      .then((res) => res.json())
      .then((data) => {
        if (data.rig_id) {
          setActiveRigId(data.rig_id);
        }
      })
      .catch(() => {});
  }, []);

  // Generate 6-digit pairing PIN on mount
  useEffect(() => {
    generatePairingPin();
  }, []);

  const generatePairingPin = async () => {
    setPinLoading(true);
    try {
      const res = await fetch("/api/commander/link/create", { method: "POST" });
      const data = await res.json();
      if (data.code) {
        setPairingPin(data.code);
      }
    } catch (e) {
      console.warn("Pin error:", e);
    } finally {
      setPinLoading(false);
    }
  };

  // Poll for pairing PIN claim
  useEffect(() => {
    if (!pairingPin || isClaimed) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/commander/link/poll?code=${pairingPin}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "claimed") {
            setIsClaimed(true);
            const assignedRigId = data.rig_id || "rig_development_1_nncx";
            setActiveRigId(assignedRigId);
            showToast({
              title: "Simulator Rig Linked!",
              message: `Successfully bound to ${data.rig_name || "Pod 1"}.`,
              icon: "🎉",
            });
            setTimeout(() => {
              router.push(`/srcommander/rig/${assignedRigId}`);
            }, 1200);
          }
        }
      } catch (err) {}
    }, 2000);

    return () => clearInterval(interval);
  }, [pairingPin, isClaimed, router, showToast]);

  // Fetch host rigs if user is logged in
  useEffect(() => {
    if (!user) return;
    setLoadingRigs(true);
    const fetchRigs = async () => {
      try {
        const q = query(collection(db, "commander_rigs"), where("owner_id", "==", user.uid));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setHostRigs(list);
      } catch (e) {
        console.warn("Fetch rigs error:", e);
      } finally {
        setLoadingRigs(false);
      }
    };
    fetchRigs();
  }, [user]);

  // Handle Manual Rig Save & Activate
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rigName.trim()) return;

    setIsSubmitting(true);
    try {
      const generatedId = `rig_${rigName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Math.random().toString(36).substring(2, 6)}`;
      const ownerUid = user?.uid || "host_local";
      const ownerEmail = user?.email || "host@gridpass.app";
      const ownerName = user?.displayName || user?.email?.split("@")[0] || "Host";

      const rigPayload = {
        id: generatedId,
        name: rigName.trim(),
        venue_name: venueName.trim(),
        owner_id: ownerUid,
        owner_email: ownerEmail,
        owner_name: ownerName,
        session_max_minutes: parseInt(stintDuration) || 8,
        session_mode: sessionMode,
        status: "ready",
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      // Save to Cloud Firestore
      await setDoc(doc(db, "commander_rigs", generatedId), rigPayload, { merge: true });

      // Save to local runtime config
      await fetch("/api/commander/link/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: pairingPin || "MANUAL",
          rig_name: rigName.trim(),
          rig_id: generatedId,
          owner_id: ownerUid,
          owner_email: ownerEmail,
          owner_name: ownerName,
          venue_name: venueName.trim(),
          session_max_minutes: parseInt(stintDuration) || 8,
        }),
      });

      setActiveRigId(generatedId);
      showToast({
        title: "Simulator Pod Created!",
        message: `${rigName} is registered and ready to race.`,
        icon: "🏎️",
      });

      router.push(`/srcommander/rig/${generatedId}`);
    } catch (err: any) {
      showToast({
        title: "Registration Failed",
        message: err.message,
        icon: "❌",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectExistingRig = async (rig: any) => {
    setActiveRigId(rig.id);
    try {
      await fetch("/api/commander/link/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "SWITCH",
          rig_name: rig.name,
          rig_id: rig.id,
          owner_id: rig.owner_id,
          owner_email: rig.owner_email,
          owner_name: rig.owner_name,
          venue_name: rig.venue_name,
        }),
      });
      showToast({
        title: "Rig Profile Switched",
        message: `Now controlling ${rig.name}.`,
        icon: "⚡",
      });
      router.push(`/srcommander/rig/${rig.id}`);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 sm:p-8 flex flex-col items-center justify-center">
      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-2xl relative z-10 space-y-6">
        {/* HEADER BREADCRUMB */}
        <div className="flex items-center justify-between">
          <Link
            href="/srcommander"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-white transition px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sim Commander Hub</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-[11px] font-mono text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>MODULE 2: RIG REGISTRATION</span>
          </div>
        </div>

        {/* TITLE */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl mb-1">
            <Monitor className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Simulator Pod Registration
          </h1>
          <p className="text-xs text-neutral-400 font-medium max-w-md mx-auto">
            Pair your physical simulator rig to GridPass in 10 seconds, name the pod, and configure venue stint rules.
          </p>
        </div>

        {/* TAB CONTROLS */}
        <div className="grid grid-cols-3 p-1.5 bg-neutral-950 rounded-2xl border border-neutral-800 shadow-xl">
          <button
            type="button"
            onClick={() => setActiveTab("pair")}
            className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "pair" ? "bg-red-600 text-white shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>6-Digit PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "manual" ? "bg-red-600 text-white shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Pod</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fleet")}
            className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "fleet" ? "bg-red-600 text-white shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>My Fleet ({hostRigs.length})</span>
          </button>
        </div>

        {/* TAB 1: 6-DIGIT PAIRING PIN */}
        {activeTab === "pair" && (
          <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                Instant Auto-Pairing PIN
              </span>
              <h2 className="text-xl font-black uppercase text-white">
                Enter Code on Your Phone / iPad
              </h2>
              <p className="text-xs text-neutral-400">
                Scan or visit <strong className="text-white">gridpass.app/link</strong> and enter this PIN to claim this rig:
              </p>
            </div>

            {/* PIN CODE DISPLAY */}
            <div className="py-6 px-4 bg-neutral-950 rounded-3xl border-2 border-dashed border-neutral-700 flex flex-col items-center justify-center gap-3">
              {pinLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-red-500 my-4" />
              ) : (
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-red-500">
                  {pairingPin || "GP-8421"}
                </div>
              )}

              <button
                type="button"
                onClick={generatePairingPin}
                className="text-[11px] font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate New Code</span>
              </button>
            </div>

            {/* QR CODE FOR PHONE SCAN */}
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-white rounded-2xl inline-block shadow-lg mx-auto">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                    `https://gridpass.app/srcommander/setup?code=${pairingPin}`
                  )}`}
                  alt="Pairing QR"
                  className="w-28 h-28 mx-auto"
                />
              </div>
              <p className="text-[11px] font-mono text-neutral-400">
                Point your phone camera at this QR code to claim this pod instantly!
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL RIG SETUP FORM */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSave} className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="space-y-1 pb-2 border-b border-neutral-800">
              <h2 className="text-lg font-black uppercase text-white">Create Simulator Pod Profile</h2>
              <p className="text-xs text-neutral-400">Define the pod name and default venue stint rules.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-neutral-400 block tracking-wider">
                  Pod / Rig Name
                </label>
                <div className="relative">
                  <Monitor className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Pod 1 - Motion Rig"
                    value={rigName}
                    onChange={(e) => setRigName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-neutral-600 text-sm font-medium focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-neutral-400 block tracking-wider">
                  Venue / Location Name
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Apex Sim Racing Lounge"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-neutral-600 text-sm font-medium focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-neutral-400 block tracking-wider">
                  Session Mode
                </label>
                <select
                  value={sessionMode}
                  onChange={(e: any) => setSessionMode(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white text-sm font-medium focus:outline-hidden focus:border-red-500"
                >
                  <option value="time">⏱️ Timed Stint (Default)</option>
                  <option value="laps">🏁 Fixed Lap Count</option>
                  <option value="unlimited">♾️ Unlimited Free Practice</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-neutral-400 block tracking-wider">
                  Stint Duration (Minutes)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={stintDuration}
                    onChange={(e) => setStintDuration(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-11 pr-4 py-3 text-white text-sm font-medium focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Registering Rig...</span>
                </>
              ) : (
                <>
                  <span>Save & Launch Simulator Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: FLEET SELECTOR */}
        {activeTab === "fleet" && (
          <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="space-y-1 pb-2 border-b border-neutral-800">
              <h2 className="text-lg font-black uppercase text-white">Your Registered Simulator Fleet</h2>
              <p className="text-xs text-neutral-400">
                Switch which pod profile this physical PC is currently running.
              </p>
            </div>

            {loadingRigs ? (
              <div className="py-12 text-center text-neutral-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-red-500" />
                <span>Loading your fleet...</span>
              </div>
            ) : hostRigs.length === 0 ? (
              <div className="py-10 text-center space-y-3 bg-neutral-950 rounded-2xl border border-neutral-800 p-6">
                <p className="text-xs font-mono text-neutral-400">No registered rigs found on your account.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase rounded-xl"
                >
                  Create First Pod
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {hostRigs.map((rig) => {
                  const isActive = rig.id === activeRigId;
                  return (
                    <div
                      key={rig.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition ${
                        isActive
                          ? "bg-cyan-950/40 border-cyan-500/60 shadow-lg"
                          : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-black text-white">{rig.name}</strong>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-black text-[9px] font-black uppercase">
                              Active On This Rig
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-2">
                          <span>{rig.venue_name || "Paddock Bay"}</span>
                          <span>•</span>
                          <span className="text-neutral-500">ID: {rig.id}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => selectExistingRig(rig)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                          isActive
                            ? "bg-neutral-800 text-neutral-300"
                            : "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30"
                        }`}
                      >
                        {isActive ? "Connected" : "Select Pod"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div className="flex items-center justify-center gap-2 text-center text-[11px] font-mono text-neutral-500">
          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          <span>Config stored in data/rig_config.json on Flash Drive</span>
        </div>
      </div>
    </div>
  );
}

export default function SRCommanderSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      }
    >
      <SRCommanderSetupContent />
    </Suspense>
  );
}
