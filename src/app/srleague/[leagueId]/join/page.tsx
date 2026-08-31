"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  updateDoc,
  increment,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueSeries, SRLeagueSeason, SRLeagueDriver } from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Trophy,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserCheck,
  Car,
  Calendar,
  Clock,
  Zap,
  AlertTriangle,
  Users,
  Sparkles,
  Download,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

function PublicJoinLeaguePageInnerContent({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSeriesId = searchParams.get("seriesId") || "";
  const initialSeasonId = searchParams.get("seasonId") || "";

  const { user } = useAuth();
  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const [seriesList, setSeriesList] = useState<SRLeagueSeries[]>([]);
  const [seasonsList, setSeasonsList] = useState<SRLeagueSeason[]>([]);
  const [existingDrivers, setExistingDrivers] = useState<SRLeagueDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Selected Target Season
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(initialSeasonId);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(initialSeriesId);

  // Driver Entry Form Details
  const [driverName, setDriverName] = useState(user?.displayName || "");
  const [custNumber, setCustNumber] = useState("");
  const [preferredNumber, setPreferredNumber] = useState("");
  const [teamName, setTeamName] = useState("");
  const [discordHandle, setDiscordHandle] = useState("");

  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Fetch User Profile from Cloud Firestore (Auto-fill GridPass Identity)
  useEffect(() => {
    if (!user?.uid) return;
    async function loadUserProfile() {
      try {
        const userDocRef = doc(db, "users", user!.uid);
        const uSnap = await getDoc(userDocRef);
        if (uSnap.exists()) {
          const uData = uSnap.data();
          if (uData.display_name && !driverName) setDriverName(uData.display_name);
          else if (uData.first_name && uData.last_name && !driverName) {
            setDriverName(`${uData.first_name} ${uData.last_name}`);
          }
          if (uData.iracing_cust_id) setCustNumber(uData.iracing_cust_id);
          if (uData.preferred_car_number) setPreferredNumber(uData.preferred_car_number);
          if (uData.team_name) setTeamName(uData.team_name);
          if (uData.discord_handle || uData.discord) setDiscordHandle(uData.discord_handle || uData.discord);
        }
      } catch (err) {
        console.warn("Could not load user profile:", err);
      } finally {
        setProfileLoaded(true);
      }
    }
    loadUserProfile();
  }, [user]);

  // 2. Fetch League, Series, Seasons & Drivers
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
        if (list.length > 0 && !selectedSeriesId) {
          setSelectedSeriesId(list[0].id);
        }
      }
    );

    const unsubSeasons = onSnapshot(
      query(collection(db, "sr_league_seasons"), where("league_id", "==", leagueId)),
      (snap) => {
        const list: SRLeagueSeason[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setSeasonsList(list);
        if (list.length > 0 && !selectedSeasonId) {
          setSelectedSeasonId(list[0].id);
        }
        setLoading(false);
      }
    );

    const unsubDrivers = onSnapshot(
      query(collection(db, "sr_league_drivers"), where("league_id", "==", leagueId)),
      (snap) => {
        const list: SRLeagueDriver[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setExistingDrivers(list);
      }
    );

    return () => {
      unsubLeague();
      unsubSeries();
      unsubSeasons();
      unsubDrivers();
    };
  }, [leagueId]);

  // Current Target Season Object & Series
  const currentSeason = useMemo(() => {
    return seasonsList.find((s) => s.id === selectedSeasonId) || seasonsList[0] || null;
  }, [seasonsList, selectedSeasonId]);

  const currentSeries = useMemo(() => {
    if (!currentSeason) return seriesList[0] || null;
    return seriesList.find((s) => s.id === currentSeason.series_id) || seriesList[0] || null;
  }, [seriesList, currentSeason]);

  // Existing driver registration for current user in this season
  const existingUserEntry = useMemo(() => {
    const targetSeasonId = currentSeason?.id || selectedSeasonId;
    if (!targetSeasonId) return null;
    return existingDrivers.find(
      (d) =>
        d.season_id === targetSeasonId &&
        ((user?.uid && d.user_id === user.uid) || (custNumber && d.iracing_cust_id === custNumber.trim()))
    );
  }, [existingDrivers, user, custNumber, currentSeason, selectedSeasonId]);

  // Check if chosen car number is already taken by ANOTHER driver in THIS season
  const isNumberTaken = useMemo(() => {
    if (!preferredNumber) return false;
    const clean = preferredNumber.trim();
    const targetSeasonId = currentSeason?.id || selectedSeasonId;
    return existingDrivers.some(
      (d) =>
        d.car_number === clean &&
        d.season_id === targetSeasonId &&
        d.status !== "archived" &&
        !d.is_archived &&
        d.id !== existingUserEntry?.id &&
        d.user_id !== user?.uid
    );
  }, [existingDrivers, preferredNumber, currentSeason, selectedSeasonId, existingUserEntry, user]);

  const takenByDriver = useMemo(() => {
    if (!isNumberTaken) return null;
    const targetSeasonId = currentSeason?.id || selectedSeasonId;
    return existingDrivers.find(
      (d) =>
        d.car_number === preferredNumber.trim() &&
        d.season_id === targetSeasonId &&
        d.status !== "archived" &&
        !d.is_archived &&
        d.id !== existingUserEntry?.id
    );
  }, [isNumberTaken, existingDrivers, preferredNumber, currentSeason, selectedSeasonId, existingUserEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) return;

    setSaving(true);
    const seasonId = currentSeason?.id || selectedSeasonId || "default_season";
    const seriesId = currentSeries?.id || selectedSeriesId || "default_series";
    
    // UPSERT: If driver is already registered in this season/league, update that record!
    const driverId = existingUserEntry ? existingUserEntry.id : `drv_${leagueId}_${seasonId}_${Date.now()}`;

    const driverPayload: any = {
      id: driverId,
      league_id: leagueId,
      series_id: seriesId,
      season_id: seasonId,
      user_id: user?.uid || null,
      driver_name: driverName.trim(),
      preferred_car_number: preferredNumber.trim() || "00",
      car_number: preferredNumber.trim() || "00",
      car_model: currentSeason?.default_car_model || "Toyota GR86 Cup",
      car_class: currentSeries?.car_classes?.[0] || "GR86",
      team_name: teamName.trim() || "",
      discord_handle: discordHandle.trim() || "",
      iracing_cust_id: custNumber.trim() || "",
      status: "active",
      updated_at: Date.now(),
    };

    if (!existingUserEntry) {
      driverPayload.points_total = 0;
      driverPayload.penalty_points = 0;
      driverPayload.wins_count = 0;
      driverPayload.podiums_count = 0;
      driverPayload.poles_count = 0;
      driverPayload.dnfs_count = 0;
      driverPayload.incidents_total = 0;
      driverPayload.created_at = Date.now();
    }

    try {
      await setDoc(doc(db, "sr_league_drivers", driverId), driverPayload, { merge: true });
      
      // Save credentials back to GridPass User Profile so they never have to type them again
      if (user?.uid) {
        await updateDoc(doc(db, "users", user.uid), {
          iracing_cust_id: custNumber.trim(),
          preferred_car_number: preferredNumber.trim(),
          team_name: teamName.trim(),
          discord_handle: discordHandle.trim(),
          updated_at: Date.now(),
        }).catch(() => {});
      }

      if (!existingUserEntry) {
        await updateDoc(doc(db, "sr_leagues", leagueId), {
          total_drivers: increment(1),
          updated_at: Date.now(),
        }).catch(() => {});

        if (seasonId !== "default_season") {
          await updateDoc(doc(db, "sr_league_seasons", seasonId), {
            total_drivers: increment(1),
            updated_at: Date.now(),
          }).catch(() => {});
        }
      }

      showToast({
        title: existingUserEntry ? "✅ Grid Spot Updated!" : "🏁 Grid Spot Claimed!",
        message: `Registered for ${currentSeason?.name || "Championship"} with #${driverPayload.car_number}.`,
        icon: "🏆",
      });
      if (seriesId && seriesId !== "default_series") {
        router.push(`/srleague/${leagueId}/series/${seriesId}`);
      } else {
        router.push(`/srleague/${leagueId}`);
      }
    } catch (err: any) {
      showToast({
        title: "Registration Error",
        message: err.message || "Could not complete registration.",
        icon: "❌",
      });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 font-mono text-xs text-neutral-500">
        Loading Season Registration Portal...
      </div>
    );
  }

  // 🔒 AUTH GATE: Unauthenticated visitors cannot register
  if (!user) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6 font-mono text-xs">
        <header className="max-w-md w-full mx-auto text-center pt-12 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Trophy className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
            Sign In Required
          </h1>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            You must be signed in with your <strong>GridPass Driver Account</strong> to register for {league?.name || "this championship"} and secure your car number.
          </p>
        </header>

        <main className="max-w-md w-full mx-auto space-y-4">
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm text-center">
            <div className="space-y-1">
              <strong className="text-sm font-black uppercase text-neutral-900 block">
                {currentSeason?.name || "Official Season Entry"}
              </strong>
              <span className="text-xs text-neutral-500 block">
                {currentSeason?.default_car_model || "Toyota GR86 Cup"} • {currentSeason?.default_race_day || "Tuesday"}s @ {currentSeason?.default_race_time || "7:00 PM"}
              </span>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href={`/login?redirect=/srleague/${leagueId}/join${initialSeasonId ? `?seasonId=${initialSeasonId}` : ""}`}
                className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-lg shadow-red-600/30 text-center block"
              >
                Sign In with GridPass
              </Link>
              <Link
                href={`/login?mode=register&redirect=/srleague/${leagueId}/join${initialSeasonId ? `?seasonId=${initialSeasonId}` : ""}`}
                className="w-full py-3.5 bg-white hover:bg-neutral-100 active:scale-98 text-neutral-800 font-bold text-xs uppercase tracking-wider border border-neutral-300 rounded-2xl transition text-center block shadow-2xs"
              >
                + Create Free Driver Account
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link
              href={`/srleague/${leagueId}`}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to League Hub</span>
            </Link>
          </div>
        </main>

        <footer className="max-w-md w-full mx-auto text-center py-4 text-[11px] text-neutral-400">
          GridPass • Sim Racing League Manager
        </footer>
      </div>
    );
  }

  if (joinedSuccess) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6 font-mono text-xs">
        <header className="max-w-md w-full mx-auto text-center pt-8">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900 mt-4">
            {isUpdateMode ? "Entry Updated!" : "Grid Spot Confirmed!"}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            You are officially registered for {currentSeason?.name || "the Season"} in {league?.name}.
          </p>
        </header>

        <main className="max-w-md w-full mx-auto space-y-4">
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white font-black text-base flex items-center justify-center shadow-xs">
                  #{preferredNumber || "00"}
                </div>
                <div>
                  <strong className="text-sm font-black text-neutral-900 block leading-tight">
                    {driverName}
                  </strong>
                  <span className="text-[11px] text-neutral-500">
                    {currentSeason?.default_car_model || "Toyota GR86 Cup"}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                ACTIVE DRIVER
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-neutral-200">
                <span className="text-neutral-500">Championship</span>
                <span className="font-bold text-neutral-900">{currentSeries?.name}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-neutral-200">
                <span className="text-neutral-500">Season</span>
                <span className="font-bold text-neutral-900">{currentSeason?.name}</span>
              </div>
              {custNumber && (
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-neutral-200">
                  <span className="text-neutral-500">iRacing Cust ID</span>
                  <span className="font-bold text-neutral-900">#{custNumber}</span>
                </div>
              )}
            </div>
          </div>

          <Link
            href={currentSeries?.id ? `/srleague/${leagueId}/series/${currentSeries.id}` : `/srleague/${leagueId}`}
            className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition text-center shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>Go to Series Championship Hub →</span>
          </Link>
        </main>

        <footer className="max-w-md w-full mx-auto text-center py-4 text-[11px] text-neutral-400">
          GridPass • Official Sim Racing League Platform
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6 font-mono text-xs">
      {/* HEADER */}
      <header className="max-w-md w-full mx-auto">
        <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-200">
          <Link
            href={`/srleague/${leagueId}`}
            className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
            title="Back to League"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
              Season Registration
            </h1>
            <span className="text-xs text-neutral-500">
              {league?.name} • Official Driver Entry
            </span>
          </div>
        </div>
      </header>

      {/* REGISTRATION FORM */}
      <main className="max-w-md w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* GRIDPASS PROFILE AUTO-FILL BANNER */}
          {user && (
            <div className="p-3 bg-red-50/70 border border-red-200 rounded-2xl flex items-center gap-2.5 text-[11px] text-red-900">
              <Sparkles className="w-4 h-4 text-red-600 shrink-0" />
              <span>Auto-filled from your verified <strong>GridPass Driver Profile</strong>.</span>
            </div>
          )}

          {/* SEASON SELECTOR & BLUEPRINT SPEC CARD */}
          <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3.5 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-red-600" />
                <span>Select Championship Season *</span>
              </label>

              {seasonsList.length > 0 ? (
                <select
                  value={selectedSeasonId}
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm font-sans text-neutral-900 focus:outline-hidden focus:border-red-600 transition cursor-pointer font-bold"
                >
                  {seasonsList.map((s) => {
                    const parentSeries = seriesList.find((ser) => ser.id === s.series_id);
                    return (
                      <option key={s.id} value={s.id}>
                        {parentSeries?.name || "Series"} — {s.name} ({s.status?.toUpperCase() || "RECRUITING"})
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="p-3 bg-white rounded-xl text-neutral-500 text-xs">
                  {seriesList[0]?.name || "Championship"} (Season 1)
                </div>
              )}
            </div>

            {/* SEASON SPECS BANNER */}
            <div className="p-3.5 bg-white rounded-2xl border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-neutral-900 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-red-600" />
                  <span>{currentSeason?.default_car_model || "Toyota GR86 Cup"}</span>
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded uppercase">
                  {currentSeason?.status || "RECRUITING"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-600 pt-1 border-t border-neutral-100">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-neutral-400" />
                  <span>{currentSeason?.default_race_day || "Tuesday"} Nights</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>{currentSeason?.default_race_time || "7:00 PM"} {currentSeason?.default_timezone || "CST"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* DRIVER DETAILS & CAR NUMBER SELECTION */}
          <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3.5 shadow-sm">
            <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5 pb-2 border-b border-neutral-200">
              <UserCheck className="w-3.5 h-3.5 text-red-600" />
              <span>Driver Entry Credentials</span>
            </h3>

            {/* DRIVER NAME */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Driver Name (iRacing Real Name) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PJ Losey"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition font-sans"
              />
            </div>

            {/* CAR NUMBER & IRACING CUST ID */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Desired Car # *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 17"
                  value={preferredNumber}
                  onChange={(e) => setPreferredNumber(e.target.value)}
                  className={`w-full bg-white border rounded-2xl p-3.5 text-center text-base font-black text-neutral-900 focus:outline-hidden transition ${
                    isNumberTaken ? "border-red-500 bg-red-50" : "border-neutral-300 focus:border-red-600"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  iRacing Cust ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 21596"
                  value={custNumber}
                  onChange={(e) => setCustNumber(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden transition font-sans"
                />
              </div>
            </div>

            {/* DUPLICATE NUMBER WARNING */}
            {isNumberTaken && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[11px] flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>
                  <strong>#{preferredNumber}</strong> is already claimed in this season by <strong>{takenByDriver?.driver_name}</strong>. Please choose another number.
                </span>
              </div>
            )}

            {/* TEAM NAME (OPTIONAL) */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Team Name / Sponsor (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. GridPass.App"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden transition font-sans"
              />
            </div>

            {/* DISCORD HANDLE (OPTIONAL) */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Discord Username (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. pjlosey#1234"
                value={discordHandle}
                onChange={(e) => setDiscordHandle(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden transition font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || isNumberTaken}
            className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Trophy className="w-5 h-5" />
                <span>{existingUserEntry ? "Update Season Entry" : "Confirm Entry & Join Season"}</span>
              </>
            )}
          </button>

          {/* DRIVER ENGINE DOWNLOAD CALLOUT */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2 text-center font-mono">
            <div className="flex items-center justify-center gap-2 text-neutral-900 font-bold text-xs">
              <Download className="w-4 h-4 text-red-600" />
              <span>Need the Driver Companion Engine?</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Download the zero-install PC engine for 60 FPS live telemetry &amp; race steward radio.
            </p>
            <Link
              href="/srleague/download"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 underline pt-0.5"
            >
              <span>Download SRCommander (v4.3.0) →</span>
            </Link>
          </div>
        </form>
      </main>

      {/* FOOTER */}
      <footer className="max-w-md w-full mx-auto text-center py-4 text-[11px] text-neutral-400">
        GridPass • Official Sim Racing League Platform
      </footer>
    </div>
  );
}

export default function PublicJoinLeaguePage(props: any) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-8 font-mono text-xs">Loading...</div>}>
      <PublicJoinLeaguePageInnerContent {...props} />
    </Suspense>
  );
}
