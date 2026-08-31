"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Users,
  ArrowLeft,
  QrCode,
  Smartphone,
  Play,
  RotateCcw,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  Loader2,
  UserPlus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

function QueueToolContent() {
  const { showToast } = useToast();
  const rigId = "rig_development_1_nncx";

  const [queue, setQueue] = useState<any[]>([]);
  const [activeDriver, setActiveDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrUrl(window.location.origin + "/srcommander/rig/" + rigId);
    }
  }, [rigId]);

  useEffect(() => {
    const q = query(
      collection(db, "commander_rig_sessions"),
      where("rig_id", "==", rigId),
      where("status", "in", ["queued", "active", "driving"])
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setQueue(list);
        const seated = list.find((s) => s.status === "driving" || s.status === "active");
        setActiveDriver(seated || null);
        setLoading(false);
      },
      (err) => {
        console.warn("Queue error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [rigId]);

  const advanceQueue = async () => {
    showToast({
      title: "Advancing Queue",
      message: "Rotating to next driver in line...",
      icon: "🏎️",
    });

    try {
      await fetch("/api/commander/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "advance",
          rig_id: rigId,
        }),
      });
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 sm:p-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <Link
            href="/srcommander"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-white transition px-4 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Toolbox</span>
          </Link>

          <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-700/50 text-[11px] font-mono uppercase font-bold">
            TOOL 05 • ARRIVE & DRIVE QUEUE
          </span>
        </div>

        {/* TITLE */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center">
              <Users className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-white tracking-tight">
                Arrive & Drive Queue Manager
              </h1>
              <p className="text-xs text-neutral-400">
                Manage driver rotations, automated stint timers, and mobile phone QR intake.
              </p>
            </div>
          </div>
        </div>

        {/* CURRENT SEATED DRIVER & ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* SEATED DRIVER CARD */}
          <div className="bg-neutral-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  Currently Seated
                </span>
                <span className="text-xs font-mono text-neutral-400">Pod 1</span>
              </div>

              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-lg font-black text-white">
                  {activeDriver ? (activeDriver.driver_name?.charAt(0) || "D") : "⚪"}
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <strong className="text-base font-black text-white block truncate">
                    {activeDriver ? activeDriver.driver_name : "Seat Open / Ready"}
                  </strong>
                  <span className="text-xs font-mono text-neutral-500 block">
                    {activeDriver ? ("@" + (activeDriver.driver_handle || "driver")) : "No driver currently seated"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={advanceQueue}
              className="w-full py-4 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Rotate / Seat Next Driver</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* QR CODE MOBILE INTAKE */}
          <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 shadow-2xl flex items-center gap-5">
            <div className="p-3 bg-white rounded-2xl shrink-0 shadow-lg border-2 border-neutral-700">
              <img
                src={"https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=" + encodeURIComponent(qrUrl)}
                alt="Queue QR"
                className="w-24 h-24"
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-rose-400">
                <Smartphone className="w-4 h-4" />
                <span>Scan to Join Queue</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Drivers can scan this QR code with their phone camera to claim a spot in the lineup.
              </p>
            </div>
          </div>
        </div>

        {/* LINEUP MANIFEST */}
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <h2 className="text-lg font-black uppercase text-white tracking-tight">
              Lineup Manifest ({queue.length})
            </h2>
            <span className="text-xs font-mono text-neutral-500">FIFO Priority</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
              <span>Loading lineup...</span>
            </div>
          ) : queue.length === 0 ? (
            <div className="py-10 text-center space-y-2 bg-neutral-950 rounded-2xl border border-neutral-800 p-6">
              <p className="text-xs font-mono text-neutral-400">No drivers currently in line.</p>
              <span className="text-[11px] text-neutral-600">Scan the QR code to add the first driver!</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {queue.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-mono font-bold text-xs text-neutral-400">
                      #{idx + 1}
                    </span>
                    <strong className="text-sm font-black text-white">{item.driver_name}</strong>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QueueToolPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      }
    >
      <QueueToolContent />
    </Suspense>
  );
}
