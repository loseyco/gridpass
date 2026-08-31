"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { doc, collection, query, where, onSnapshot, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueSeries, SRLeagueRound } from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import { useLeaguePermissions } from "@/lib/hooks/useLeaguePermissions";
import {
  Calendar,
  ArrowLeft,
  Plus,
  Clock,
  MapPin,
  Car,
  Zap,
  Check,
  Cpu,
  Shield,
  Flag,
  CloudSun,
  Edit2,
  Trash2,
  Settings,
  Key,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

export default function SRLeagueSchedulePage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const { user, isLeagueOwner } = useLeaguePermissions(league);
  const [seriesList, setSeriesList] = useState<SRLeagueSeries[]>([]);
  const [rounds, setRounds] = useState<SRLeagueRound[]>([]);
  const [isRegisteredDriver, setIsRegisteredDriver] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // 1. Fetch League Profile
  useEffect(() => {
    if (!leagueId) return;
    const unsub = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });
    return () => unsub();
  }, [leagueId]);

  // 2. Fetch Series
  useEffect(() => {
    if (!leagueId) return;
    const q = query(collection(db, "sr_league_series"), where("league_id", "==", leagueId));
    const unsub = onSnapshot(q, (snap) => {
      const list: SRLeagueSeries[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setSeriesList(list);
    });
    return () => unsub();
  }, [leagueId]);

  // 3. Fetch Rounds
  useEffect(() => {
    if (!leagueId) return;
    const q = query(collection(db, "sr_league_rounds"), where("league_id", "==", leagueId));
    const unsub = onSnapshot(q, (snap) => {
      const list: SRLeagueRound[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (a.round_number || 0) - (b.round_number || 0));
      setRounds(list);
      setLoading(false);
    });
    return () => unsub();
  }, [leagueId]);

  // 4. Check if current user is registered in this league
  useEffect(() => {
    if (!leagueId || !user?.uid) return;
    const q = query(
      collection(db, "sr_league_drivers"),
      where("league_id", "==", leagueId),
      where("user_id", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setIsRegisteredDriver(!snap.empty);
    });
    return () => unsub();
  }, [leagueId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 font-mono text-xs text-neutral-500">
        Loading Championship Calendar...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6 font-mono text-xs">
      {/* HEADER */}
      <header className="max-w-2xl w-full mx-auto">
        <div className="flex items-center justify-between gap-3.5 pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-3.5">
            <Link
              href={`/srleague/${leagueId}`}
              className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
              title="Back to League"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
                Championship Calendar
              </h1>
              <span className="text-xs text-neutral-500">{league?.name} • {rounds.length} Scheduled Rounds</span>
            </div>
          </div>

          {isLeagueOwner && (
            <Link
              href={`/srleague/${leagueId}/schedule/new`}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold uppercase rounded-2xl shadow-md shadow-red-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Round</span>
            </Link>
          )}
        </div>
      </header>

      {/* ROUNDS LIST */}
      <main className="max-w-2xl w-full mx-auto space-y-4">
        {rounds.length === 0 ? (
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mx-auto text-neutral-300 shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-black uppercase text-neutral-900">No Rounds Scheduled</h3>
              <p className="text-xs text-neutral-500">
                Build your season calendar by scheduling tracks, dates, and race lengths.
              </p>
            </div>
            {isLeagueOwner && (
              <Link
                href={`/srleague/${leagueId}/schedule/new`}
                className="inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-md shadow-red-600/20 transition"
              >
                + Schedule Round 1
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {rounds.map((r) => {
              const isCompleted = r.status === "completed";

              return (
                <div
                  key={r.id}
                  className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3.5 shadow-sm hover:border-neutral-300 transition"
                >
                  {/* ROUND HEADER WITH ACTIONS */}
                  <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-neutral-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center font-black text-red-600 text-sm shrink-0 shadow-2xs">
                        R{r.round_number}
                      </div>
                      <div className="min-w-0">
                        <strong className="text-sm font-black uppercase text-neutral-900 block leading-tight truncate">
                          {r.title}
                        </strong>
                        <span className="text-[11px] text-neutral-500 flex items-center gap-1.5 pt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                          <span>{r.track_name} ({r.track_layout})</span>
                        </span>
                      </div>
                    </div>

                    {/* EDIT CONTROL */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          isCompleted
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-blue-50 text-blue-700 border-blue-300"
                        }`}
                      >
                        {r.status}
                      </span>

                      {isLeagueOwner && (
                        <Link
                          href={`/srleague/${leagueId}/schedule/${r.id}/edit`}
                          className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-neutral-800 hover:text-neutral-950 transition shadow-2xs flex items-center gap-1.5 text-[11px] font-bold"
                          title="Edit Round Date, Time & Specs"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Edit</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* EVENT SPECS & FORMAT SUMMARY */}
                  <div className="p-4 bg-white rounded-2xl border border-neutral-200 space-y-3 shadow-2xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10px] text-neutral-700">
                      <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-neutral-400 block uppercase text-[9px] font-bold">Car Model</span>
                        <strong className="text-neutral-900 block truncate">{r.car_model || "Toyota GR86"}</strong>
                        <span className="text-emerald-700 font-bold">{r.fixed_setup !== false ? "Fixed Setup" : "Open Setup"}</span>
                      </div>

                      <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-neutral-400 block uppercase text-[9px] font-bold">Session Timing</span>
                        <strong className="text-neutral-900 block">P: {r.practice_minutes || 20}m • Q: {r.qualifying_minutes || 15}m</strong>
                        <span className="text-red-700 font-bold">Race: {r.race_length_value || 30} {r.race_length_type || "mins"}</span>
                      </div>

                      <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-neutral-400 block uppercase text-[9px] font-bold">Start & Rules</span>
                        <strong className="text-neutral-900 block capitalize">{r.start_type || "standing"} Start</strong>
                        <span className="text-neutral-600 font-bold">DQ: {r.incident_limit_dq || 17}x • {r.fast_repairs ?? 1} Repair</span>
                      </div>

                      <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-neutral-400 block uppercase text-[9px] font-bold">Weather / Server</span>
                        <strong className="text-neutral-900 block truncate">{r.server_region || "US-East-OH"}</strong>
                        <span className="text-neutral-600 font-bold">{r.weather_temp_f || 78}°F Dynamic</span>
                      </div>
                    </div>

                    {/* 🔑 SERVER PASSWORD BADGE (REGISTERED DRIVERS & ORGANIZERS) */}
                    {r.server_password && (
                      <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-700">
                          <Key className="w-3.5 h-3.5 text-amber-600" />
                          <span>Session Password:</span>
                        </div>

                        {isLeagueOwner || isRegisteredDriver ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-300">
                              {revealedPasswords[r.id] ? r.server_password : "••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setRevealedPasswords((prev) => ({ ...prev, [r.id]: !prev[r.id] }));
                              }}
                              className="text-neutral-500 hover:text-neutral-900 font-bold uppercase text-[9px] cursor-pointer"
                            >
                              {revealedPasswords[r.id] ? "Hide" : "Reveal"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(r.server_password || "");
                                showToast({ title: "🔑 Password Copied", message: "Session password copied to clipboard.", icon: "📋" });
                              }}
                              className="text-red-600 hover:text-red-700 font-bold uppercase text-[9px] cursor-pointer"
                            >
                              Copy
                            </button>
                          </div>
                        ) : (
                          <Link
                            href={`/srleague/${leagueId}/join?seasonId=${r.season_id}`}
                            className="text-red-600 font-bold hover:underline flex items-center gap-1 text-[10px]"
                          >
                            <span>🔒 Register to View Password</span>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SCHEDULE & LAUNCH TIME FOOTER */}
                  <div className="text-[11px] text-neutral-600 pt-0.5 flex items-center justify-between flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 text-neutral-900 font-bold">
                      <Clock className="w-3.5 h-3.5 text-red-600" />
                      <span>{r.scheduled_date} @ {r.server_start_time || "7:00 PM CST"}</span>
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {r.is_league_session !== false ? "Official League Hosted Session" : "Open Session"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="max-w-2xl w-full mx-auto text-center py-4 text-[11px] text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}
