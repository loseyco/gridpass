"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, deleteDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SRLeague, SRLeagueDriver } from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import { useLeaguePermissions } from "@/lib/hooks/useLeaguePermissions";
import {
  ArrowLeft,
  User,
  Car,
  Loader2,
  Trash2,
  Check,
  ShieldAlert,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string; driverId: string }>;
}

export default function EditDriverPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";
  const driverId = unwrappedParams?.driverId || "";

  const router = useRouter();
  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const { user, isLeagueOwner, authLoading } = useLeaguePermissions(league);
  const [driver, setDriver] = useState<SRLeagueDriver | null>(null);
  const [loading, setLoading] = useState(true);

  const [driverName, setDriverName] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [carModel, setCarModel] = useState("Toyota GR86 Cup");
  const [carClass, setCarClass] = useState("GR86");
  const [custNumber, setCustNumber] = useState("");
  const [teamName, setTeamName] = useState("");
  const [discordHandle, setDiscordHandle] = useState("");
  const [pointsTotal, setPointsTotal] = useState(0);

  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!leagueId || !driverId) return;

    const unsubLeague = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });

    const unsubDriver = onSnapshot(doc(db, "sr_league_drivers", driverId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...(snap.data() as any) } as any;
        setDriver(data);
        setDriverName(data.driver_name || "");
        setCarNumber(data.car_number || "");
        setCarModel(data.car_model || "Toyota GR86 Cup");
        setCarClass(data.car_class || "GR86");
        setCustNumber(data.iracing_cust_id || "");
        setTeamName(data.team_name || "");
        setDiscordHandle(data.discord_handle || "");
        setPointsTotal(data.points_total || 0);
      }
      setLoading(false);
    });

    return () => {
      unsubLeague();
      unsubDriver();
    };
  }, [leagueId, driverId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) return;

    setSaving(true);
    const updates: any = {
      driver_name: driverName.trim(),
      car_number: carNumber.trim() || "00",
      preferred_car_number: carNumber.trim() || "00",
      car_model: carModel.trim() || "Toyota GR86 Cup",
      car_class: carClass.trim() || "GR86",
      iracing_cust_id: custNumber.trim() || "",
      team_name: teamName.trim() || "",
      discord_handle: discordHandle.trim() || "",
      points_total: Number(pointsTotal) || 0,
      updated_at: Date.now(),
    };

    try {
      await updateDoc(doc(db, "sr_league_drivers", driverId), updates);
      showToast({
        title: "✅ Driver Updated",
        message: `Changes saved for #${updates.car_number} ${updates.driver_name}.`,
        icon: "✅",
      });
      if (driver?.series_id) {
        router.push(`/srleague/${leagueId}/series/${driver.series_id}`);
      } else {
        router.push(`/srleague/${leagueId}`);
      }
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not update driver.",
        icon: "❌",
      });
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "sr_league_drivers", driverId));
      await updateDoc(doc(db, "sr_leagues", leagueId), {
        total_drivers: increment(-1),
        updated_at: Date.now(),
      }).catch(() => {});

      if (driver?.season_id && driver.season_id !== "default_season") {
        await updateDoc(doc(db, "sr_league_seasons", driver.season_id), {
          total_drivers: increment(-1),
          updated_at: Date.now(),
        }).catch(() => {});
      }

      showToast({
        title: "🗑️ Driver Removed",
        message: `${driver?.driver_name || "Driver"} was removed from the roster.`,
        icon: "🗑️",
      });
      if (driver?.series_id) {
        router.push(`/srleague/${leagueId}/series/${driver.series_id}`);
      } else {
        router.push(`/srleague/${leagueId}`);
      }
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not remove driver.",
        icon: "❌",
      });
      setDeleting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 font-mono text-xs text-neutral-500">
        Loading Driver Details...
      </div>
    );
  }

  // 🔒 RBAC GATE: Only League Owner or Driver themselves can edit
  const canEdit = isLeagueOwner || (user?.uid && driver?.user_id === user.uid);
  if (!canEdit) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6 font-mono text-xs">
        <main className="max-w-md w-full mx-auto text-center pt-20 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
            Access Denied
          </h1>
          <p className="text-xs text-neutral-500">
            You do not have permission to edit this driver entry. Only league organizers or the driver themselves can modify this profile.
          </p>
          <Link
            href={driver?.series_id ? `/srleague/${leagueId}/series/${driver.series_id}` : `/srleague/${leagueId}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-2xl shadow-sm text-xs"
          >
            ← Back to Series Hub
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
      <header className="max-w-md w-full mx-auto">
        <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-200">
          <Link
            href={driver?.series_id ? `/srleague/${leagueId}/series/${driver.series_id}` : `/srleague/${leagueId}`}
            className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
            title="Back to Series Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
              Edit Driver Entry
            </h1>
            <span className="text-xs text-neutral-500">
              #{driver?.car_number} {driver?.driver_name} • {league?.name}
            </span>
          </div>
        </div>
      </header>

      {/* FORM */}
      <main className="max-w-md w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3.5 shadow-sm">
            <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5 pb-2 border-b border-neutral-200">
              <User className="w-3.5 h-3.5 text-red-600" />
              <span>Competitor Profile</span>
            </h3>

            {/* DRIVER NAME */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Driver Real Name *
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />
            </div>

            {/* CAR NUMBER & IRACING CUST ID */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Car # *
                </label>
                <input
                  type="text"
                  required
                  value={carNumber}
                  onChange={(e) => setCarNumber(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-center text-base font-black text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  iRacing Cust ID
                </label>
                <input
                  type="text"
                  value={custNumber}
                  onChange={(e) => setCustNumber(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden"
                />
              </div>
            </div>

            {/* CAR MODEL & CLASS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Car Model
                </label>
                <input
                  type="text"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Car Class
                </label>
                <input
                  type="text"
                  value={carClass}
                  onChange={(e) => setCarClass(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden"
                />
              </div>
            </div>

            {/* TEAM NAME */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Team Name / Sponsor
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden"
              />
            </div>

            {/* DISCORD */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Discord Username
              </label>
              <input
                type="text"
                value={discordHandle}
                onChange={(e) => setDiscordHandle(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden"
              />
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
                <Check className="w-5 h-5" />
                <span>Save Driver Changes</span>
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
                    Remove #{driver?.car_number} {driver?.driver_name} from the roster.
                  </span>
                </div>

                {!showDeleteConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3.5 py-2 bg-white hover:bg-red-600 hover:text-white text-red-600 border border-red-300 rounded-xl font-bold uppercase text-[10px] transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Driver</span>
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
                        Confirm Driver Removal?
                      </strong>
                      <p className="text-[11px] text-neutral-600 leading-normal">
                        Are you sure you want to remove <strong>#{driver?.car_number} {driver?.driver_name}</strong> from the championship roster?
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
                          <span>Yes, Remove Driver</span>
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
      <footer className="max-w-md w-full mx-auto text-center py-4 text-[11px] text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}
