'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle2, Star, Calendar, GitCommit } from 'lucide-react';

const CHANGELOG_ITEMS = [
  {
    version: 'v0.4.0',
    date: 'May 22, 2026',
    title: 'Super-Admin Operations & Feedback Dispatch Queue',
    description: 'Hardened platform telemetry security rules and created centralized logging interfaces for real-time monitoring and automated feedback loops.',
    type: 'Feature Release',
    typeColor: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
    bullets: [
      'In-App Feedback Dispatch: Created /feedback portal to capture user feature requests and bug reports, sync directly to Firestore feedback queue, and form work streams for the active automated operations system.',
      'Super-Admin Console: Engineered a high-end, responsive system logs analyzer route (/admin/logs) securely gated by a strict server-side email match verification restricted exclusively to loseyp@gmail.com.',
      'Central Firestore Logger: Deployed a centralized logger logging all QR tag scans, payment hooks, and server actions structured with custom attributes (IP, browser agent, level, status).',
      'Hardened Rules: Deployed robust firestore.rules and storage.rules preventing unauthorized reads of private logs while allowing public anonymous feedback and QR claim submissions.'
    ]
  },
  {
    version: 'v0.3.0',
    date: 'May 22, 2026',
    title: 'Next-Gen Serverless Stripe Billing Pipeline',
    description: 'Engineered a highly flexible and type-safe serverless payment architecture converting functions from the companion iRacersResource codebase.',
    type: 'Infrastructure Update',
    typeColor: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    bullets: [
      'Stripe Serverless Conversion: Migrated and refactored express onboarding and split-payout billing systems into modern Next.js 16 Route Handlers in /api/billing/*.',
      'Split-Payment Checkout: Deployed /checkout endpoint matching split-fee routing for tracks, ensuring that when day-passes are purchased, the platform fee is collected, and remaining payouts route directly to track owners.',
      'Connected Express Onboarding: Deployed /connect endpoint enabling tracks, parks, and event hosts to instantly link Stripe Express accounts to automatically receive payout distributions.',
      'Verified Signature Webhooks: Built security-hardened webhook validation routing to automatically trigger premium vehicle unlocks and track event check-in entries in Firestore upon successful payment completion.'
    ]
  },
  {
    version: 'v0.2.0',
    date: 'May 22, 2026',
    title: 'Unified QR Resolving & Inline Claim Experience',
    description: 'Designed a highly polished, mobile-first unified router to capture physical QR tag scans in the wild with geolocation insights.',
    type: 'Core Feature',
    typeColor: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    bullets: [
      'Unified Tag Resolver: Engineered the /join landing route, automatically fetching scanner geocoordinates (latitude/longitude), logging location metrics to database, and presenting high-converting registration forms.',
      'Claim Tag Interface: Created ClaimTagForm allowing logged-in community members to claim new tags or register vehicles instantly during the resolve flow with zero friction.',
      'Legacy Forwarding: Deployed a dynamic route wrapper at /qr/[id] to intercept and forward older printed tags in the wild to the optimized /join pipeline, preserving 1,000+ tags active in the field.',
      'Diagnostic Tracking: Built background syncs recording device profiles and proximity details during scans to optimize local track telemetry.'
    ]
  },
  {
    version: 'v0.1.0',
    date: 'May 21, 2026',
    title: 'Next.js 16 & HSL Dark Glassmorphic Bootstrap',
    description: 'Overhauled the legacy base structure from the ground up to establish a state-of-the-art framework layer.',
    type: 'Platform Overhaul',
    typeColor: 'text-pink-400 border-pink-500/20 bg-pink-500/5',
    bullets: [
      'Next.js 16 Workspace: Clean migration to Next.js 16 App Router, TypeScript, and Tailwind CSS v4 in gridpass root folder.',
      'Dark Glassmorphic UI: Created globals.css containing curated HSL colors, smooth transitions, glassmorphic cards, custom typography, and dynamic ambient background glows.',
      'Firebase Singletons: Set up centralized Auth, Firestore, and Storage client singletons and secure Admin SDK server loaders.',
      'Auth Cookies Integration: Integrated AuthProvider wrapping with nookies to sync user JWT tokens securely, ensuring seamless server-side middleware and authentication gate validations.'
    ]
  }
];

export default function Changelog() {
  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden flex flex-col pt-24">
      {/* Ambient background glows */}
      <div className="mesh-glow" />

      <Navbar />

      <section className="relative max-w-4xl mx-auto px-6 py-12 flex-1 z-10 w-full">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
            <Star className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            Public Engineering Stream
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Engine Room <span className="text-gradient">Changelog</span>
          </h1>
          <p className="text-neutral-400 text-base max-w-xl mx-auto font-medium">
            Real-time feed of all technical features, infrastructure conversions, and upgrades compiled live onto the Gridpass platform.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative border-l border-neutral-800 ml-4 sm:ml-6 space-y-12 pb-16">
          {CHANGELOG_ITEMS.map((item, index) => (
            <div key={index} className="relative pl-8 sm:pl-10">
              {/* Timeline Indicator Node */}
              <div className="absolute -left-[9px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-950 border-2 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] z-20">
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              </div>

              {/* Release Card */}
              <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black tracking-tight text-white">{item.version}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${item.typeColor}`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.date}
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-neutral-600 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 w-fit">
                    <GitCommit className="w-3.5 h-3.5 text-blue-500" />
                    GP4-REV-{CHANGELOG_ITEMS.length - 1 - index}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white leading-snug">{item.title}</h3>
                  <p className="text-sm text-neutral-400 font-medium leading-relaxed">{item.description}</p>
                </div>

                {/* Bullet details */}
                <div className="border-t border-neutral-900/60 pt-4 space-y-3">
                  {item.bullets.map((bullet, bulletIdx) => {
                    const [highlight, text] = bullet.split(': ');
                    return (
                      <div key={bulletIdx} className="flex items-start gap-3 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-neutral-300 leading-relaxed">
                          <strong className="text-white font-bold">{highlight}</strong>: {text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
