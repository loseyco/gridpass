// @ts-ignore
import Parser from "rss-parser";

const parser = new Parser({
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Gridpass-Wire/2.0",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
  timeout: 8000,
});

const FEEDS_TO_AUDIT = [
  // 1. Stock Car & NASCAR
  { name: "Racer.com NASCAR", url: "https://racer.com/nascar/feed/", category: "stock_car" },
  { name: "Frontstretch NASCAR", url: "https://frontstretch.com/feed/", category: "stock_car" },
  { name: "Speedway Digest", url: "https://speedwaydigest.com/index.php/feed/", category: "stock_car" },
  { name: "Motorsport.com NASCAR", url: "https://www.motorsport.com/rss/nascar-cup/news/", category: "stock_car" },

  // 2. Open Wheel & IndyCar / F1
  { name: "Racer.com F1 / IndyCar", url: "https://racer.com/feed/", category: "open_wheel" },

  // 3. Sports Cars & Endurance
  { name: "Sportscar365", url: "https://sportscar365.com/feed/", category: "sportscar" },
  { name: "Speedcafe", url: "https://speedcafe.com/feed/", category: "sportscar" },

  // 4. Motocross & AMA Supercross
  { name: "Racer X Online MX", url: "https://racerxonline.com/rss", category: "motocross_supercross" },
  { name: "Motocross Action Magazine", url: "https://motocrossactionmag.com/feed/", category: "motocross_supercross" },

  // 5. American Flat Track (AFT) & Road Racing
  { name: "Cycle News AFT & Superbikes", url: "https://www.cyclenews.com/feed/", category: "flat_track" },
  { name: "MotoAmerica Superbikes", url: "https://www.motoamerica.com/feed/", category: "motorcycles" },

  // 6. Grassroots Dirt Racing, Outlaws & USAC
  { name: "World of Outlaws Sprint & Late Models", url: "https://worldofoutlaws.com/sprintcars/feed/", category: "dirt" },
  { name: "USAC Racing", url: "https://usacracing.com/feed/", category: "dirt" },
  { name: "SPEED SPORT Grassroots Oval", url: "https://speedsport.com/feed/", category: "dirt" },

  // 7. Grassroots Club Racing (SCCA, NASA, ChampCar)
  { name: "SCCA Official Racing Wire", url: "https://www.scca.com/rss", category: "grassroots_club" },
  { name: "NASA Speed News", url: "https://nasaspeed.news/feed/", category: "grassroots_club" },
  { name: "Grassroots Motorsports Club & Autocross", url: "https://grassrootsmotorsports.com/feed/", category: "grassroots_club" },

  // 8. RC Racing (ROAR, IFMAR, 1/8 Nitro, 1/10 Electric)
  { name: "LiveRC Official Wire", url: "https://www.liverc.com/news/rss/", category: "rc_racing" },
  { name: "Red RC International", url: "https://www.redrc.net/feed/", category: "rc_racing" },
  { name: "RC Car Action", url: "https://www.rccaraction.com/feed/", category: "rc_racing" },

  // 9. Formula DRIFT & Grassroots Drifting
  { name: "Drifted Magazine", url: "https://www.drifted.com/feed/", category: "drifting" },

  // 10. Baja, Off-Road & American Rally
  { name: "DirtFish American Rally", url: "https://dirtfish.com/feed/", category: "offroad_rally" },
  { name: "Race-Dezert Off-Road", url: "https://www.race-dezert.com/home/feed/", category: "offroad_rally" },

  // 11. Drag Racing & NHRA
  { name: "Dragzine NHRA", url: "https://www.dragzine.com/feed/", category: "drag" },
  { name: "CompetitionPlus Drag Racing", url: "https://competitionplus.com/feed", category: "drag" },

  // 12. Sim Racing & Esports
  { name: "Traxion.gg Sim Racing", url: "https://traxion.gg/feed/", category: "sim_racing" },

  // 13. Car Shows & Meets
  { name: "Car Show Radar", url: "https://carshowradar.com/feed/", category: "car_shows" },
];

async function runAudit() {
  console.log(`📡 Auditing ${FEEDS_TO_AUDIT.length} Accredited Motorsport Feeds Across All Disciplines...\n`);

  let activeCount = 0;
  for (const feed of FEEDS_TO_AUDIT) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const itemCount = (parsed.items || []).length;
      const latestTitle = parsed.items?.[0]?.title || "No title";
      console.log(`✅ [${feed.category.toUpperCase()}] "${feed.name}" -> ONLINE (${itemCount} live stories). Latest: "${latestTitle.slice(0, 40)}..."`);
      activeCount++;
    } catch (err: any) {
      console.log(`❌ [${feed.category.toUpperCase()}] "${feed.name}" -> ERROR: ${err.message.slice(0, 80)}`);
    }
  }

  console.log(`\n🏁 Audit Complete: ${activeCount}/${FEEDS_TO_AUDIT.length} feeds ONLINE & ACTIVE.`);
}

runAudit();
