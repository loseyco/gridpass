"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { doc, collection, query, where, onSnapshot, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueSeries, SRLeagueSeason, SRLeagueDriver } from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import { useLeaguePermissions } from "@/lib/hooks/useLeaguePermissions";
import {
  Users,
  ArrowLeft,
  Plus,
  Search,
  AlertCircle,
  Trophy,
  Trash2,
  Car,
  Shield,
  MessageSquare,
  User,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

export default function LeagueRosterPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const { user, isLeagueOwner } = useLeaguePermissions(league);
  const [seriesList, setSeriesList] = useState<SRLeagueSeries[]>([]);
  const [seasonsList, setSeasonsList] = useState<SRLeagueSeason[]>([]);
  const [drivers, setDrivers] = useState<SRLeagueDriver[]>([]);
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    if (!leagueId) return;
    const q = query(collection(db, "sr_league_series"), where("league_id", "==", leagueId));
    const unsub = onSnapshot(q, (snap) => {
      const list: SRLeagueSeries[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setSeriesList(list);
    });
    return () => unsub();
  }, [leagueId]);

  // 3. Fetch Seasons
  useEffect(() => {
    if (!leagueId) return;
    const q = query(collection(db, "sr_league_seasons"), where("league_id", "==", leagueId));
    const unsub = onSnapshot(q, (snap) => {
      const list: SRLeagueSeason[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setSeasonsList(list);
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
      setDrivers(list);
      setLoading(false);
    });
    return () => unsub();
  }, [leagueId]);

  // Filter drivers by search and season tab
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const matchesSeason =
        selectedSeasonFilter === "all" ||
        d.season_id === selectedSeasonFilter ||
        (!d.season_id && selectedSeasonFilter === "all");

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.driver_name.toLowerCase().includes(q) ||
        (d.car_number && d.car_number.toLowerCase().includes(q)) ||
        (d.team_name && d.team_name.toLowerCase().includes(q)) ||
        (d.iracing_cust_id && d.iracing_cust_id.toLowerCase().includes(q));

      return matchesSeason && matchesSearch;
    });
  }, [drivers, selectedSeasonFilter, searchQuery]);

  // Delete / Remove Driver Entry Handler
  const handleDeleteDriver = async (driver: SRLeagueDriver) => {
    if (!confirm(`Remove #${driver.car_number} ${driver.driver_name} from the roster?`)) {
      return;
    }

    setDeletingId(driver.id);
    try {
      await deleteDoc(doc(db, "sr_league_drivers", driver.id));
      await updateDoc(doc(db, "sr_leagues", leagueId), {
        total_drivers: increment(-1),
        updated_at: Date.now(),
      }).catch(() => {});

      if (driver.season_id && driver.season_id !== "default_season") {
        await updateDoc(doc(db, "sr_league_seasons", driver.season_id), {
          total_drivers: increment(-1),
          updated_at: Date.now(),
        }).catch(() => {});
      }

      showToast({
        title: "🗑️ Driver Removed",
        message: `${driver.driver_name} was removed from the roster.`,
        icon: "🗑️",
      });
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not remove driver.",
        icon: "❌",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6 font-mono text-xs">
      {/* TOP HEADER */}
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
              <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
                Driver Roster
              </h1>
              <span className="text-xs text-neutral-500">
                {league?.name || "Championship"} • {filteredDrivers.length} Verified Competitors
              </span>
            </div>
          </div>

          <Link
            href={`/srleague/${leagueId}/join`}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold uppercase rounded-2xl shadow-md shadow-red-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Join Grid</span>
          </Link>
        </div>

        {/* SEASON FILTER PILLS */}
        {seasonsList.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-2xl border border-neutral-200 text-[11px] font-bold overflow-x-auto">
            <button
              onClick={() => setSelectedSeasonFilter("all")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                selectedSeasonFilter === "all" ? "bg-white text-neutral-900 shadow-2xs" : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              All Seasons ({drivers.length})
            </button>
            {seasonsList.map((s) => {
              const seasonDriverCount = drivers.filter((d) => d.season_id === s.id).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeasonFilter(s.id)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                    selectedSeasonFilter === s.id ? "bg-white text-neutral-900 shadow-2xs" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {s.name} ({seasonDriverCount})
                </button>
              );
            })}
          </div>
        )}

        {/* SEARCH BAR */}
        {drivers.length > 0 && (
          <div className="relative w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search driver by name, #, team, or iRacing ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 rounded-2xl pl-10 pr-4 py-3 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 focus:bg-white transition"
            />
          </div>
        )}
      </header>

      {/* MAIN DRIVER LIST (STRICT ZERO FAKE DATA) */}
      <main className="max-w-xl w-full mx-auto space-y-3">
        {loading ? (
          <div className="p-12 text-center text-neutral-400">Loading Drivers...</div>
        ) : filteredDrivers.length === 0 ? (
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <Users className="w-10 h-10 text-neutral-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-black uppercase text-neutral-900">
                No Drivers Enrolled
              </h3>
              <p className="text-neutral-500 text-xs">
                {selectedSeasonFilter !== "all" ? "No drivers registered in this season yet." : "Register competitors to populate the official championship grid."}
              </p>
            </div>
            <Link
              href={`/srleague/${leagueId}/join`}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-xl shadow-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Claim First Grid Spot</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDrivers.map((d) => (
              <div
                key={d.id}
                className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3 shadow-xs hover:border-neutral-300 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-2xl bg-neutral-900 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                      #{d.car_number || "00"}
                    </span>
                    <div className="min-w-0">
                      <strong className="text-sm font-black text-neutral-900 block leading-tight truncate">
                        {d.driver_name}
                      </strong>
                      <span className="text-[11px] text-neutral-500 truncate block mt-0.5">
                        {d.team_name || "Independent"} • {d.car_model || "Toyota GR86 Cup"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 font-bold text-[10px] text-neutral-700 uppercase">
                      {d.car_class || "GR86"}
                    </span>

                    {/* EDIT DRIVER BUTTON (ORGANIZER OR SELF) */}
                    {(isLeagueOwner || (user?.uid && d.user_id === user.uid)) && (
                      <Link
                        href={`/srleague/${leagueId}/roster/${d.id}/edit`}
                        className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 rounded-lg transition text-neutral-700 hover:text-neutral-950 font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                        title="Edit Driver Profile & Number"
                      >
                        <User className="w-3 h-3 text-red-600" />
                        <span>Edit</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* VERIFIED REAL DATA ROW (ZERO FILLER STATS) */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-200 text-center">
                  <div className="p-2 bg-white rounded-xl border border-neutral-200">
                    <span className="text-[9px] text-neutral-400 block uppercase font-bold">iRacing ID</span>
                    <strong className="text-neutral-900 block text-xs">
                      {d.iracing_cust_id ? `#${d.iracing_cust_id}` : "—"}
                    </strong>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-neutral-200">
                    <span className="text-[9px] text-neutral-400 block uppercase font-bold">Championship</span>
                    <strong className="text-red-600 block text-xs">
                      {d.points_total || 0} pts
                    </strong>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-neutral-200">
                    <span className="text-[9px] text-neutral-400 block uppercase font-bold">Discord</span>
                    <strong className="text-neutral-700 block text-xs truncate">
                      {d.discord_handle || "—"}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="max-w-xl w-full mx-auto text-center py-4 text-[11px] text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}
