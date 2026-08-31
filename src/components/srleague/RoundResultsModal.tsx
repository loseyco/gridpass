"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { doc, updateDoc, setDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  SRLeagueRound,
  SRLeagueSeason,
  SRLeagueDriver,
} from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import {
  X,
  Trophy,
  Upload,
  Cpu,
  CheckCircle2,
  Calendar,
  Clock,
  Car,
  MapPin,
  Loader2,
  FileCode,
  Sparkles,
  AlertCircle,
  Award,
  ChevronRight,
  RotateCcw,
  Trash2,
  UserPlus,
  Plus,
  RefreshCw,
} from "lucide-react";

interface RoundResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  round: SRLeagueRound;
  season?: SRLeagueSeason | null;
  drivers: SRLeagueDriver[];
  leagueId: string;
}

const POINTS_PRESETS: Record<string, { name: string; points: number[] }> = {
  f1: { name: "FIA Formula 1 Standard", points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] },
  motogp: { name: "MotoGP Top 15", points: [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
  nascar: { name: "NASCAR Cup 40-to-1", points: Array.from({ length: 40 }, (_, i) => 40 - i) },
  indycar: { name: "IndyCar Series Top 25", points: [50, 40, 35, 32, 30, 28, 26, 24, 22, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5] },
};

// Universal helper to parse any iRacing JSON / object structure
function extractSessionData(rawParsed: any) {
  let parsed = rawParsed;
  if (parsed?.data && typeof parsed.data === "object") parsed = parsed.data;
  if (parsed?.response && typeof parsed.response === "object") parsed = parsed.response;

  const subsessionId =
    parsed?.subsession_id ||
    parsed?.subsessionId ||
    parsed?.subsessionID ||
    parsed?.session_id ||
    parsed?.id ||
    "Unknown";

  const trackName =
    parsed?.track?.track_name ||
    parsed?.track_name ||
    parsed?.trackName ||
    (typeof parsed?.track === "string" ? parsed.track : "Track");

  const configName =
    parsed?.track?.track_config_name ||
    parsed?.track_config_name ||
    parsed?.configName ||
    "";

  let rawList: any[] = [];

  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (Array.isArray(parsed?.results)) {
    rawList = parsed.results;
  } else if (Array.isArray(parsed?.rows)) {
    rawList = parsed.rows;
  } else if (Array.isArray(parsed?.drivers)) {
    rawList = parsed.drivers;
  } else if (Array.isArray(parsed?.session_results)) {
    const sessionsWithResults = parsed.session_results.filter(
      (s: any) => s?.results && Array.isArray(s.results) && s.results.length > 0
    );

    const raceSession = sessionsWithResults.find(
      (s: any) =>
        /race|feature|sprint|final/i.test(s?.simsession_name || "") ||
        /race|feature|sprint|final/i.test(s?.simsession_type_name || "") ||
        s?.simsession_type === 6
    );

    const targetSession =
      raceSession ||
      sessionsWithResults[sessionsWithResults.length - 1] ||
      parsed.session_results[0];

    rawList = targetSession?.results || [];
  }

  return { subsessionId, trackName, configName, rawList };
}

export default function RoundResultsModal({
  isOpen,
  onClose,
  round,
  season,
  drivers,
  leagueId,
}: RoundResultsModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasExistingResults = round.status === "completed" || (round.results && round.results.length > 0);

  // View state: 'view_current' (if completed) or 'intake' (to upload/select new file)
  const [modalMode, setModalMode] = useState<"view_current" | "intake">(
    hasExistingResults ? "view_current" : "intake"
  );

  const [activeTab, setActiveTab] = useState<"local" | "upload" | "paste">("local");
  const [pastedText, setPastedText] = useState("");
  const [localSessions, setLocalSessions] = useState<any[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [selectedRawSession, setSelectedRawSession] = useState<any | null>(null);
  const [applying, setApplying] = useState(false);

  // Local drivers list with dynamic additions from guest enrollments
  const [localDrivers, setLocalDrivers] = useState<SRLeagueDriver[]>(drivers);
  const [enrollingDrivers, setEnrollingDrivers] = useState<Record<string, boolean>>({});
  const [bulkEnrolling, setBulkEnrolling] = useState(false);

  useEffect(() => {
    setLocalDrivers(drivers);
  }, [drivers]);

  // Fetch local iRacing session files
  const fetchLocalSessions = async () => {
    setLoadingLocal(true);
    try {
      const res = await fetch("/api/srleague/iracing/import-results");
      const data = await res.json();
      if (data.success) {
        setLocalSessions(data.files || []);
      }
    } catch (err: any) {
      console.error("Failed to load local iRacing results:", err);
    } finally {
      setLoadingLocal(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLocalSessions();
      setSelectedRawSession(null);
      setPastedText("");
      setModalMode(hasExistingResults ? "view_current" : "intake");
    }
  }, [isOpen, hasExistingResults]);

  // Points distribution curve
  const pointsGrid = useMemo(() => {
    if (season?.points_allocation_system?.finish_positions) {
      return season.points_allocation_system.finish_positions;
    }
    return POINTS_PRESETS.f1.points;
  }, [season]);

  const fastLapBonus = season?.points_allocation_system?.fastest_lap ?? 1;
  const poleBonus = season?.points_allocation_system?.pole_position ?? 0;

  // Process selected session into structured finish order
  // Process selected session into structured finish order
  const processedResults = useMemo(() => {
    if (!selectedRawSession) return null;

    const parsed = selectedRawSession.rawSummary || selectedRawSession;
    const { subsessionId, trackName, configName, rawList } = extractSessionData(parsed);

    // Find fastest lap in session
    let bestLapOverall = Infinity;
    rawList.forEach((r: any) => {
      const best = r.best_lap_time || r.bestLapTime || r.fastest_lap_time || 0;
      if (best > 0 && best < bestLapOverall) {
        bestLapOverall = best;
      }
    });

    const parsedFinishes = rawList.map((entry: any, idx: number) => {
      const rawPos =
        entry.finish_position ??
        entry.finish_pos ??
        entry.position ??
        entry.pos ??
        entry.finishPosition ??
        entry.Place ??
        entry.Finish;

      const pos = typeof rawPos === "number" ? (rawPos === 0 || rawPos < rawList.length && rawList.some((e: any) => e.finish_position === 0) ? rawPos + 1 : rawPos) : idx + 1;

      const rawStartPos =
        entry.starting_position ??
        entry.start_pos ??
        entry.startPosition ??
        idx;
      const startPos = typeof rawStartPos === "number" ? rawStartPos + 1 : idx + 1;

      const custIdStr = String(entry.cust_id || entry.custId || entry.custid || entry.CustID || "").trim();
      const driverName = entry.display_name || entry.name || entry.driver_name || entry.driverName || "Driver";
      const sessionCarNum = String(entry.car_number || entry.car_num || entry.livery?.car_number || pos);

      // Match against registered league drivers:
      // Priority 1: iRacing Customer ID (100% Unique & Verified)
      // Priority 2: Exact Full Name Match
      let matchType: "ID_MATCH" | "NAME_MATCH" | null = null;
      let matchedDriver = null;

      if (custIdStr) {
        matchedDriver = localDrivers.find(
          (d) => d.iracing_cust_id && String(d.iracing_cust_id).trim() === custIdStr
        );
        if (matchedDriver) matchType = "ID_MATCH";
      }

      if (!matchedDriver) {
        matchedDriver = localDrivers.find(
          (d) => d.driver_name && d.driver_name.toLowerCase().trim() === driverName.toLowerCase().trim()
        );
        if (matchedDriver) matchType = "NAME_MATCH";
      }

      // Base points from curve
      const basePoints = pointsGrid[pos - 1] || 0;
      const bestLap = entry.best_lap_time || entry.bestLapTime || entry.fastest_lap_time || 0;
      const isFastestLap = bestLap > 0 && bestLap === bestLapOverall;
      const isPole = startPos === 1;

      const totalPoints = basePoints + (isFastestLap ? fastLapBonus : 0) + (isPole ? poleBonus : 0);

      return {
        position: pos,
        startPosition: startPos,
        driverName: matchedDriver?.driver_name || driverName,
        sessionDriverName: driverName,
        custId: custIdStr || matchedDriver?.iracing_cust_id || "",
        matchType: matchType,
        carNumber: matchedDriver?.car_number || matchedDriver?.preferred_car_number || sessionCarNum,
        sessionCarNumber: sessionCarNum,
        teamName: matchedDriver?.team_name || "Independent",
        matchedDriverId: matchedDriver?.id || null,
        lapsCompleted: entry.laps_complete || entry.laps_completed || entry.laps || 0,
        bestLapTime: bestLap,
        incidents: entry.incidents ?? entry.inc ?? entry.incident_count ?? 0,
        isFastestLap: isFastestLap,
        isPole: isPole,
        basePoints: basePoints,
        bonusPoints: (isFastestLap ? fastLapBonus : 0) + (isPole ? poleBonus : 0),
        totalPoints: totalPoints,
      };
    });

    parsedFinishes.sort((a, b) => a.position - b.position);

    return {
      subsessionId: subsessionId || "Unknown",
      trackName: trackName || selectedRawSession.trackName || round.track_name || "Track",
      configName: configName || selectedRawSession.configName || round.track_layout || "",
      finishes: parsedFinishes,
      matchedCount: parsedFinishes.filter((f: any) => f.matchedDriverId).length,
      totalDrivers: parsedFinishes.length,
    };
  }, [selectedRawSession, localDrivers, pointsGrid, fastLapBonus, poleBonus, round]);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const { subsessionId, trackName, rawList } = extractSessionData(parsed);

        setSelectedRawSession({
          filename: file.name,
          subsessionId: subsessionId || Date.now(),
          trackName: trackName || "Uploaded Event",
          rawSummary: parsed,
        });

        showToast({
          title: "📄 Results Loaded",
          message: "Loaded " + rawList.length + " finishers from " + file.name,
          icon: "✅",
        });
      } catch (err: any) {
        showToast({
          title: "Parse Error",
          message: "Could not parse JSON. Ensure it is a valid result file.",
          icon: "❌",
        });
      }
    };
    reader.readAsText(file);
  };

  // Handle parse pasted text/CSV
  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;

    try {
      const lines = pastedText.trim().split(/\r?\n/).filter(Boolean);
      const finishes: any[] = [];

      lines.forEach((line, idx) => {
        const parts = line.includes(",") ? line.split(",") : line.split(/\t|\s{2,}/);
        const cleanParts = parts.map((p) => p.trim().replace(/^"|"$/g, "")).filter(Boolean);

        if (cleanParts.length >= 2) {
          if (/^(pos|finish|position|#)/i.test(cleanParts[0])) return;

          const posNum = parseInt(cleanParts[0], 10) || idx + 1;
          let driverName = cleanParts[1];
          let carNum = "00";
          let custId = "";
          let incidents = 0;

          cleanParts.forEach((part) => {
            if (/^#?\d{1,3}$/.test(part) && part !== cleanParts[0]) carNum = part.replace("#", "");
            if (/^\d{5,8}$/.test(part)) custId = part;
            if (/^\d+x$/i.test(part)) incidents = parseInt(part.replace(/x/i, ""), 10) || 0;
          });

          const matched = drivers.find(
            (d) =>
              (custId && d.iracing_cust_id === custId) ||
              (d.driver_name && d.driver_name.toLowerCase().includes(driverName.toLowerCase())) ||
              (driverName && driverName.toLowerCase().includes(d.driver_name.toLowerCase()))
          );

          finishes.push({
            finish_position: posNum - 1,
            starting_position: posNum - 1,
            display_name: matched?.driver_name || driverName,
            cust_id: matched?.iracing_cust_id || custId,
            car_number: matched?.car_number || matched?.preferred_car_number || carNum,
            incidents: incidents,
            laps_complete: 0,
            best_lap_time: 0,
          });
        }
      });

      if (finishes.length === 0) {
        showToast({ title: "Parse Warning", message: "Could not detect driver rows. Try pasting CSV or tab-separated text.", icon: "⚠️" });
        return;
      }

      setSelectedRawSession({
        filename: "Pasted Web Results",
        subsessionId: Date.now(),
        trackName: round.track_name,
        rawSummary: {
          subsession_id: Date.now(),
          track: { track_name: round.track_name, track_config_name: round.track_layout },
          session_results: [{ results: finishes }],
        },
      });

      showToast({ title: "📋 Results Parsed", message: "Extracted " + finishes.length + " finishing positions.", icon: "✅" });
    } catch (err: any) {
      showToast({ title: "Parse Error", message: err.message || "Failed to parse text.", icon: "❌" });
    }
  };

  // 1-Click Enroll Guest Driver into Cloud Firestore
  const handleEnrollGuestDriver = async (finishEntry: any) => {
    const driverKey = finishEntry.custId || finishEntry.sessionDriverName || finishEntry.driverName;
    setEnrollingDrivers((prev) => ({ ...prev, [driverKey]: true }));

    try {
      const newDriverId = `driver_${leagueId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const carNum = finishEntry.sessionCarNumber || finishEntry.carNumber || "00";
      const name = finishEntry.sessionDriverName || finishEntry.driverName || "Driver";

      const newDriverDoc: SRLeagueDriver = {
        id: newDriverId,
        league_id: leagueId,
        series_id: round.series_id || "",
        season_id: round.season_id || season?.id || "",
        driver_name: name,
        iracing_cust_id: finishEntry.custId || "",
        preferred_car_number: carNum,
        car_number: carNum,
        team_name: "Independent",
        status: "active",
        points_total: 0,
        wins_count: 0,
        podiums_count: 0,
        incidents_total: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      await setDoc(doc(db, "sr_league_drivers", newDriverId), newDriverDoc);
      setLocalDrivers((prev) => [...prev, newDriverDoc]);

      showToast({
        title: "🏎️ Driver Enrolled!",
        message: `${name} (#${carNum}) is now registered and will earn championship points!`,
        icon: "✅",
      });
    } catch (err: any) {
      showToast({
        title: "Enrollment Error",
        message: err.message || "Failed to enroll driver.",
        icon: "❌",
      });
    } finally {
      setEnrollingDrivers((prev) => ({ ...prev, [driverKey]: false }));
    }
  };

  // Bulk Enroll All Guest Drivers into Cloud Firestore
  const handleBulkEnrollAllGuests = async () => {
    if (!processedResults) return;
    const guests = processedResults.finishes.filter((f: any) => !f.matchedDriverId);
    if (guests.length === 0) return;

    setBulkEnrolling(true);
    try {
      const createdDrivers: SRLeagueDriver[] = [];

      for (const finishEntry of guests) {
        const newDriverId = `driver_${leagueId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const carNum = finishEntry.sessionCarNumber || finishEntry.carNumber || "00";
        const name = finishEntry.sessionDriverName || finishEntry.driverName || "Driver";

        const newDriverDoc: SRLeagueDriver = {
          id: newDriverId,
          league_id: leagueId,
          series_id: round.series_id || "",
          season_id: round.season_id || season?.id || "",
          driver_name: name,
          iracing_cust_id: finishEntry.custId || "",
          preferred_car_number: carNum,
          car_number: carNum,
          team_name: "Independent",
          status: "active",
          points_total: 0,
          wins_count: 0,
          podiums_count: 0,
          incidents_total: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        };

        await setDoc(doc(db, "sr_league_drivers", newDriverId), newDriverDoc);
        createdDrivers.push(newDriverDoc);
      }

      setLocalDrivers((prev) => [...prev, ...createdDrivers]);

      showToast({
        title: "🏎️ All Drivers Enrolled!",
        message: `Enrolled ${createdDrivers.length} drivers to the championship grid!`,
        icon: "🏁",
      });
    } catch (err: any) {
      showToast({
        title: "Bulk Enrollment Error",
        message: err.message || "Failed to enroll all drivers.",
        icon: "❌",
      });
    } finally {
      setBulkEnrolling(false);
    }
  };

  // 1-CLICK RESET / REVERT ROUND
  const handleResetRound = async () => {
    setApplying(true);
    try {
      // 1. If this round had previous results, subtract points from matched drivers
      if (round.results && Array.isArray(round.results) && round.results.length > 0) {
        for (const prevFinish of round.results) {
          if (prevFinish.matchedDriverId) {
            const isWinner = prevFinish.position === 1;
            const isPodium = prevFinish.position <= 3;
            const ptsToSubtract = -(prevFinish.totalPoints || 0);

            await updateDoc(doc(db, "sr_league_drivers", prevFinish.matchedDriverId), {
              points_total: increment(ptsToSubtract),
              wins_count: increment(isWinner ? -1 : 0),
              podiums_count: increment(isPodium ? -1 : 0),
              incidents_total: increment(-(prevFinish.incidents || 0)),
              updated_at: Date.now(),
            }).catch((err) => console.error("Error reverting driver stats:", err));
          }
        }
      } else {
        for (const d of drivers) {
          await updateDoc(doc(db, "sr_league_drivers", d.id), {
            points_total: 0,
            wins_count: 0,
            podiums_count: 0,
            incidents_total: 0,
            updated_at: Date.now(),
          }).catch((err) => console.error("Error zeroing driver stats:", err));
        }
      }

      // 2. Reset Round Document in Cloud Firestore
      await updateDoc(doc(db, "sr_league_rounds", round.id), {
        status: "scheduled",
        results: [],
        winner_name: "",
        winner_driver_id: null,
        fastest_lap_driver: "",
        subsession_id: null,
        completed_at: null,
        updated_at: Date.now(),
      });

      showToast({
        title: "🔄 Results Cleared!",
        message: "Round results cleared and standings restored to pre-race state.",
        icon: "↩️",
      });

      onClose();
    } catch (err: any) {
      showToast({
        title: "Reset Error",
        message: err.message || "Failed to reset round.",
        icon: "❌",
      });
    } finally {
      setApplying(false);
    }
  };

  // Commit and finalize results to Cloud Firestore
  const handleCommitResults = async () => {
    if (!processedResults || processedResults.finishes.length === 0) return;

    setApplying(true);
    try {
      // 1. If re-scoring an already completed round, subtract previous results first
      if (round.results && Array.isArray(round.results) && round.results.length > 0) {
        for (const prevFinish of round.results) {
          if (prevFinish.matchedDriverId) {
            const isWinner = prevFinish.position === 1;
            const isPodium = prevFinish.position <= 3;
            const ptsToSubtract = -(prevFinish.totalPoints || 0);

            await updateDoc(doc(db, "sr_league_drivers", prevFinish.matchedDriverId), {
              points_total: increment(ptsToSubtract),
              wins_count: increment(isWinner ? -1 : 0),
              podiums_count: increment(isPodium ? -1 : 0),
              incidents_total: increment(-(prevFinish.incidents || 0)),
              updated_at: Date.now(),
            }).catch((err) => console.error("Error subtracting previous stats:", err));
          }
        }
      }

      // 2. Update Round Document in Cloud Firestore
      await updateDoc(doc(db, "sr_league_rounds", round.id), {
        status: "completed",
        completed_at: Date.now(),
        subsession_id: processedResults.subsessionId,
        results: processedResults.finishes,
        winner_name: processedResults.finishes[0]?.driverName || "",
        winner_driver_id: processedResults.finishes[0]?.matchedDriverId || null,
        fastest_lap_driver: processedResults.finishes.find((f: any) => f.isFastestLap)?.driverName || "",
        updated_at: Date.now(),
      });

      // 3. Award New Points & Update Driver Stats in Cloud Firestore
      for (const finish of processedResults.finishes) {
        if (finish.matchedDriverId) {
          const isWinner = finish.position === 1;
          const isPodium = finish.position <= 3;

          await updateDoc(doc(db, "sr_league_drivers", finish.matchedDriverId), {
            points_total: increment(finish.totalPoints),
            wins_count: increment(isWinner ? 1 : 0),
            podiums_count: increment(isPodium ? 1 : 0),
            incidents_total: increment(finish.incidents),
            updated_at: Date.now(),
          }).catch((err) => console.error("Error updating driver stats:", err));
        }
      }

      showToast({
        title: "🏆 Standings Updated!",
        message: "Round " + (round.round_number || 1) + " scored and championship points awarded!",
        icon: "🏁",
      });

      onClose();
    } catch (err: any) {
      showToast({
        title: "Error Finalizing Results",
        message: err.message || "Could not commit results to database.",
        icon: "❌",
      });
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono text-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-5 bg-neutral-900 text-white flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-600 font-black text-[9px] uppercase tracking-wider">
                {round.status === "completed" ? "Round Results Management" : "iRacing Results Intake"}
              </span>
              <span className="text-neutral-400 text-[10px]">
                Round {round.round_number || 1} • {round.track_name}
              </span>
            </div>
            <h2 className="text-base font-black uppercase text-white leading-tight">
              {modalMode === "view_current" ? "Current Recorded Results" : "Score Event & Update Standings"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">

          {/* ══════════════════════════════════════════════════════════════
              MODE A: VIEW CURRENT RECORDED RESULTS (WHEN COMPLETED)
             ══════════════════════════════════════════════════════════════ */}
          {modalMode === "view_current" && hasExistingResults && (
            <div className="space-y-4">
              {/* STATUS BANNER */}
              <div className="p-4 bg-neutral-900 text-white rounded-2xl space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Results Active on Championship Standings</span>
                  </span>
                  {round.subsession_id && (
                    <span className="text-neutral-400 text-[9px]">Subsession #{round.subsession_id}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase text-white leading-tight">
                      {round.track_name} ({round.track_layout})
                    </h3>
                    <span className="text-[10px] text-neutral-300">
                      Winner: <strong className="text-white">{round.winner_name || "Winner"}</strong> • {round.results?.length || 0} Scored Finishers
                    </span>
                  </div>
                </div>
              </div>

              {/* 2 DIRECT ACTION CARDS (CLEAR RESULTS vs RE-SCORE) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1-TAP CLEAR RESULTS */}
                <button
                  type="button"
                  disabled={applying}
                  onClick={handleResetRound}
                  className="p-4 rounded-2xl border-2 border-red-200 bg-red-50/50 hover:bg-red-50 hover:border-red-400 transition text-left cursor-pointer space-y-1 shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-red-700 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>Clear Results</span>
                    </span>
                    <RotateCcw className="w-3.5 h-3.5 text-red-500 group-hover:-rotate-45 transition" />
                  </div>
                  <p className="text-[11px] text-red-800 font-sans">
                    Reverts standings to 0 pts and sets Round 1 back to Scheduled.
                  </p>
                </button>

                {/* RE-SCORE WITH NEW FILE */}
                <button
                  type="button"
                  onClick={() => setModalMode("intake")}
                  className="p-4 rounded-2xl border-2 border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-400 transition text-left cursor-pointer space-y-1 shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-neutral-700" />
                      <span>Re-Score / Replace</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:translate-x-0.5 transition" />
                  </div>
                  <p className="text-[11px] text-neutral-600 font-sans">
                    Upload a different .JSON file or select another PC session.
                  </p>
                </button>
              </div>

              {/* ACTIVE FINISHERS TABLE */}
              {round.results && round.results.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                    Recorded Finishing Positions:
                  </span>
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-100 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-600">
                        <tr>
                          <th className="py-2 px-3">Pos</th>
                          <th className="py-2 px-3">Driver</th>
                          <th className="py-2 px-3">Car #</th>
                          <th className="py-2 px-3 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 bg-white font-mono">
                        {round.results.map((f: any) => (
                          <tr key={f.position} className={f.matchedDriverId ? "bg-emerald-50/40" : "hover:bg-neutral-50"}>
                            <td className="py-2 px-3 font-black text-neutral-900">
                              {f.position === 1 ? "🥇 P1" : f.position === 2 ? "🥈 P2" : f.position === 3 ? "🥉 P3" : "P" + f.position}
                            </td>
                            <td className="py-2 px-3">
                              <strong className="text-neutral-900">{f.driverName}</strong>
                            </td>
                            <td className="py-2 px-3 text-neutral-700 font-bold">
                              #{f.carNumber}
                            </td>
                            <td className="py-2 px-3 text-right font-black text-red-600">
                              +{f.totalPoints} pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              MODE B: INTAKE & SCORE SESSION (UPLOAD / PC / PASTE)
             ══════════════════════════════════════════════════════════════ */}
          {modalMode === "intake" && (
            <>
              {!processedResults ? (
                <div className="space-y-4">
                  {hasExistingResults && (
                    <button
                      type="button"
                      onClick={() => setModalMode("view_current")}
                      className="text-neutral-500 hover:text-neutral-900 text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                    >
                      ← Back to Current Results
                    </button>
                  )}

                  {/* SOURCE TABS */}
                  <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 p-1.5 rounded-2xl text-[11px] font-bold text-neutral-600">
                    <button
                      type="button"
                      onClick={() => setActiveTab("local")}
                      className={"py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center " + (activeTab === "local" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900")}
                    >
                      <Cpu className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span className="truncate">PC Files ({localSessions.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("upload")}
                      className={"py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center " + (activeTab === "upload" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900")}
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">Upload .JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("paste")}
                      className={"py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center " + (activeTab === "paste" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900")}
                    >
                      <FileCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Paste Web Text</span>
                    </button>
                  </div>

                  {/* TAB 1: LOCAL DETECTED SESSIONS */}
                  {activeTab === "local" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span>Detected in Documents/iRacing/results:</span>
                        <button
                          type="button"
                          onClick={fetchLocalSessions}
                          className="text-red-600 hover:text-red-700 font-bold uppercase text-[9px] cursor-pointer"
                        >
                          {loadingLocal ? "Scanning..." : "↻ Refresh"}
                        </button>
                      </div>

                      {localSessions.length === 0 ? (
                        <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-2xl text-center space-y-2">
                          <Cpu className="w-8 h-8 text-neutral-300 mx-auto" />
                          <strong className="text-neutral-800 block text-xs uppercase">No Local Sessions Found</strong>
                          <p className="text-neutral-500 text-[11px]">
                            Run an iRacing session on this PC, or upload a downloaded .JSON result file.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {localSessions.map((session, idx) => {
                            const isMatch =
                              round.track_name &&
                              session.trackName &&
                              session.trackName.toLowerCase().includes(round.track_name.toLowerCase().split(" ")[0]);

                            return (
                              <div
                                key={idx}
                                className={"p-3 rounded-2xl border transition flex items-center justify-between gap-3 " + (isMatch ? "bg-red-50/60 border-red-300 hover:border-red-500" : "bg-neutral-50 border-neutral-200 hover:border-neutral-300")}
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <strong className="text-xs font-black uppercase text-neutral-900 truncate">
                                      {session.trackName} {session.configName ? "(" + session.configName + ")" : ""}
                                    </strong>
                                    {isMatch && (
                                      <span className="px-1.5 py-0.2 bg-red-600 text-white font-black text-[8px] rounded uppercase shadow-2xs">
                                        🎯 Best Match
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-neutral-500 flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-neutral-700">📅 {session.fileDate || "Saved Session"}</span>
                                    <span>•</span>
                                    <span>Subsession #{session.subsessionId}</span>
                                    <span>•</span>
                                    <span>{session.driversCount} Drivers</span>
                                    <span>•</span>
                                    <span>Winner: <strong className="text-neutral-800">{session.winner}</strong></span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedRawSession(session)}
                                  className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-[10px] font-bold uppercase transition shrink-0 cursor-pointer shadow-xs"
                                >
                                  Select →
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: UPLOAD FILE */}
                  {activeTab === "upload" && (
                    <div className="space-y-4">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="p-8 border-2 border-dashed border-neutral-300 hover:border-red-500 rounded-3xl text-center space-y-3 cursor-pointer transition bg-neutral-50 hover:bg-red-50/30"
                      >
                        <Upload className="w-10 h-10 text-neutral-400 mx-auto" />
                        <div>
                          <strong className="text-xs font-black uppercase text-neutral-800 block">
                            Click or Drag & Drop iRacing Result File
                          </strong>
                          <span className="text-[10px] text-neutral-500">
                            Supports official iRacing result JSON files (.json)
                          </span>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PASTE TEXT / CSV */}
                  {activeTab === "paste" && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-neutral-700 block">
                          Paste iRacing Results Table or CSV:
                        </label>
                        <textarea
                          rows={6}
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                          placeholder={"1, PJ Losey, #17, 21596, 0x, 20 laps\n2, Charles Leclerc, #16, 67890, 4x, 20 laps"}
                          className="w-full bg-neutral-50 border border-neutral-300 rounded-2xl p-3 font-mono text-xs text-neutral-900 focus:outline-hidden focus:border-red-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleParsePastedText}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs uppercase rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Parse Text & Preview Points →</span>
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                /* STEP 2: PREVIEW & CONFIRM POINTS ALLOCATION */
                <div className="space-y-4">
                  {/* EVENT MATCH BANNER */}
                  <div className="p-4 bg-neutral-900 text-white rounded-2xl space-y-2 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase text-red-400">
                        Session Ingested • Subsession #{processedResults.subsessionId}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedRawSession(null)}
                        className="text-neutral-400 hover:text-white font-bold uppercase text-[9px] underline cursor-pointer"
                      >
                        ← Choose Different File
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black uppercase text-white leading-tight">
                          {processedResults.trackName} {processedResults.configName ? "(" + processedResults.configName + ")" : ""}
                        </h3>
                        <span className="text-[10px] text-neutral-300">
                          {processedResults.totalDrivers} Finishers • {processedResults.matchedCount} / {drivers.length} Registered Drivers Matched
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase">
                        Ready to Score
                      </span>
                    </div>
                  </div>

                  {/* POINTS PREVIEW TABLE */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                      <span>Championship Points Preview ({season?.points_allocation_system?.preset ? POINTS_PRESETS[season.points_allocation_system.preset]?.name : "FIA F1"}):</span>
                      <span className="text-neutral-400 text-[10px]">Fast Lap: +{fastLapBonus} pt</span>
                    </div>

                    {processedResults.finishes.length === 0 ? (
                      <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl text-center text-neutral-500 text-xs">
                        No race finishers found in the selected session.
                      </div>
                    ) : (
                      <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-100 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-600">
                            <tr>
                              <th className="py-2 px-3">Pos</th>
                              <th className="py-2 px-3">Driver</th>
                              <th className="py-2 px-3">Car #</th>
                              <th className="py-2 px-3">Inc</th>
                              <th className="py-2 px-3 text-right">Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 bg-white font-mono">
                            {processedResults.finishes.map((f: any) => (
                              <tr key={f.position} className={f.matchedDriverId ? "bg-emerald-50/40" : "hover:bg-neutral-50"}>
                                <td className="py-2.5 px-3 font-black text-neutral-900">
                                  {f.position === 1 ? "🥇 P1" : f.position === 2 ? "🥈 P2" : f.position === 3 ? "🥉 P3" : "P" + f.position}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <strong className="text-neutral-900">{f.driverName}</strong>
                                    {f.matchType === "ID_MATCH" ? (
                                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[8px] font-bold rounded uppercase flex items-center gap-0.5">
                                        🛡️ iR #{f.custId} Verified
                                      </span>
                                    ) : f.matchType === "NAME_MATCH" ? (
                                      <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 border border-blue-200 text-[8px] font-bold rounded uppercase">
                                        👤 Name Matched
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 bg-neutral-100 text-neutral-500 text-[8px] rounded uppercase">
                                        ⚪ Guest
                                      </span>
                                    )}
                                    {f.isFastestLap && (
                                      <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[8px] font-bold rounded uppercase">
                                        ⚡ Fast Lap
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-bold text-neutral-700">
                                  <div>
                                    <span>#{f.carNumber}</span>
                                    {f.sessionCarNumber && f.sessionCarNumber !== f.carNumber && (
                                      <span className="text-[9px] text-neutral-400 block font-normal">
                                        (Session #{f.sessionCarNumber})
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-neutral-500">
                                  {f.incidents}x
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-red-600">
                                  +{f.totalPoints} pts
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-neutral-700 font-bold uppercase text-[10px] transition cursor-pointer shadow-2xs"
          >
            Close
          </button>

          {modalMode === "intake" && processedResults && processedResults.finishes.length > 0 && (
            <button
              type="button"
              disabled={applying}
              onClick={handleCommitResults}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl font-black uppercase text-xs transition shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {applying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Awarding Points...</span>
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" />
                  <span>Apply Results & Update Standings →</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
