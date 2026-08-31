"use client";

import React, { Suspense, useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, setDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueSeries, SRLeagueSeason, SRLeagueRound } from "@/lib/types/league";
import { IRACING_OFFICIAL_TRACKS, IRACING_OFFICIAL_CARS } from "@/lib/data/iracingTracksAndCars";
import { useToast } from "@/components/ToastContext";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  AlertCircle,
  Plus,
  Zap,
  Clock,
  Flag,
  MapPin,
  Car,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Settings,
  Sparkles,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

// Helper to compute next Tuesday or next consecutive week
function getNextTuesdayDate(weekOffset: number = 0) {
  const d = new Date();
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, 2 is Tuesday
  let diff = (2 - day + 7) % 7;
  if (diff === 0 && weekOffset === 0) diff = 7; // if today is Tuesday, next week Tuesday
  d.setDate(d.getDate() + diff + (weekOffset * 7));
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const dateStr = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${dateStr}`;
}

function ScheduleNewRoundPageInnerContent({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSeriesId = searchParams.get("seriesId") || "";
  const initialSeasonId = searchParams.get("seasonId") || "";

  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const [seriesList, setSeriesList] = useState<SRLeagueSeries[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(initialSeriesId);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(initialSeasonId);
  const [activeSeason, setActiveSeason] = useState<SRLeagueSeason | null>(null);
  const [existingRoundsCount, setExistingRoundsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Accordion state for customizing server settings
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // 1. Race Information & League Session
  const [title, setTitle] = useState("");
  const [isLeagueSession, setIsLeagueSession] = useState(true);
  const [serverRegion, setServerRegion] = useState("US-East-OH");
  const [serverPassword, setServerPassword] = useState("");
  const [adminName, setAdminName] = useState("PJ Losey");

  // Modern Date & Time Picker State (Default: 7:00 PM CST Tuesdays)
  const [scheduledDate, setScheduledDate] = useState(getNextTuesdayDate(0));
  const [serverStartTime, setServerStartTime] = useState("19:00");
  const [serverTimezone, setServerTimezone] = useState("CST");

  // ─────────────────────────────────────────────────────────────────
  // 2. SEARCHABLE TRACK COMBOBOX STATE
  // ─────────────────────────────────────────────────────────────────
  const [trackSearch, setTrackSearch] = useState("Lime Rock Park");
  const [selectedTrackKey, setSelectedTrackKey] = useState("limerock");
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);
  const [trackCategoryFilter, setTrackCategoryFilter] = useState<"All" | "Free" | "Road" | "Oval" | "Dirt">("All");
  const [customTrackName, setCustomTrackName] = useState("");
  const [selectedLayout, setSelectedLayout] = useState("Grand Prix");
  const [customLayoutName, setCustomLayoutName] = useState("");

  const trackDropdownRef = useRef<HTMLDivElement>(null);

  // Alphabetically sorted tracks
  const sortedTracks = useMemo(() => {
    return [...IRACING_OFFICIAL_TRACKS].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filtered tracks matching search query or aliases
  const filteredTracks = useMemo(() => {
    const q = trackSearch.toLowerCase().trim();
    return sortedTracks.filter((t) => {
      let matchesCategory = true;
      if (trackCategoryFilter === "Free") {
        matchesCategory = t.is_free_base === true;
      } else if (trackCategoryFilter !== "All") {
        matchesCategory = t.category === trackCategoryFilter;
      }

      if (!matchesCategory) return false;
      if (!q) return true;

      const nameMatch = t.name.toLowerCase().includes(q);
      const idMatch = t.id.toLowerCase().includes(q);
      
      let aliasMatch = false;
      if (q.includes("st louis") || q.includes("gateway") || q.includes("wwt")) {
        aliasMatch = t.name.toLowerCase().includes("gateway") || t.name.toLowerCase().includes("technology");
      } else if (q.includes("bathurst") || q.includes("mount panorama")) {
        aliasMatch = t.name.toLowerCase().includes("panorama") || t.name.toLowerCase().includes("bathurst");
      } else if (q.includes("mosport")) {
        aliasMatch = t.name.toLowerCase().includes("canadian tire") || t.name.toLowerCase().includes("mosport");
      } else if (q.includes("nurburg") || q.includes("nordschleife") || q.includes("green hell")) {
        aliasMatch = t.name.toLowerCase().includes("nürburgring") || t.name.toLowerCase().includes("nordschleife");
      } else if (q.includes("portimao") || q.includes("algarve")) {
        aliasMatch = t.name.toLowerCase().includes("algarve") || t.name.toLowerCase().includes("portimão");
      }

      return nameMatch || idMatch || aliasMatch;
    });
  }, [sortedTracks, trackCategoryFilter, trackSearch]);

  // ─────────────────────────────────────────────────────────────────
  // 3. SEARCHABLE CAR COMBOBOX STATE
  // ─────────────────────────────────────────────────────────────────
  const [carSearch, setCarSearch] = useState("Toyota GR86 Cup");
  const [selectedCar, setSelectedCar] = useState("Toyota GR86 Cup");
  const [isCarDropdownOpen, setIsCarDropdownOpen] = useState(false);
  const [customCarName, setCustomCarName] = useState("");
  const [fixedSetup, setFixedSetup] = useState(true);

  const carDropdownRef = useRef<HTMLDivElement>(null);

  const sortedCars = useMemo(() => {
    return [...IRACING_OFFICIAL_CARS].sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredCars = useMemo(() => {
    const q = carSearch.toLowerCase().trim();
    if (!q) return sortedCars;
    return sortedCars.filter((c) => {
      const nameMatch = c.toLowerCase().includes(q);
      let aliasMatch = false;
      if (q.includes("miata")) aliasMatch = c.toLowerCase().includes("mazda mx-5");
      else if (q.includes("gr86") || q.includes("86")) aliasMatch = c.toLowerCase().includes("gr86");
      else if (q.includes("cup car")) aliasMatch = c.toLowerCase().includes("cup");
      return nameMatch || aliasMatch;
    });
  }, [sortedCars, carSearch]);

  // 4. Time Limits & Durations
  const [practiceMins, setPracticeMins] = useState(20);
  const [qualifyingMins, setQualifyingMins] = useState(15);
  const [raceLengthType, setRaceLengthType] = useState<"minutes" | "laps">("minutes");
  const [raceLengthValue, setRaceLengthValue] = useState(30);
  const [startType, setStartType] = useState<"rolling" | "standing">("standing");
  const [fastRepairs, setFastRepairs] = useState(1);
  const [incidentLimitDq, setIncidentLimitDq] = useState(17);

  const [saving, setSaving] = useState(false);

  // Click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (trackDropdownRef.current && !trackDropdownRef.current.contains(event.target as Node)) {
        setIsTrackDropdownOpen(false);
      }
      if (carDropdownRef.current && !carDropdownRef.current.contains(event.target as Node)) {
        setIsCarDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!leagueId) return;
    const unsubLeague = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });

    const unsubSeries = onSnapshot(
      query(collection(db, "sr_league_series"), where("league_id", "==", leagueId)),
      (snap) => {
        const list: SRLeagueSeries[] = [];
        snap.forEach((d) => {
          const data = { id: d.id, ...(d.data() as any) } as SRLeagueSeries;
          if (!data.is_archived && data.status !== "archived") {
            list.push(data);
          }
        });
        setSeriesList(list);
        if (list.length > 0) {
          const targetId = (initialSeriesId && list.some((s) => s.id === initialSeriesId)) ? initialSeriesId : list[0].id;
          setSelectedSeriesId(targetId);

          // Fetch target season for this series to pull blueprint defaults
          const seriesObj = list.find((s) => s.id === targetId);
          const targetSeasonId = initialSeasonId || selectedSeasonId || seriesObj?.active_season_id;
          if (targetSeasonId) {
            onSnapshot(doc(db, "sr_league_seasons", targetSeasonId), (sSnap) => {
              if (sSnap.exists()) {
                const sData = { id: sSnap.id, ...(sSnap.data() as any) } as SRLeagueSeason;
                setActiveSeason(sData);
                setSelectedSeasonId(sData.id);

                // Auto-apply Season Blueprint defaults if present
                if (sData.default_car_model) {
                  setSelectedCar(sData.default_car_model);
                  setCarSearch(sData.default_car_model);
                }
                if (sData.default_race_time) setServerStartTime(sData.default_race_time);
                if (sData.default_timezone) setServerTimezone(sData.default_timezone);
                if (sData.default_practice_minutes) setPracticeMins(sData.default_practice_minutes);
                if (sData.default_qualifying_minutes) setQualifyingMins(sData.default_qualifying_minutes);
                if (sData.default_race_length_value) setRaceLengthValue(sData.default_race_length_value);
                if (sData.default_race_length_type) setRaceLengthType(sData.default_race_length_type);
                if (sData.default_fixed_setup !== undefined) setFixedSetup(sData.default_fixed_setup);
                if (sData.default_fast_repairs !== undefined) setFastRepairs(sData.default_fast_repairs);
                if (sData.default_incident_limit_dq) setIncidentLimitDq(sData.default_incident_limit_dq);
                if (sData.default_server_password) setServerPassword(sData.default_server_password);
                if (sData.default_server_region) setServerRegion(sData.default_server_region);
              }
            });
          }
        }
        setLoading(false);
      }
    );

    // Query rounds for target season or league
    const qRounds = initialSeasonId || selectedSeasonId
      ? query(collection(db, "sr_league_rounds"), where("league_id", "==", leagueId), where("season_id", "==", initialSeasonId || selectedSeasonId))
      : query(collection(db, "sr_league_rounds"), where("league_id", "==", leagueId));

    const unsubRounds = onSnapshot(qRounds, (snap) => {
      const count = snap.size;
      setExistingRoundsCount(count);
      setScheduledDate(getNextTuesdayDate(count)); // Auto consecutive weeks!
      if (!title) {
        setTitle(`Round ${count + 1} @ Lime Rock Park`);
      }
    });

    return () => {
      unsubLeague();
      unsubSeries();
      unsubRounds();
    };
  }, [leagueId, initialSeriesId, initialSeasonId, selectedSeasonId]);

  // Select Track Handler
  const handleSelectTrack = (track: (typeof IRACING_OFFICIAL_TRACKS)[0]) => {
    setSelectedTrackKey(track.id);
    setTrackSearch(track.name);
    setSelectedLayout(track.layouts[0] || "Full Course");
    setTitle(`Round ${existingRoundsCount + 1} @ ${track.name}`);
    setIsTrackDropdownOpen(false);
  };

  const handleSelectCustomTrack = () => {
    setSelectedTrackKey("custom");
    setTrackSearch("Custom Track");
    setSelectedLayout("custom");
    setIsTrackDropdownOpen(false);
  };

  // Select Car Handler
  const handleSelectCar = (carName: string) => {
    setSelectedCar(carName);
    setCarSearch(carName);
    setIsCarDropdownOpen(false);
  };

  const handleSelectCustomCar = () => {
    setSelectedCar("custom");
    setCarSearch("Custom Car");
    setIsCarDropdownOpen(false);
  };

  const currentTrackObj = sortedTracks.find((t) => t.id === selectedTrackKey);
  const effectiveTrackName = selectedTrackKey === "custom" ? customTrackName.trim() : (currentTrackObj?.name || trackSearch);
  const effectiveLayout = selectedLayout === "custom" ? customLayoutName.trim() : selectedLayout;
  const effectiveCar = selectedCar === "custom" ? customCarName.trim() : selectedCar;

  const totalEventMins = practiceMins + qualifyingMins + (raceLengthType === "minutes" ? raceLengthValue : 30);

  // Format 12-Hour Time for Display
  const formattedDisplayTime = useMemo(() => {
    if (!serverStartTime) return "7:00 PM " + serverTimezone;
    const [hoursStr, minsStr] = serverStartTime.split(":");
    let h = parseInt(hoursStr, 10);
    const m = minsStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm} ${serverTimezone}`;
  }, [serverStartTime, serverTimezone]);

  // Formatted Date for Display (e.g. Tuesday, Sep 1, 2026)
  const formattedDisplayDate = useMemo(() => {
    if (!scheduledDate) return "Next Tuesday";
    const [y, m, d] = scheduledDate.split("-").map(Number);
    if (!y || !m || !d) return scheduledDate;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [scheduledDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !effectiveTrackName) return;

    setSaving(true);
    const roundNumber = existingRoundsCount + 1;
    const roundId = `rnd_${leagueId}_${roundNumber}_${Date.now()}`;

    const newRound: any = {
      id: roundId,
      league_id: leagueId,
      season_id: activeSeason?.id || selectedSeasonId || initialSeasonId || "default_season",
      series_id: selectedSeriesId || initialSeriesId || "default_series",
      round_number: roundNumber,
      title: title.trim(),
      track_name: effectiveTrackName,
      track_layout: effectiveLayout || "Full Course",
      car_model: effectiveCar || "Toyota GR86 Cup",
      scheduled_date: formattedDisplayDate,
      scheduled_date_raw: scheduledDate,
      server_start_time: formattedDisplayTime,
      server_start_time_raw: serverStartTime,
      server_timezone: serverTimezone,
      is_league_session: isLeagueSession,
      server_region: serverRegion,
      server_password: serverPassword.trim() || "",
      admin_name: adminName.trim() || "PJ Losey",
      practice_minutes: Number(practiceMins) || 20,
      qualifying_minutes: Number(qualifyingMins) || 15,
      race_length_type: raceLengthType,
      race_length_value: Number(raceLengthValue) || 30,
      start_type: startType,
      fixed_setup: fixedSetup,
      fast_repairs: Number(fastRepairs) || 0,
      incident_limit_dq: Number(incidentLimitDq) || 17,
      weather_temp_f: 78,
      weather_sky: "partly_cloudy",
      dynamic_weather: true,
      status: "scheduled",
      created_at: Date.now(),
    };

    try {
      await setDoc(doc(db, "sr_league_rounds", roundId), newRound);
      showToast({
        title: "🏁 Round Scheduled!",
        message: `${newRound.title} configured for ${effectiveTrackName}.`,
        icon: "📅",
      });
      router.push(selectedSeriesId ? `/srleague/${leagueId}/series/${selectedSeriesId}` : `/srleague/${leagueId}/schedule`);
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not schedule round.",
        icon: "❌",
      });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 font-mono text-xs text-neutral-500">
        Loading iRacing Track Directory...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6 font-mono text-xs">
      {/* HEADER */}
      <header className="max-w-2xl w-full mx-auto">
        <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-200">
          <Link
            href={`/srleague/${leagueId}/schedule`}
            className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
            title="Back to Schedule"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
              Schedule Round {existingRoundsCount + 1}
            </h1>
            <span className="text-xs text-neutral-500">
              {league?.name || "Championship"} • iRacing Matcher
            </span>
          </div>
        </div>
      </header>

      {/* FORM */}
      <main className="max-w-2xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* ─────────────────────────────────────────────────────────────
              SEASON BLUEPRINT SUMMARY BANNER
             ───────────────────────────────────────────────────────────── */}
          <div className="p-4 bg-red-50/80 border border-red-200 rounded-3xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-red-600 flex items-center justify-center font-bold text-white shrink-0 shadow-xs">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 text-xs truncate">
                    {activeSeason?.name || "Season Blueprint"}: {effectiveCar}
                  </span>
                  <span className="px-1.5 py-0.2 bg-red-100 text-red-700 font-bold text-[9px] rounded uppercase shrink-0">
                    Auto-Applied
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                  {formattedDisplayDate} @ {formattedDisplayTime} • {practiceMins}m Practice / {qualifyingMins}m Qual / {raceLengthValue}m Race
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-[10px] font-bold uppercase transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-red-600" />
              <span>{showAdvancedSettings ? "Hide Settings" : "Customize"}</span>
              {showAdvancedSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              PRIMARY STEP: SET TRACK & LAYOUT (10-SECOND ACTION)
             ───────────────────────────────────────────────────────────── */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 flex-wrap gap-2">
              <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>Choose Track & Layout ({sortedTracks.length} Available)</span>
              </h3>

              {/* CATEGORY FILTER PILLS */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 text-[10px] font-bold flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setTrackCategoryFilter("All");
                    setIsTrackDropdownOpen(true);
                  }}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    trackCategoryFilter === "All" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrackCategoryFilter("Free");
                    setIsTrackDropdownOpen(true);
                  }}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    trackCategoryFilter === "Free" ? "bg-emerald-600 text-white" : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  <span>🆓 Free Base</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrackCategoryFilter("Road");
                    setIsTrackDropdownOpen(true);
                  }}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    trackCategoryFilter === "Road" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Road
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrackCategoryFilter("Oval");
                    setIsTrackDropdownOpen(true);
                  }}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    trackCategoryFilter === "Oval" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Oval
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrackCategoryFilter("Dirt");
                    setIsTrackDropdownOpen(true);
                  }}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    trackCategoryFilter === "Dirt" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Dirt
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* TYPE-TO-SEARCH TRACK COMBOBOX */}
              <div className="space-y-1.5 relative" ref={trackDropdownRef}>
                <label className="text-[11px] uppercase font-bold text-neutral-600 flex items-center justify-between">
                  <span>Track Name (Type to Filter) *</span>
                  <span className="text-[10px] text-neutral-400 font-normal">{filteredTracks.length} matches</span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={trackSearch}
                    onFocus={() => setIsTrackDropdownOpen(true)}
                    onChange={(e) => {
                      setTrackSearch(e.target.value);
                      setIsTrackDropdownOpen(true);
                    }}
                    placeholder="Type track name (e.g. Gateway, St Louis, Spa)..."
                    className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 pr-10 text-sm font-sans text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                  />

                  {trackSearch ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTrackSearch("");
                        setIsTrackDropdownOpen(true);
                      }}
                      className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  )}
                </div>

                {/* FLOATING FILTERED TRACK DROPDOWN */}
                {isTrackDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-60 bg-white border border-neutral-300 rounded-2xl shadow-xl overflow-y-auto z-50 divide-y divide-neutral-100 font-sans">
                    {filteredTracks.length === 0 ? (
                      <div className="p-3 text-center text-xs text-neutral-400">
                        No tracks matching "{trackSearch}"
                      </div>
                    ) : (
                      filteredTracks.map((t) => {
                        const isSelected = selectedTrackKey === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectTrack(t)}
                            className={`w-full text-left p-3 hover:bg-neutral-50 flex items-center justify-between transition cursor-pointer text-xs ${
                              isSelected ? "bg-red-50 text-red-900 font-bold" : "text-neutral-800"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="block truncate font-bold">{t.name}</span>
                                {t.is_free_base && (
                                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded">
                                    FREE
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-400 block">{t.layouts.join(" • ")}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-neutral-100 text-neutral-600 shrink-0 ml-2">
                              {t.category}
                            </span>
                          </button>
                        );
                      })
                    )}
                    <button
                      type="button"
                      onClick={handleSelectCustomTrack}
                      className="w-full text-left p-3 hover:bg-neutral-100 text-red-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer bg-neutral-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Custom / Community Track</span>
                    </button>
                  </div>
                )}
              </div>

              {/* LAYOUT DROPDOWN */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Track Layout *
                </label>
                {selectedTrackKey !== "custom" && currentTrackObj?.layouts && currentTrackObj.layouts.length > 0 ? (
                  <select
                    value={selectedLayout}
                    onChange={(e) => setSelectedLayout(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition cursor-pointer font-sans"
                  >
                    {currentTrackObj.layouts.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                    <option value="custom">+ Custom Layout...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Full Course"
                    value={customLayoutName}
                    onChange={(e) => setCustomLayoutName(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                  />
                )}
              </div>
            </div>

            {selectedTrackKey === "custom" && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Custom Track Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Knockhill Racing Circuit"
                  value={customTrackName}
                  onChange={(e) => setCustomTrackName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                />
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              OPTIONAL ACCORDION: CUSTOMIZE ROUND SERVER SETTINGS
             ───────────────────────────────────────────────────────────── */}
          {showAdvancedSettings && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* SECTION: RACE DETAILS & DATE/TIME */}
              <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
                <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5 pb-2 border-b border-neutral-200">
                  <Clock className="w-3.5 h-3.5 text-red-600" />
                  <span>Customize Date, Time & Server</span>
                </h3>

                {/* ROUND TITLE */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-neutral-600">
                    Round Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-neutral-500">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-3 text-sm font-sans text-neutral-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-neutral-500">
                      Launch Time & Timezone *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        required
                        value={serverStartTime}
                        onChange={(e) => setServerStartTime(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-xl p-3 text-sm font-sans text-neutral-900 focus:outline-hidden"
                      />
                      <select
                        value={serverTimezone}
                        onChange={(e) => setServerTimezone(e.target.value)}
                        className="bg-white border border-neutral-300 rounded-xl p-3 text-xs font-bold text-neutral-900 focus:outline-hidden shrink-0"
                      >
                        <option value="CST">CST (US-Central)</option>
                        <option value="EST">EST (US-East)</option>
                        <option value="MST">MST (US-Mountain)</option>
                        <option value="PST">PST (US-West)</option>
                        <option value="UTC">UTC / GMT</option>
                        <option value="BST">BST (UK)</option>
                        <option value="AEST">AEST (Sydney)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-neutral-600">
                      Server Region
                    </label>
                    <select
                      value={serverRegion}
                      onChange={(e) => setServerRegion(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-2xl p-3 text-sm text-neutral-900 focus:outline-hidden"
                    >
                      <option value="US-East-OH">🇺🇸 US-East (Ohio)</option>
                      <option value="US-West">🇺🇸 US-West</option>
                      <option value="Europe-DE">🇩🇪 Europe (Frankfurt)</option>
                      <option value="Sydney">🇦🇺 Sydney (Australia)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-neutral-600">
                      Password (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Optional private pass"
                      value={serverPassword}
                      onChange={(e) => setServerPassword(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-2xl p-3 text-sm text-neutral-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: CAR & SESSION LENGTHS */}
              <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
                <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5 pb-2 border-b border-neutral-200">
                  <Car className="w-3.5 h-3.5 text-red-600" />
                  <span>Customize Car Model & Session Lengths</span>
                </h3>

                {/* TYPE-TO-SEARCH CAR COMBOBOX */}
                <div className="space-y-1.5 relative" ref={carDropdownRef}>
                  <label className="text-[11px] uppercase font-bold text-neutral-600 flex items-center justify-between">
                    <span>Car Model *</span>
                    <span className="text-[10px] text-neutral-400 font-normal">{filteredCars.length} matches</span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={carSearch}
                      onFocus={() => setIsCarDropdownOpen(true)}
                      onChange={(e) => {
                        setCarSearch(e.target.value);
                        setIsCarDropdownOpen(true);
                      }}
                      placeholder="Type car name..."
                      className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 pr-10 text-sm font-sans text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                    />

                    {carSearch ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCarSearch("");
                          setIsCarDropdownOpen(true);
                        }}
                        className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    )}
                  </div>

                  {isCarDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 max-h-60 bg-white border border-neutral-300 rounded-2xl shadow-xl overflow-y-auto z-50 divide-y divide-neutral-100 font-sans">
                      {filteredCars.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleSelectCar(c)}
                          className={`w-full text-left p-3 hover:bg-neutral-50 flex items-center justify-between transition cursor-pointer text-xs ${
                            selectedCar === c ? "bg-red-50 text-red-900 font-bold" : "text-neutral-800"
                          }`}
                        >
                          <span>{c}</span>
                          {selectedCar === c && <Check className="w-4 h-4 text-red-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* SESSION LENGTHS */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-500">Practice (Mins)</label>
                    <input
                      type="number"
                      value={practiceMins}
                      onChange={(e) => setPracticeMins(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-center text-sm font-bold text-neutral-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-500">Qualifying (Mins)</label>
                    <input
                      type="number"
                      value={qualifyingMins}
                      onChange={(e) => setQualifyingMins(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-center text-sm font-bold text-neutral-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-500">Race (Mins)</label>
                    <input
                      type="number"
                      value={raceLengthValue}
                      onChange={(e) => setRaceLengthValue(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-center text-sm font-bold text-neutral-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* FIXED SETUP & REPAIRS */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-500">Setups</label>
                    <button
                      type="button"
                      onClick={() => setFixedSetup(!fixedSetup)}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                        fixedSetup ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {fixedSetup ? "Fixed" : "Open"}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-500">Fast Repairs</label>
                    <input
                      type="number"
                      value={fastRepairs}
                      onChange={(e) => setFastRepairs(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-center text-sm font-bold text-neutral-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-500">DQ Limit (x)</label>
                    <input
                      type="number"
                      value={incidentLimitDq}
                      onChange={(e) => setIncidentLimitDq(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-center text-sm font-bold text-neutral-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                <span>Save Round & iRacing Matcher</span>
              </>
            )}
          </button>

        </form>
      </main>

      {/* FOOTER */}
      <footer className="max-w-2xl w-full mx-auto text-center py-4 text-[11px] text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}

export default function ScheduleNewRoundPage(props: any) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-8 font-mono text-xs">Loading...</div>}>
      <ScheduleNewRoundPageInnerContent {...props} />
    </Suspense>
  );
}
