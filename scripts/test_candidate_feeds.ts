import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Gridpass-Feed-Verifier/1.0',
  },
  timeout: 8000,
});

const candidateFeeds = [
  // Grassroots & Club / Sportscar
  { name: 'NASA Speed News Magazine', url: 'https://nasaspeed.news/feed/', category: 'grassroots_club' },
  { name: 'DailySportsCar Endurance Wire', url: 'https://www.dailysportscar.com/feed', category: 'sportscar' },
  { name: 'The Checkered Flag Motorsport', url: 'https://www.thecheckeredflag.co.uk/feed/', category: 'sportscar' },
  { name: 'Classic Motorsports Magazine', url: 'https://classicmotorsports.com/news/feed/', category: 'grassroots_club' },

  // Open Wheel / F1
  { name: 'RaceFans Independent F1 Wire', url: 'https://www.racefans.net/feed/', category: 'open_wheel' },
  { name: 'Motorsport.com F1 News', url: 'https://www.motorsport.com/rss/f1/news/', category: 'open_wheel' },
  { name: 'Autosport Grand Prix Wire', url: 'https://www.autosport.com/rss/f1/news/', category: 'open_wheel' },
  { name: 'Pitpass Formula 1 Wire', url: 'https://www.pitpass.com/rss/news.xml', category: 'open_wheel' },

  // Stock Car / NASCAR
  { name: 'Frontstretch NASCAR & Short Track', url: 'https://frontstretch.com/feed/', category: 'stock_car' },
  { name: 'Speedway Digest Wire', url: 'https://www.speedwaydigest.com/index.php?format=feed&type=rss', category: 'stock_car' },
  { name: 'TobyChristie NASCAR Wire', url: 'https://tobychristie.com/feed/', category: 'stock_car' },
  { name: 'Motorsport.com NASCAR Cup', url: 'https://www.motorsport.com/rss/nascar-cup/news/', category: 'stock_car' },

  // Dirt Track & Sprint Cars
  { name: 'Speed Sport National Wire', url: 'https://www.speedsport.com/feed/', category: 'dirt' },
  { name: 'TJSlideways Sprint Car News', url: 'https://tjslideways.com/feed/', category: 'dirt' },

  // Drag Racing
  { name: 'Competition Plus Drag Racing', url: 'https://competitionplus.com/feed/', category: 'drag' },
  { name: 'NHRA Official News Dispatch', url: 'https://www.nhra.com/rss.xml', category: 'drag' },

  // Motorcycles & Supercross
  { name: 'Racer X Motocross & Supercross', url: 'https://racerxonline.com/rss/news', category: 'motorcycles' },
  { name: 'Roadracing World & Tech', url: 'https://www.roadracingworld.com/feed/', category: 'motorcycles' },
  { name: 'Asphalt & Rubber Motorcycle Wire', url: 'https://www.asphaltandrubber.com/feed/', category: 'motorcycles' },

  // Sim Racing
  { name: 'OverTake.gg Sim Racing Portal', url: 'https://www.overtake.gg/feed/', category: 'sim_racing' },
  { name: 'BoxThisLap Sim Racing', url: 'https://boxthislap.org/feed/', category: 'sim_racing' },

  // RC Racing
  { name: 'Red RC Global News Wire', url: 'https://www.redrc.net/feed/', category: 'rc_racing' },
  { name: 'Circus RC News', url: 'https://circusrc.com/feed/', category: 'rc_racing' },

  // Car Shows & Concours
  { name: 'Hemmings Motor News & Culture', url: 'https://www.hemmings.com/stories/feed/', category: 'car_shows' },
  { name: 'StanceWorks Heritage & Builds', url: 'https://stanceworks.com/feed/', category: 'car_shows' },
];

async function verifyFeeds() {
  console.log(`🔍 Testing ${candidateFeeds.length} candidate RSS feeds...\n`);
  const valid: any[] = [];

  for (const f of candidateFeeds) {
    try {
      const parsed = await parser.parseURL(f.url);
      const itemsCount = (parsed.items || []).length;
      console.log(`✅ VALID: [${f.category.toUpperCase()}] "${f.name}" (${itemsCount} items)`);
      valid.push({
        name: f.name,
        url: f.url,
        category: f.category,
        itemsCount,
        sampleTitle: parsed.items?.[0]?.title?.slice(0, 50) || 'N/A',
      });
    } catch (err: any) {
      console.log(`❌ FAILED: "${f.name}" - ${err.message}`);
    }
  }

  console.log(`\n========================================================`);
  console.log(`📊 Result: ${valid.length} / ${candidateFeeds.length} feeds verified active!`);
  console.log(`========================================================`);
}

verifyFeeds();
