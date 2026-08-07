'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LiveActivityFeed from '@/components/feed/LiveActivityFeed';
import { Activity, Sparkles, QrCode, Calendar, Car, ShieldCheck } from 'lucide-react';

export default function FeedPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900 font-sans relative flex flex-col">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-24 pb-16 w-full flex-1 space-y-8">
        
        {/* Title Header Block */}
        <div className="bg-neutral-50 border border-neutral-200 p-6 md:p-8 rounded-2xl space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#ff3b30] uppercase bg-[#ff3b30]/5 border border-[#ff3b30]/15 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Community Activity Stream
            </span>
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-mono hidden sm:inline-block">
              Real-time Firestore Sync
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-neutral-900 uppercase tracking-tight leading-none">
            Live Feed
          </h1>
          <p className="text-sm text-neutral-500 max-w-xl">
            Real-time activity stream across Gridpass. See new vehicle passports, physical tag scans, member signups, event updates, and system releases live.
          </p>
        </div>

        {/* Live Activity Feed Component */}
        <div className="w-full">
          <LiveActivityFeed />
        </div>

        {/* Fast Action Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Link 
            href="/scan" 
            className="p-4 bg-neutral-50 hover:bg-[#ff3b30]/5 border border-neutral-200 hover:border-[#ff3b30] rounded-xl transition-all flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-white border border-neutral-200 rounded-lg text-[#ff3b30]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-neutral-900 group-hover:text-[#ff3b30] transition-colors">Scan Tag</h3>
              <p className="text-[10px] text-neutral-500">Scan QR codes & tags</p>
            </div>
          </Link>

          <Link 
            href="/events" 
            className="p-4 bg-neutral-50 hover:bg-[#ff3b30]/5 border border-neutral-200 hover:border-[#ff3b30] rounded-xl transition-all flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-white border border-neutral-200 rounded-lg text-[#ff3b30]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-neutral-900 group-hover:text-[#ff3b30] transition-colors">Find Events</h3>
              <p className="text-[10px] text-neutral-500">Upcoming meets & rallies</p>
            </div>
          </Link>

          <Link 
            href="/explore" 
            className="p-4 bg-neutral-50 hover:bg-[#ff3b30]/5 border border-neutral-200 hover:border-[#ff3b30] rounded-xl transition-all flex items-center gap-3 group"
          >
            <div className="p-2.5 bg-white border border-neutral-200 rounded-lg text-[#ff3b30]">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-neutral-900 group-hover:text-[#ff3b30] transition-colors">Explore Registry</h3>
              <p className="text-[10px] text-neutral-500">Search members & vehicles</p>
            </div>
          </Link>
        </div>

      </div>
      <Footer />
    </main>
  );
}
