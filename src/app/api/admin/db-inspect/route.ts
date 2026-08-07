import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, limit, query } from 'firebase/firestore';

const COLLECTIONS = [
  'users',
  'vehicles',
  'events',
  'businesses',
  'reward_rules',
  'rewards_catalog',
  'points_logs',
  'sightings',
  'crm_deals',
  'products',
  'proposals',
  'staff',
  'industries',
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('collection');

  const collectionsToInspect = target && target !== 'all' ? [target] : COLLECTIONS;
  const report: Record<string, any> = {};

  for (const collName of collectionsToInspect) {
    try {
      const q = query(collection(db, collName), limit(15));
      const snap = await getDocs(q);

      const docs = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Infer schema fields
      const schema: Record<string, string> = {};
      docs.forEach((d: any) => {
        Object.keys(d).forEach((k) => {
          if (!schema[k]) {
            const val = d[k];
            schema[k] = val === null ? 'null' : Array.isArray(val) ? 'array' : typeof val;
          }
        });
      });

      report[collName] = {
        countSample: docs.length,
        schema,
        sampleRecords: docs.slice(0, 5),
      };
    } catch (err: any) {
      report[collName] = {
        error: err.message || String(err),
      };
    }
  }

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gridpass',
    report,
  });
}
