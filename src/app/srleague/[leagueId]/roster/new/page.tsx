"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, setDoc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueSeries, SRLeagueDriver } from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import {
  ArrowLeft,
  Users,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

export default function EnrollDriverPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const router = useRouter();
  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const [seriesList, setSeriesList] = useState<SRLeagueSeries[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [driverName, setDriverName] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [carClass, setCarClass] = useState("GT3");
  const [carModel, setCarModel] = useState("");
  const [teamName, setNewTeamName] = useState("");
  const [iRating, setIRating] = useState(3000);
  const [safetyRating, setSafetyRating] = useState("A 3.50");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!leagueId) return;
    const unsubLeague = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });

    const unsubSeries = onSnapshot(
      query(collection(db, "sr_league_series"), where("league_id", "==", leagueId)),
      (snap) => {
        const list: SRLeagueSeries[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setSeriesList(list);
        if (list.length > 0 && !selectedSeriesId) {
          setSelectedSeriesId(list[0].id);
        }
        setLoading(false);
      }
    );

    return () => {
      unsubLeague();
      unsubSeries();
    };
  }, [leagueId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !carNumber.trim()) return;

    setSaving(true);
    const driverId = `drv_${leagueId}_${Date.now()}`;

    const newDriver: SRLeagueDriver = {
      id: driverId,
      league_id: leagueId,
      driver_name: driverName.trim(),
      car_number: carNumber.trim(),
      car_class: carClass.trim() || "Open",
      car_model: carModel.trim() || "Race Car",
      team_name: teamName.trim() || "Independent",
      i_rating: Number(iRating) || 3000,
      safety_rating: safetyRating.trim() || "A 3.50",
      points_total: 0,
      penalty_points: 0,
      wins_count: 0,
      podiums_count: 0,
      poles_count: 0,
      dnfs_count: 0,
      incidents_total: 0,
      status: "active",
      created_at: Date.now(),
    };

    try {
      await setDoc(doc(db, "sr_league_drivers", driverId), newDriver);
      showToast({
        title: "🏎️ Driver Enrolled",
        message: `${newDriver.driver_name} (#${newDriver.car_number}) added to roster.`,
        icon: "✅",
      });
      router.push(`/srleague/${leagueId}/roster`);
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not enroll driver.",
        icon: "❌",
      });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 font-mono text-xs text-neutral-500">
        Loading...
      </div>
    );
  }

  // STATE GUARDIAN: IF NO SERIES CREATED, BLOCK DRIVER ENROLLMENT
  if (seriesList.length === 0) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
        <header className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-200">
            <Link
              href={`/srleague/${leagueId}`}
              className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
                Enroll Driver
              </h1>
              <span className="text-xs font-mono text-neutral-500">{league?.name}</span>
            </div>
          </div>
        </header>

        <main className="max-w-md w-full mx-auto">
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 text-center space-y-4 shadow-sm font-mono text-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto shadow-xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black uppercase text-neutral-900">
                Series Required First
              </h3>
              <p className="text-neutral-500 text-xs">
                You must create a competition series in this league before you can enroll drivers onto the roster.
              </p>
            </div>

            <Link
              href={`/srleague/${leagueId}/series/new`}
              className="inline-flex items-center justify-center px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-2xl shadow-md shadow-red-600/20"
            >
              + Create Series First
            </Link>
          </div>
        </main>

        <footer className="max-w-md w-full mx-auto text-center py-4 text-[11px] font-mono text-neutral-400">
          GridPass • Sim Racing League Manager
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
      {/* HEADER */}
      <header className="max-w-md w-full mx-auto">
        <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-200">
          <Link
            href={`/srleague/${leagueId}/roster`}
            className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
            title="Back to Roster"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
              Enroll Driver
            </h1>
            <span className="text-xs font-mono text-neutral-500">
              {league?.name || "Championship"}
            </span>
          </div>
        </div>
      </header>

      {/* FORM */}
      <main className="max-w-md w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
          
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            
            {/* SERIES SELECTOR */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Target Championship Series *
              </label>
              <select
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              >
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.game?.toUpperCase() || "IRACING"})
                  </option>
                ))}
              </select>
            </div>

            {/* DRIVER NAME */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Driver Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Morgan"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />
            </div>

            {/* CAR # & CLASS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Car # *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 44"
                  value={carNumber}
                  onChange={(e) => setCarNumber(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Car Class
                </label>
                <input
                  type="text"
                  placeholder="GT3 / GTP / Cup"
                  value={carClass}
                  onChange={(e) => setCarClass(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                />
              </div>
            </div>

            {/* CAR MODEL & TEAM */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Car Model
                </label>
                <input
                  type="text"
                  placeholder="Porsche 911 GT3 R"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Constructor / Team
                </label>
                <input
                  type="text"
                  placeholder="Apex Racing / Independent"
                  value={teamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                />
              </div>
            </div>

            {/* IRATING & SAFETY */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  iRating
                </label>
                <input
                  type="number"
                  value={iRating}
                  onChange={(e) => setIRating(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Safety Rating
                </label>
                <input
                  type="text"
                  placeholder="A 4.20"
                  value={safetyRating}
                  onChange={(e) => setSafetyRating(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
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
                <Users className="w-5 h-5" />
                <span>Enroll Driver into Series</span>
              </>
            )}
          </button>

        </form>
      </main>

      {/* FOOTER */}
      <footer className="max-w-md w-full mx-auto text-center py-4 text-[11px] font-mono text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}
