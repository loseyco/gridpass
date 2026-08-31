"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { doc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueSeries, SRLeagueSeason, SRLeagueRound, SRLeagueDriver } from "@/lib/types/league";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLeaguePermissions } from "@/lib/hooks/useLeaguePermissions";
import {
  Trophy,
  Calendar,
  Users,
  Tv,
  ArrowLeft,
  ChevronRight,
  Plus,
  Settings,
  Layers,
  Archive,
  Cpu,
  AlertCircle,
  ShieldCheck,
  Car,
  Clock,
  Flag,
  MapPin,
  Sparkles,
  BarChart3,
  Download,
  Sliders,
} from "lucide-react";
import LeagueAnalyticsDashboard from "@/components/srleague/LeagueAnalyticsDashboard";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

function formatRaceTime(timeStr?: string): string {
  if (!timeStr) return "7:00 PM";
  if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) {
    return timeStr;
  }
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const mins = parts[1].padStart(2, "0");
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${mins} ${ampm}`;
  }
  return timeStr;
}

function cleanTrackName(name?: string): string {
  if (!name) return "Track";
  return name
    .replace(/^WeatherTech\s+(Raceway\s+)?/i, "")
    .replace(/^Circuit\s+(de\s+|of\s+the\s+)?/i, "")
    .replace(/Lime Rock Park/gi, "Lime Rock")
    .replace(/Oulton Park Circuit/gi, "Oulton Park")
    .replace(/\s+(International\s+Circuit|Park\s+Circuit|Motor\s+Speedway|Motorsports\s+Park|Raceway|Circuit|International)/gi, "")
    .replace(/Autodromo Jose Carlos Pace/gi, "Interlagos")
    .replace(/Circuit de Spa-Francorchamps/gi, "Spa-Francorchamps")
    .replace(/Mount Panorama Motor Racing Circuit/gi, "Mount Panorama")
    .trim();
}

export default function SRLeagueDetailPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const [league, setLeague] = useState<SRLeague | null>(null);
  const { isLeagueOwner } = useLeaguePermissions(league);
  const [seriesList, setSeriesList] = useState<SRLeagueSeries[]>([]);
  const [seasonsMap, setSeasonsMap] = useState<Record<string, SRLeagueSeason[]>>({});
  const [allDrivers, setAllDrivers] = useState<SRLeagueDriver[]>([]);
  const [allRounds, setAllRounds] = useState<SRLeagueRound[]>([]);
  const [seriesTab, setSeriesTab] = useState<"active" | "archived" | "analytics">("active");
  const [driversCount, setDriversCount] = useState(0);
  const [roundsCount, setRoundsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Fetch League Profile
  useEffect(() => {
    if (!leagueId) return;
    const unsub = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) {
        setLeague({ id: snap.id, ...(snap.data() as any) });
      } else {
        setLeague(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [leagueId]);

  // 2. Fetch Series in this League
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

  // 3. Fetch Seasons for all Series in this League
  useEffect(() => {
    if (!leagueId) return;
    const q = query(collection(db, "sr_league_seasons"), where("league_id", "==", leagueId));
    const unsub = onSnapshot(q, (snap) => {
      const map: Record<string, SRLeagueSeason[]> = {};
      snap.forEach((d) => {
        const season = { id: d.id, ...(d.data() as any) } as SRLeagueSeason;
        if (!map[season.series_id]) {
          map[season.series_id] = [];
        }
        map[season.series_id].push(season);
      });
      setSeasonsMap(map);
    });
    return () => unsub();
  }, [leagueId]);

  // 4. Fetch Drivers
  useEffect(() => {
    if (!leagueId) return;
    const q = query(collection(db, "sr_league_drivers"), where("league_id", "==", leagueId));
    const unsub = onSnapshot(q, (snap) => {
      const list: SRLeagueDriver[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setAllDrivers(list);
      setDriversCount(list.length);
    });
    return () => unsub();
  }, [leagueId]);

  // 5. Fetch Rounds
  useEffect(() => {
    if (!leagueId) return;
    const q = query(collection(db, "sr_league_rounds"), where("league_id", "==", leagueId));
    const unsub = onSnapshot(q, (snap) => {
      const list: SRLeagueRound[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (a.round_number || 0) - (b.round_number || 0));
      setAllRounds(list);
      setRoundsCount(list.length);
    });
    return () => unsub();
  }, [leagueId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 font-mono text-xs text-neutral-500">
        Loading Championship League...
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-8">
        <div className="max-w-md mx-auto text-center space-y-4 py-16">
          <Trophy className="w-12 h-12 text-neutral-300 mx-auto" />
          <h2 className="text-xl font-black uppercase text-neutral-900">League Not Found</h2>
          <p className="text-xs font-mono text-neutral-500">
            This championship league does not exist in Cloud Firestore.
          </p>
          <Link
            href="/srleague"
            className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 text-white text-xs font-mono font-bold uppercase rounded-2xl shadow-xs"
          >
            ← Back to All Leagues
          </Link>
        </div>
      </div>
    );
  }

  const activeSeries = seriesList.filter((s) => s.status !== "archived" && !s.is_archived);
  const archivedSeries = seriesList.filter((s) => s.status === "archived" || s.is_archived);
  const displayedSeries = seriesTab === "active" ? activeSeries : archivedSeries;

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. MOBILE-FIRST TOP HEADER
         ───────────────────────────────────────────────────────────── */}
      <header className="max-w-xl w-full mx-auto space-y-4">
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/srleague"
              className="p-2.5 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
              title="All Leagues"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {isLeagueOwner && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSeriesTab("analytics")}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    seriesTab === "analytics"
                      ? "bg-red-600 text-white"
                      : "bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-red-500" />
                  <span>Traffic & Sponsors</span>
                </button>

                <Link
                  href={`/srleague/${leagueId}/iracing`}
                  className="px-3 py-1.5 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 shadow-xs"
                >
                  <Cpu className="w-3.5 h-3.5 text-red-500" />
                  <span>iRacing Engine</span>
                </Link>

                <Link
                  href={`/srleague/${leagueId}/edit`}
                  className="px-3 py-1.5 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 shadow-xs"
                >
                  <Settings className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Edit</span>
                </Link>
              </div>
            )}
          </div>

          {/* LEAGUE BRANDING */}
          <div className="flex items-center gap-4 pt-1">
            <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {league.logo_url ? (
                <img src={league.logo_url} alt={league.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-red-600 text-white font-black text-sm flex items-center justify-center tracking-tight">
                  {league.short_name || league.name.slice(0, 3).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-tight">
                {league.name}
              </h1>
              
              <div className="flex items-center gap-2 flex-wrap">
                {league.short_name && (
                  <span className="text-xs font-mono text-neutral-500">
                    {league.short_name}
                  </span>
                )}

                {league.iracing_league_id && (
                  <a
                    href={`https://members.iracing.com/membersite/member/LeagueView.do?league=${league.iracing_league_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 transition shadow-2xs"
                    title="View Official iRacing League Page"
                  >
                    <span>iRacing ID #{league.iracing_league_id}</span>
                    <span className="text-[9px]">↗</span>
                  </a>
                )}

                {league.custom_domain && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-300 text-neutral-700 text-[10px] font-bold">
                    🌐 {league.custom_domain}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-200 text-center font-mono">
            <div className="p-2.5 bg-white rounded-2xl border border-neutral-200">
              <span className="text-[9px] text-neutral-400 block uppercase font-bold">Active Series</span>
              <strong className="text-base font-black text-neutral-900">{activeSeries.length}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-2xl border border-neutral-200">
              <span className="text-[9px] text-neutral-400 block uppercase font-bold">Entries</span>
              <strong className="text-base font-black text-neutral-900">{driversCount}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-2xl border border-neutral-200">
              <span className="text-[9px] text-neutral-400 block uppercase font-bold">Rounds</span>
              <strong className="text-base font-black text-neutral-900">{roundsCount}</strong>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          DRIVER PC COMPANION / DAEMON DOWNLOAD CARD
         ───────────────────────────────────────────────────────────── */}
      <div className="max-w-xl w-full mx-auto font-mono">
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-600/20 text-red-600 flex items-center justify-center font-black">
                🏎️
              </div>
              <div>
                <strong className="text-xs font-black uppercase text-neutral-950 block">
                  GridPass SRCommander Companion
                </strong>
                <span className="text-[10px] text-neutral-500">
                  60 FPS Live Telemetry • Zero-Install • Taskbar App
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[9px] font-black uppercase shadow-2xs">
              v4.3.0
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/srleague/download"
              className="min-h-[44px] px-3.5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-2xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Engine</span>
            </Link>

            <Link
              href="/srcommander/rig"
              className="min-h-[44px] px-3.5 py-2.5 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-2xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-neutral-600" />
              <span>Rig Manager</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SERIES / CHAMPIONSHIPS SECTION
         ───────────────────────────────────────────────────────────── */}
      <main className="max-w-xl w-full mx-auto space-y-4 font-mono">
        
        <div className="flex items-center justify-between gap-3">
          {/* TAB PILLS */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-2xl border border-neutral-200 text-[11px] font-bold">
            <button
              onClick={() => setSeriesTab("active")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                seriesTab === "active"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Active ({activeSeries.length})
            </button>
            {archivedSeries.length > 0 && (
              <button
                onClick={() => setSeriesTab("archived")}
                className={`px-3 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                  seriesTab === "archived"
                    ? "bg-white text-neutral-900 shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <Archive className="w-3 h-3" />
                <span>Archived ({archivedSeries.length})</span>
              </button>
            )}
            <button
              onClick={() => setSeriesTab("analytics")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                seriesTab === "analytics"
                  ? "bg-white text-neutral-900 shadow-2xs font-black text-red-600"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <BarChart3 className="w-3 h-3 text-red-600" />
              <span>Analytics & Sponsors</span>
            </button>
          </div>

          {isLeagueOwner && seriesTab !== "analytics" && (
            <Link
              href={`/srleague/${leagueId}/series/new`}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-mono font-bold uppercase rounded-2xl shadow-md shadow-red-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Series</span>
            </Link>
          )}
        </div>

        {seriesTab === "analytics" ? (
          <LeagueAnalyticsDashboard
            leagueId={leagueId}
            leagueName={league?.name || "League"}
            isOwner={isLeagueOwner}
          />
        ) : displayedSeries.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mx-auto text-neutral-300 shadow-xs">
              {seriesTab === "active" ? <Trophy className="w-6 h-6" /> : <Archive className="w-6 h-6" />}
            </div>

            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-black uppercase text-neutral-900">
                {seriesTab === "active" ? "No Active Series" : "No Archived Series"}
              </h3>
              <p className="text-xs text-neutral-500">
                {seriesTab === "active"
                  ? "Launch a championship series program to host competition seasons, calendars, and live standings."
                  : "Completed or retired series will appear here with all historical results preserved."}
              </p>
            </div>

            {seriesTab === "active" && isLeagueOwner && (
              <Link
                href={`/srleague/${leagueId}/series/new`}
                className="inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-md shadow-red-600/20 transition"
              >
                + Create Your First Series
              </Link>
            )}
          </div>
        ) : (
          /* SERIES LIST */
          <div className="space-y-4">
            {displayedSeries.map((s) => {
              const isArchived = s.status === "archived" || s.is_archived;
              const seasons = seasonsMap[s.id] || [];
              const activeSeason = seasons.find((season) => season.id === s.active_season_id) || seasons[0];
              const seasonRounds = allRounds
                .filter((r) => r.season_id === activeSeason?.id || (!r.season_id && activeSeason))
                .sort((a, b) => (a.round_number || 0) - (b.round_number || 0));

              const seasonDrivers = allDrivers.filter(
                (d) => d.season_id === activeSeason?.id || (!d.season_id && activeSeason)
              );

              const carList = Array.from(
                new Set(
                  [
                    activeSeason?.default_car_model,
                    ...seasonRounds.map((r) => r.car_model),
                    s.car_class,
                  ].filter(Boolean)
                )
              ) as string[];
              if (carList.length === 0) carList.push("Toyota GR86 Cup");

              const isFixed = activeSeason?.default_fixed_setup !== false;
              const raceDay = activeSeason?.default_race_day || "Tuesday";
              const raceTime = activeSeason?.default_race_time || "7:00 PM";
              const timezone = activeSeason?.default_timezone || "CST";
              const practiceMins = activeSeason?.default_practice_minutes || 20;
              const qualMins = activeSeason?.default_qualifying_minutes || 15;
              const raceMins = activeSeason?.default_race_length_value || 30;
              const gridCapacity = 40;
              const spotsLeft = Math.max(0, gridCapacity - seasonDrivers.length);

              return (
                <div key={s.id} className="relative group">
                  <Link
                    href={`/srleague/${leagueId}/series/${s.id}`}
                    className={`block p-5 border rounded-3xl space-y-3.5 transition shadow-sm hover:shadow-md hover:border-neutral-400 active:scale-[0.99] ${
                      isArchived
                        ? "bg-neutral-100/80 border-neutral-300"
                        : "bg-neutral-50 hover:bg-neutral-100/70 border-neutral-200"
                    }`}
                  >
                    {/* 1. SERIES HEADER ROW */}
                    {s.banner_url || s.cover_image_url || activeSeason?.banner_url ? (
                      <div className="relative h-28 -mx-5 -mt-5 mb-3 rounded-t-3xl overflow-hidden border-b border-neutral-200">
                        <img
                          src={s.banner_url || s.cover_image_url || activeSeason?.banner_url}
                          alt={s.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-white">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[9px] font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded shadow-xs shrink-0">
                              {s.game?.toUpperCase() || "IRACING"}
                            </span>
                            <h3 className="text-sm font-black uppercase text-white truncate shadow-xs">
                              {s.name}
                            </h3>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0 ${
                              isArchived
                                ? "bg-neutral-800 text-neutral-300 border-neutral-600"
                                : "bg-emerald-500 text-white border-emerald-400"
                            }`}
                          >
                            {s.status || "Active"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-neutral-200">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[9px] font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded-md shadow-xs shrink-0">
                            {s.game?.toUpperCase() || "IRACING"}
                          </span>
                          <h3 className="text-sm font-black uppercase text-neutral-900 truncate group-hover:text-red-600 transition">
                            {s.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                              isArchived
                                ? "bg-neutral-200 text-neutral-700 border-neutral-400"
                                : "bg-emerald-50 text-emerald-700 border-emerald-300"
                            }`}
                          >
                            {s.status || "Active"}
                          </span>
                          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>
                    )}

                    {/* SERIES / SEASON DESCRIPTION SNIPPET */}
                    {(s.description || activeSeason?.description) && (
                      <p className="text-xs text-neutral-600 line-clamp-2 font-sans leading-relaxed">
                        {s.description || activeSeason?.description}
                      </p>
                    )}

                    {/* 2. SPEC DETAILS (ACTIVE SEASON) */}
                    {activeSeason ? (
                      <div className="space-y-3">
                        {/* SCHEDULE & GRID CAPACITY ROW */}
                        <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] text-neutral-600">
                          <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                            <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>{raceDay}s @ {formatRaceTime(raceTime)} {timezone}</span>
                            <span className="text-neutral-400 font-normal">({practiceMins}m P • {qualMins}m Q • {raceMins}m R)</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-700">
                            <Users className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{seasonDrivers.length} / {gridCapacity} Entries</span>
                            <span className="text-emerald-600 text-[10px]">({spotsLeft} open)</span>
                          </div>
                        </div>

                        {/* 🏎️ ELIGIBLE CAR(S) BADGES */}
                        <div className="pt-2 border-t border-neutral-200/60 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-neutral-400 block">
                            Eligible Car{carList.length > 1 ? "s" : ""}:
                          </span>
                          <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] text-neutral-800 font-bold pb-0.5 scrollbar-none">
                            {carList.map((car, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-white rounded-lg border border-neutral-200 shrink-0 flex items-center gap-1.5 shadow-2xs"
                              >
                                <Car className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                <span>{car}</span>
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                  {isFixed ? "Fixed Setup" : "Open"}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 📍 TRACK TOUR / CALENDAR PREVIEW */}
                        {seasonRounds.length > 0 && (
                          <div className="pt-1.5 border-t border-neutral-200/60 space-y-1">
                            <span className="text-[9px] uppercase font-bold text-neutral-400 block">
                              {seasonRounds.length}-Race Track Tour:
                            </span>
                            <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] text-neutral-800 font-bold pb-0.5 scrollbar-none">
                              {seasonRounds.map((r, idx) => (
                                <span
                                  key={r.id}
                                  className="px-2 py-0.5 bg-white rounded-lg border border-neutral-200 shrink-0 flex items-center gap-1 shadow-2xs"
                                >
                                  <span className="text-[9px] text-red-600 font-black">R{r.round_number || idx + 1}</span>
                                  <span>{cleanTrackName(r.track_name)}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-2 text-center text-xs text-neutral-500">
                        ⚪ No seasons configured yet
                      </div>
                    )}

                    {/* 3. PUNCHY BOTTOM ACTION LINK */}
                    <div className="pt-2.5 border-t border-neutral-200 flex items-center justify-between text-xs font-black uppercase text-red-600 group-hover:text-red-700">
                      <span>View {s.name} & Active Season Hub</span>
                      <span className="flex items-center gap-1">
                        <span>Enter</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
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
