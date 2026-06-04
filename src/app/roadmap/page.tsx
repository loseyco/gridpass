'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Compass, CheckCircle2, Circle, ArrowUpRight, Shield, Car, Ticket } from 'lucide-react';

const ROADMAP_PHASES = [
  {
    phase: 'Phase 1',
    status: 'COMPLETED',
    statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    title: 'Core App Router & Base Rebuild',
    progress: 100,
    description: 'Bootstrapping the unified framework architecture of Gridpass with complete cookie token syncs, high-end design assets, and Stripe serverless billing integrations.',
    bullets: [
      'Next.js 16 Base Rebuild: Clean App Router architecture with TypeScript & Tailwind CSS v4.',
      'Sleek HSL UI & Styling: Brand-aligned glassmorphism classes, animated ambient glows, and dark typography presets.',
      'Unified QR Resolving: Resolver at /join handling geolocation collection and tag claim registrations.',
      'Serverless Stripe Payments: Checkout session routing, Express onboarding hooks, and secure payout webhooks.'
    ]
  },
  {
    phase: 'Phase 2',
    status: 'IN PROGRESS',
    statusColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse',
    title: 'Market Outreach & Club Integrations',
    progress: 75,
    description: 'Triggering our autonomous business growth team to crawl and pitch regional racing circuits, enthusiast car clubs, and offroad parks.',
    bullets: [
      'Programmatic CRM Leads: Formulating lead crawler scripts collecting verified details of 52+ tracks and club organizers (CSV leads database complete).',
      'Digital Pitch Decks: Custom templates tailored to clubs (p2p garages) and track operators (ticketing, split fees).',
      'Physical QR Tag Campaigns: Marketing campaigns targeting the 1,000 active QR tags already printed and distributed in the wild.'
    ]
  },
  {
    phase: 'Phase 3',
    status: 'UPCOMING',
    statusColor: 'text-neutral-500 bg-neutral-900 border-neutral-800',
    title: 'Digital Garages & Immutable Telemetry Logs',
    progress: 0,
    icon: Car,
    description: 'Developing full digital showcase grids for vehicles and equipment, transforming static claims into active digital garages.',
    bullets: [
      'Digital Vehicle Garages: Publicly viewable profiles showcasing performance specs, active logs, and custom media.',
      'Immutable Maintenance logs: Allowing authorized mechanics or certified technicians to append safety passes and dyno telemetry slips directly into Firestore.',
      'Secured Title Transfers: One-click ownership transfers securely signing over the digital garage and QR association to a new buyer.'
    ]
  },
  {
    phase: 'Phase 4',
    status: 'UPCOMING',
    statusColor: 'text-neutral-500 bg-neutral-900 border-neutral-800',
    title: 'Waiver Verification & Stripe Connected Express Ticketing',
    progress: 0,
    icon: Ticket,
    description: 'Rolling out next-gen racetrack check-in gateways, enabling paperless waiver registration and automatic ticket processing.',
    bullets: [
      'Seamless Ticket Sales: Racetrack day-passes purchasable instantly at the track gate via inline Stripe checkout on /join scans.',
      'Dynamic Digital Waivers: Integrated signing flows validating attendee identity and safety agreement status before event access.',
      'Express Split Payouts: Smart contract-based Stripe payouts routing day-pass sales straight to the venue owner\'s Stripe account while taking a small platform fee.'
    ]
  }
];

export default function Roadmap() {
  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden flex flex-col pt-24">
      {/* Ambient background glows */}
      <div className="mesh-glow" />

      <Navbar />

      <section className="relative max-w-4xl mx-auto px-6 py-12 flex-1 z-10 w-full">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            Project Horizons
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Gridpass <span className="text-gradient">Roadmap</span>
          </h1>
          <p className="text-neutral-400 text-base max-w-xl mx-auto font-medium">
            Discover the future of the universal vehicle network. Real-time updates on active pipelines, outreach swarms, and upcoming capabilities.
          </p>
        </div>

        {/* Phases list */}
        <div className="space-y-8 pb-16">
          {ROADMAP_PHASES.map((phase, index) => (
            <div key={index} className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden group">
              {/* Decorative side accent based on status */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                phase.status === 'COMPLETED' ? 'bg-emerald-500' :
                phase.status === 'IN PROGRESS' ? 'bg-blue-500' :
                'bg-neutral-800'
              }`} />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 pl-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tracking-wider uppercase text-neutral-500">{phase.phase}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${phase.statusColor}`}>
                      {phase.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight group-hover:text-neutral-100 transition-colors">
                    {phase.title}
                  </h3>
                </div>

                {/* Progress bar info */}
                <div className="flex items-center gap-3 text-right">
                  <div className="hidden xs:block text-xs font-bold text-neutral-500">Progress</div>
                  <div className="relative flex items-center justify-center font-bold text-xs bg-neutral-900 border border-neutral-800 h-10 w-10 rounded-full text-white shadow-inner">
                    {phase.progress}%
                  </div>
                </div>
              </div>

              {/* Progress bar track */}
              <div className="w-full h-1 bg-neutral-900 border border-neutral-900/60 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${
                    phase.status === 'COMPLETED' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                    phase.status === 'IN PROGRESS' ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                    'bg-neutral-800'
                  }`}
                  style={{ width: `${phase.progress}%` }}
                />
              </div>

              <div className="pl-2 space-y-4">
                <p className="text-sm text-neutral-400 font-medium leading-relaxed">
                  {phase.description}
                </p>

                {/* Bullet items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-neutral-900/60 pt-4">
                  {phase.bullets.map((bullet, bulletIdx) => {
                    const [highlight, text] = bullet.split(': ');
                    return (
                      <div key={bulletIdx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                        {phase.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : phase.status === 'IN PROGRESS' ? (
                          <Compass className="w-4 h-4 text-blue-400 mt-0.5 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
                        ) : (
                          <Circle className="w-4 h-4 text-neutral-700 mt-0.5 shrink-0" />
                        )}
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
