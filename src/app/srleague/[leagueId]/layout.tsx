import React from "react";
import { Metadata } from "next";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ leagueId: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { leagueId } = resolvedParams;

  let leagueName = "GridPass League";
  let description =
    "Official Sim Racing League Hub on GridPass. Championship schedules, live standings, confirmed entry lists, and automated steward workflows.";
  let coverUrl = "https://gridpass.app/images/gr86_official_gridpass_banner.jpg";

  try {
    const leagueSnap = await getDoc(doc(db, "sr_leagues", leagueId));
    if (leagueSnap.exists()) {
      const lData = leagueSnap.data();
      if (lData.name) leagueName = lData.name;
      if (lData.description) description = lData.description;
      if (lData.banner_url || lData.logo_url) {
        coverUrl = lData.banner_url || lData.logo_url;
      }
    }
  } catch (e) {
    console.error("Error generating league metadata:", e);
  }

  const absoluteImageUrl = coverUrl.startsWith("http")
    ? coverUrl
    : `https://gridpass.app${coverUrl.startsWith("/") ? "" : "/"}${coverUrl}`;

  const cleanTitle = `${leagueName} | Sim Racing League HQ | GridPass`;
  const cleanDesc = description.length > 180 ? `${description.slice(0, 177)}...` : description;
  const canonicalUrl = `https://gridpass.app/srleague/${leagueId}`;

  return {
    title: cleanTitle,
    description: cleanDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: cleanTitle,
      description: cleanDesc,
      url: canonicalUrl,
      siteName: "GridPass Sim Racing",
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 675,
          alt: leagueName,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description: cleanDesc,
      images: [absoluteImageUrl],
    },
  };
}

export default async function LeagueLayout({ children, params }: LayoutProps) {
  return <>{children}</>;
}
