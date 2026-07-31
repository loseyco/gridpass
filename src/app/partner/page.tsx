'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { BusinessProfile } from '@/lib/types/business';
import { PartnerRequest } from '@/lib/types/partner';

export default function PartnerOverviewPage() {
  const [clients, setClients] = useState<BusinessProfile[]>([]);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [totalScans, setTotalScans] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // 1. Subscribe to Live Businesses Collection
  useEffect(() => {
    const unsubBiz = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      const bizList: BusinessProfile[] = [];
      snapshot.forEach((docSnap) => {
        bizList.push({ id: docSnap.id, ...docSnap.data() } as BusinessProfile);
      });
      setClients(bizList);
      setLoading(false);
    }, (err) => {
      console.warn('Businesses query fallback:', err);
      setLoading(false);
    });

    // 2. Subscribe to Live Partner Requests
    const unsubReq = onSnapshot(collection(db, 'partner_requests'), (snapshot) => {
      const reqList: PartnerRequest[] = [];
      snapshot.forEach((docSnap) => {
        reqList.push({ id: docSnap.id, ...docSnap.data() } as PartnerRequest);
      });
      setRequests(reqList);
    }, (err) => {
      console.warn('Partner requests query fallback:', err);
    });

    // 3. Subscribe to Live Tag Scans Collection
    const unsubScans = onSnapshot(collection(db, 'tag_scans'), (snapshot) => {
      setTotalScans(snapshot.size);
    }, (err) => {
      console.warn('Tag scans count fallback:', err);
    });

    return () => {
      unsubBiz();
      unsubReq();
      unsubScans();
    };
  }, []);

  // Calculate live MRR from active business subscriptions
  const totalMrr = clients.reduce((acc, c) => acc + (c.subscription?.mrr || 0), 0);
  const openRequests = requests.filter((r) => r.status !== 'closed' && r.status !== 'deployed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c1c1e] uppercase tracking-tight">
              Gridpass Ops Hub
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 font-medium mt-1">
              Build, pitch, provision, and scale custom automotive SaaS packages with live Gridpass telemetry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/partner/demo"
              className="bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg transition shadow-sm"
            >
              🎬 Open Pitch Studio
            </Link>
            <Link
              href="/partner/clients"
              className="bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg transition shadow-sm"
            >
              + Add Client
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid (Real Live Data) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Monthly Recurring Revenue
          </p>
          <p className="text-2xl sm:text-3xl font-black text-[#1c1c1e] mt-1">
            ${totalMrr.toLocaleString()}<span className="text-xs font-normal text-neutral-400">/mo</span>
          </p>
          <span className="inline-block mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Live Subscriptions
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Active Client Orgs
          </p>
          <p className="text-2xl sm:text-3xl font-black text-[#1c1c1e] mt-1">
            {clients.length}
          </p>
          <span className="inline-block mt-2 text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
            {clients.length === 1 ? '1 Client Provisioned' : `${clients.length} Clients Provisioned`}
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Open Requests & Bugs
          </p>
          <p className="text-2xl sm:text-3xl font-black text-[#ff3b30] mt-1">
            {openRequests}
          </p>
          <Link
            href="/partner/requests"
            className="inline-block mt-2 text-[10px] font-bold text-[#ff3b30] hover:underline"
          >
            View Backlog →
          </Link>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Platform QR Scans
          </p>
          <p className="text-2xl sm:text-3xl font-black text-[#1c1c1e] mt-1">
            {totalScans.toLocaleString()}
          </p>
          <span className="inline-block mt-2 text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            Live Telemetry
          </span>
        </div>
      </div>

      {/* Main 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Client Accounts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#1c1c1e] uppercase tracking-wider">
              Active Client Business Accounts
            </h2>
            <Link
              href="/partner/clients"
              className="text-xs font-bold text-[#ff3b30] hover:underline uppercase"
            >
              Manage Toggles →
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-xs font-bold text-neutral-400 uppercase">
                Loading Live Client Accounts...
              </div>
            ) : clients.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-3">
                <p className="text-xs font-bold text-neutral-500 uppercase">
                  No Client Accounts Provisioned Yet
                </p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Click "+ Add Client" or open the Clients tab to provision your first business account and toggle a la carte feature modules.
                </p>
                <Link
                  href="/partner/clients"
                  className="inline-block bg-[#ff3b30] text-white font-bold text-xs uppercase px-4 py-2 rounded-lg"
                >
                  + Provision First Client
                </Link>
              </div>
            ) : (
              clients.map((client) => (
                <div
                  key={client.id}
                  className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:border-neutral-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-[#1c1c1e]">
                          {client.name}
                        </h3>
                        <span className="text-[10px] font-bold uppercase bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                          {client.vertical ? client.vertical.replace('_', ' ') : client.category}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 font-medium mt-1">
                        MRR: <span className="font-bold text-black">${client.subscription?.mrr || 0}/mo</span>
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full uppercase">
                      {client.subscription?.status || 'Active'}
                    </span>
                  </div>

                  {/* Enabled Modules Badge Pills */}
                  <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mr-1">
                      Active Packs:
                    </span>
                    {client.enabled_modules && Object.entries(client.enabled_modules).filter(([_, val]) => val).length > 0 ? (
                      Object.entries(client.enabled_modules)
                        .filter(([_, val]) => val)
                        .map(([key]) => (
                          <span
                            key={key}
                            className="text-[10px] font-semibold bg-neutral-50 text-neutral-800 border border-neutral-200 px-2 py-0.5 rounded"
                          >
                            ✓ {key.replace(/_/g, ' ')}
                          </span>
                        ))
                    ) : (
                      <span className="text-[10px] italic text-neutral-400">Base Core Only</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sales Partner Backlog & Quick Actions Side Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-[#1c1c1e] uppercase tracking-wider">
              Quick Sales Tools
            </h2>

            <div className="space-y-2">
              <Link
                href="/partner/demo"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-neutral-200 hover:border-[#ff3b30] hover:bg-neutral-50 transition group"
              >
                <div>
                  <p className="font-bold text-xs text-black group-hover:text-[#ff3b30]">
                    Launch Client Pitch Demo
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Switch between shop, track, truck & team demo modes.
                  </p>
                </div>
                <span className="text-[#ff3b30] font-bold">→</span>
              </Link>

              <Link
                href="/partner/requests"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-neutral-200 hover:border-black hover:bg-neutral-50 transition group"
              >
                <div>
                  <p className="font-bold text-xs text-black">
                    Log Client Feature Request / Bug
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Direct feedback channel to the builder.
                  </p>
                </div>
                <span className="text-neutral-400 font-bold group-hover:text-black">→</span>
              </Link>
            </div>
          </div>

          {/* Recent Backlog Feed */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[#1c1c1e] uppercase tracking-wider">
                Recent Backlog Updates
              </h2>
              <Link
                href="/partner/requests"
                className="text-[11px] font-bold text-[#ff3b30] hover:underline"
              >
                All ({requests.length})
              </Link>
            </div>

            <div className="space-y-2">
              {requests.length === 0 ? (
                <p className="text-xs text-neutral-400 italic text-center py-4">
                  No requests or bug tickets logged yet.
                </p>
              ) : (
                requests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900 truncate max-w-[160px]">
                        {req.title}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        {req.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-500">
                      <span>{req.client_name}</span>
                      {req.estimated_mrr_impact ? (
                        <span className="font-bold text-emerald-600">
                          +${req.estimated_mrr_impact}/mo MRR
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
