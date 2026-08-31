import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GridPass Sim Racing Broadcast Overlay",
  description: "Live 60 FPS Transparent iRacing Broadcast Overlay for OBS Studio & vMix",
};

export default function SRLeagueOverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent m-0 p-0 select-none">
      {children}
    </div>
  );
}
