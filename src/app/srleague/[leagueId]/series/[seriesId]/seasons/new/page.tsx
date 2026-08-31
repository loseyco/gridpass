"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, setDoc, updateDoc, onSnapshot, collection, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { SRLeague, SRLeagueSeries, SRLeagueSeason } from "@/lib/types/league";
import { IRACING_OFFICIAL_CARS } from "@/lib/data/iracingTracksAndCars";
import { useToast } from "@/components/ToastContext";
import { compressImage } from "@/lib/utils/imageCompressor";
import {
  ArrowLeft,
  Trophy,
  Loader2,
  Calendar,
  Award,
  HelpCircle,
  Check,
  Plus,
  Clock,
  Car,
  Flag,
  Zap,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string; seriesId: string }>;
}

// Points Presets
const POINTS_PRESETS: Record<string, { label: string; desc: string; points: number[]; fastLap: number; pole: number; lapsLed: number }> = {
  club_racing: {
    label: "iRacing Club Racing (25, 21, 18, 17, 16, 15, 14, 13...)",
    desc: "1st through 20th earn points (25, 21, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1).",
    points: [25, 21, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0],
    fastLap: 0,
    pole: 0,
    lapsLed: 0,
  },
  f1: {
    label: "Standard FIA / F1 (25, 18, 15, 12, 10, 8, 6, 4, 2, 1)",
    desc: "Top 10 finishers earn points. 1 bonus point for fastest lap inside top 10.",
    points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    fastLap: 1,
    pole: 0,
    lapsLed: 0,
  },
  iracing: {
    label: "iRacing Standard (35, 32, 29, 26, 24, 22, 20, 18...)",
    desc: "Standard linear curve awarding points down to 24th position.",
    points: [35, 32, 29, 26, 24, 22, 20, 18, 16, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1],
    fastLap: 0,
    pole: 0,
    lapsLed: 0,
  },
  motogp: {
    label: "MotoGP / Superbike (25, 20, 16, 13, 11, 10, 9...)",
    desc: "Top 15 finishers score points.",
    points: [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    fastLap: 0,
    pole: 0,
    lapsLed: 0,
  },
  nascar: {
    label: "NASCAR Cup Style (40, 35, 34, 33, 32, 31...)",
    desc: "Full field points scoring with 1 pt steps down to 40th.",
    points: [40, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13],
    fastLap: 1,
    pole: 1,
    lapsLed: 1,
  },
  none: {
    label: "None (Manual / Administrator Assigned Later)",
    desc: "No points will be awarded automatically. The league administrator will assign points at a later date.",
    points: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    fastLap: 0,
    pole: 0,
    lapsLed: 0,
  },
  custom: {
    label: "Custom Points Grid",
    desc: "Specify exact custom points for finishing positions #1 through #24.",
    points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    fastLap: 1,
    pole: 1,
    lapsLed: 0,
  },
};

export default function CreateSeasonPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";
  const seriesId = unwrappedParams?.seriesId || "";

  const router = useRouter();
  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const [series, setSeries] = useState<SRLeagueSeries | null>(null);
  const [existingSeasonsCount, setExistingSeasonsCount] = useState(0);

  // 1. Season Details
  const [seasonName, setSeasonName] = useState("");
  const [description, setDescription] = useState("");
  const [countAllRaces, setCountAllRaces] = useState(true);
  const [dropWeeks, setDropWeeks] = useState(0);
  const [noDropsOnOrAfter, setNoDropsOnOrAfter] = useState(0);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Season Blueprint Defaults (Auto-fills round schedules)
  const [defaultCarModel, setDefaultCarModel] = useState("Toyota GR86 Cup");
  const [defaultRaceDay, setDefaultRaceDay] = useState("Tuesday");
  const [defaultRaceTime, setDefaultRaceTime] = useState("19:00");
  const [defaultTimezone, setDefaultTimezone] = useState("CST");
  const [defaultPracticeMins, setDefaultPracticeMins] = useState(20);
  const [defaultQualifyingMins, setDefaultQualifyingMins] = useState(15);
  const [defaultRaceLengthType, setDefaultRaceLengthType] = useState<"minutes" | "laps">("minutes");
  const [defaultRaceLengthValue, setDefaultRaceLengthValue] = useState(30);
  const [defaultStartType, setDefaultStartType] = useState<"standing" | "rolling">("standing");
  const [defaultFixedSetup, setDefaultFixedSetup] = useState(true);
  const [defaultFastRepairs, setDefaultFastRepairs] = useState(1);
  const [defaultIncidentLimitDq, setDefaultIncidentLimitDq] = useState(17);
  const [defaultServerRegion, setDefaultServerRegion] = useState("US-East-OH");

  // 3. Points Allocation System
  const [selectedPreset, setSelectedPreset] = useState("f1");
  const [pointsGrid, setPointsGrid] = useState<number[]>(POINTS_PRESETS.f1.points);
  const [fastLapBonus, setFastLapBonus] = useState(1);
  const [poleBonus, setPoleBonus] = useState(0);
  const [lapsLedBonus, setLapsLedBonus] = useState(0);

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!leagueId || !seriesId) return;

    const unsubLeague = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });

    const unsubSeries = onSnapshot(doc(db, "sr_league_series", seriesId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...(snap.data() as any) };
        setSeries(data);
      }
    });

    const unsubSeasons = onSnapshot(
      query(collection(db, "sr_league_seasons"), where("series_id", "==", seriesId)),
      (snap) => {
        setExistingSeasonsCount(snap.size);
        if (!seasonName) {
          setSeasonName(`Season ${snap.size + 1}`);
        }
      }
    );

    return () => {
      unsubLeague();
      unsubSeries();
      unsubSeasons();
    };
  }, [leagueId, seriesId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setBannerPreview(objectUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setBannerPreview(objectUrl);
    }
  };

  const clearBanner = () => {
    setSelectedFile(null);
    setBannerPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle Preset Change
  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const config = POINTS_PRESETS[presetKey];
    if (config) {
      setPointsGrid([...config.points]);
      setFastLapBonus(config.fastLap);
      setPoleBonus(config.pole);
      setLapsLedBonus(config.lapsLed);
    }
  };

  // Handle Single Grid Point Change
  const handlePointChange = (index: number, val: number) => {
    const updated = [...pointsGrid];
    updated[index] = val;
    setPointsGrid(updated);
    if (selectedPreset !== "custom" && selectedPreset !== "none") {
      setSelectedPreset("custom");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonName.trim()) return;

    setSaving(true);
    const seasonNumber = existingSeasonsCount + 1;
    const seasonId = `season_${seriesId}_${seasonNumber}_${Date.now()}`;
    let finalBannerUrl = bannerPreview;

    if (selectedFile) {
      try {
        const optimizedFile = await compressImage(selectedFile, 1200, 600, 0.85);
        const storagePath = `leagues/${leagueId}/series/${seriesId}/seasons/${seasonId}/banner_${Date.now()}.${optimizedFile.name.split('.').pop() || 'webp'}`;
        const storageRef = ref(storage, storagePath);
        const uploadResult = await uploadBytes(storageRef, optimizedFile);
        finalBannerUrl = await getDownloadURL(uploadResult.ref);
      } catch (storageErr) {
        console.warn("Storage upload failed:", storageErr);
      }
    }

    const newSeason: any = {
      id: seasonId,
      league_id: leagueId,
      series_id: seriesId,
      name: seasonName.trim(),
      season_number: seasonNumber,
      description: description.trim() || "",
      banner_url: finalBannerUrl || undefined,
      cover_image_url: finalBannerUrl || undefined,
      status: "recruiting",
      drop_weeks: countAllRaces ? 0 : Number(dropWeeks) || 0,
      no_drops_on_or_after: Number(noDropsOnOrAfter) || 0,

      // Season Blueprint Defaults
      default_car_model: defaultCarModel,
      default_race_day: defaultRaceDay,
      default_race_time: defaultRaceTime,
      default_timezone: defaultTimezone,
      default_practice_minutes: Number(defaultPracticeMins) || 20,
      default_qualifying_minutes: Number(defaultQualifyingMins) || 15,
      default_race_length_type: defaultRaceLengthType,
      default_race_length_value: Number(defaultRaceLengthValue) || 30,
      default_start_type: defaultStartType,
      default_fixed_setup: defaultFixedSetup,
      default_fast_repairs: Number(defaultFastRepairs) || 0,
      default_incident_limit_dq: Number(defaultIncidentLimitDq) || 17,
      default_server_region: defaultServerRegion,

      points_allocation_system: {
        preset: selectedPreset,
        finish_positions: pointsGrid,
        fastest_lap: Number(fastLapBonus) || 0,
        pole_position: Number(poleBonus) || 0,
        laps_led: Number(lapsLedBonus) || 0,
      },
      rounds_count: 0,
      total_drivers: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    try {
      await setDoc(doc(db, "sr_league_seasons", seasonId), newSeason);
      await updateDoc(doc(db, "sr_league_series", seriesId), {
        active_season_id: seasonId,
        updated_at: Date.now(),
      }).catch(() => {});

      showToast({
        title: "🏆 Season Created!",
        message: `${newSeason.name} is now live with race blueprint.`,
        icon: "🏁",
      });
      router.push(`/srleague/${leagueId}/series/${seriesId}`);
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not create season.",
        icon: "❌",
      });
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
      {/* HEADER */}
      <header className="max-w-2xl w-full mx-auto">
        <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-200">
          <Link
            href={`/srleague/${leagueId}/series/${seriesId}`}
            className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
            title="Back to Series Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
              Create a League Season
            </h1>
            <span className="text-xs font-mono text-neutral-500">
              {series?.name || "Series"} • {league?.name}
            </span>
          </div>
        </div>
      </header>

      {/* FORM */}
      <main className="max-w-2xl w-full mx-auto font-mono text-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: SEASON NAME, DESCRIPTION & COVER PHOTO */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider">
              Season Information & Presentation
            </h3>
            
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Season Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Season Alpha1"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Season Description & Calendar Notes
              </label>
              <textarea
                rows={3}
                placeholder="Details about prize pools, season points format, entry criteria, broadcast dates..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-xs text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />
            </div>

            {/* SEASON COVER BANNER PHOTO */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600 flex items-center justify-between">
                <span>Season Cover Banner</span>
                <span className="text-[10px] text-neutral-400 font-normal">Optional (1200x600 recommended)</span>
              </label>

              {bannerPreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-neutral-300 shadow-2xs group">
                  <img
                    src={bannerPreview}
                    alt="Season Cover Preview"
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearBanner}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition shadow-md cursor-pointer"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                    isDragging
                      ? "border-red-600 bg-red-50/80 scale-[1.01] shadow-md ring-2 ring-red-500/20"
                      : "border-neutral-300 hover:border-red-500 bg-white hover:bg-neutral-50"
                  }`}
                >
                  <Upload className={`w-5 h-5 transition ${isDragging ? "text-red-600 scale-110" : "text-neutral-400"}`} />
                  <span className={`text-xs font-bold uppercase transition ${isDragging ? "text-red-700 font-black" : "text-neutral-700"}`}>
                    {isDragging ? "Drop Image Here" : "Drag & Drop Image or Click to Browse"}
                  </span>
                  <span className="text-[10px] text-neutral-400">PNG, JPG, WebP auto-compressed</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 2: DEFAULT RACE BLUEPRINT (AUTO-FILLS ROUND SCHEDULES)
             ───────────────────────────────────────────────────────────── */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-red-600" />
                <span>Season Race Blueprint (Default Round Format)</span>
              </h3>
              <span className="text-[10px] text-neutral-400 font-bold">Auto-fills round creator</span>
            </div>

            {/* DEFAULT CAR MODEL */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-red-600" />
                <span>Default Official Car Model *</span>
              </label>
              <select
                value={defaultCarModel}
                onChange={(e) => setDefaultCarModel(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm font-sans text-neutral-900 focus:outline-hidden focus:border-red-600 cursor-pointer"
              >
                {IRACING_OFFICIAL_CARS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* DEFAULT DAY, TIME & TIMEZONE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Default Race Day
                </label>
                <select
                  value={defaultRaceDay}
                  onChange={(e) => setDefaultRaceDay(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3 text-sm text-neutral-900 focus:outline-hidden"
                >
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Launch Time
                </label>
                <input
                  type="time"
                  value={defaultRaceTime}
                  onChange={(e) => setDefaultRaceTime(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3 text-sm font-sans text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Timezone
                </label>
                <select
                  value={defaultTimezone}
                  onChange={(e) => setDefaultTimezone(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3 text-xs font-bold text-neutral-900 focus:outline-hidden"
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

            {/* DEFAULT SESSION LENGTHS */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500">Practice (Mins)</label>
                <input
                  type="number"
                  value={defaultPracticeMins}
                  onChange={(e) => setDefaultPracticeMins(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-center text-sm font-bold text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500">Qualifying (Mins)</label>
                <input
                  type="number"
                  value={defaultQualifyingMins}
                  onChange={(e) => setDefaultQualifyingMins(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-center text-sm font-bold text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500">Race (Mins)</label>
                <input
                  type="number"
                  value={defaultRaceLengthValue}
                  onChange={(e) => setDefaultRaceLengthValue(Number(e.target.value))}
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
                  onClick={() => setDefaultFixedSetup(!defaultFixedSetup)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    defaultFixedSetup ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {defaultFixedSetup ? "Fixed" : "Open"}
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500">Fast Repairs</label>
                <input
                  type="number"
                  value={defaultFastRepairs}
                  onChange={(e) => setDefaultFastRepairs(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-center text-sm font-bold text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500">DQ Limit (x)</label>
                <input
                  type="number"
                  value={defaultIncidentLimitDq}
                  onChange={(e) => setDefaultIncidentLimitDq(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-center text-sm font-bold text-neutral-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: DROP WEEKS & RULES */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider">
              Drop Weeks & Scored Rounds
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCountAllRaces(true)}
                className={`p-4 rounded-2xl border text-left transition ${
                  countAllRaces
                    ? "bg-red-50 border-red-500 text-red-900"
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                <div className="font-bold text-xs">Count All Races</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  Every scheduled round points score counts.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCountAllRaces(false);
                  if (dropWeeks === 0) setDropWeeks(1);
                }}
                className={`p-4 rounded-2xl border text-left transition ${
                  !countAllRaces
                    ? "bg-red-50 border-red-500 text-red-900"
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                <div className="font-bold text-xs">Enable Drop Weeks</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  Drop lowest round(s) as attendance buffer.
                </div>
              </button>
            </div>

            {!countAllRaces && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1 relative">
                  <div className="flex items-center gap-1">
                    <label className="text-[11px] uppercase font-bold text-neutral-600">
                      Drop Weeks Count
                    </label>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={dropWeeks}
                    onChange={(e) => setDropWeeks(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-300 rounded-2xl p-3 text-sm text-neutral-900 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1 relative">
                  <div className="flex items-center gap-1">
                    <label className="text-[11px] uppercase font-bold text-neutral-600">
                      No Drops On or After
                    </label>
                  </div>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. Round 4"
                    value={noDropsOnOrAfter}
                    onChange={(e) => setNoDropsOnOrAfter(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-300 rounded-2xl p-3 text-sm text-neutral-900 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: POINTS ALLOCATION SYSTEM */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-red-600" />
              <span>Championship Points System</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Points Preset Curve
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm font-sans text-neutral-900 focus:outline-hidden focus:border-red-600 transition cursor-pointer"
              >
                {Object.entries(POINTS_PRESETS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-500 mt-1">
                {POINTS_PRESETS[selectedPreset]?.desc}
              </p>
            </div>

            {/* BONUS POINTS */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500">Fastest Lap</label>
                <input
                  type="number"
                  value={fastLapBonus}
                  onChange={(e) => setFastLapBonus(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-center text-sm font-bold text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500">Pole Position</label>
                <input
                  type="number"
                  value={poleBonus}
                  onChange={(e) => setPoleBonus(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-center text-sm font-bold text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500">Laps Led</label>
                <input
                  type="number"
                  value={lapsLedBonus}
                  onChange={(e) => setLapsLedBonus(Number(e.target.value))}
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
                <Trophy className="w-5 h-5" />
                <span>Save Season & Race Blueprint</span>
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
