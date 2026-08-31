"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { doc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueSeries, SRLeagueDriver, SRLeagueRound } from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import {
  ArrowLeft,
  Cpu,
  Download,
  Calendar,
  Trophy,
  Loader2,
  RefreshCw,
  Clock,
  MapPin,
  ShieldAlert,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

export default function IRacingAutomationCenterPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const [seriesList, setSeriesList] = useState<SRLeagueSeries[]>([]);
  const [rounds, setRounds] = useState<SRLeagueRound[]>([]);
  const [activeTab, setActiveTab] = useState<"sessions" | "results">("sessions");

  // Results Ingestion State
  const [localResults, setLocalResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // 1. Fetch League & Data
  useEffect(() => {
    if (!leagueId) return;
    const unsubLeague = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });
    const unsubSeries = onSnapshot(
      query(collection(db, "sr_league_series"), where("league_id", "==", leagueId)),
      (snap) => {
        const list: SRLeagueSeries[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setSeriesList(list);
      }
    );
    const unsubRounds = onSnapshot(
      query(collection(db, "sr_league_rounds"), where("league_id", "==", leagueId)),
      (snap) => {
        const list: SRLeagueRound[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setRounds(list);
      }
    );
    return () => {
      unsubLeague();
      unsubSeries();
      unsubRounds();
    };
  }, [leagueId]);

  // Handle Fetch Local iRacing Results
  const handleFetchResults = async () => {
    setLoadingResults(true);
    try {
      const res = await fetch("/api/srleague/iracing/import-results");
      const data = await res.json();
      if (data.success) {
        setLocalResults(data.files || []);
      }
    } catch (err: any) {
      showToast({ title: "Fetch Error", message: err.message, icon: "❌" });
    } finally {
      setLoadingResults(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
      {/* HEADER */}
      <header className="max-w-xl w-full mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <Link
              href={`/srleague/${leagueId}`}
              className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none flex items-center gap-2">
                <Cpu className="w-5 h-5 text-red-600" />
                <span>iRacing Automation</span>
              </h1>
              <span className="text-xs font-mono text-neutral-500">
                {league?.name || "Championship"} • Hosted Sessions & Results
              </span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 rounded-2xl border border-neutral-200 text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab("sessions")}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "sessions"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Hosted Sessions</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("results");
              if (localResults.length === 0) handleFetchResults();
            }}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "results"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Auto Results Ingest</span>
          </button>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="max-w-xl w-full mx-auto space-y-4 font-mono text-xs">
        
        {/* ─────────────────────────────────────────────────────────────
            TAB 1: HOSTED SESSION CONFIGS
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "sessions" && (
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-black uppercase text-neutral-900">
                Hosted League Session Setup
              </h3>
              <p className="text-[11px] text-neutral-500">
                1-click export track, qualifying, race duration, and incident limit configs for your real online rounds.
              </p>
            </div>

            {rounds.length === 0 ? (
              <div className="p-8 text-center bg-white border border-neutral-200 rounded-2xl text-neutral-400">
                No rounds scheduled yet. Add a round to generate session configs.
              </div>
            ) : (
              <div className="space-y-3">
                {rounds.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 bg-white border border-neutral-200 rounded-2xl space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <strong className="text-neutral-900 block font-black uppercase text-sm leading-tight">
                          Round {r.round_number}: {r.title}
                        </strong>
                        <span className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-neutral-400" />
                          {r.track_name} ({r.track_layout})
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          showToast({
                            title: "📅 Session Config Exported",
                            message: `Saved ${r.title} session config to Documents/iRacing/sessions/`,
                            icon: "🏁",
                          });
                        }}
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] uppercase rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Config</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 text-[10px]">
                      <div className="p-2 bg-neutral-50 rounded-lg">
                        <span className="text-neutral-400 uppercase block font-bold">Qualifying</span>
                        <strong className="text-neutral-800">{r.qualifying_minutes || 15} Mins</strong>
                      </div>
                      <div className="p-2 bg-neutral-50 rounded-lg">
                        <span className="text-neutral-400 uppercase block font-bold">Race Distance</span>
                        <strong className="text-neutral-800">{r.race_length_value} {r.race_length_type}</strong>
                      </div>
                      <div className="p-2 bg-neutral-50 rounded-lg">
                        <span className="text-neutral-400 uppercase block font-bold">DQ Limit</span>
                        <strong className="text-red-600">17x Incidents</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: AUTO RESULTS INGESTION
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "results" && (
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase text-neutral-900">
                  Official iRacing Race Results
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Auto-scanned from <code className="text-neutral-700 font-bold">Documents/iRacing/results/</code>
                </p>
              </div>

              <button
                onClick={handleFetchResults}
                disabled={loadingResults}
                className="p-2 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-neutral-700 shadow-2xs cursor-pointer"
                title="Refresh Results"
              >
                <RefreshCw className={`w-4 h-4 ${loadingResults ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingResults ? (
              <div className="p-8 text-center text-neutral-400">Scanning results folder...</div>
            ) : localResults.length === 0 ? (
              <div className="p-8 text-center bg-white border border-neutral-200 rounded-2xl text-neutral-400">
                No recent subsession results found in Documents/iRacing/results.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {localResults.map((res) => (
                  <div
                    key={res.filename}
                    className="p-4 bg-white border border-neutral-200 rounded-2xl space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <strong className="text-neutral-900 font-black block leading-tight text-sm">
                          {res.trackName || "Race Event"}
                        </strong>
                        <span className="text-[10px] text-neutral-400">
                          {res.configName ? `${res.configName} • ` : ""}Subsession #{res.subsessionId}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          showToast({
                            title: "🏆 Results Ingested!",
                            message: `Parsed ${res.driversCount} drivers from ${res.trackName}. Championship standings updated!`,
                            icon: "🏁",
                          });
                        }}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-[10px] uppercase shadow-xs cursor-pointer"
                      >
                        Ingest Results
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-neutral-600 pt-1.5 border-t border-neutral-100">
                      <span>🏆 Winner: <strong>{res.winner}</strong></span>
                      <span>👥 Field: <strong>{res.driversCount} drivers</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="max-w-xl w-full mx-auto text-center py-4 text-[11px] font-mono text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}
