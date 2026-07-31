'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { BusinessProfile } from '@/lib/types/business';

export default function AdminAnalyticsPage() {
  const [clients, setClients] = useState<BusinessProfile[]>([]);
  const [totalScans, setTotalScans] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubBiz = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      const bizList: BusinessProfile[] = [];
      snapshot.forEach((docSnap) => {
        bizList.push({ id: docSnap.id, ...docSnap.data() } as BusinessProfile);
      });
      setClients(bizList);
      setLoading(false);
    }, (err) => {
      console.warn('Analytics biz error:', err);
      setLoading(false);
    });

    const unsubScans = onSnapshot(collection(db, 'tag_scans'), (snapshot) => {
      setTotalScans(snapshot.size);
    }, (err) => {
      console.warn('Analytics scans error:', err);
    });

    return () => {
      unsubBiz();
      unsubScans();
    };
  }, []);

  const totalMrr = clients.reduce((acc, c) => acc + (c.subscription?.mrr || 0), 0);
  const annualRunRate = totalMrr * 12;
  const arpu = clients.length > 0 ? Math.round(totalMrr / clients.length) : 0;

  const verticalCounts: { [key: string]: { mrr: number; clients: number } } = {};
  clients.forEach((c) => {
    const vert = c.vertical || c.category || 'other';
    if (!verticalCounts[vert]) {
      verticalCounts[vert] = { mrr: 0, clients: 0 };
    }
    verticalCounts[vert].mrr += c.subscription?.mrr || 0;
    verticalCounts[vert].clients += 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-black text-[#1c1c1e] uppercase tracking-tight">
          Revenue Analytics & Platform Telemetry HQ
        </h1>
        <p className="text-xs text-neutral-600 font-medium mt-1">
          Detailed revenue metrics, vertical package performance, and QR telemetry across all client accounts.
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-1">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Total Monthly Recurring Revenue
          </p>
          <p className="text-3xl font-black text-[#1c1c1e]">${totalMrr.toLocaleString()}<span className="text-xs font-normal text-neutral-400">/mo</span></p>
          <p className="text-[11px] font-bold text-emerald-600">Annual Run-Rate: ${annualRunRate.toLocaleString()}/yr</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-1">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Average Revenue Per User (ARPU)
          </p>
          <p className="text-3xl font-black text-[#1c1c1e]">${arpu.toLocaleString()}<span className="text-xs font-normal text-neutral-400">/client</span></p>
          <p className="text-[11px] font-bold text-neutral-500">{clients.length} Active Client{clients.length === 1 ? '' : 's'}</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-1">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Total QR Scans Logged
          </p>
          <p className="text-3xl font-black text-[#ff3b30]">{totalScans.toLocaleString()}</p>
          <p className="text-[11px] font-bold text-sky-600">Real-Time Firestore Telemetry</p>
        </div>
      </div>

      {/* Revenue by Vertical */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-[#1c1c1e] uppercase tracking-wider">
            MRR Breakdown by Business Vertical
          </h2>

          {loading ? (
            <div className="p-6 text-center text-xs font-bold text-neutral-400 uppercase">
              Loading Vertical Breakdown...
            </div>
          ) : Object.keys(verticalCounts).length === 0 ? (
            <div className="p-6 text-center text-xs font-bold text-neutral-400 uppercase border border-dashed border-neutral-200 rounded-lg">
              No Business Accounts Provisioned Yet
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(verticalCounts).map(([vertName, data]) => {
                const percentage = totalMrr > 0 ? Math.round((data.mrr / totalMrr) * 100) : 0;
                return (
                  <div key={vertName} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-neutral-900 uppercase">
                      <span>{vertName.replace('_', ' ')} ({data.clients} client{data.clients > 1 ? 's' : ''})</span>
                      <span>${data.mrr}/mo ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ff3b30]"
                        style={{ width: `${percentage || 10}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-[#1c1c1e] uppercase tracking-wider">
            Platform Engine & Database Connection
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
              <div className="flex justify-between font-bold text-emerald-950">
                <span>Firestore Businesses Collection</span>
                <span>Connected</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Tracking {clients.length} provisioned client account(s).
              </p>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg space-y-1">
              <div className="flex justify-between font-bold text-sky-950">
                <span>Firestore Tag Scans Telemetry</span>
                <span>Active</span>
              </div>
              <p className="text-[11px] text-sky-700">
                Tracking {totalScans} verified physical QR tag scan event(s).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
