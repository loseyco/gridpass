import * as fs from 'fs';
import * as path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { cleanTitle, calculateTitleSimilarity } from '../src/lib/news-deduplicator';
import { Article } from '../src/lib/types/news';

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

async function cleanDuplicates() {
  console.log('🔍 Scanning news_articles collection for duplicate stories...');

  const snap = await getDocs(query(collection(db, 'news_articles'), where('is_public', '==', true)));
  const articles = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));

  console.log(`📊 Found ${articles.length} public articles.`);

  const handled = new Set<string>();
  let duplicatesFound = 0;

  for (let i = 0; i < articles.length; i++) {
    const artA = articles[i];
    if (handled.has(artA.id)) continue;

    const titleA = cleanTitle(artA.title || '');

    for (let j = i + 1; j < articles.length; j++) {
      const artB = articles[j];
      if (handled.has(artB.id)) continue;

      const titleB = cleanTitle(artB.title || '');
      const similarity = calculateTitleSimilarity(titleA, titleB);

      if (similarity >= 0.5 || titleA.toLowerCase() === titleB.toLowerCase()) {
        console.log(`\n🔀 DUPLICATE FOUND (Similarity: ${(similarity * 100).toFixed(1)}%):`);
        console.log(`   Keeping:  "${artA.title}" (${artA.source_name || 'Outlet'}) [${artA.id}]`);
        console.log(`   Hiding:   "${artB.title}" (${artB.source_name || 'Outlet'}) [${artB.id}]`);

        // Merge better image or content into primary
        const updatesA: Record<string, any> = {
          title: cleanTitle(artA.title || ''),
        };
        if (!artA.cover_image && (artB.cover_image || artB.cover_image_url)) {
          updatesA.cover_image = artB.cover_image || artB.cover_image_url;
          updatesA.cover_image_url = artB.cover_image || artB.cover_image_url;
        }
        await updateDoc(doc(db, 'news_articles', artA.id), updatesA);

        // Soft-delete / hide duplicate
        await updateDoc(doc(db, 'news_articles', artB.id), {
          is_public: false,
          is_hidden: true,
          is_deleted: true,
          status: 'merged',
          merged_into: artA.id,
          updated_at: new Date().toISOString(),
        });

        handled.add(artB.id);
        duplicatesFound++;
      }
    }
  }

  console.log(`\n================================================================`);
  console.log(`✅ Deduplication Complete: Merged & hid ${duplicatesFound} duplicate stories!`);
  console.log(`================================================================`);
  process.exit(0);
}

cleanDuplicates();
