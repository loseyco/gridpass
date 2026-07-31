'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Loader2, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MigratePage() {
  const { user, loading: authLoading } = useAuth();
  const [running, setRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    businesses: Array<{ id: string; name: string; changes: Record<string, string> }>;
    events: Array<{ id: string; title: string; changes: Record<string, string> }>;
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("Authentication required. Please sign in to run migrations.");
      setRunning(false);
      return;
    }

    async function runMigration() {
      try {
        const migrations = {
          businesses: [] as any[],
          events: [] as any[]
        };

        // 1. Align Businesses
        const bizSnap = await getDocs(collection(db, 'businesses'));
        for (const docSnap of bizSnap.docs) {
          const id = docSnap.id;
          const data = docSnap.data();
          const updates: Record<string, string> = {};

          const ownerUid = data.owner_uid || '';
          const ownerId = data.owner_id || '';

          if (ownerUid && !ownerId) {
            updates.owner_id = ownerUid;
          } else if (ownerId && !ownerUid) {
            updates.owner_uid = ownerId;
          }

          if (Object.keys(updates).length > 0) {
            const isSuperAdmin = user?.email === 'loseyp@gmail.com';
            const isOwner = data.owner_id === user?.uid || data.owner_uid === user?.uid || !data.owner_id || data.owner_id === 'seeded' || data.owner_id === 'unclaimed';
            
            if (isSuperAdmin || isOwner) {
              try {
                const docRef = doc(db, 'businesses', id);
                await updateDoc(docRef, updates);
                migrations.businesses.push({
                  id,
                  name: data.name || 'Anonymous Business',
                  changes: updates
                });
              } catch (writeErr) {
                console.warn(`Skipping business doc ${id} due to write permissions:`, writeErr);
              }
            }
          }
        }

        // 2. Align Events
        const evSnap = await getDocs(collection(db, 'events'));
        for (const docSnap of evSnap.docs) {
          const id = docSnap.id;
          const data = docSnap.data();
          const updates: Record<string, string> = {};

          const hostUid = data.host_uid || '';
          const hostId = data.host_id || '';

          if (hostUid && !hostId) {
            updates.host_id = hostUid;
          } else if (hostId && !hostUid) {
            updates.host_uid = hostId;
          }

          if (Object.keys(updates).length > 0) {
            const isSuperAdmin = user?.email === 'loseyp@gmail.com';
            const isHost = data.host_uid === user?.uid || data.host_id === user?.uid || !data.host_uid || data.host_uid === 'seeded';

            if (isSuperAdmin || isHost) {
              try {
                const docRef = doc(db, 'events', id);
                await updateDoc(docRef, updates);
                migrations.events.push({
                  id,
                  title: data.title || 'Untitled Event',
                  changes: updates
                });
              } catch (writeErr) {
                console.warn(`Skipping event doc ${id} due to write permissions:`, writeErr);
              }
            }
          }
        }

        setResult(migrations);
        setRunning(false);
      } catch (err: any) {
        console.error("Migration failed:", err);
        setError(err.message || String(err));
        setRunning(false);
      }
    }

    runMigration();
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-8 space-y-6 text-center shadow-sm">
        
        <div className="space-y-2">
          <h1 className="text-xl font-black uppercase text-neutral-900 tracking-tight">
            Database Alignment Tool
          </h1>
          <p className="text-xs text-neutral-500">
            Unifying owner IDs and metadata across businesses and events.
          </p>
        </div>

        {running && (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <Loader2 className="w-10 h-10 text-[#ff3b30] animate-spin" />
            <p className="text-xs text-neutral-600 font-medium">Running database scan and patches...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-left space-y-2">
            <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase font-mono">
              <AlertTriangle className="w-4 h-4" /> Migration Failed
            </div>
            <p className="text-[11px] text-red-700 leading-relaxed font-medium">
              {error}
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase font-mono">
                <CheckCircle className="w-4 h-4" /> Alignments Complete
              </div>
              <ul className="text-[11px] text-emerald-700 font-mono font-bold space-y-1.5">
                <li>• Businesses Aligned: {result.businesses.length}</li>
                <li>• Events Aligned: {result.events.length}</li>
              </ul>
            </div>

            {(result.businesses.length > 0 || result.events.length > 0) && (
              <div className="text-left bg-neutral-100/50 border border-neutral-200 rounded-2xl p-4 max-h-36 overflow-y-auto space-y-2">
                <span className="text-[9px] font-mono text-neutral-400 font-bold uppercase tracking-wider block">Patch Log</span>
                {result.businesses.map(b => (
                  <div key={b.id} className="text-[9px] text-neutral-600 font-mono leading-none">
                    patched biz [{b.name}]: {JSON.stringify(b.changes)}
                  </div>
                ))}
                {result.events.map(e => (
                  <div key={e.id} className="text-[9px] text-neutral-600 font-mono leading-none">
                    patched event [{e.title}]: {JSON.stringify(e.changes)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/dash"
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
