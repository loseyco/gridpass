import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// Read environment variables
const envPath = path.join(process.cwd(), ".env.development.local");
const envVars: any = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      envVars[key] = val;
    }
  });
}

const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gridpass",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Predefined coordinate mapping for Illinois towns to prevent Monmouth default map placement
const townCoords: Record<string, { lat: number; lng: number }> = {
  "crete": { lat: 41.4445, lng: -87.6253 },
  "downers grove": { lat: 41.7961, lng: -88.0076 },
  "berwyn": { lat: 41.8506, lng: -87.7937 },
  "elgin": { lat: 42.0373, lng: -88.2812 },
  "st. charles": { lat: 41.9139, lng: -88.3126 },
  "effingham": { lat: 39.1200, lng: -88.5434 },
  "union": { lat: 42.2334, lng: -88.5437 },
  "chicago": { lat: 41.8781, lng: -87.6298 },
  "st. louis": { lat: 38.6270, lng: -90.1994 },
  "clinton": { lat: 40.1542, lng: -88.9601 },
  "maroa": { lat: 40.0384, lng: -88.9767 },
  "monmouth": { lat: 40.9115, lng: -90.6473 }
};

function parseCustomDate(str: string): string | null {
  // Matches e.g. "8/29/2026 09:00" or "08/29/2026 12:00"
  const regex = /(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+)/;
  const match = str.match(regex);
  if (match) {
    const month = match[1].padStart(2, "0");
    const day = match[2].padStart(2, "0");
    const year = match[3];
    const hour = match[4].padStart(2, "0");
    const min = match[5].padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${min}`;
  }
  return null;
}

// Custom crawler to parse CarShowRadar IL list and find their Facebook Event pages
async function runScraper() {
  console.log("🚀 STARTING REAL CAR SHOW DISCOVERY ENGINE...");
  
  try {
    const response = await fetch("https://carshowradar.com/shows/il/");
    const html = await response.text();
    
    // Extract individual show detail URLs using regex from the listing HTML
    const showUrlRegex = /href="(https:\/\/carshowradar\.com\/shows\/il\/[a-z0-9\-]+\/\?serp=nothing)"/g;
    const urls: string[] = [];
    let match;
    while ((match = showUrlRegex.exec(html)) !== null) {
      if (!urls.includes(match[1])) {
        urls.push(match[1]);
      }
    }
    
    console.log(`🔍 Found ${urls.length} upcoming Illinois car show pages to inspect...`);
    
    // Limit to scanning the first 5 upcoming ones to avoid rate-limiting
    const targetUrls = urls.slice(0, 5);
    
    for (const showUrl of targetUrls) {
      console.log(`📄 Inspecting event page: ${showUrl}`);
      const showRes = await fetch(showUrl);
      const showHtml = await showRes.text();
      
      // 1. Extract title
      const titleMatch = showHtml.match(/<h1 class="entry-title">([^<]+)<\/h1>/) || showHtml.match(/<h1 class="h1">([^<]+)<\/h1>/) || showHtml.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch ? titleMatch[1].replace(" - Car Show Radar", "").trim() : "Unknown Event";
      
      // 2. Extract Location and Dates from lead paragraph
      const leadMatch = showHtml.match(/<p class="lead">([^<]+)</);
      let physicalAddress = "Illinois";
      let startDateTimeStr = new Date().toISOString().substring(0, 16);
      let endDateTimeStr = new Date().toISOString().substring(0, 16);
      
      if (leadMatch) {
        const leadText = leadMatch[1];
        const parts = leadText.split(" - ");
        if (parts[0]) {
          physicalAddress = parts[0].trim();
        }
        if (parts[1]) {
          const dateParts = parts[1].split(" to ");
          if (dateParts[0]) {
            const startParsed = parseCustomDate(dateParts[0].trim());
            if (startParsed) startDateTimeStr = startParsed;
          }
          if (dateParts[1]) {
            const endParsed = parseCustomDate(dateParts[1].trim());
            if (endParsed) endDateTimeStr = endParsed;
          } else {
            const startDate = new Date(startDateTimeStr);
            startDate.setHours(startDate.getHours() + 3);
            endDateTimeStr = startDate.toISOString().substring(0, 16);
          }
        }
      }
      
      // Date check: parse the start date of the show, compare it to process time, and skip any events that are in the past (older than yesterday)
      const showStartDate = new Date(startDateTimeStr);
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      if (isNaN(showStartDate.getTime()) || showStartDate < yesterday) {
        console.log(`⏭️ Skipping past/invalid show: "${title}" (${startDateTimeStr})`);
        continue;
      }
      
      // 3. Resolve Coordinates based on physical address town
      let latitude = 40.91148; // Fallback Monmouth
      let longitude = -90.64764;
      const addrLower = physicalAddress.toLowerCase();
      for (const town of Object.keys(townCoords)) {
        if (addrLower.includes(town)) {
          latitude = townCoords[town].lat;
          longitude = townCoords[town].lng;
          console.log(`📍 Resolved venue to ${town}: ${latitude}, ${longitude}`);
          break;
        }
      }
      
      // 4. Extract Description paragraphs
      const showContentMatch = showHtml.match(/<div class="[^"]*showcontent"[^>]*>([\s\S]+?)<\/div>/i);
      let description = "Join us for this exciting automotive cruise and meet!";
      if (showContentMatch) {
        const contentHtml = showContentMatch[1];
        const paragraphs = [...contentHtml.matchAll(/<p>([\s\S]+?)<\/p>/gi)];
        const cleanParagraphs = paragraphs
          .map(p => p[1].replace(/<[^>]+>/g, "").trim())
          .filter(text => text.length > 50 && !text.includes("Tagged:") && !text.includes("edit listing"));
        
        if (cleanParagraphs.length > 0) {
          description = cleanParagraphs.join("\n\n");
        }
      }
      
      // 5. Extract Flyer/Banner Image URL
      const flyerMatch = showHtml.match(/href="(https:\/\/carshowradar\.com\/wp-content\/uploads\/[^"]+\.(jpg|jpeg|png))"/i) ||
                         showHtml.match(/data-lazy-src="(https:\/\/carshowradar\.com\/wp-content\/uploads\/[^"]+\.(jpg|jpeg|png))"/i) ||
                         showHtml.match(/src="(https:\/\/carshowradar\.com\/wp-content\/uploads\/[^"]+\.(jpg|jpeg|png))"/i);
      const bannerUrl = flyerMatch ? flyerMatch[1] : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1600";
      
      // 6. Search for Facebook outreach target page
      const fbEventRegex = /href="(https:\/\/(www\.)?facebook\.com\/events\/[0-9]+[^"]*)"/i;
      const fbGroupRegex = /href="(https:\/\/(www\.)?facebook\.com\/groups\/[a-z0-9\._\-]+[^"]*)"/i;
      const fbPageRegex = /href="(https:\/\/(www\.)?facebook\.com\/[a-z0-9\._\-]+[^"]*)"/i;
      
      let targetUrl = "https://www.facebook.com/carshowradar/"; // Fallback organizer
      
      const fbEventMatch = showHtml.match(fbEventRegex);
      const fbGroupMatch = showHtml.match(fbGroupRegex);
      const fbPageMatch = showHtml.match(fbPageRegex);
      
      if (fbEventMatch) {
        targetUrl = fbEventMatch[1];
      } else if (fbGroupMatch) {
        targetUrl = fbGroupMatch[1];
      } else if (fbPageMatch && !fbPageMatch[1].includes("carshowradar")) {
        targetUrl = fbPageMatch[1];
      } else {
        const extLinkMatch = showHtml.match(/href="(https?:\/\/(?!carshowradar)[a-z0-9\.\-]+[^"]*)"/i);
        if (extLinkMatch) {
          targetUrl = extLinkMatch[1];
        }
      }
      
      // Create doc
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      
      const scrapedDoc = {
        id,
        title,
        location_name: physicalAddress,
        physical_address: physicalAddress,
        date_str: startDateTimeStr.substring(0, 10),
        start_date: startDateTimeStr,
        end_date: endDateTimeStr,
        description,
        banner_url: bannerUrl,
        latitude,
        longitude,
        target_url: targetUrl,
        source_url: showUrl,
        status: "pending",
        created_at: new Date().toISOString()
      };
      
      await setDoc(doc(db, "scraped_events", id), scrapedDoc, { merge: true });
      console.log(`💾 Saved "${title}" into triage queue with Rich Info:`);
      console.log(`   - Address: ${physicalAddress}`);
      console.log(`   - Banner: ${bannerUrl}`);
      console.log(`   - Coordinates: ${latitude}, ${longitude}`);
    }
    
    console.log("🏁 CRAWLER COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("Scraper failed:", err);
    process.exit(1);
  }
}

runScraper();
