import React from "react";
import { Metadata } from "next";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ leagueId: string; seriesId: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ leagueId: string; seriesId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { leagueId, seriesId } = resolvedParams;

  let seriesName = "Championship Series";
  let leagueName = "GridPass League";
  let description =
    "Official championship sim racing series on iRacing. Fixed setups, live points, steward reviews, and championship standings.";
  let coverUrl = "https://gridpass.app/images/gr86_official_gridpass_banner.jpg";

  try {
    const seriesSnap = await getDoc(doc(db, "sr_league_series", seriesId));
    if (seriesSnap.exists()) {
      const sData = seriesSnap.data();
      if (sData.name) seriesName = sData.name;
      if (sData.description) description = sData.description;
      if (sData.banner_url || sData.cover_image_url) {
        coverUrl = sData.banner_url || sData.cover_image_url;
      }

      if (sData.active_season_id) {
        const seasonSnap = await getDoc(doc(db, "sr_league_seasons", sData.active_season_id));
        if (seasonSnap.exists()) {
          const seasonData = seasonSnap.data();
          if (seasonData.description && !sData.description) {
            description = seasonData.description;
          }
          if (seasonData.banner_url || seasonData.cover_image_url) {
            coverUrl = seasonData.banner_url || seasonData.cover_image_url;
          }
        }
      }
    }

    const leagueSnap = await getDoc(doc(db, "sr_leagues", leagueId));
    if (leagueSnap.exists()) {
      const lData = leagueSnap.data();
      if (lData.name) leagueName = lData.name;
    }
  } catch (e) {
    console.error("Error generating series metadata:", e);
  }

  // Ensure absolute URL for social crawlers (iMessage, Discord, Facebook, X)
  const absoluteImageUrl = coverUrl.startsWith("http")
    ? coverUrl
    : `https://gridpass.app${coverUrl.startsWith("/") ? "" : "/"}${coverUrl}`;

  const cleanTitle = `${seriesName} • ${leagueName} | GridPass Sim Racing`;
  const cleanDesc = description.length > 180 ? `${description.slice(0, 177)}...` : description;
  const canonicalUrl = `https://gridpass.app/srleague/${leagueId}/series/${seriesId}`;

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
          alt: `${seriesName} - ${leagueName}`,
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

export default async function SeriesLayout({ children, params }: LayoutProps) {
  const resolvedParams = await params;
  const { leagueId, seriesId } = resolvedParams;

  let seriesName = "Championship Series";
  let leagueName = "GridPass League";
  let description = "Official championship sim racing series on iRacing.";
  let coverUrl = "https://gridpass.app/images/gr86_official_gridpass_banner.jpg";

  try {
    const seriesSnap = await getDoc(doc(db, "sr_league_series", seriesId));
    if (seriesSnap.exists()) {
      const sData = seriesSnap.data();
      if (sData.name) seriesName = sData.name;
      if (sData.description) description = sData.description;
      if (sData.banner_url || sData.cover_image_url) {
        coverUrl = sData.banner_url || sData.cover_image_url;
      }
    }
    const leagueSnap = await getDoc(doc(db, "sr_leagues", leagueId));
    if (leagueSnap.exists()) {
      const lData = leagueSnap.data();
      if (lData.name) leagueName = lData.name;
    }
  } catch (e) {
    // Non-blocking for JSON-LD render
  }

  const absoluteImageUrl = coverUrl.startsWith("http")
    ? coverUrl
    : `https://gridpass.app${coverUrl.startsWith("/") ? "" : "/"}${coverUrl}`;

  // Schema.org JSON-LD Structured Data for AI & Search Engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: seriesName,
    description: description,
    image: [absoluteImageUrl],
    organizer: {
      "@type": "SportsOrganization",
      name: leagueName,
      url: `https://gridpass.app/srleague/${leagueId}`,
    },
    sport: "Sim Racing / iRacing",
    url: `https://gridpass.app/srleague/${leagueId}/series/${seriesId}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
