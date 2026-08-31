"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastContext";
import {
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
  ArrowLeft,
  Search,
  Zap,
  TrendingUp,
  TrendingDown,
  Shield,
  Copy,
  BarChart2,
  Sliders,
  Users,
  Flag,
  Share2,
  ExternalLink,
  Flame,
} from "lucide-react";

// Format milliseconds/lap time to mm:ss.sss
function formatLapTime(timeInMsOrSeconds: number | null | undefined): string {
  if (!timeInMsOrSeconds || timeInMsOrSeconds <= 0) return "—";
  // If in milliseconds (e.g. 105123)
  const seconds = timeInMsOrSeconds > 1000 ? timeInMsOrSeconds / 10000 : timeInMsOrSeconds;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, "0")}`;
}


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

function ResultsReaderContent() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ingestion state
  const [sourceTab, setSourceTab] = useState<"pc" | "upload" | "paste">("pc");
  const [localSessions, setLocalSessions] = useState<any[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [selectedRawSession, setSelectedRawSession] = useState<any | null>(null);
  const [pastedText, setPastedText] = useState("");

  // Analysis UI state
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<
    "classification" | "pace" | "safety" | "irating" | "compare" | "export"
  >("classification");
  const [searchQuery, setSearchQuery] = useState("");
  const [compareDriverA, setCompareDriverA] = useState<string>("");
  const [compareDriverB, setCompareDriverB] = useState<string>("");

  // Fetch local iRacing results
  const fetchLocalSessions = async () => {
    setLoadingLocal(true);
    try {
      const res = await fetch("/api/srleague/iracing/import-results");
      const data = await res.json();
      if (data.success && data.files) {
        setLocalSessions(data.files);
        // Auto-select first session if none selected
        if (!selectedRawSession && data.files.length > 0) {
          setSelectedRawSession(data.files[0]);
        }
      }
    } catch (err: any) {
      console.error("Failed to load local results:", err);
    } finally {
      setLoadingLocal(false);
    }
  };

  useEffect(() => {
    fetchLocalSessions();
  }, []);

  // Handle file upload
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
          fileDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          rawSummary: parsed,
        });
        showToast({ title: "📄 Session Loaded", message: "Loaded " + rawList.length + " finishers from " + file.name, icon: "✅" });
      } catch (err: any) {
        showToast({ title: "Parse Error", message: "Could not parse JSON. Ensure it is a valid iRacing result file.", icon: "❌" });
      }
    };
    reader.readAsText(file);
  };

  // Handle parse pasted text
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
          let carNum = String(posNum);
          let custId = "";
          let incidents = 0;

          cleanParts.forEach((part) => {
            if (/^#?\d{1,3}$/.test(part) && part !== cleanParts[0]) carNum = part.replace("#", "");
            if (/^\d{5,8}$/.test(part)) custId = part;
            if (/^\d+x$/i.test(part)) incidents = parseInt(part.replace(/x/i, ""), 10) || 0;
          });

          finishes.push({
            finish_position: posNum - 1,
            starting_position: posNum - 1,
            display_name: driverName,
            cust_id: custId || (100000 + idx),
            car_number: carNum,
            incidents: incidents,
            laps_complete: 20,
            best_lap_time: 0,
          });
        }
      });

      if (finishes.length === 0) {
        showToast({ title: "Parse Warning", message: "Could not detect driver rows.", icon: "⚠️" });
        return;
      }

      setSelectedRawSession({
        filename: "Pasted Web Session",
        subsessionId: Date.now(),
        trackName: "Imported Race",
        fileDate: "Just Now",
        rawSummary: {
          subsession_id: Date.now(),
          track: { track_name: "Imported Race", track_config_name: "Grand Prix" },
          session_results: [{ results: finishes }],
        },
      });

      showToast({ title: "📋 Session Loaded", message: "Parsed " + finishes.length + " finishing positions.", icon: "✅" });
    } catch (err: any) {
      showToast({ title: "Parse Error", message: err.message || "Failed to parse text.", icon: "❌" });
    }
  };

  // Structured Session Data
  const parsedData = useMemo(() => {
    if (!selectedRawSession) return null;
    const parsed = selectedRawSession.rawSummary || selectedRawSession;
    const { subsessionId, trackName, configName, rawList } = extractSessionData(parsed);

    // Find fastest lap in session
    let bestLapTimeOverall = Infinity;
    let fastestDriverName = "";
    rawList.forEach((r: any) => {
      if (r.best_lap_time && r.best_lap_time > 0 && r.best_lap_time < bestLapTimeOverall) {
        bestLapTimeOverall = r.best_lap_time;
        fastestDriverName = r.display_name;
      }
    });

    const driversList = rawList.map((entry: any, idx: number) => {
      const pos = (entry.finish_position ?? idx) + 1;
      const startPos = (entry.starting_position ?? idx) + 1;
      const delta = startPos - pos; // +3 means gained 3 positions
      const isFastLap = entry.best_lap_time > 0 && entry.best_lap_time === bestLapTimeOverall;

      const oldIr = entry.old_irating || 0;
      const newIr = entry.new_irating || 0;
      const irDelta = (newIr && oldIr) ? (newIr - oldIr) : 0;

      return {
        id: String(entry.cust_id || idx),
        pos,
        startPos,
        posDelta: delta,
        driverName: entry.display_name || entry.name || "Driver",
        custId: entry.cust_id ? String(entry.cust_id) : "—",
        carNumber: entry.car_number || (entry.livery?.car_number) || String(pos),
        carName: entry.car_name || "Toyota GR86",
        carClass: entry.car_class_short_name || "GT",
        lapsCompleted: entry.laps_complete || entry.laps_completed || 0,
        incidents: entry.incidents || 0,
        bestLapTime: entry.best_lap_time || 0,
        avgLapTime: entry.average_lap_time || 0,
        isFastestLap: isFastLap,
        isPole: startPos === 1,
        oldIrating: oldIr,
        newIrating: newIr,
        iratingDelta: irDelta,
        interval: entry.interval ? (entry.interval / 10000).toFixed(3) + "s" : (pos === 1 ? "Leader" : "—"),
        reasonOut: entry.reason_out || "Running",
      };
    });

    // Auto-set compare drivers if not set
    if (!compareDriverA && driversList.length > 0) setCompareDriverA(driversList[0].id);
    if (!compareDriverB && driversList.length > 1) setCompareDriverB(driversList[1].id);

    // Calculate session SOF (Strength of Field)
    const validIratings = driversList.filter((d: any) => d.newIrating > 0).map((d: any) => d.newIrating);
    const sof = validIratings.length > 0 ? Math.round(validIratings.reduce((a: number, b: number) => a + b, 0) / validIratings.length) : null;
    const totalIncidents = driversList.reduce((sum: number, d: any) => sum + d.incidents, 0);
    const cleanDriversCount = driversList.filter((d: any) => d.incidents === 0).length;

    return {
      subsessionId: parsed.subsession_id || selectedRawSession.subsessionId || "Unknown",
      startTime: parsed.start_time || selectedRawSession.startTime || "2026-02-16",
      trackName: parsed.track?.track_name || selectedRawSession.trackName || "Track",
      configName: parsed.track?.track_config_name || selectedRawSession.configName || "Standard Course",
      drivers: driversList,
      totalDrivers: driversList.length,
      winner: driversList[0]?.driverName || "Winner",
      fastestLapDriver: fastestDriverName,
      bestLapTime: bestLapTimeOverall !== Infinity ? bestLapTimeOverall : 0,
      sof: sof,
      totalIncidents: totalIncidents,
      cleanDriversCount: cleanDriversCount,
    };
  }, [selectedRawSession, compareDriverA, compareDriverB]);

  // Filtered drivers for search
  const filteredDrivers = useMemo(() => {
    if (!parsedData) return [];
    if (!searchQuery.trim()) return parsedData.drivers;
    const q = searchQuery.toLowerCase().trim();
    return parsedData.drivers.filter(
      (d: any) =>
        d.driverName.toLowerCase().includes(q) ||
        d.carNumber.includes(q) ||
        d.custId.includes(q)
    );
  }, [parsedData, searchQuery]);

  // Driver comparison entities
  const driverA = useMemo(() => parsedData?.drivers.find((d: any) => d.id === compareDriverA), [parsedData, compareDriverA]);
  const driverB = useMemo(() => parsedData?.drivers.find((d: any) => d.id === compareDriverB), [parsedData, compareDriverB]);

  // Markdown Summary Copy
  const handleCopyMarkdown = () => {
    if (!parsedData) return;
    let md = `# 🏁 ${parsedData.trackName} (${parsedData.configName})\n`;
    md += `**Subsession:** #${parsedData.subsessionId} • **Drivers:** ${parsedData.totalDrivers} • **SOF:** ${parsedData.sof || "N/A"}\n\n`;
    md += `| Pos | Car | Driver | Inc | Laps | Best Lap | iR Delta |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    parsedData.drivers.forEach((d: any) => {
      md += `| P${d.pos} | #${d.carNumber} | ${d.driverName} | ${d.incidents}x | ${d.lapsCompleted} | ${formatLapTime(d.bestLapTime)} | ${d.iratingDelta > 0 ? "+" + d.iratingDelta : d.iratingDelta} |\n`;
    });
    navigator.clipboard.writeText(md);
    showToast({ title: "📋 Markdown Copied", message: "Race classification table copied to clipboard!", icon: "✅" });
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6 font-mono text-xs">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION HEADER
         ───────────────────────────────────────────────────────────── */}
      <header className="max-w-6xl w-full mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <Link
              href="/srcommander"
              className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
              title="Back to Sim Commander"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] uppercase tracking-wider">
                  SR Commander Telemetry
                </span>
                <span className="text-neutral-400 text-[10px]">Results Reader Engine</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-neutral-900 leading-tight">
                iRacing Results & Telemetry Analyzer
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLocalSessions}
              className="px-3 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl font-bold text-[10px] uppercase flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              {loadingLocal ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" /> : <Cpu className="w-3.5 h-3.5 text-red-600" />}
              <span>Scan Local ({localSessions.length})</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. INGESTION SOURCE TOOLBAR (3 TABS)
           ───────────────────────────────────────────────────────────── */}
        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setSourceTab("pc")}
                className={"px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase transition cursor-pointer flex items-center gap-1.5 " + (sourceTab === "pc" ? "bg-neutral-900 text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900")}
              >
                <Cpu className="w-3.5 h-3.5 text-red-500" />
                <span>PC Results ({localSessions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceTab("upload")}
                className={"px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase transition cursor-pointer flex items-center gap-1.5 " + (sourceTab === "upload" ? "bg-neutral-900 text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900")}
              >
                <Upload className="w-3.5 h-3.5 text-blue-500" />
                <span>Upload .JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceTab("paste")}
                className={"px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase transition cursor-pointer flex items-center gap-1.5 " + (sourceTab === "paste" ? "bg-neutral-900 text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900")}
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                <span>Paste Text</span>
              </button>
            </div>

            {selectedRawSession && (
              <span className="text-[10px] text-neutral-500 font-bold">
                Active: <strong className="text-neutral-900">{selectedRawSession.trackName || "Session"}</strong> (#{selectedRawSession.subsessionId})
              </span>
            )}
          </div>

          {/* TAB 1: PC DETECTED SESSIONS LIST */}
          {sourceTab === "pc" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {localSessions.map((session, idx) => {
                  const isSelected = selectedRawSession?.subsessionId === session.subsessionId;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedRawSession(session)}
                      className={"p-2.5 rounded-2xl border text-left shrink-0 min-w-[220px] transition cursor-pointer " + (isSelected ? "bg-red-50 border-red-400 shadow-xs" : "bg-white border-neutral-200 hover:border-neutral-300")}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <strong className="text-[11px] font-black uppercase text-neutral-900 truncate block">
                          {session.trackName}
                        </strong>
                        <span className="text-[9px] text-neutral-400">#{session.subsessionId}</span>
                      </div>
                      <div className="text-[9px] text-neutral-500 flex items-center gap-2 mt-0.5">
                        <span>📅 {session.fileDate || "Saved"}</span>
                        <span>•</span>
                        <span>{session.driversCount} Cars</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD FILE */}
          {sourceTab === "upload" && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 border-2 border-dashed border-neutral-300 hover:border-red-500 rounded-2xl text-center space-y-1 cursor-pointer transition bg-white hover:bg-red-50/20"
            >
              <Upload className="w-6 h-6 text-neutral-400 mx-auto" />
              <strong className="text-xs font-black uppercase text-neutral-800 block">
                Click or Drop iRacing Result File (.json)
              </strong>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </div>
          )}

          {/* TAB 3: PASTE WEB TEXT */}
          {sourceTab === "paste" && (
            <div className="space-y-2 bg-white p-3 rounded-2xl border border-neutral-200">
              <textarea
                rows={3}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste iRacing web table rows (Pos, Driver, Car#, CustID, Incidents...)"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 font-mono text-[11px] text-neutral-900 focus:outline-hidden focus:border-red-500"
              />
              <button
                type="button"
                onClick={handleParsePastedText}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Parse Text & Load Session →</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN ANALYTICS WORKSPACE (IF SESSION LOADED)
         ───────────────────────────────────────────────────────────── */}
      {parsedData ? (
        <main className="max-w-6xl w-full mx-auto space-y-5">
          
          {/* 🚩 HERO SESSION SUMMARY CARD */}
          <div className="p-5 bg-neutral-900 text-white rounded-3xl space-y-4 shadow-xl border border-neutral-800">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                    Subsession #{parsedData.subsessionId}
                  </span>
                  <span className="text-neutral-400 text-[10px]">
                    {parsedData.startTime}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight leading-tight">
                  {parsedData.trackName}
                </h2>
                <span className="text-xs text-neutral-300 block">
                  Configuration: <strong className="text-white">{parsedData.configName}</strong>
                </span>
              </div>

              {/* METRIC PILLS */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="p-3 bg-white/10 rounded-2xl text-center min-w-[90px] backdrop-blur-xs">
                  <span className="text-neutral-400 block text-[9px] font-bold uppercase">Grid Size</span>
                  <strong className="text-base font-black text-white">{parsedData.totalDrivers}</strong>
                  <span className="text-[9px] text-neutral-400 block">Finishers</span>
                </div>

                {parsedData.sof && (
                  <div className="p-3 bg-white/10 rounded-2xl text-center min-w-[90px] backdrop-blur-xs">
                    <span className="text-neutral-400 block text-[9px] font-bold uppercase">Strength of Field</span>
                    <strong className="text-base font-black text-amber-400">{parsedData.sof}</strong>
                    <span className="text-[9px] text-neutral-400 block">SOF Rating</span>
                  </div>
                )}

                <div className="p-3 bg-white/10 rounded-2xl text-center min-w-[100px] backdrop-blur-xs">
                  <span className="text-neutral-400 block text-[9px] font-bold uppercase">Race Winner</span>
                  <strong className="text-xs font-black text-white block truncate max-w-[120px]">
                    🥇 {parsedData.winner}
                  </strong>
                  <span className="text-[9px] text-emerald-400 block">P1 Finish</span>
                </div>

                {parsedData.bestLapTime > 0 && (
                  <div className="p-3 bg-white/10 rounded-2xl text-center min-w-[110px] backdrop-blur-xs">
                    <span className="text-neutral-400 block text-[9px] font-bold uppercase">Fastest Lap</span>
                    <strong className="text-xs font-black text-purple-300 block">
                      ⚡ {formatLapTime(parsedData.bestLapTime)}
                    </strong>
                    <span className="text-[9px] text-neutral-400 block truncate max-w-[110px]">
                      {parsedData.fastestLapDriver}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              4. INTERACTIVE ANALYSIS TABS
             ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 bg-neutral-100 p-1.5 rounded-2xl text-[11px] font-bold text-neutral-600">
            <button
              type="button"
              onClick={() => setActiveAnalysisTab("classification")}
              className={"py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center " + (activeAnalysisTab === "classification" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900")}
            >
              <Trophy className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="truncate">Classification</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAnalysisTab("pace")}
              className={"py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center " + (activeAnalysisTab === "pace" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900")}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Lap Pace</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAnalysisTab("safety")}
              className={"py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center " + (activeAnalysisTab === "safety" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900")}
            >
              <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Safety (Incidents)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAnalysisTab("irating")}
              className={"py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center " + (activeAnalysisTab === "irating" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900")}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">iRating Delta</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAnalysisTab("compare")}
              className={"py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center " + (activeAnalysisTab === "compare" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900")}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">Head-to-Head</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAnalysisTab("export")}
              className={"py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center " + (activeAnalysisTab === "export" ? "bg-white text-neutral-900 shadow-xs font-black" : "hover:text-neutral-900")}
            >
              <Share2 className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
              <span className="truncate">Export Card</span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              TAB 1: OFFICIAL RACE CLASSIFICATION TABLE
             ───────────────────────────────────────────────────────────── */}
          {activeAnalysisTab === "classification" && (
            <div className="space-y-3">
              {/* SEARCH & FILTER BAR */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by driver name, car #, or custID..."
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-hidden focus:border-red-500"
                  />
                </div>
                <div className="text-[11px] text-neutral-500 font-bold">
                  Showing {filteredDrivers.length} of {parsedData.totalDrivers} Drivers
                </div>
              </div>

              {/* TABLE */}
              <div className="border border-neutral-200 rounded-3xl overflow-hidden shadow-xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-600">
                      <tr>
                        <th className="py-3 px-4">Pos</th>
                        <th className="py-3 px-3">Start</th>
                        <th className="py-3 px-3">+/-</th>
                        <th className="py-3 px-3">Car #</th>
                        <th className="py-3 px-4">Driver Name</th>
                        <th className="py-3 px-3">Cust ID</th>
                        <th className="py-3 px-3">Inc</th>
                        <th className="py-3 px-3">Laps</th>
                        <th className="py-3 px-4">Best Lap</th>
                        <th className="py-3 px-4 text-right">Interval</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono">
                      {filteredDrivers.map((d: any) => (
                        <tr key={d.id} className="hover:bg-neutral-50 transition">
                          <td className="py-3 px-4 font-black text-neutral-900">
                            {d.pos === 1 ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-black">🥇 P1</span>
                            ) : d.pos === 2 ? (
                              <span className="px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded font-black">🥈 P2</span>
                            ) : d.pos === 3 ? (
                              <span className="px-2 py-0.5 bg-amber-700/20 text-amber-900 rounded font-black">🥉 P3</span>
                            ) : (
                              <span>P{d.pos}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-neutral-500">
                            P{d.startPos}
                          </td>
                          <td className="py-3 px-3 font-bold">
                            {d.posDelta > 0 ? (
                              <span className="text-emerald-600 flex items-center gap-0.5">
                                ▲{d.posDelta}
                              </span>
                            ) : d.posDelta < 0 ? (
                              <span className="text-red-600 flex items-center gap-0.5">
                                ▼{Math.abs(d.posDelta)}
                              </span>
                            ) : (
                              <span className="text-neutral-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-black text-neutral-900">
                            #{d.carNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <strong className="text-neutral-900 text-xs">{d.driverName}</strong>
                              {d.isFastestLap && (
                                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[8px] font-bold rounded uppercase">
                                  ⚡ Fast Lap
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-neutral-400 text-[10px]">
                            #{d.custId}
                          </td>
                          <td className="py-3 px-3">
                            <span className={"font-bold " + (d.incidents === 0 ? "text-emerald-600" : d.incidents > 6 ? "text-red-600" : "text-neutral-700")}>
                              {d.incidents}x
                            </span>
                          </td>
                          <td className="py-3 px-3 text-neutral-600">
                            {d.lapsCompleted}
                          </td>
                          <td className="py-3 px-4 text-neutral-800 font-bold">
                            {formatLapTime(d.bestLapTime)}
                          </td>
                          <td className="py-3 px-4 text-right text-neutral-600 font-bold">
                            {d.interval}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: PACE & LAP TIMES ANALYSIS
             ───────────────────────────────────────────────────────────── */}
          {activeAnalysisTab === "pace" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-3xl space-y-1">
                  <span className="text-purple-600 font-bold text-[10px] uppercase block">Fastest Lap of Race</span>
                  <strong className="text-lg font-black text-purple-950 block">
                    ⚡ {formatLapTime(parsedData.bestLapTime)}
                  </strong>
                  <span className="text-[11px] text-purple-800 font-sans block">{parsedData.fastestLapDriver}</span>
                </div>
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-1">
                  <span className="text-neutral-500 font-bold text-[10px] uppercase block">Average Best Lap</span>
                  <strong className="text-lg font-black text-neutral-900 block">
                    {formatLapTime(
                      parsedData.drivers.reduce((acc: number, d: any) => acc + (d.bestLapTime || 0), 0) / (parsedData.drivers.length || 1)
                    )}
                  </strong>
                  <span className="text-[11px] text-neutral-500 font-sans block">Field Average</span>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-1">
                  <span className="text-emerald-600 font-bold text-[10px] uppercase block">P1 to P2 Lap Gap</span>
                  <strong className="text-lg font-black text-emerald-950 block">
                    {parsedData.drivers.length > 1 && parsedData.drivers[0].bestLapTime && parsedData.drivers[1].bestLapTime ? (
                      "+" + ((parsedData.drivers[1].bestLapTime - parsedData.drivers[0].bestLapTime) / 10000).toFixed(3) + "s"
                    ) : "—"}
                  </strong>
                  <span className="text-[11px] text-emerald-800 font-sans block">P1 vs P2 Best Lap Delta</span>
                </div>
              </div>

              {/* PACE TABLE */}
              <div className="border border-neutral-200 rounded-3xl overflow-hidden shadow-xs bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-600">
                    <tr>
                      <th className="py-3 px-4">Pos</th>
                      <th className="py-3 px-4">Driver</th>
                      <th className="py-3 px-4">Best Lap Time</th>
                      <th className="py-3 px-4">Avg Lap Time</th>
                      <th className="py-3 px-4 text-right">Delta to Fastest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono">
                    {parsedData.drivers.map((d: any) => {
                      const deltaToFastest = d.bestLapTime && parsedData.bestLapTime ? (
                        (d.bestLapTime - parsedData.bestLapTime) / 10000
                      ) : null;

                      return (
                        <tr key={d.id} className="hover:bg-neutral-50">
                          <td className="py-3 px-4 font-black">P{d.pos}</td>
                          <td className="py-3 px-4">
                            <strong className="text-neutral-900">#{d.carNumber} {d.driverName}</strong>
                          </td>
                          <td className="py-3 px-4 font-bold text-purple-700">
                            {formatLapTime(d.bestLapTime)}
                          </td>
                          <td className="py-3 px-4 text-neutral-700">
                            {formatLapTime(d.avgLapTime)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            {deltaToFastest === 0 ? (
                              <span className="text-purple-600">PURPLE (0.000s)</span>
                            ) : deltaToFastest !== null ? (
                              <span className="text-neutral-600">+{deltaToFastest.toFixed(3)}s</span>
                            ) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 3: SAFETY & INCIDENT AUDIT
             ───────────────────────────────────────────────────────────── */}
          {activeAnalysisTab === "safety" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-1">
                  <span className="text-emerald-600 font-bold text-[10px] uppercase block">Clean Driver Awards</span>
                  <strong className="text-lg font-black text-emerald-950 block">
                    🛡️ {parsedData.cleanDriversCount} Drivers
                  </strong>
                  <span className="text-[11px] text-emerald-800 font-sans block">0x Incident-Free Finishes</span>
                </div>
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-1">
                  <span className="text-neutral-500 font-bold text-[10px] uppercase block">Total Field Incidents</span>
                  <strong className="text-lg font-black text-neutral-900 block">
                    {parsedData.totalIncidents}x Total
                  </strong>
                  <span className="text-[11px] text-neutral-500 font-sans block">Across all competitors</span>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-3xl space-y-1">
                  <span className="text-red-600 font-bold text-[10px] uppercase block">Average Incident Count</span>
                  <strong className="text-lg font-black text-red-950 block">
                    {(parsedData.totalIncidents / (parsedData.totalDrivers || 1)).toFixed(1)}x / Driver
                  </strong>
                  <span className="text-[11px] text-red-800 font-sans block">Field Safety Rating Index</span>
                </div>
              </div>

              {/* CLEAN DRIVERS HIGHLIGHT */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-2">
                <h3 className="text-xs font-black uppercase text-neutral-800 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>0x Clean Driving Honor Roll:</span>
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {parsedData.drivers.filter((d: any) => d.incidents === 0).map((d: any) => (
                    <span key={d.id} className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1">
                      <span>🥇 #{d.carNumber}</span>
                      <span>{d.driverName}</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">0x CLEAN</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 4: IRATING DELTA
             ───────────────────────────────────────────────────────────── */}
          {activeAnalysisTab === "irating" && (
            <div className="border border-neutral-200 rounded-3xl overflow-hidden shadow-xs bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-600">
                  <tr>
                    <th className="py-3 px-4">Pos</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Pre-Race iR</th>
                    <th className="py-3 px-4">Post-Race iR</th>
                    <th className="py-3 px-4 text-right">iRating Gain / Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-mono">
                  {parsedData.drivers.map((d: any) => (
                    <tr key={d.id} className="hover:bg-neutral-50">
                      <td className="py-3 px-4 font-black">P{d.pos}</td>
                      <td className="py-3 px-4">
                        <strong className="text-neutral-900">#{d.carNumber} {d.driverName}</strong>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {d.oldIrating ? d.oldIrating : "—"}
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-900">
                        {d.newIrating ? d.newIrating : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-black">
                        {d.iratingDelta > 0 ? (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+{d.iratingDelta} iR ▲</span>
                        ) : d.iratingDelta < 0 ? (
                          <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md">{d.iratingDelta} iR ▼</span>
                        ) : (
                          <span className="text-neutral-400">0 iR</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 5: DRIVER HEAD-TO-HEAD COMPARISON
             ───────────────────────────────────────────────────────────── */}
          {activeAnalysisTab === "compare" && (
            <div className="space-y-4">
              {/* SELECT DRIVERS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-neutral-50 rounded-3xl border border-neutral-200">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Driver 1:</label>
                  <select
                    value={compareDriverA}
                    onChange={(e) => setCompareDriverA(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-xs font-bold text-neutral-900"
                  >
                    {parsedData.drivers.map((d: any) => (
                      <option key={d.id} value={d.id}>P{d.pos} • #{d.carNumber} {d.driverName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Driver 2:</label>
                  <select
                    value={compareDriverB}
                    onChange={(e) => setCompareDriverB(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-xs font-bold text-neutral-900"
                  >
                    {parsedData.drivers.map((d: any) => (
                      <option key={d.id} value={d.id}>P{d.pos} • #{d.carNumber} {d.driverName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* COMPARISON CARDS */}
              {driverA && driverB && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* DRIVER A */}
                  <div className="p-5 bg-white border-2 border-neutral-900 rounded-3xl space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-xl bg-neutral-900 text-white font-black text-xs">
                        P{driverA.pos} FINISH
                      </span>
                      <span className="text-neutral-500 font-bold text-xs">#{driverA.carNumber}</span>
                    </div>
                    <h3 className="text-lg font-black uppercase text-neutral-900">{driverA.driverName}</h3>
                    
                    <div className="space-y-2 text-xs divide-y divide-neutral-100">
                      <div className="flex justify-between py-1.5">
                        <span className="text-neutral-500">Grid Start:</span>
                        <strong className="text-neutral-900">P{driverA.startPos}</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-neutral-500">Best Lap:</span>
                        <strong className="text-purple-700">{formatLapTime(driverA.bestLapTime)}</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-neutral-500">Incidents:</span>
                        <strong className={driverA.incidents === 0 ? "text-emerald-600" : "text-neutral-900"}>{driverA.incidents}x</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-neutral-500">iRating Impact:</span>
                        <strong className={driverA.iratingDelta >= 0 ? "text-emerald-600" : "text-red-600"}>
                          {driverA.iratingDelta > 0 ? "+" + driverA.iratingDelta : driverA.iratingDelta} iR
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* DRIVER B */}
                  <div className="p-5 bg-white border-2 border-neutral-300 rounded-3xl space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-xl bg-neutral-200 text-neutral-900 font-black text-xs">
                        P{driverB.pos} FINISH
                      </span>
                      <span className="text-neutral-500 font-bold text-xs">#{driverB.carNumber}</span>
                    </div>
                    <h3 className="text-lg font-black uppercase text-neutral-900">{driverB.driverName}</h3>
                    
                    <div className="space-y-2 text-xs divide-y divide-neutral-100">
                      <div className="flex justify-between py-1.5">
                        <span className="text-neutral-500">Grid Start:</span>
                        <strong className="text-neutral-900">P{driverB.startPos}</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-neutral-500">Best Lap:</span>
                        <strong className="text-purple-700">{formatLapTime(driverB.bestLapTime)}</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-neutral-500">Incidents:</span>
                        <strong className={driverB.incidents === 0 ? "text-emerald-600" : "text-neutral-900"}>{driverB.incidents}x</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-neutral-500">iRating Impact:</span>
                        <strong className={driverB.iratingDelta >= 0 ? "text-emerald-600" : "text-red-600"}>
                          {driverB.iratingDelta > 0 ? "+" + driverB.iratingDelta : driverB.iratingDelta} iR
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 6: EXPORT & SHARE
             ───────────────────────────────────────────────────────────── */}
          {activeAnalysisTab === "export" && (
            <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-neutral-900">Export & Share Race Data</h3>
                <p className="text-neutral-500 text-xs">
                  Generate Discord race reports, social media recap cards, or raw markdown.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="p-4 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-2xl text-left font-bold transition cursor-pointer shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Copy className="w-5 h-5 text-red-600" />
                    <div>
                      <strong className="text-xs uppercase text-neutral-900 block">Copy Markdown Table</strong>
                      <span className="text-[10px] text-neutral-500 font-normal">Formatted for Discord / Reddit / Docs</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const jsonStr = JSON.stringify(parsedData, null, 2);
                    navigator.clipboard.writeText(jsonStr);
                    showToast({ title: "📄 JSON Copied", message: "Parsed session JSON copied to clipboard!", icon: "✅" });
                  }}
                  className="p-4 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-2xl text-left font-bold transition cursor-pointer shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="w-5 h-5 text-blue-600" />
                    <div>
                      <strong className="text-xs uppercase text-neutral-900 block">Copy Clean JSON</strong>
                      <span className="text-[10px] text-neutral-500 font-normal">Structured API data for downstream tools</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            </div>
          )}

        </main>
      ) : (
        <div className="max-w-xl w-full mx-auto p-12 bg-neutral-50 border border-neutral-200 rounded-3xl text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto" />
          <strong className="text-sm font-black uppercase text-neutral-900 block">
            Scanning for iRacing Results...
          </strong>
          <p className="text-neutral-500 text-xs">
            Select a session from the toolbar above or upload an iRacing result file.
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. FOOTER
         ───────────────────────────────────────────────────────────── */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 text-[11px] font-mono text-neutral-400 flex items-center justify-center gap-2">
        <Trophy className="w-3.5 h-3.5 text-neutral-400" />
        <span>GridPass Sim Commander • Motorsport Telemetry & Analytics Engine</span>
      </footer>

    </div>
  );
}

export default function ResultsReaderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      }
    >
      <ResultsReaderContent />
    </Suspense>
  );
}
