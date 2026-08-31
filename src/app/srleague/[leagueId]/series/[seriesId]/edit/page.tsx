"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, deleteField } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { SRLeague, SRLeagueSeries, LeagueGame, LeagueStatus } from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import { compressImage } from "@/lib/utils/imageCompressor";
import {
  ArrowLeft,
  Settings,
  Loader2,
  Save,
  Archive,
  RotateCcw,
  AlertTriangle,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string; seriesId: string }>;
}

export default function EditSeriesPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";
  const seriesId = unwrappedParams?.seriesId || "";

  const router = useRouter();
  const { showToast } = useToast();

  const [series, setSeries] = useState<SRLeagueSeries | null>(null);
  const [seriesName, setSeriesName] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [game, setGame] = useState<LeagueGame>("iracing");
  const [status, setStatus] = useState<LeagueStatus>("recruiting");
  const [dropWeeks, setDropWeeks] = useState(1);
  const [incidentLimitDq, setIncidentLimitDq] = useState(17);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!seriesId) return;
    const unsub = onSnapshot(doc(db, "sr_league_series", seriesId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...(snap.data() as any) };
        setSeries(data);
        setSeriesName(data.name || "");
        setShortName(data.short_name || "");
        setDescription(data.description || "");
        setGame(data.game || "iracing");
        setStatus(data.status || "recruiting");
        setDropWeeks(data.drop_weeks ?? 1);
        setIncidentLimitDq(data.incident_limit_dq ?? 17);
        setBannerPreview(data.banner_url || data.cover_image_url || null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [seriesId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesName.trim()) return;

    setSaving(true);
    let finalBannerUrl = bannerPreview;

    if (selectedFile) {
      try {
        const optimizedFile = await compressImage(selectedFile, 1200, 600, 0.85);
        const storagePath = `leagues/${leagueId}/series/${seriesId}/banner_${Date.now()}.${optimizedFile.name.split('.').pop() || 'webp'}`;
        const storageRef = ref(storage, storagePath);
        const uploadResult = await uploadBytes(storageRef, optimizedFile);
        finalBannerUrl = await getDownloadURL(uploadResult.ref);
      } catch (storageErr) {
        console.warn("Storage upload failed:", storageErr);
      }
    }

    try {
      const updateData: Record<string, any> = {
        name: seriesName.trim(),
        short_name: shortName.trim() || "",
        description: description.trim() || "",
        game: game,
        status: status,
        drop_weeks: Number(dropWeeks) || 0,
        incident_limit_dq: Number(incidentLimitDq) || 17,
        updated_at: Date.now(),
      };

      if (finalBannerUrl) {
        updateData.banner_url = finalBannerUrl;
        updateData.cover_image_url = finalBannerUrl;
      } else {
        updateData.banner_url = deleteField();
        updateData.cover_image_url = deleteField();
      }

      await updateDoc(doc(db, "sr_league_series", seriesId), updateData);

      showToast({
        title: "⚙️ Series Updated",
        message: "Your series changes have been saved.",
        icon: "✅",
      });
      router.push(`/srleague/${leagueId}/series/${seriesId}`);
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not update series.",
        icon: "❌",
      });
      setSaving(false);
    }
  };

  const handleToggleArchive = async () => {
    const isCurrentlyArchived = status === "archived";
    const newStatus = isCurrentlyArchived ? "recruiting" : "archived";
    setArchiving(true);

    try {
      await updateDoc(doc(db, "sr_league_series", seriesId), {
        status: newStatus,
        is_archived: !isCurrentlyArchived,
        archived_at: isCurrentlyArchived ? null : Date.now(),
        updated_at: Date.now(),
      });

      showToast({
        title: isCurrentlyArchived ? "♻️ Series Restored" : "📦 Series Archived",
        message: isCurrentlyArchived
          ? "Series is now active and open for racing."
          : "Series safely archived. Historical records and stats preserved.",
        icon: isCurrentlyArchived ? "🏁" : "📦",
      });
      router.push(`/srleague/${leagueId}`);
    } catch (err: any) {
      showToast({
        title: "Archival Error",
        message: err.message || "Could not update series status.",
        icon: "❌",
      });
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 font-mono text-xs text-neutral-500">
        Loading Series Details...
      </div>
    );
  }

  const isArchived = status === "archived";

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
      {/* HEADER */}
      <header className="max-w-md w-full mx-auto">
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
              Edit Series
            </h1>
            <span className="text-xs font-mono text-neutral-500">
              {series?.name || "Championship Season"}
            </span>
          </div>
        </div>
      </header>

      {/* FORM */}
      <main className="max-w-md w-full mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
          
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 shadow-sm">
            
            {/* SERIES NAME */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Series Name *
              </label>
              <input
                type="text"
                required
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />
            </div>

            {/* SHORT NAME */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Short Name / Code
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition uppercase"
              />
            </div>

            {/* GAME & STATUS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Sim Platform *
                </label>
                <select
                  value={game}
                  onChange={(e) => setGame(e.target.value as LeagueGame)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                >
                  <option value="iracing">iRacing</option>
                  <option value="assetto_corsa">Assetto Corsa</option>
                  <option value="acc">Assetto Corsa Comp</option>
                  <option value="automobilista2">Automobilista 2</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Season Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeagueStatus)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
                >
                  <option value="recruiting">Recruiting / Open</option>
                  <option value="in_progress">In Progress / Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived (Retired)</option>
                </select>
              </div>
            </div>

            {/* SERIES DESCRIPTION */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Series Description / Overview
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe the series format, car class, sporting guidelines, or requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-xs text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />
            </div>

            {/* SERIES COVER BANNER PHOTO */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600 flex items-center justify-between">
                <span>Series Cover Banner</span>
                <span className="text-[10px] text-neutral-400 font-normal">Optional (1200x600 recommended)</span>
              </label>

              {bannerPreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-neutral-300 shadow-2xs group">
                  <img
                    src={bannerPreview}
                    alt="Series Cover Preview"
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

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Series Changes</span>
              </>
            )}
          </button>

        </form>

        {/* ─────────────────────────────────────────────────────────────
            HISTORICAL ARCHIVAL ZONE (SOFT DELETE - NEVER HARD DELETE)
           ───────────────────────────────────────────────────────────── */}
        <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3 shadow-xs font-mono text-xs">
          <div className="flex items-center gap-2 text-neutral-800 font-bold uppercase text-[11px]">
            <Archive className="w-4 h-4 text-neutral-500" />
            <span>Championship Archival & Historical Records</span>
          </div>

          <p className="text-neutral-500 text-[11px] leading-relaxed">
            {isArchived
              ? "This series is currently archived. All race records, standings, and driver data remain safely preserved for historical reference."
              : "When a season finishes, archive it to retire it from active registration while keeping all race results, standings, and driver histories preserved forever."}
          </p>

          <button
            type="button"
            onClick={handleToggleArchive}
            disabled={archiving}
            className={`w-full py-3 px-4 rounded-2xl font-bold uppercase text-xs transition flex items-center justify-center gap-2 cursor-pointer border ${
              isArchived
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm"
                : "bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300 shadow-2xs"
            }`}
          >
            {archiving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isArchived ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Restore Series to Active</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 text-neutral-500" />
                <span>📦 Archive This Series (Preserve Records)</span>
              </>
            )}
          </button>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="max-w-md w-full mx-auto text-center py-4 text-[11px] font-mono text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}
