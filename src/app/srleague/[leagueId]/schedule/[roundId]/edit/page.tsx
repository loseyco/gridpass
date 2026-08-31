"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueRound } from "@/lib/types/league";
import { IRACING_OFFICIAL_TRACKS, IRACING_OFFICIAL_CARS } from "@/lib/data/iracingTracksAndCars";
import { useToast } from "@/components/ToastContext";
import { useLeaguePermissions } from "@/lib/hooks/useLeaguePermissions";
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
  X,
  Trash2,
  ShieldAlert,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string; roundId: string }>;
}

export default function EditRoundPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";
  const roundId = unwrappedParams?.roundId || "";

  const router = useRouter();
  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const { isLeagueOwner, authLoading } = useLeaguePermissions(league);
  const [round, setRound] = useState<SRLeagueRound | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Race Information & League Session
  const [title, setTitle] = useState("");
  const [isLeagueSession, setIsLeagueSession] = useState(true);
  const [serverRegion, setServerRegion] = useState("US-East-OH");
  const [serverPassword, setServerPassword] = useState("");
  const [adminName, setAdminName] = useState("PJ Losey");

  // Modern Date & Time Picker State
  const [scheduledDate, setScheduledDate] = useState("");
  const [serverStartTime, setServerStartTime] = useState("19:00");
  const [serverTimezone, setServerTimezone] = useState("CST");

  // 2. Track & Layout State
  const [trackSearch, setTrackSearch] = useState("");
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

  // 3. Car Search State
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
    return sortedCars.filter((c) => c.toLowerCase().includes(q));
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    if (!leagueId || !roundId) return;

    const unsubLeague = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });

    const unsubRound = onSnapshot(doc(db, "sr_league_rounds", roundId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...(snap.data() as any) } as any;
        setRound(data);
        setTitle(data.title || "");
        setIsLeagueSession(data.is_league_session !== false);
        setServerRegion(data.server_region || "US-East-OH");
        setServerPassword(data.server_password || "");
        setAdminName(data.admin_name || "PJ Losey");
        
        if (data.scheduled_date_raw) setScheduledDate(data.scheduled_date_raw);
        else setScheduledDate("2026-09-01");

        if (data.server_start_time_raw) setServerStartTime(data.server_start_time_raw);
        else setServerStartTime("19:00");

        if (data.server_timezone) setServerTimezone(data.server_timezone);

        if (data.track_name) {
          setTrackSearch(data.track_name);
          const found = sortedTracks.find((t) => t.name === data.track_name);
          if (found) setSelectedTrackKey(found.id);
          else {
            setSelectedTrackKey("custom");
            setCustomTrackName(data.track_name);
          }
        }
        if (data.track_layout) {
          setSelectedLayout(data.track_layout);
          setCustomLayoutName(data.track_layout);
        }

        if (data.car_model) {
          setSelectedCar(data.car_model);
          setCarSearch(data.car_model);
        }
        if (data.practice_minutes) setPracticeMins(data.practice_minutes);
        if (data.qualifying_minutes) setQualifyingMins(data.qualifying_minutes);
        if (data.race_length_value) setRaceLengthValue(data.race_length_value);
        if (data.race_length_type) setRaceLengthType(data.race_length_type);
        if (data.start_type) setStartType(data.start_type);
        if (data.fixed_setup !== undefined) setFixedSetup(data.fixed_setup);
        if (data.fast_repairs !== undefined) setFastRepairs(data.fast_repairs);
        if (data.incident_limit_dq) setIncidentLimitDq(data.incident_limit_dq);
      }
      setLoading(false);
    });

    return () => {
      unsubLeague();
      unsubRound();
    };
  }, [leagueId, roundId, sortedTracks]);

  const handleSelectTrack = (track: (typeof IRACING_OFFICIAL_TRACKS)[0]) => {
    setSelectedTrackKey(track.id);
    setTrackSearch(track.name);
    setSelectedLayout(track.layouts[0] || "Full Course");
    setIsTrackDropdownOpen(false);
  };

  const handleSelectCar = (carName: string) => {
    setSelectedCar(carName);
    setCarSearch(carName);
    setIsCarDropdownOpen(false);
  };

  const currentTrackObj = sortedTracks.find((t) => t.id === selectedTrackKey);
  const effectiveTrackName = selectedTrackKey === "custom" ? customTrackName.trim() : (currentTrackObj?.name || trackSearch);
  const effectiveLayout = selectedLayout === "custom" ? customLayoutName.trim() : selectedLayout;
  const effectiveCar = selectedCar === "custom" ? customCarName.trim() : selectedCar;

  const totalEventMins = practiceMins + qualifyingMins + (raceLengthType === "minutes" ? raceLengthValue : 30);

  const formattedDisplayTime = useMemo(() => {
    if (!serverStartTime) return "7:00 PM " + serverTimezone;
    const [hoursStr, minsStr] = serverStartTime.split(":");
    let h = parseInt(hoursStr, 10);
    const m = minsStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm} ${serverTimezone}`;
  }, [serverStartTime, serverTimezone]);

  const formattedDisplayDate = useMemo(() => {
    if (!scheduledDate) return "Scheduled Date";
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
    const updates: any = {
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
      updated_at: Date.now(),
    };

    try {
      await updateDoc(doc(db, "sr_league_rounds", roundId), updates);
      showToast({
        title: "🏁 Round Updated!",
        message: `${updates.title} changes saved successfully.`,
        icon: "✅",
      });
      router.push(`/srleague/${leagueId}/schedule`);
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not update round.",
        icon: "❌",
      });
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "sr_league_rounds", roundId));
      showToast({
        title: "🗑️ Round Deleted",
        message: `Round ${round?.round_number} was permanently removed from the schedule.`,
        icon: "🗑️",
      });
      router.push(`/srleague/${leagueId}/schedule`);
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not delete round.",
        icon: "❌",
      });
      setDeleting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 font-mono text-xs text-neutral-500">
        Loading Round Details...
      </div>
    );
  }

  // 🔒 RBAC GATE: Only League Owner / Super Admin can edit rounds
  if (!isLeagueOwner) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6 font-mono text-xs">
        <main className="max-w-md w-full mx-auto text-center pt-20 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
            Organizer Access Required
          </h1>
          <p className="text-xs text-neutral-500">
            Only the league creator or designated organizers can edit championship rounds and server parameters.
          </p>
          <Link
            href={`/srleague/${leagueId}/schedule`}
            className="inline-flex items-center justify-center px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase rounded-2xl shadow-sm"
          >
            ← Back to Schedule
          </Link>
        </main>

        <footer className="max-w-md w-full mx-auto text-center py-4 text-[11px] text-neutral-400">
          GridPass • Sim Racing League Manager
        </footer>
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
              Edit Round {round?.round_number}
            </h1>
            <span className="text-xs text-neutral-500">
              {round?.title} • {league?.name}
            </span>
          </div>
        </div>
      </header>

      {/* FORM */}
      <main className="max-w-2xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: RACE INFORMATION */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-red-600" />
                <span>Race Information & Schedule</span>
              </h3>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-500 font-bold">Enable League Racing</span>
                <button
                  type="button"
                  onClick={() => setIsLeagueSession(!isLeagueSession)}
                  className={`w-11 h-6 rounded-full transition cursor-pointer p-0.5 ${
                    isLeagueSession ? "bg-emerald-600" : "bg-neutral-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition transform ${
                      isLeagueSession ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* ROUND TITLE */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Session Name / Round Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />
            </div>

            {/* DATE & TIME PICKERS */}
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
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm font-sans text-neutral-900 focus:outline-hidden"
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
                    className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm font-sans text-neutral-900 focus:outline-hidden"
                  />
                  <select
                    value={serverTimezone}
                    onChange={(e) => setServerTimezone(e.target.value)}
                    className="bg-white border border-neutral-300 rounded-2xl p-3.5 text-xs font-bold text-neutral-900 focus:outline-hidden shrink-0"
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

            {/* SERVER REGION & PASSWORD */}
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

          {/* SECTION 2: TRACK & LAYOUT */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 flex-wrap gap-2">
              <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>Track & Layout</span>
              </h3>

              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200 text-[10px] font-bold flex-wrap">
                {(["All", "Free", "Road", "Oval", "Dirt"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setTrackCategoryFilter(cat);
                      setIsTrackDropdownOpen(true);
                    }}
                    className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                      trackCategoryFilter === cat ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    {cat === "Free" ? "🆓 Free Base" : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 relative" ref={trackDropdownRef}>
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Track Name *
                </label>
                <input
                  type="text"
                  required
                  value={trackSearch}
                  onFocus={() => setIsTrackDropdownOpen(true)}
                  onChange={(e) => {
                    setTrackSearch(e.target.value);
                    setIsTrackDropdownOpen(true);
                  }}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm font-sans text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                />

                {isTrackDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-60 bg-white border border-neutral-300 rounded-2xl shadow-xl overflow-y-auto z-50 divide-y divide-neutral-100 font-sans">
                    {filteredTracks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTrack(t)}
                        className={`w-full text-left p-3 hover:bg-neutral-50 flex items-center justify-between transition cursor-pointer text-xs ${
                          selectedTrackKey === t.id ? "bg-red-50 text-red-900 font-bold" : "text-neutral-800"
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="block truncate font-bold">{t.name}</span>
                          <span className="text-[10px] text-neutral-400 block">{t.layouts.join(" • ")}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-neutral-100 text-neutral-600 shrink-0 ml-2">
                          {t.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Track Layout *
                </label>
                {selectedTrackKey !== "custom" && currentTrackObj?.layouts && currentTrackObj.layouts.length > 0 ? (
                  <select
                    value={selectedLayout}
                    onChange={(e) => setSelectedLayout(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 cursor-pointer font-sans"
                  >
                    {currentTrackObj.layouts.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customLayoutName}
                    onChange={(e) => setCustomLayoutName(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden"
                  />
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: CAR & SESSION LENGTHS */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-red-600" />
                <span>Car Model & Durations</span>
              </h3>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-500 font-bold">Fixed Setups</span>
                <button
                  type="button"
                  onClick={() => setFixedSetup(!fixedSetup)}
                  className={`w-11 h-6 rounded-full transition cursor-pointer p-0.5 ${
                    fixedSetup ? "bg-emerald-600" : "bg-neutral-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition transform ${
                      fixedSetup ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* CAR MODEL */}
            <div className="space-y-1.5 relative" ref={carDropdownRef}>
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Official Car Model *
              </label>
              <input
                type="text"
                required
                value={carSearch}
                onFocus={() => setIsCarDropdownOpen(true)}
                onChange={(e) => {
                  setCarSearch(e.target.value);
                  setIsCarDropdownOpen(true);
                }}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm font-sans text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />

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

            {/* FAST REPAIRS & DQ */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500">Start Type</label>
                <select
                  value={startType}
                  onChange={(e) => setStartType(e.target.value as any)}
                  className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-xs text-neutral-900 focus:outline-hidden font-bold"
                >
                  <option value="standing">Standing</option>
                  <option value="rolling">Rolling</option>
                </select>
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

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                <span>Save Round Changes & iRacing Specs</span>
              </>
            )}
          </button>

          {/* DANGER ZONE: 2-STEP CONFIRMATION DELETE */}
          <div className="pt-4 border-t border-neutral-200">
            <div className="p-5 bg-red-50/50 border border-red-200 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-xs font-black uppercase text-red-900 block">
                    Danger Zone
                  </strong>
                  <span className="text-[11px] text-red-700">
                    Permanently delete Round {round?.round_number} from this championship.
                  </span>
                </div>

                {!showDeleteConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3.5 py-2 bg-white hover:bg-red-600 hover:text-white text-red-600 border border-red-300 rounded-xl font-bold uppercase text-[10px] transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Round</span>
                  </button>
                )}
              </div>

              {/* 2-STEP CONFIRMATION BLOCK */}
              {showDeleteConfirm && (
                <div className="p-4 bg-white border border-red-300 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <Trash2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-xs font-bold text-neutral-900 block">
                        Confirm Permanent Deletion?
                      </strong>
                      <p className="text-[11px] text-neutral-600 leading-normal">
                        Are you sure you want to delete <strong>Round {round?.round_number}: {round?.title}</strong>? This action cannot be undone and will remove all scheduled session data for this event.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold uppercase text-[10px] rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[10px] rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {deleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Yes, Permanently Delete Round</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </form>
      </main>

      {/* FOOTER */}
      <footer className="max-w-2xl w-full mx-auto text-center py-4 text-[11px] text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}
