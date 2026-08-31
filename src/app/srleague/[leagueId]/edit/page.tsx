"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, deleteField } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { SRLeague } from "@/lib/types/league";
import { useToast } from "@/components/ToastContext";
import { compressImage } from "@/lib/utils/imageCompressor";
import {
  ArrowLeft,
  Settings,
  Upload,
  X,
  Loader2,
  Save,
  Globe,
  Hash,
} from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

export default function EditLeaguePage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  const router = useRouter();
  const { showToast } = useToast();

  const [league, setLeague] = useState<SRLeague | null>(null);
  const [leagueName, setLeagueName] = useState("");
  const [shortName, setShortName] = useState("");
  const [iracingLeagueId, setIracingLeagueId] = useState("25");
  const [customDomain, setCustomDomain] = useState("");
  const [description, setDescription] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!leagueId) return;
    const unsub = onSnapshot(doc(db, "sr_leagues", leagueId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...(snap.data() as any) };
        setLeague(data);
        setLeagueName(data.name || "");
        setShortName(data.short_name || "");
        setIracingLeagueId(data.iracing_league_id ? String(data.iracing_league_id) : "25");
        setCustomDomain(data.custom_domain || "");
        setDescription(data.description || "");
        setDiscordUrl(data.discord_url || "");
        setLogoPreview(data.logo_url || null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [leagueId]);

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
    let finalLogoUrl = logoPreview;

    if (selectedFile) {
      try {
        const optimizedFile = await compressImage(selectedFile, 600, 600, 0.85);
        const storagePath = `leagues/${leagueId}/logo_${Date.now()}.${optimizedFile.name.split('.').pop() || 'webp'}`;
        const storageRef = ref(storage, storagePath);
        const uploadResult = await uploadBytes(storageRef, optimizedFile);
        finalLogoUrl = await getDownloadURL(uploadResult.ref);
      } catch (storageErr) {
        console.warn("Storage upload failed:", storageErr);
      }
    }

    try {
      const updateData: Record<string, any> = {
        name: leagueName.trim(),
        short_name: shortName.trim() || "",
        iracing_league_id: iracingLeagueId.trim() ? Number(iracingLeagueId.trim()) || iracingLeagueId.trim() : "25",
        custom_domain: customDomain.trim() || "",
        description: description.trim() || "",
        discord_url: discordUrl.trim() || "",
        updated_at: Date.now(),
      };

      if (finalLogoUrl) {
        updateData.logo_url = finalLogoUrl;
      } else {
        updateData.logo_url = deleteField();
      }

      await updateDoc(doc(db, "sr_leagues", leagueId), updateData);

      showToast({
        title: "⚙️ League Updated",
        message: "Your changes have been saved.",
        icon: "✅",
      });
      router.push(`/srleague/${leagueId}`);
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err.message || "Could not update league.",
        icon: "❌",
      });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 font-mono text-xs text-neutral-500">
        Loading League Details...
      </div>
    );
  }

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
              Edit League Details
            </h1>
            <span className="text-xs font-mono text-neutral-500">
              {league?.name}
            </span>
          </div>
        </div>
      </header>

      {/* FORM */}
      <main className="max-w-md w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
          
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-5 shadow-sm">
            
            {/* LOGO */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold text-neutral-600 block">
                League Logo
              </label>

              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-neutral-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={clearLogo}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-[10px]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full bg-red-600 text-white font-black text-xl flex items-center justify-center">
                      {shortName.slice(0, 3).toUpperCase() || "GP"}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="edit-logo-input"
                  />
                  <label
                    htmlFor="edit-logo-input"
                    className="w-full py-2.5 px-3.5 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-neutral-800 font-bold uppercase text-[11px] flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Change Logo</span>
                  </label>
                </div>
              </div>
            </div>

            {/* NAME */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                League Name *
              </label>
              <input
                type="text"
                required
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />
            </div>

            {/* SHORT NAME & iRACING LEAGUE ID */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600">
                  Short Name
                </label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-neutral-600 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-red-600" />
                  <span>iRacing League ID</span>
                </label>
                <input
                  type="text"
                  placeholder="25"
                  value={iracingLeagueId}
                  onChange={(e) => setIracingLeagueId(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition font-bold"
                />
              </div>
            </div>

            {/* CUSTOM DOMAIN / ALIAS */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600 flex items-center gap-1">
                <Globe className="w-3 h-3 text-neutral-500" />
                <span>Custom Domain / Brand (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="israleague.com or iracersresource.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="About this league..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition resize-none"
              />
            </div>

            {/* DISCORD */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-neutral-600">
                Discord Community Link (Optional)
              </label>
              <input
                type="url"
                placeholder="https://discord.gg/your-league"
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-neutral-900 focus:outline-hidden focus:border-red-600 transition"
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
                <span>Save Changes</span>
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
