"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { doc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  SRLeague,
  SRLeagueSeries,
  SRLeagueSeason,
  SRLeagueRound,
  SRLeagueDriver,
} from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import { useLeaguePermissions } from "@/lib/hooks/useLeaguePermissions";
import RoundResultsModal from "@/components/srleague/RoundResultsModal";
import TrackCarGuideModal from "@/components/srleague/TrackCarGuideModal";
import { getTrackGuide, getCarGuide } from "@/lib/data/iracingGuides";
import {
  Trophy,
  Calendar,
  Users,
  ArrowLeft,
  Settings,
  Car,
  Clock,
  Flag,
  MapPin,
  Shield,
  Key,
  DollarSign,
  Award,
  Sparkles,
  Check,
  AlertCircle,
  Plus,
  Edit2,
  ChevronRight,
  Layers,
  FileText,
  HelpCircle,
  Share2,
  BarChart3,
} from "lucide-react";
import LeagueAnalyticsDashboard from "@/components/srleague/LeagueAnalyticsDashboard";

interface PageProps {
  params: Promise<{ leagueId: string; seriesId: string }>;
}

const POINTS_PRESETS: Record<string, { name: string; points: number[] }> = {
  f1: { name: "FIA Formula 1 Standard", points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] },
  motogp: { name: "MotoGP Top 15", points: [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
  nascar: { name: "NASCAR Cup 40-to-1", points: Array.from({ length: 40 }, (_, i) => 40 - i) },
  indycar: { name: "IndyCar Series Top 25", points: [50, 40, 35, 32, 30, 28, 26, 24, 22, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5] },
};

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

export default function SeriesHubPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";
  const seriesId = unwrappedParams?.seriesId || "";

  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const { user, isLeagueOwner } = useLeaguePermissions(league);
  const [series, setSeries] = useState<SRLeagueSeries | null>(null);
  const [seasons, setSeasons] = useState<SRLeagueSeason[]>([]);
  const [allRounds, setAllRounds] = useState<SRLeagueRound[]>([]);
  const [allDrivers, setAllDrivers] = useState<SRLeagueDriver[]>([]);
  const [loading, setLoading] = useState(true);

  // In-Page Interactive Tab state
  const [activeTab, setActiveTab] = useState<"schedule" | "roster" | "rules" | "standings" | "analytics">("schedule");
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [scoringRound, setScoringRound] = useState<SRLeagueRound | null>(null);
  const [activeTrackGuide, setActiveTrackGuide] = useState<{ trackName: string; layout?: string } | null>(null);
  const [activeCarGuide, setActiveCarGuide] = useState<string | null>(null);

  // 1. Fetch League
  useEffect(() => {
    if (!leagueId) return;
    const unsub = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });
    return () => unsub();
  }, [leagueId]);

  // 2. Fetch Series
  useEffect(() => {
    if (!seriesId) return;
    const unsub = onSnapshot(doc(db, "sr_league_series", seriesId), (snap) => {
      if (snap.exists()) {
        setSeries({ id: snap.id, ...(snap.data() as any) });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [seriesId]);

  // 3. Fetch Seasons for this Series
  useEffect(() => {
    if (!seriesId) return;
    const q = query(
      collection(db, "sr_league_seasons"),
      where("series_id", "==", seriesId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: SRLeagueSeason[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (b.season_number || 0) - (a.season_number || 0));
      setSeasons(list);
    });
    return () => unsub();
  }, [seriesId]);

  // 4. Fetch Rounds for this League
  useEffect(() => {
    if (!leagueId) return;
    const q = query(
      collection(db, "sr_league_rounds"),
      where("league_id", "==", leagueId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: SRLeagueRound[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (a.round_number || 0) - (b.round_number || 0));
      setAllRounds(list);
    });
    return () => unsub();
  }, [leagueId]);

  // 5. Fetch Drivers for this League
  useEffect(() => {
    if (!leagueId) return;
    const q = query(
      collection(db, "sr_league_drivers"),
      where("league_id", "==", leagueId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: SRLeagueDriver[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setAllDrivers(list);
    });
    return () => unsub();
  }, [leagueId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 font-mono text-xs text-neutral-500">
        Loading Championship Series...
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-8">
        <div className="max-w-md mx-auto text-center space-y-4 py-16">
          <Trophy className="w-12 h-12 text-neutral-300 mx-auto" />
          <h2 className="text-xl font-black uppercase text-neutral-900">Series Not Found</h2>
          <Link
            href={`/srleague/${leagueId}`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 text-white text-xs font-mono font-bold uppercase rounded-2xl shadow-xs"
          >
            ← Back to League Hub
          </Link>
        </div>
      </div>
    );
  }

  // Active season is either the one marked active_season_id, or the newest one
  const activeSeason = (selectedSeasonId ? seasons.find((s) => s.id === selectedSeasonId) : null) || seasons.find((s) => s.id === series.active_season_id) || seasons[0];
  const otherSeasons = seasons.filter((s) => s.id !== activeSeason?.id);

  // Active Season Metrics
  const activeSeasonRounds = allRounds
    .filter((r) => r.season_id === activeSeason?.id || (!r.season_id && activeSeason))
    .sort((a, b) => (a.round_number || 0) - (b.round_number || 0));

  const activeSeasonDrivers = allDrivers.filter(
    (d) => d.season_id === activeSeason?.id || (!d.season_id && activeSeason)
  );

  const isSeasonCompleted =
    activeSeasonRounds.length > 0 &&
    activeSeasonRounds.every((r) => r.status === "completed");

  const nextRound = activeSeasonRounds.find((r) => r.status === "scheduled" || !r.status);

  const rankedDrivers = activeSeasonDrivers
    .slice()
    .sort((a, b) => (b.points_total || 0) - (a.points_total || 0));

  const hasSeasonPoints = activeSeasonDrivers.some((d) => (d.points_total || 0) > 0);
  const championshipLeader = hasSeasonPoints ? rankedDrivers[0] : null;
  const seasonChampion = isSeasonCompleted && rankedDrivers.length > 0 ? rankedDrivers[0] : null;
  const runnerUp = isSeasonCompleted && rankedDrivers.length > 1 ? rankedDrivers[1] : null;
  const thirdPlace = isSeasonCompleted && rankedDrivers.length > 2 ? rankedDrivers[2] : null;

  const carList = Array.from(
    new Set(
      [
        activeSeason?.default_car_model,
        ...activeSeasonRounds.map((r) => r.car_model),
        series.car_class,
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
  const spotsLeft = Math.max(0, gridCapacity - activeSeasonDrivers.length);
  
  const myDriverRecord = activeSeasonDrivers.find(
    (d) =>
      (user?.uid && d.user_id === user.uid) ||
      (user?.email && d.driver_email?.toLowerCase() === user.email.toLowerCase()) ||
      (user?.displayName && d.driver_name?.toLowerCase() === user.displayName.toLowerCase())
  );
  const isRegisteredInSeason = Boolean(myDriverRecord);

  // Points system lookup
  const currentPointsGrid = activeSeason?.points_allocation_system?.finish_positions || POINTS_PRESETS.f1.points;
  const presetName = activeSeason?.points_allocation_system?.preset
    ? POINTS_PRESETS[activeSeason.points_allocation_system.preset]?.name || "Custom Curve"
    : "FIA Formula 1 Standard";

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6 font-mono text-xs">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & TOP NAVIGATION
         ───────────────────────────────────────────────────────────── */}
      <header className="max-w-2xl w-full mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 truncate">
            <Link
              href={`/srleague/${leagueId}`}
              className="hover:text-neutral-900 transition font-bold truncate"
            >
              ← {league?.name || "League Hub"}
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-black truncate">{series.name}</span>
          </div>

          {isLeagueOwner && (
            <div className="flex items-center gap-2">
              <Link
                href={`/srleague/${leagueId}/series/${seriesId}/edit`}
                className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded-xl text-neutral-800 transition flex items-center gap-1.5 text-[11px] font-bold shadow-2xs shrink-0"
              >
                <Settings className="w-3.5 h-3.5 text-red-600" />
                <span>Series Settings</span>
              </Link>
            </div>
          )}
        </div>

        {/* SERIES BANNER / COVER HERO */}
        {series.banner_url || series.cover_image_url || activeSeason?.banner_url ? (
          <div className="relative rounded-3xl overflow-hidden border border-neutral-800 shadow-md">
            <div className="relative h-44 sm:h-56 w-full">
              <img
                src={activeSeason?.banner_url || series.banner_url || series.cover_image_url}
                alt={series.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-3 flex-wrap text-white">
              <div className="space-y-1 max-w-md">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                    {series.game?.toUpperCase() || "IRACING"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                    Recruiting
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
                  {series.name}
                </h1>
                <p className="text-xs text-neutral-300 font-sans">
                  Hosted by <strong className="text-white">{league?.name}</strong> • {seasons.length} Season(s) Recorded
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(window.location.href);
                      showToast({
                        title: "🔗 Invite Link Copied!",
                        message: "Direct link to this championship series copied to clipboard.",
                        icon: "📋",
                      });
                    }
                  }}
                  className="px-3 py-2 bg-white/90 hover:bg-white text-neutral-900 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 shadow-md cursor-pointer transition backdrop-blur-xs"
                  title="Copy shareable series link for drivers"
                >
                  <Share2 className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Share / Invite</span>
                </button>

                {isLeagueOwner && (
                  <Link
                    href={`/srleague/${leagueId}/series/${seriesId}/edit`}
                    className="px-3 py-2 bg-neutral-900/80 hover:bg-neutral-900 text-white border border-white/20 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 shadow-md backdrop-blur-xs"
                  >
                    <Settings className="w-3.5 h-3.5 text-red-500" />
                    <span>Edit Series</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                    {series.game?.toUpperCase() || "IRACING"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[9px] uppercase tracking-wider">
                    Recruiting
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900 leading-tight">
                  {series.name}
                </h1>
                <p className="text-xs text-neutral-500 font-sans">
                  Hosted by <strong className="text-neutral-900">{league?.name}</strong> • {seasons.length} Season(s) Recorded
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("analytics");
                    const el = document.getElementById("tab-content-container");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 shadow-2xs cursor-pointer transition ${
                    activeTab === "analytics"
                      ? "bg-red-600 text-white"
                      : "bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800"
                  }`}
                  title="View Traffic & Sponsor Analytics"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-red-500" />
                  <span>Analytics</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(window.location.href);
                      showToast({
                        title: "🔗 Invite Link Copied!",
                        message: "Direct link to this championship series copied to clipboard.",
                        icon: "📋",
                      });
                    }
                  }}
                  className="px-3 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
                  title="Copy shareable series link for drivers"
                >
                  <Share2 className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Share / Invite</span>
                </button>

                {isLeagueOwner && (
                  <Link
                    href={`/srleague/${leagueId}/series/${seriesId}/edit`}
                    className="px-3 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 shadow-xs"
                  >
                    <Settings className="w-3.5 h-3.5 text-red-500" />
                    <span>Edit Series</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 📖 SERIES / SEASON DESCRIPTION CARD */}
        {(series.description || activeSeason?.description) && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-1 font-sans text-xs shadow-2xs">
            <span className="text-[10px] font-mono uppercase font-black text-neutral-400 block tracking-wider">
              {activeSeason?.description ? `${activeSeason.name} Overview` : "Series Overview & Guidelines"}
            </span>
            <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
              {activeSeason?.description || series.description}
            </p>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. PROMINENT ACTIVE SEASON SHOWCASE & SUMMARY
         ───────────────────────────────────────────────────────────── */}
      <main className="max-w-2xl w-full mx-auto space-y-5 font-mono">
        {activeSeason ? (
          <div className="space-y-4">
            {/* 🏆 MULTI-SEASON SELECTOR TABS */}
            {seasons.length > 1 && (
              <div className="flex items-center justify-between gap-2 p-1.5 bg-neutral-100 border border-neutral-200 rounded-2xl flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {seasons.map((s) => {
                    const isSelected = activeSeason.id === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSeasonId(s.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-neutral-900 text-white shadow-xs"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                        }`}
                      >
                        <Trophy className={`w-3.5 h-3.5 ${isSelected ? "text-amber-400" : "text-neutral-400"}`} />
                        <span>{s.name || `Season ${s.season_number}`}</span>
                        {s.id === series.active_season_id && (
                          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-600 rounded text-[8px] font-bold">Active</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {isLeagueOwner && (
                  <Link
                    href={`/srleague/${leagueId}/series/${seriesId}/seasons/new?fromSeasonId=${activeSeason.id}`}
                    className="px-2.5 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-xl text-[10px] font-bold uppercase transition flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3 h-3 text-red-600" />
                    <span>New Season</span>
                  </Link>
                )}
              </div>
            )}

            {/* SUMMARY CARD */}
            <div className="p-5 bg-white border-2 border-neutral-900 rounded-3xl space-y-4 shadow-md">
              {/* ACTIVE SEASON HEADER */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black uppercase text-neutral-900 leading-tight">
                      {activeSeason.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                      Active Championship
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 font-sans">
                    {activeSeasonRounds.length} Rounds • {activeSeasonDrivers.length} Entries Confirmed • {spotsLeft} Spots Open
                  </span>
                </div>

                {isLeagueOwner && (
                  <Link
                    href={`/srleague/${leagueId}/series/${seriesId}/seasons/${activeSeason.id}/edit`}
                    className="p-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-700 font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                  >
                    <Settings className="w-3.5 h-3.5 text-red-600" />
                    <span>Season Settings</span>
                  </Link>
                )}
              </div>

              {/* 🏆 HERO BANNER: CHAMPIONSHIP CROWNING (IF SEASON COMPLETE) OR NEXT RACE SPOTLIGHT */}
              {isSeasonCompleted && seasonChampion ? (
                <div className="p-5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950 border border-amber-500/40 text-white rounded-3xl space-y-3.5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex items-center justify-between gap-2 flex-wrap relative z-10">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[9px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Season {activeSeason?.season_number || 1} Championship Concluded</span>
                    </span>
                    <span className="text-[10px] text-amber-200/70 font-sans font-bold">
                      {activeSeasonRounds.length} of {activeSeasonRounds.length} Rounds Completed
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3 relative z-10 flex-wrap">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                        Official Championship Winner:
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black uppercase text-white leading-tight flex items-center gap-2">
                        <span className="text-amber-400">👑</span>
                        <span>#{seasonChampion.car_number || "00"} {seasonChampion.driver_name}</span>
                      </h3>
                      <p className="text-xs text-amber-200/90 font-sans">
                        {seasonChampion.points_total || 0} Total Championship Points • {seasonChampion.wins_count || 0} Wins • {seasonChampion.team_name || "Independent"}
                      </p>
                    </div>

                    {isLeagueOwner && (
                      <Link
                        href={`/srleague/${leagueId}/series/${seriesId}/seasons/new?fromSeasonId=${activeSeason?.id}`}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-98 text-neutral-950 rounded-2xl font-black text-xs uppercase transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>Launch Season {(activeSeason?.season_number || 1) + 1}</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>

                  {/* PODIUM SUMMARY PILLS */}
                  <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] relative z-10">
                    <div className="p-2.5 bg-white/10 rounded-xl border border-amber-500/30 flex items-center gap-2">
                      <span className="text-base">🥇</span>
                      <div className="truncate">
                        <strong className="text-white block truncate">#{seasonChampion.car_number || "00"} {seasonChampion.driver_name}</strong>
                        <span className="text-amber-300 font-bold">{seasonChampion.points_total || 0} pts • Champion</span>
                      </div>
                    </div>

                    {runnerUp && (
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                        <span className="text-base">🥈</span>
                        <div className="truncate">
                          <strong className="text-neutral-200 block truncate">#{runnerUp.car_number || "00"} {runnerUp.driver_name}</strong>
                          <span className="text-neutral-400 font-bold">{runnerUp.points_total || 0} pts • Runner-Up</span>
                        </div>
                      </div>
                    )}

                    {thirdPlace && (
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                        <span className="text-base">🥉</span>
                        <div className="truncate">
                          <strong className="text-neutral-200 block truncate">#{thirdPlace.car_number || "00"} {thirdPlace.driver_name}</strong>
                          <span className="text-neutral-400 font-bold">{thirdPlace.points_total || 0} pts • 3rd Place</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : nextRound ? (
                <div className="p-4 bg-neutral-900 text-white rounded-2xl space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5 text-red-500" />
                      <span>Next Race • Round {nextRound.round_number || 1}</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 font-sans font-medium">
                      {nextRound.scheduled_date || "Upcoming"} @ {nextRound.server_start_time || `${raceTime} ${timezone}`}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black uppercase text-white leading-tight">
                        {nextRound.title || nextRound.track_name}
                      </h3>
                      <span className="text-[11px] text-neutral-300 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                        <span>{nextRound.track_name} ({nextRound.track_layout || "Grand Prix"})</span>
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px] block">
                        {nextRound.car_model || carList[0]}
                      </span>
                      <span className="text-[9px] text-neutral-400 uppercase mt-0.5 block">
                        {nextRound.fixed_setup !== false ? "Fixed Setup" : "Open"}
                      </span>
                    </div>
                  </div>

                  {/* QUICK PASSWORD BADGE FOR REGISTERED DRIVERS */}
                  {nextRound.server_password && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 text-neutral-300">
                        <Key className="w-3 h-3 text-amber-400" />
                        <span>Lobby Password:</span>
                      </div>

                      {isLeagueOwner || isRegisteredInSeason ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-300 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                            {revealedPasswords[nextRound.id] ? nextRound.server_password : "••••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRevealedPasswords((prev) => ({ ...prev, [nextRound.id]: !prev[nextRound.id] }))}
                            className="text-neutral-400 hover:text-white font-bold uppercase text-[9px] cursor-pointer"
                          >
                            {revealedPasswords[nextRound.id] ? "Hide" : "Reveal"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(nextRound.server_password || "");
                              showToast({ title: "🔑 Password Copied", message: "Next race password copied to clipboard.", icon: "📋" });
                            }}
                            className="text-red-400 hover:text-red-300 font-bold uppercase text-[9px] cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-[9px]">🔒 Register to View Password</span>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* 📊 3-COLUMN QUICK METRICS SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px]">
                {/* COL 1: POINTS LEADER */}
                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                  <span className="text-neutral-400 uppercase font-bold text-[9px] flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-500" />
                    <span>Championship Leader</span>
                  </span>
                  {championshipLeader ? (
                    <div>
                      <strong className="text-xs font-black text-neutral-900 block truncate">
                        🥇 #{championshipLeader.car_number || championshipLeader.preferred_car_number || "00"} {championshipLeader.driver_name}
                      </strong>
                      <span className="text-[10px] text-neutral-500 font-sans">
                        {championshipLeader.points_total || 0} pts • {championshipLeader.team_name || "Independent"}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <strong className="text-xs font-black text-neutral-800 block">
                        Pending Round 1
                      </strong>
                      <span className="text-[10px] text-neutral-400 font-sans block">
                        Standings open after R1
                      </span>
                    </div>
                  )}
                </div>

                {/* COL 2: GRID OCCUPANCY */}
                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                  <span className="text-neutral-400 uppercase font-bold text-[9px] flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-500" />
                    <span>Registered Grid</span>
                  </span>
                  <div>
                    <strong className="text-xs font-black text-neutral-900 block">
                      {activeSeasonDrivers.length} / {gridCapacity} Confirmed
                    </strong>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      🟢 {spotsLeft} Grid Spots Available
                    </span>
                  </div>
                </div>

                {/* COL 3: RACE FORMAT & TIME */}
                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                  <span className="text-neutral-400 uppercase font-bold text-[9px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>Weekly Timeslot</span>
                  </span>
                  <div>
                    <strong className="text-xs font-black text-neutral-900 block truncate">
                      {raceDay}s @ {formatRaceTime(raceTime)}
                    </strong>
                    <span className="text-[10px] text-neutral-500">
                      {practiceMins}m P • {qualMins}m Q • {raceMins}m R
                    </span>
                  </div>
                </div>
              </div>

              {/* 🏎️ ELIGIBLE CARS & TRACK TOUR ROW */}
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Cars:</span>
                    {carList.map((car, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white rounded-md border border-neutral-200 text-[10px] font-bold text-neutral-800 flex items-center gap-1 shadow-2xs"
                      >
                        <Car className="w-3 h-3 text-red-600" />
                        <span>{car}</span>
                        <span className="text-[8px] text-emerald-700 bg-emerald-50 px-1 rounded">{isFixed ? "Fixed" : "Open"}</span>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Tracks ({activeSeasonRounds.length}):</span>
                    {activeSeasonRounds.map((r, idx) => (
                      <span
                        key={r.id}
                        className="px-1.5 py-0.5 bg-white rounded-md border border-neutral-200 text-[9px] font-bold text-neutral-700 shadow-2xs"
                      >
                        <span className="text-red-600 font-black mr-0.5">R{r.round_number || idx + 1}</span>
                        <span>{cleanTrackName(r.track_name)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* PRIMARY REGISTRATION OR REGISTERED DRIVER BOX */}
              {isRegisteredInSeason ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 flex-wrap shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      #{myDriverRecord?.car_number || myDriverRecord?.preferred_car_number || "00"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black uppercase text-emerald-950">
                          You Are Registered on the Grid
                        </span>
                        <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-800 text-[9px] font-bold rounded uppercase">
                          Active Driver
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-800 font-sans block">
                        Car #{myDriverRecord?.car_number || myDriverRecord?.preferred_car_number || "00"} • {myDriverRecord?.driver_name || user?.displayName || "Driver"} ({myDriverRecord?.team_name || "Independent"})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/srleague/${leagueId}/roster/${myDriverRecord?.id}/edit`}
                      className="px-3 py-2 bg-white hover:bg-neutral-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
                      title="Edit Driver Number / Team"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Edit Driver Entry</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/srleague/${leagueId}/join?seriesId=${seriesId}&seasonId=${activeSeason.id}`}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>+ Claim Grid Spot & Enter {activeSeason.name}</span>
                </Link>
              )}
            </div>

            {/* ─────────────────────────────────────────────────────────────
                3. ALL-IN-ONE INTERACTIVE WORKSPACE TABS
               ───────────────────────────────────────────────────────────── */}
            <div className="space-y-4 pt-2">
              {/* TAB BAR CONTROLS */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-neutral-100 p-1.5 rounded-2xl text-[11px] font-bold text-neutral-600 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveTab("schedule")}
                  className={`py-2.5 px-2 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    activeTab === "schedule" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-red-600" />
                  <span className="truncate">Schedule ({activeSeasonRounds.length})</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab("roster")}
                  className={`py-2.5 px-2 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    activeTab === "roster" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate">Entries ({activeSeasonDrivers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("standings")}
                  className={`py-2.5 px-2 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    activeTab === "standings" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span className="truncate">Standings</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("rules")}
                  className={`py-2.5 px-2 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    activeTab === "rules" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-neutral-700" />
                  <span className="truncate">Rulebook</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("analytics")}
                  className={`py-2.5 px-2 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    activeTab === "analytics" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-red-600" />
                  <span className="truncate">Analytics</span>
                </button>
              </div>

              {/* ── TAB 1: SCHEDULE & ROUND CALENDAR ── */}
              {activeTab === "schedule" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider">
                      {activeSeasonRounds.length}-Round Championship Calendar
                    </h3>
                    {isLeagueOwner && (
                      <Link
                        href={`/srleague/${leagueId}/schedule/new?seriesId=${seriesId}&seasonId=${activeSeason?.id}`}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Schedule Round</span>
                      </Link>
                    )}
                  </div>

                  {activeSeasonRounds.length === 0 ? (
                    <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-3xl text-center space-y-2">
                      <Calendar className="w-8 h-8 text-neutral-300 mx-auto" />
                      <strong className="text-neutral-800 block text-xs uppercase">No Rounds Scheduled</strong>
                      <p className="text-neutral-500 text-[11px]">The organizer has not scheduled rounds for this season yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeSeasonRounds.map((r) => (
                        <div
                          key={r.id}
                          className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3 shadow-2xs hover:border-neutral-300 transition"
                        >
                          <div className="flex items-center justify-between gap-3 pb-2 border-b border-neutral-200">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-white border border-neutral-200 flex items-center justify-center font-black text-red-600 text-xs shrink-0 shadow-2xs">
                                R{r.round_number}
                              </div>
                              <div className="min-w-0">
                                <strong className="text-xs font-black uppercase text-neutral-900 block truncate">
                                  {r.title}
                                </strong>
                                <span className="text-[10px] text-neutral-500 flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                                  <span>{r.track_name} ({r.track_layout})</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                r.status === "completed"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}>
                                {r.status === "completed" ? "🏁 Completed" : r.status || "Scheduled"}
                              </span>
                              {isLeagueOwner && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setScoringRound(r)}
                                    className={`px-2.5 py-1 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer ${
                                      r.status === "completed"
                                        ? "bg-neutral-900 hover:bg-black"
                                        : "bg-red-600 hover:bg-red-700"
                                    }`}
                                    title={r.status === "completed" ? "View / Manage Round Results" : "Score / Import iRacing Results"}
                                  >
                                    <Trophy className="w-3 h-3 text-amber-400" />
                                    <span>{r.status === "completed" ? "Results" : "Score"}</span>
                                  </button>
                                  <Link
                                    href={`/srleague/${leagueId}/schedule/${r.id}/edit`}
                                    className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-800 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                                  >
                                    <Edit2 className="w-3 h-3 text-neutral-500" />
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                            <div className="p-2 bg-white rounded-xl border border-neutral-200">
                              <span className="text-neutral-400 block text-[9px] font-bold uppercase">Date & Launch</span>
                              <strong className="text-neutral-900 block truncate">{r.scheduled_date}</strong>
                              <span className="text-neutral-600 font-bold">{r.server_start_time || "7:00 PM CST"}</span>
                            </div>

                            <div className="p-2 bg-white rounded-xl border border-neutral-200">
                              <span className="text-neutral-400 block text-[9px] font-bold uppercase">Car & Setup</span>
                              <strong className="text-neutral-900 block truncate">{r.car_model || "Toyota GR86"}</strong>
                              <span className="text-emerald-700 font-bold">{r.fixed_setup !== false ? "Fixed" : "Open"}</span>
                            </div>

                            <div className="p-2 bg-white rounded-xl border border-neutral-200">
                              <span className="text-neutral-400 block text-[9px] font-bold uppercase">Format</span>
                              <strong className="text-neutral-900 block">{r.practice_minutes || 20}m P • {r.qualifying_minutes || 15}m Q</strong>
                              <span className="text-red-700 font-bold">{r.race_length_value || 30} {r.race_length_type || "mins"}</span>
                            </div>

                            <div className="p-2 bg-white rounded-xl border border-neutral-200">
                              <span className="text-neutral-400 block text-[9px] font-bold uppercase">Server Region</span>
                              <strong className="text-neutral-900 block truncate">{r.server_region || "US-East-OH"}</strong>
                              <span className="text-neutral-600 font-bold">DQ: {r.incident_limit_dq || 17}x</span>
                            </div>
                          </div>

                          {/* 🔑 SERVER PASSWORD BADGE */}
                          {r.server_password && (
                            <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-neutral-200 text-[10px]">
                              <div className="flex items-center gap-1.5 font-bold text-neutral-700">
                                <Key className="w-3 h-3 text-amber-600" />
                                <span>Session Password:</span>
                              </div>

                              {isLeagueOwner || isRegisteredInSeason ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
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
                                  href={`/srleague/${leagueId}/join?seriesId=${seriesId}&seasonId=${activeSeason.id}`}
                                  className="text-red-600 font-bold hover:underline flex items-center gap-1 text-[10px]"
                                >
                                  <span>🔒 Register to View Password</span>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2: ENTRIES & DRIVER GRID ── */}
              {activeTab === "roster" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider">
                      Confirmed Entry List ({activeSeasonDrivers.length} / {gridCapacity} Spots)
                    </h3>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      🟢 {spotsLeft} Spots Open
                    </span>
                  </div>

                  {activeSeasonDrivers.length === 0 ? (
                    <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-3xl text-center space-y-2">
                      <Users className="w-8 h-8 text-neutral-300 mx-auto" />
                      <strong className="text-neutral-800 block text-xs uppercase">No Entries Submitted Yet</strong>
                      <p className="text-neutral-500 text-[11px]">Be the first driver to submit an entry for this season!</p>
                    </div>
                  ) : (
                    <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-100 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-600">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Driver</th>
                            <th className="py-2.5 px-3">Team</th>
                            <th className="py-2.5 px-3">iRacing ID</th>
                            <th className="py-2.5 px-3 text-right">Pts</th>
                            {isLeagueOwner && <th className="py-2.5 px-3 text-right">Action</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white font-mono">
                          {activeSeasonDrivers.map((d) => (
                            <tr key={d.id} className="hover:bg-neutral-50/80 transition">
                              <td className="py-3 px-3">
                                <span className="font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs shadow-2xs">
                                  #{d.car_number || "00"}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-bold text-neutral-900">
                                {d.driver_name}
                              </td>
                              <td className="py-3 px-3 text-neutral-500">
                                {d.team_name || "—"}
                              </td>
                              <td className="py-3 px-3 text-neutral-400 font-mono text-[11px]">
                                {d.iracing_cust_id ? `#${d.iracing_cust_id}` : "—"}
                              </td>
                              <td className="py-3 px-3 text-right font-black text-neutral-900">
                                {d.points_total || 0}
                              </td>
                              {isLeagueOwner && (
                                <td className="py-3 px-3 text-right">
                                  <Link
                                    href={`/srleague/${leagueId}/roster/${d.id}/edit`}
                                    className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-900 inline-block"
                                    title="Edit Driver"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Link>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 3: STANDINGS & LEADERBOARD ── */}
              {activeTab === "standings" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider">
                      Championship Leaderboard
                    </h3>
                    <span className="text-[10px] text-neutral-500">
                      Points System: {presetName}
                    </span>
                  </div>

                  {activeSeasonDrivers.length === 0 ? (
                    <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-3xl text-center space-y-2">
                      <Trophy className="w-8 h-8 text-neutral-300 mx-auto" />
                      <strong className="text-neutral-800 block text-xs uppercase">No Results Recorded Yet</strong>
                      <p className="text-neutral-500 text-[11px]">Points will update dynamically as rounds are completed.</p>
                    </div>
                  ) : (
                    <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-100 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-600">
                          <tr>
                            <th className="py-2.5 px-3">Pos</th>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Driver</th>
                            <th className="py-2.5 px-3">Team</th>
                            <th className="py-2.5 px-3 text-right">Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white font-mono">
                          {[...activeSeasonDrivers]
                            .sort((a, b) => (b.points_total || 0) - (a.points_total || 0))
                            .map((d, index) => (
                              <tr key={d.id} className="hover:bg-neutral-50/80 transition">
                                <td className="py-3 px-3 font-black text-neutral-900">
                                  {index === 0 ? "🥇 P1" : index === 1 ? "🥈 P2" : index === 2 ? "🥉 P3" : `P${index + 1}`}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded text-[11px]">
                                    #{d.car_number || "00"}
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-bold text-neutral-900">
                                  {d.driver_name}
                                </td>
                                <td className="py-3 px-3 text-neutral-500">
                                  {d.team_name || "—"}
                                </td>
                                <td className="py-3 px-3 text-right font-black text-red-600 text-sm">
                                  {d.points_total || 0}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 4: RULEBOOK & SCORING ── */}
              {activeTab === "rules" && (
                <div className="space-y-4">
                  {/* REGULATIONS OVERVIEW */}
                  <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3 shadow-2xs">
                    <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-red-600" />
                      <span>Championship Sporting Regulations</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div className="p-3 bg-white rounded-xl border border-neutral-200">
                        <span className="text-neutral-400 block uppercase font-bold text-[9px]">Incident DQ</span>
                        <strong className="text-neutral-900 block text-xs">{activeSeason.default_incident_limit_dq || 17}x DQ</strong>
                        <span className="text-neutral-500">Strict Track Limits</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-neutral-200">
                        <span className="text-neutral-400 block uppercase font-bold text-[9px]">Fast Repairs</span>
                        <strong className="text-neutral-900 block text-xs">{activeSeason.default_fast_repairs || 1} Reset</strong>
                        <span className="text-emerald-600 font-bold">Quick Tow Ready</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-neutral-200">
                        <span className="text-neutral-400 block uppercase font-bold text-[9px]">Drop Weeks</span>
                        <strong className="text-neutral-900 block text-xs">{activeSeason.drop_weeks || 0} Drops</strong>
                        <span className="text-neutral-500">Worst rounds discarded</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-neutral-200">
                        <span className="text-neutral-400 block uppercase font-bold text-[9px]">Server Region</span>
                        <strong className="text-neutral-900 block text-xs truncate">{activeSeason.default_server_region || "US-East-OH"}</strong>
                        <span className="text-neutral-500">Dedicated Sim Node</span>
                      </div>
                    </div>
                  </div>

                  {/* POINTS SCORING CURVE */}
                  <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Points Scoring Allocation ({presetName})</span>
                      </h3>
                      <span className="text-[10px] text-neutral-400 font-mono">Fastest Lap: +1 pt</span>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-center text-[10px]">
                      {currentPointsGrid.slice(0, 10).map((pts, idx) => (
                        <div key={idx} className="p-2 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                          <span className="text-neutral-400 block text-[9px] font-bold">P{idx + 1}</span>
                          <strong className="text-red-600 font-black text-xs">{pts}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 5: SERIES ANALYTICS & SPONSORS ── */}
              {activeTab === "analytics" && (
                <LeagueAnalyticsDashboard
                  leagueId={leagueId}
                  seriesId={seriesId}
                  leagueName={league?.name || "League"}
                  seriesName={series?.name}
                  isOwner={isLeagueOwner}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-3xl text-center space-y-3">
            <Calendar className="w-8 h-8 text-neutral-300 mx-auto" />
            <h3 className="text-sm font-black uppercase text-neutral-800">No Active Season Configured</h3>
            <p className="text-xs text-neutral-500">Create Season 1 to configure race times, car models, and schedules.</p>
            {isLeagueOwner && (
              <Link
                href={`/srleague/${leagueId}/series/${seriesId}/seasons/new`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold uppercase"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Season 1</span>
              </Link>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            4. OTHER SEASONS (ARCHIVE / HISTORY)
           ───────────────────────────────────────────────────────────── */}
        {otherSeasons.length > 0 && (
          <div className="space-y-3 pt-6 border-t border-neutral-200">
            <h3 className="text-xs font-black uppercase text-neutral-600 tracking-wider">
              Other Seasons ({otherSeasons.length})
            </h3>
            <div className="space-y-2">
              {otherSeasons.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSeasonId(s.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full text-left p-3.5 bg-neutral-50 hover:bg-neutral-100 active:scale-99 border border-neutral-200 rounded-2xl flex items-center justify-between transition shadow-2xs cursor-pointer"
                >
                  <div>
                    <strong className="text-xs font-black uppercase text-neutral-900 block">{s.name}</strong>
                    <span className="text-[10px] text-neutral-500">Season #{s.season_number} • {s.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                    <span>View Season →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </main>

      
      {/* 🏆 ROUND RESULTS INTAKE MODAL */}
      {scoringRound && (
        <RoundResultsModal
          isOpen={!!scoringRound}
          onClose={() => setScoringRound(null)}
          round={scoringRound}
          season={activeSeason}
          drivers={activeSeasonDrivers}
          leagueId={leagueId}
        />
      )}
\n      {/* FOOTER */}
      <footer className="max-w-2xl w-full mx-auto text-center py-4 text-[11px] text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}
