"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueProtest } from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import {
  ArrowLeft,
  Scale,
  Loader2,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

export default function FileInquiryPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const router = useRouter();
  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const [submittingDriver, setSubmittingDriver] = useState("");
  const [accusedDriver, setAccusedDriver] = useState("");
  const [lap, setLap] = useState(1);
  const [turn, setTurn] = useState("Turn 1");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!leagueId) return;
    const unsub = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });
    return () => unsub();
  }, [leagueId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingDriver.trim() || !accusedDriver.trim() || !description.trim()) return;

    setSaving(true);
    const protestId = `prot_${leagueId}_${Date.now()}`;

    const newProtest: SRLeagueProtest = {
      id: protestId,
      league_id: leagueId,
      round_id: "active_round",
      submitting_driver_name: submittingDriver.trim(),
      accused_driver_name: accusedDriver.trim(),
      incident_lap: Number(lap) || 1,
      incident_turn: turn.trim() || "Turn 1",
      description: description.trim(),
      replay_timestamp_s: 0,
      status: "submitted",
      created_at: Date.now(),
    };

    try {
      await setDoc(doc(db, "sr_league_protests", protestId), newProtest);
      showToast({
        title: "⚖️ Incident Inquiry Filed",
        message: "Your inquiry has been submitted for steward review.",
        icon: "📋",
      });
      router.push(`/srleague/${leagueId}/stewarding`);
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not file inquiry.",
        icon: "❌",
      });
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
      {/* HEADER */}
      <header className="max-w-xl w-full mx-auto">
        <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-200">
          <Link
            href={`/srleague/${leagueId}/stewarding`}
            className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
            title="Back to Stewarding"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
              File Incident Inquiry
            </h1>
            <span className="text-xs font-mono text-neutral-500">
              {league?.name || "Championship"}
            </span>
          </div>
        </div>
      </header>

      {/* FORM */}
      <main className="max-w-xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
          
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            
            {/* SUBMITTING DRIVER */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Your Driver Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Marcus Vance"
                value={submittingDriver}
                onChange={(e) => setSubmittingDriver(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />
            </div>

            {/* ACCUSED DRIVER */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Involved Competitor / Car # *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Car #44 (Alex Morgan)"
                value={accusedDriver}
                onChange={(e) => setAccusedDriver(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />
            </div>

            {/* LAP & CORNER */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Lap Number *
                </label>
                <input
                  type="number"
                  required
                  value={lap}
                  onChange={(e) => setLap(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Corner / Sector
                </label>
                <input
                  type="text"
                  placeholder="Turn 1 / Hairpin"
                  value={turn}
                  onChange={(e) => setTurn(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Incident Description *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Explain what happened (dive-bomb, blocking, unsafe rejoins, etc.)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition resize-none"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Scale className="w-5 h-5" />
                <span>Submit Inquiry to Stewards</span>
              </>
            )}
          </button>

        </form>
      </main>

      {/* FOOTER */}
      <footer className="max-w-xl w-full mx-auto text-center py-4 text-[11px] font-mono text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}
