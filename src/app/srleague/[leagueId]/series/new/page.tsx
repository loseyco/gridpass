"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, setDoc, updateDoc, onSnapshot, collection, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { SRLeague, SRLeagueSeries, LeagueGame } from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import { compressImage } from "@/lib/utils/imageCompressor";
import {
  ArrowLeft,
  Trophy,
  Plus,
  Loader2,
  Layers,
  Flag,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

export default function CreateSeriesPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const router = useRouter();
  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const [existingCount, setExistingCount] = useState(0);

  const [seriesName, setSeriesName] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [game, setGame] = useState<LeagueGame>("iracing");
  const [dropWeeks, setDropWeeks] = useState(1);
  const [incidentLimitDq, setIncidentLimitDq] = useState(17);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!leagueId) return;
    const unsubLeague = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) setLeague({ id: snap.id, ...(snap.data() as any) });
    });
    const unsubSeries = onSnapshot(
      query(collection(db, "sr_league_series"), where("league_id", "==", leagueId)),
      (snap) => setExistingCount(snap.size)
    );
    return () => {
      unsubLeague();
      unsubSeries();
    };
  }, [leagueId]);

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
    const seriesId = `series_${leagueId}_${Date.now()}`;
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

    const newSeries: SRLeagueSeries = {
      id: seriesId,
      league_id: leagueId,
      name: seriesName.trim(),
      short_name: shortName.trim() || "",
      description: description.trim() || "",
      banner_url: finalBannerUrl || undefined,
      cover_image_url: finalBannerUrl || undefined,
      game: game,
      car_classes: [], // Classes derived from cars picked later
      status: "recruiting",
      drop_weeks: Number(dropWeeks) || 0,
      incident_limit_dq: Number(incidentLimitDq) || 17,
      rounds_count: 0,
      total_drivers: 0,
      points_system: {
        p1: 25,
        p2: 18,
        p3: 15,
        p4: 12,
        p5: 10,
        p6: 8,
        p7: 6,
        p8: 4,
        p9: 2,
        p10: 1,
        fastest_lap: 1,
        pole_position: 1,
      },
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    try {
      await setDoc(doc(db, "sr_league_series", seriesId), newSeries);
      // Update league active series and count
      await updateDoc(doc(db, "sr_leagues", leagueId), {
        total_seasons: existingCount + 1,
        active_season_id: seriesId,
        updated_at: Date.now(),
      }).catch(() => {});

      showToast({
        title: "🏁 Series Created!",
        message: `${newSeries.name} is now live under ${league?.name || "League"}.`,
        icon: "🏆",
      });
      router.push(`/srleague/${leagueId}/series/${seriesId}`);
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not create series.",
        icon: "❌",
      });
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
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
              Create Series
            </h1>
            <span className="text-xs font-mono text-neutral-500">
              {league?.name || "Championship"} • New Season
            </span>
          </div>
        </div>
      </header>

      {/* FORM */}
      <main className="max-w-md w-full mx-auto">
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
                placeholder="e.g. Special Events"
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
                placeholder="e.g. GPASE"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition uppercase"
              />
            </div>

            {/* SIM PLATFORM */}
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
                <option value="acc">Assetto Corsa Competizione</option>
                <option value="automobilista2">Automobilista 2</option>
              </select>
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
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition shadow-md"
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
                <Trophy className="w-5 h-5" />
                <span>Launch Series</span>
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
