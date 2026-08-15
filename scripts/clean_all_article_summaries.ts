import * as fs from 'fs';
import * as path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { cleanStoryText } from '../src/lib/news-scraper';
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

async function cleanAllArticles() {
  console.log('🧹 Scanning and cleaning existing article content and headlines in Firestore...');

  const snap = await getDocs(collection(db, 'news_articles'));
  let cleanedCount = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data() as Article;
    const rawContent = data.content || '';
    const cleanedContent = cleanStoryText(rawContent);

    if (cleanedContent !== rawContent) {
      // Find clean lead paragraph for summary
      const paragraphs = cleanedContent.split('\n\n');
      const cleanLeadParagraph = paragraphs.find((p) => !p.startsWith('#') && !p.startsWith('>') && p.length > 30) || '';
      const summary = cleanLeadParagraph.slice(0, 240) || data.summary || '';

      await updateDoc(doc(db, 'news_articles', docSnap.id), {
        content: cleanedContent,
        summary: summary,
        updated_at: new Date().toISOString(),
      });
      cleanedCount++;
      console.log(`   ✨ Cleaned: "${data.title?.slice(0, 45)}..." [${docSnap.id}]`);
    }
  }

  console.log(`\n========================================================`);
  console.log(`✅ Cleaned and stripped related links from ${cleanedCount} articles!`);
  console.log(`========================================================`);
  process.exit(0);
}

cleanAllArticles();
