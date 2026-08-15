import * as fs from 'fs';
import * as path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { NewsFeed, NewsCategory } from '../src/lib/types/news';

// 1. Read Environment Variables
const envVars: Record<string, string> = {};
const envFiles = ['.env.development.local', '.env.local', '.env.production.local', '.env'];

for (const file of envFiles) {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const eqIdx = trimmed.indexOf('=');
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!envVars[key]) envVars[key] = val;
      }
    });
  }
}

const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gridpass',
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const EXPANDED_FEEDS: Array<{
  name: string;
  url: string;
  category: NewsCategory;
  fetch_interval_mins: number;
}> = [
  // Sportscar & Endurance
  { name: 'DailySportsCar Endurance Wire', url: 'https://www.dailysportscar.com/feed', category: 'sportscar', fetch_interval_mins: 30 },
  { name: 'The Checkered Flag Motorsport', url: 'https://www.thecheckeredflag.co.uk/feed/', category: 'sportscar', fetch_interval_mins: 30 },
  
  // Open Wheel / Formula 1
  { name: 'RaceFans Independent F1 Wire', url: 'https://www.racefans.net/feed/', category: 'open_wheel', fetch_interval_mins: 15 },
  { name: 'Motorsport.com F1 News', url: 'https://www.motorsport.com/rss/f1/news/', category: 'open_wheel', fetch_interval_mins: 15 },
  { name: 'Autosport Grand Prix Wire', url: 'https://www.autosport.com/rss/f1/news/', category: 'open_wheel', fetch_interval_mins: 15 },

  // Stock Car / NASCAR
  { name: 'Frontstretch NASCAR & Short Track', url: 'https://frontstretch.com/feed/', category: 'stock_car', fetch_interval_mins: 15 },
  { name: 'TobyChristie NASCAR Wire', url: 'https://tobychristie.com/feed/', category: 'stock_car', fetch_interval_mins: 20 },
  { name: 'Motorsport.com NASCAR Cup', url: 'https://www.motorsport.com/rss/nascar-cup/news/', category: 'stock_car', fetch_interval_mins: 20 },

  // Dirt & Short Track
  { name: 'Speed Sport National Wire', url: 'https://www.speedsport.com/feed/', category: 'dirt', fetch_interval_mins: 30 },
  { name: 'TJSlideways Sprint Car News', url: 'https://tjslideways.com/feed/', category: 'dirt', fetch_interval_mins: 30 },

  // Drag Racing
  { name: 'Competition Plus Drag Racing', url: 'https://competitionplus.com/feed/', category: 'drag', fetch_interval_mins: 60 },

  // Motorcycles
  { name: 'Roadracing World & Tech', url: 'https://www.roadracingworld.com/feed/', category: 'motorcycles', fetch_interval_mins: 30 },
  { name: 'Asphalt & Rubber Motorcycle Wire', url: 'https://www.asphaltandrubber.com/feed/', category: 'motorcycles', fetch_interval_mins: 30 },

  // Sim Racing
  { name: 'BoxThisLap Sim Racing', url: 'https://boxthislap.org/feed/', category: 'sim_racing', fetch_interval_mins: 30 },

  // RC Racing
  { name: 'Red RC Global News Wire', url: 'https://www.redrc.net/feed/', category: 'rc_racing', fetch_interval_mins: 60 },
  { name: 'Circus RC News', url: 'https://circusrc.com/feed/', category: 'rc_racing', fetch_interval_mins: 60 },

  // Car Shows & Concours
  { name: 'Hemmings Motor News & Culture', url: 'https://www.hemmings.com/stories/feed/', category: 'car_shows', fetch_interval_mins: 120 },
  { name: 'StanceWorks Heritage & Builds', url: 'https://stanceworks.com/feed/', category: 'car_shows', fetch_interval_mins: 120 },
];

async function seedFeeds() {
  console.log(`🚀 Adding ${EXPANDED_FEEDS.length} accredited feeds to news_feeds collection...`);

  let added = 0;
  for (const item of EXPANDED_FEEDS) {
    const id = slugify(item.name);
    const docRef = doc(db, 'news_feeds', id);

    const feedData: Partial<NewsFeed> = {
      id,
      name: item.name,
      url: item.url,
      category: item.category,
      is_active: true,
      fetch_interval_mins: item.fetch_interval_mins,
      last_fetched_at: null,
      total_ingested: 0,
      created_at: new Date().toISOString(),
      status: 'active',
    };

    await setDoc(docRef, feedData, { merge: true });
    added++;
    console.log(`   ✅ Added [${item.category.toUpperCase()}]: "${item.name}"`);
  }

  const snap = await getDocs(collection(db, 'news_feeds'));
  console.log(`\n========================================================`);
  console.log(`🎉 Expansion Complete! news_feeds collection now has ${snap.size} total feeds!`);
  console.log(`========================================================`);
  process.exit(0);
}

seedFeeds();
