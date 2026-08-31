"use client";

import React from "react";
import { TrackGuide, CarGuide } from "@/lib/data/iracingGuides";
import {
  X,
  MapPin,
  ExternalLink,
  Car,
  Gauge,
  Layers,
  Sparkles,
  Compass,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface TrackCarGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackGuide?: TrackGuide | null;
  carGuide?: CarGuide | null;
  layoutName?: string;
}

export default function TrackCarGuideModal({
  isOpen,
  onClose,
  trackGuide,
  carGuide,
  layoutName,
}: TrackCarGuideModalProps) {
  if (!isOpen || (!trackGuide && !carGuide)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono text-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* MODAL HEADER */}
        <div className="p-5 bg-neutral-900 text-white flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="px-2 py-0.5 rounded bg-red-600 font-black text-[9px] uppercase tracking-wider">
              {trackGuide ? "Circuit Intelligence Guide" : "Competition Vehicle Specs"}
            </span>
            <h2 className="text-base font-black uppercase text-white leading-tight">
              {trackGuide ? trackGuide.name : carGuide?.name}
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
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* TRACK GUIDE DETAILS */}
          {trackGuide && (
            <div className="space-y-4">
              {/* SPECS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-neutral-400 block text-[9px] font-bold uppercase">Track Length</span>
                  <strong className="text-neutral-900 block text-xs">{trackGuide.length}</strong>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-neutral-400 block text-[9px] font-bold uppercase">Turn Count</span>
                  <strong className="text-neutral-900 block text-xs">{trackGuide.turns} Turns</strong>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-neutral-400 block text-[9px] font-bold uppercase">Pit Speed</span>
                  <strong className="text-red-600 block text-xs font-black">{trackGuide.pitSpeed}</strong>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-neutral-400 block text-[9px] font-bold uppercase">Content Tier</span>
                  <span className={"inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase " + (trackGuide.isBaseContent ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-800")}>
                    {trackGuide.isBaseContent ? "Base Free" : "iRacing Paid"}
                  </span>
                </div>
              </div>

              {/* LOCATION & DESCRIPTION */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-neutral-600 text-[11px] font-bold">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>{trackGuide.location}</span>
                </div>
                <p className="text-xs text-neutral-700 font-sans leading-relaxed">
                  {trackGuide.desc}
                </p>
              </div>

              {/* LAYOUTS LIST */}
              {trackGuide.layouts && trackGuide.layouts.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                    Available Configurations ({trackGuide.layouts.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {trackGuide.layouts.map((layout, idx) => (
                      <span
                        key={idx}
                        className={"px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase border " + (layoutName && layoutName.toLowerCase() === layout.toLowerCase() ? "bg-red-600 text-white border-red-600 shadow-2xs font-black" : "bg-neutral-100 text-neutral-700 border-neutral-200")}
                      >
                        {layout} {layoutName && layoutName.toLowerCase() === layout.toLowerCase() ? "🎯" : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* OFFICIAL IRACING LINK */}
              <a
                href={trackGuide.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-neutral-900 hover:bg-black active:scale-98 text-white rounded-2xl font-black uppercase text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>View Official iRacing Track Guide</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* CAR GUIDE DETAILS */}
          {carGuide && (
            <div className="space-y-4">
              {/* SPECS GRID */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-0.5">
                  <span className="text-neutral-400 block text-[9px] font-bold uppercase">Horsepower</span>
                  <strong className="text-red-600 block text-sm font-black">{carGuide.power}</strong>
                </div>

                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-0.5">
                  <span className="text-neutral-400 block text-[9px] font-bold uppercase">Engine</span>
                  <strong className="text-neutral-900 block text-xs">{carGuide.engine}</strong>
                </div>

                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-0.5">
                  <span className="text-neutral-400 block text-[9px] font-bold uppercase">Weight</span>
                  <strong className="text-neutral-900 block text-xs">{carGuide.weight}</strong>
                </div>

                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-0.5">
                  <span className="text-neutral-400 block text-[9px] font-bold uppercase">Transmission</span>
                  <strong className="text-neutral-900 block text-xs">{carGuide.gearbox}</strong>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                <div className="flex items-center gap-1.5 text-neutral-800 text-[11px] font-bold">
                  <Car className="w-3.5 h-3.5 text-red-600" />
                  <span>Competition Characteristics</span>
                </div>
                <p className="text-xs text-neutral-700 font-sans leading-relaxed">
                  {carGuide.desc}
                </p>
              </div>

              {/* OFFICIAL IRACING LINK */}
              <a
                href={carGuide.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-2xl font-black uppercase text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-600/30"
              >
                <span>View Official iRacing Car Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-neutral-700 font-bold uppercase text-[10px] transition cursor-pointer shadow-2xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
