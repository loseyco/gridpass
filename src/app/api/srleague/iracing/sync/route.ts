import { NextResponse } from "next/server";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { IRACING_OFFICIAL_TRACKS, IRACING_OFFICIAL_CARS } from "@/lib/data/iracingTracksAndCars";

export async function POST() {
  try {
    const startTime = Date.now();
    let tracksAdded = 0;
    let carsAdded = 0;
    let newsAdded = 0;

    // 1. Sync Official Tracks
    for (const track of IRACING_OFFICIAL_TRACKS) {
      const trackRef = doc(db, "iracing_tracks", track.id);
      const existing = await getDoc(trackRef);
      if (!existing.exists()) {
        await setDoc(trackRef, {
          id: track.id,
          name: track.name,
          category: track.category,
          layouts: track.layouts,
          synced_at: Date.now(),
        });
        tracksAdded++;

        // Log news item
        const newsId = `news_track_${track.id}_${Date.now()}`;
        await setDoc(doc(db, "sr_iracing_news", newsId), {
          id: newsId,
          type: "new_track",
          title: `🏁 New Track Catalog Entry: ${track.name}`,
          summary: `iRacing catalog updated with ${track.name} (${track.layouts.join(", ")}).`,
          category: track.category,
          item_id: track.id,
          created_at: Date.now(),
        });
        newsAdded++;
      }
    }

    // 2. Sync Official Cars
    for (const car of IRACING_OFFICIAL_CARS) {
      const carId = car.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const carRef = doc(db, "iracing_cars", carId);
      const existing = await getDoc(carRef);
      if (!existing.exists()) {
        await setDoc(carRef, {
          id: carId,
          name: car,
          synced_at: Date.now(),
        });
        carsAdded++;
      }
    }

    // 3. Fetch iRacing Official RSS Feed for News / Patch Notes
    try {
      const res = await fetch("https://www.iracing.com/feed/", { next: { revalidate: 3600 } });
      if (res.ok) {
        const xml = await res.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xml)) !== null) {
          const itemContent = match[1];
          const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemContent.match(/<title>(.*?)<\/title>/);
          const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
          const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || itemContent.match(/<description>(.*?)<\/description>/);
          const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);

          if (titleMatch && linkMatch) {
            const title = titleMatch[1].trim();
            const link = linkMatch[1].trim();
            const desc = descMatch ? descMatch[1].replace(/<[^>]*>?/gm, "").trim() : "";
            const newsId = `iracing_news_${Buffer.from(link).toString("base64").slice(0, 20)}`;

            const newsRef = doc(db, "sr_iracing_news", newsId);
            const existing = await getDoc(newsRef);
            if (!existing.exists()) {
              await setDoc(newsRef, {
                id: newsId,
                type: "iracing_official",
                title,
                link,
                summary: desc.slice(0, 300) + (desc.length > 300 ? "..." : ""),
                published_at: pubDateMatch ? new Date(pubDateMatch[1]).getTime() : Date.now(),
                created_at: Date.now(),
              });
              newsAdded++;
            }
          }
        }
      }
    } catch (err) {
      console.warn("RSS feed fetch error:", err);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    return NextResponse.json({
      success: true,
      message: `iRacing catalog & news synced successfully in ${duration}s.`,
      stats: { tracksAdded, carsAdded, newsAdded, duration },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
