"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useToast } from "@/components/ToastContext";
import {
  Newspaper,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  MapPin,
  Car,
  Flag,
  Calendar,
  Sparkles,
  Layers,
  Cpu,
} from "lucide-react";

interface NewsItem {
  id: string;
  type: "iracing_official" | "new_track" | "new_car" | "league_patch";
  title: string;
  summary?: string;
  link?: string;
  category?: string;
  published_at?: number;
  created_at: number;
}

export default function SRLeagueNewsPage() {
  const { showToast } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "sr_iracing_news"), orderBy("created_at", "desc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const list: NewsItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setNews(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/srleague/iracing/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast({
          title: "🔄 Sync Complete!",
          message: data.message || "iRacing catalog & news feed updated.",
          icon: "✅",
        });
      } else {
        throw new Error(data.error || "Sync failed.");
      }
    } catch (err: any) {
      showToast({
        title: "Sync Error",
        message: err.message || "Could not sync iRacing catalog.",
        icon: "❌",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between p-4 sm:p-8 space-y-6 font-mono text-xs">
      {/* HEADER */}
      <header className="max-w-2xl w-full mx-auto">
        <div className="flex items-center justify-between gap-3.5 pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-3.5">
            <Link
              href="/srleague"
              className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition flex items-center justify-center shadow-xs"
              title="Back to Leagues"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 leading-none">
                iRacing News & Catalog Updates
              </h1>
              <span className="text-xs text-neutral-500">Official Patch Notes • New Tracks & Cars</span>
            </div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-black active:scale-98 text-white text-xs font-bold uppercase rounded-2xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-red-500 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing..." : "Sync iRacing"}</span>
          </button>
        </div>
      </header>

      {/* FEED CONTENT */}
      <main className="max-w-2xl w-full mx-auto space-y-4">
        {loading ? (
          <div className="py-16 text-center text-neutral-400">
            Loading iRacing news feed...
          </div>
        ) : news.length === 0 ? (
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <Newspaper className="w-12 h-12 text-neutral-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-black uppercase text-neutral-900">No News Items Yet</h3>
              <p className="text-xs text-neutral-500">
                Run the sync daemon to pull the latest official iRacing releases, patch notes, and catalog updates.
              </p>
            </div>
            <button
              onClick={handleManualSync}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-2xl shadow-md shadow-red-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Run First Sync</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((item) => {
              const isOfficial = item.type === "iracing_official";
              const isTrack = item.type === "new_track";

              return (
                <div
                  key={item.id}
                  className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-2.5 shadow-sm hover:border-neutral-300 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                        isTrack
                          ? "bg-red-600 text-white"
                          : isOfficial
                          ? "bg-neutral-900 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {isTrack ? "🏁 New Track Catalog" : "📰 Official iRacing"}
                    </span>

                    <span className="text-[10px] text-neutral-400">
                      {new Date(item.published_at || item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-black uppercase text-neutral-900 leading-snug">
                    {item.title}
                  </h3>

                  {item.summary && (
                    <p className="text-neutral-600 text-xs leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  )}

                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 pt-1"
                    >
                      <span>Read Official Article</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="max-w-2xl w-full mx-auto text-center py-4 text-[11px] text-neutral-400">
        GridPass • Sim Racing League Manager
      </footer>
    </div>
  );
}
