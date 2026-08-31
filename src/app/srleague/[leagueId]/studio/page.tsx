"use client";

import React from "react";
import SRCommanderBroadcastStudioPage from "@/app/srcommander/studio/page";

interface PageProps {
  params: Promise<{ leagueId: string }>;
}

export default function LeagueBroadcastStudioPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";

  return <SRCommanderBroadcastStudioPage leagueId={leagueId} />;
}
