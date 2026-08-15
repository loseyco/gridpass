import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.development.local');
const envVars: Record<string, string> = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
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
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gridpass',
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const feeds = [
  { id: 'racer-f1', name: 'Racer.com F1', url: 'https://racer.com/f1/feed/', category: 'open_wheel' },
  { id: 'racer-indycar', name: 'Racer.com IndyCar', url: 'https://racer.com/indycar/feed/', category: 'open_wheel' },
  { id: 'speedcafe', name: 'Speedcafe', url: 'https://www.speedcafe.com/feed/', category: 'open_wheel' },
  { id: 'imsa-news', name: 'IMSA News', url: 'https://www.imsa.com/news/feed/', category: 'sportscar' },
  { id: 'sportscar365', name: 'Sportscar365', url: 'https://sportscar365.com/feed/', category: 'sportscar' },
  { id: 'nascar-com', name: 'NASCAR.com', url: 'https://www.nascar.com/feed/', category: 'stock_car' },
  { id: 'jayski', name: 'Jayski', url: 'https://www.jayski.com/feed/', category: 'stock_car' },
  { id: 'dirtondirt', name: 'DirtOnDirt', url: 'https://www.dirtondirt.com/rss.php', category: 'dirt' },
  { id: 'world-of-outlaws', name: 'World of Outlaws', url: 'https://worldofoutlaws.com/feed/', category: 'dirt' },
  { id: 'dragzine', name: 'Dragzine', url: 'https://www.dragzine.com/feed/', category: 'drag' },
  { id: 'nhra-news', name: 'NHRA News', url: 'https://www.nhra.com/rss/news', category: 'drag' },
  { id: 'motoamerica', name: 'MotoAmerica', url: 'https://motoamerica.com/feed/', category: 'motorcycles' },
  { id: 'cycle-news', name: 'Cycle News', url: 'https://www.cyclenews.com/feed/', category: 'motorcycles' },
  { id: 'ama-supercross', name: 'AMA Supercross', url: 'https://www.amasupercross.com/feed/', category: 'motorcycles' },
  { id: 'iracing-news', name: 'iRacing News', url: 'https://www.iracing.com/feed/', category: 'sim_racing' },
  { id: 'traxion-gg', name: 'Traxion.gg', url: 'https://traxion.gg/feed/', category: 'sim_racing' },
  { id: 'overtake-gg', name: 'OverTake.gg', url: 'https://www.overtake.gg/news/index.rss', category: 'sim_racing' },
  { id: 'carshowradar', name: 'CarShowRadar', url: 'https://carshowradar.com/feed/', category: 'car_shows' },
  { id: 'grassroots-motorsports', name: 'Grassroots Motorsports', url: 'https://grassrootsmotorsports.com/news/feed/', category: 'car_shows' }
];

async function seed() {
  console.log('Seeding news_feeds collection...');
  let count = 0;
  for (const feed of feeds) {
    const feedData = {
      ...feed,
      is_active: true,
      last_fetched_at: null,
      total_ingested: 0,
      created_at: new Date().toISOString(),
    };
    
    await setDoc(doc(db, 'news_feeds', feed.id), feedData);
    console.log(`Seeded: ${feed.name}`);
    count++;
  }
  console.log(`Successfully seeded ${count} feeds.`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Error seeding feeds:', err);
  process.exit(1);
});
