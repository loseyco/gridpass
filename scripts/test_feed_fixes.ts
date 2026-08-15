// @ts-ignore
import Parser from "rss-parser";

const parser = new Parser({
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Gridpass-Wire/2.0",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
  timeout: 12000,
});

const CANDIDATES = [
  { name: "Racer X News", url: "https://racerxonline.com/rss/news" },
  { name: "Racer X Category", url: "https://racerxonline.com/feed" },
  { name: "SCCA News Feed", url: "https://www.scca.com/articles.atom" },
  { name: "NASA Speed News", url: "https://nasaspeed.news/feed/" },
  { name: "Grassroots Motorsports News", url: "https://grassrootsmotorsports.com/news/feed/" },
  { name: "Formula DRIFT News", url: "https://www.formulad.com/news/feed" },
  { name: "Drifting.com", url: "https://drifting.com/feed/" },
  { name: "Race-Dezert Clean", url: "https://www.race-dezert.com/feed/" },
  { name: "Speed Sport USAC", url: "https://speedsport.com/sprint-cars/usac-sprint-cars/feed/" },
  { name: "Speed Sport Outlaws", url: "https://speedsport.com/sprint-cars/world-of-outlaws-sprint-cars/feed/" },
  { name: "eKartingNews Grassroots", url: "https://ekartingnews.com/feed/" },
  { name: "Drag Illustrated", url: "https://dragillustrated.com/feed/" },
  { name: "UTV Underground", url: "https://utvunderground.com/feed/" },
];

async function test() {
  for (const c of CANDIDATES) {
    try {
      const p = await parser.parseURL(c.url);
      console.log(`✅ SUCCESS: "${c.name}" -> ${p.items?.length} stories. URL: ${c.url}`);
    } catch (err: any) {
      console.log(`❌ FAIL: "${c.name}" -> ${err.message.slice(0, 80)}`);
    }
  }
}

test();
