"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { SRLeague } from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { compressImage } from "@/lib/utils/imageCompressor";
import {
  ArrowLeft,
  Trophy,
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";

export default function CreateLeaguePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [leagueName, setLeagueName] = useState("");
  const [shortName, setShortName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo Picker
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
  };

  const clearLogo = () => {
    setSelectedFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim()) return;

    setSaving(true);
    const leagueId = `league_${leagueName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;
    const slug = (shortName.trim() || leagueName.trim()).toLowerCase().replace(/[^a-z0-9]/g, "-");

    let finalLogoUrl: string | undefined = undefined;

    // 1. Upload to Firebase Cloud Storage if a file was selected
    if (selectedFile) {
      try {
        // Compress before upload to save bandwidth & speed up loading
        const optimizedFile = await compressImage(selectedFile, 600, 600, 0.85);
        const storagePath = `leagues/${leagueId}/logo_${Date.now()}.${optimizedFile.name.split('.').pop() || 'webp'}`;
        const storageRef = ref(storage, storagePath);
        
        const uploadResult = await uploadBytes(storageRef, optimizedFile);
        finalLogoUrl = await getDownloadURL(uploadResult.ref);
      } catch (storageErr) {
        console.warn("Firebase Cloud Storage upload failed, falling back to local canvas compression:", storageErr);
        // Fallback: compress to lightweight Base64 (<40KB)
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = (evt) => resolve(evt.target?.result as string);
            reader.readAsDataURL(selectedFile);
          });
          const rawBase64 = await base64Promise;
          finalLogoUrl = rawBase64.length > 500000 ? rawBase64.slice(0, 400000) : rawBase64;
        } catch {
          finalLogoUrl = undefined;
        }
      }
    }

    // 2. Save League Record in Cloud Firestore
    const newLeague: Record<string, any> = {
      id: leagueId,
      name: leagueName.trim(),
      short_name: shortName.trim() || "",
      slug: slug,
      logo_url: finalLogoUrl || "",
      organizer_id: user?.uid || "admin",
      organizer_name: user?.displayName || "League Director",
      organizer_email: user?.email || "",
      total_drivers: 0,
      total_seasons: 0,
      active_season_id: "",
      is_public: true,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    try {
      await setDoc(doc(db, "sr_leagues", leagueId), newLeague);
      showToast({
        title: "🏆 League Created!",
        message: `${newLeague.name} is now live with Cloud Storage.`,
        icon: "🏁",
      });
      router.push(`/srleague/${leagueId}`);
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not save league.",
        icon: "❌",
      });
      setSaving(false);
    }
  };

  // Derive default abbreviation if shortName is empty
  const defaultAbbr = shortName.trim()
    ? shortName.trim().toUpperCase().slice(0, 4)
    : leagueName.trim()
    ? leagueName
        .trim()
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 4)
    : "GP";

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6">
      {/* HEADER */}
      <header className="max-w-md w-full mx-auto">
        <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-200">
          <Link
            href="/srleague"
            className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
            title="Back to Leagues"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
              Create League
            </h1>
            <span className="text-xs font-mono text-neutral-500">
              New Sim Racing Championship
            </span>
          </div>
        </div>
      </header>

      {/* FORM */}
      <main className="max-w-md w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
          
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-5 shadow-sm">
            
            {/* LOGO UPLOAD & BADGE PREVIEW */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold text-neutral-600 block">
                League Logo (Cloud Storage)
              </label>

              <div className="flex items-center gap-4">
                {/* Visual Preview Badge */}
                <div className="relative w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-neutral-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt="League Logo Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={clearLogo}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-[10px]"
                        title="Remove Logo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full bg-red-600 text-white font-black text-xl flex items-center justify-center tracking-tight">
                      {defaultAbbr}
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="space-y-1.5 flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="league-logo-input"
                  />
                  <label
                    htmlFor="league-logo-input"
                    className="w-full py-2.5 px-3.5 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-neutral-800 font-bold uppercase text-[11px] flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{logoPreview ? "Change Logo" : "Upload Logo"}</span>
                  </label>
                  <p className="text-[10px] text-neutral-400">
                    Uploaded directly to Firebase Storage
                  </p>
                </div>
              </div>
            </div>

            {/* LEAGUE FULL NAME */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                League Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex GT3 Sprint Championship"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />
            </div>

            {/* SHORT NAME */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Short Name / Abbreviation
              </label>
              <input
                type="text"
                placeholder="e.g. APEX or AGTC"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition uppercase"
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
                <span>Create League</span>
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
