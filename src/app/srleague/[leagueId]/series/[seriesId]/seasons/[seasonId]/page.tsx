"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{ leagueId: string; seriesId: string; seasonId: string }>;
}

export default function LegacySeasonPageRedirect({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const leagueId = unwrappedParams?.leagueId || "";
  const seriesId = unwrappedParams?.seriesId || "";
  const seasonId = unwrappedParams?.seasonId || "";
  const router = useRouter();

  useEffect(() => {
    if (leagueId && seriesId) {
      router.replace(`/srleague/${leagueId}/series/${seriesId}`);
    }
  }, [leagueId, seriesId, seasonId, router]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8 font-mono text-xs">
      <div className="flex items-center gap-2 text-neutral-500">
        <Loader2 className="w-5 h-5 animate-spin text-red-600" />
        <span>Redirecting to Championship Series Hub...</span>
      </div>
    </div>
  );
}
