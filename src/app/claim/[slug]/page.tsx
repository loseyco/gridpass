'use client';

import React, { useState, use, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Info,
  DollarSign,
  QrCode,
  Lock,
  Loader2,
  Clock,
  Compass,
  ArrowUpRight,
  Database,
  Building,
  CreditCard,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

import { db } from '@/lib/firebase/config';
import { doc, setDoc, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { logEvent } from '@/lib/logger';

// Leads database copy to resolve details by slug
const LEADS_DATABASE = [
  { slug: 'sonoma-raceway', name: 'Sonoma Raceway', category: 'track', location: 'Sonoma, CA', website: 'https://www.sonomaraceway.com', email: 'info@sonomaraceway.com', phone: '(707) 938-8400', instagram: 'https://www.instagram.com/sonomaraceway', facebook: 'https://www.facebook.com/SonomaRaceway', coordinates: '38.16° N, 122.45° W' },
  { slug: 'weathertech-raceway-laguna-seca', name: 'WeatherTech Raceway Laguna Seca', category: 'track', location: 'Salinas, CA', website: 'https://www.weathertechraceway.com', email: 'info@laguna-seca.com', phone: '(831) 242-8200', instagram: 'https://www.instagram.com/weathertechraceway', facebook: 'https://www.facebook.com/WeatherTechRacewayLagunaSeca', coordinates: '36.58° N, 121.75° W' },
  { slug: 'michelin-raceway-road-atlanta', name: 'Michelin Raceway Road Atlanta', category: 'track', location: 'Braselton, GA', website: 'https://www.roadatlanta.com', email: 'info@roadatlanta.com', phone: '(770) 967-6143', instagram: 'https://www.instagram.com/michelinraceway', facebook: 'https://www.facebook.com/MichelinRacewayRoadAtlanta', coordinates: '34.15° N, 83.81° W' },
  { slug: 'lime-rock-park', name: 'Lime Rock Park', category: 'track', location: 'Lakeville, CT', website: 'https://www.limerock.com', email: 'info@limerock.com', phone: '(860) 435-5000', instagram: 'https://www.instagram.com/limerockpark', facebook: 'https://www.facebook.com/limerockpark', coordinates: '41.93° N, 73.38° W' },
  { slug: 'virginia-international-raceway', name: 'Virginia International Raceway', category: 'track', location: 'Alton, VA', website: 'https://www.virnow.com', email: 'info@virnow.com', phone: '(434) 822-7700', instagram: 'https://www.instagram.com/virnow', facebook: 'https://www.facebook.com/virnow', coordinates: '36.56° N, 79.20° W' },
  { slug: 'watkins-glen-international', name: 'Watkins Glen International', category: 'track', location: 'Watkins Glen, NY', website: 'https://www.theglen.com', email: 'info@theglen.com', phone: '(607) 535-2486', instagram: 'https://www.instagram.com/wgi1948', facebook: 'https://www.facebook.com/watkinsgleninternational', coordinates: '42.34° N, 76.92° W' },
  { slug: 'circuit-of-the-americas', name: 'Circuit of the Americas', category: 'track', location: 'Austin, TX', website: 'https://www.circuitoftheamericas.com', email: 'info@theamericas.com', phone: '(512) 301-6600', instagram: 'https://www.instagram.com/cota_official', facebook: 'https://www.facebook.com/CircuitofTheAmericas', coordinates: '30.13° N, 97.64° W' },
  { slug: 'sebring-international-raceway', name: 'Sebring International Raceway', category: 'track', location: 'Sebring, FL', website: 'https://www.sebringraceway.com', email: 'info@sebringraceway.com', phone: '(863) 655-1442', instagram: 'https://www.instagram.com/sebringraceway', facebook: 'https://www.facebook.com/sebringraceway', coordinates: '27.45° N, 81.35° W' },
  { slug: 'windrock-park', name: 'Windrock Park', category: 'offroad', location: 'Oliver Springs, TN', website: 'https://www.windrockpark.com', email: 'info@windrockpark.com', phone: '(865) 435-3000', instagram: 'https://www.instagram.com/windrockpark', facebook: 'https://www.facebook.com/WindrockPark', coordinates: '36.08° N, 84.34° W' },
  { slug: 'rausch-creek-off-road-park', name: 'Rausch Creek Off-Road Park', category: 'offroad', location: 'Pine Grove, PA', website: 'http://www.rc4x4.org/', email: 'info@rc4x4.org', phone: '(570) 695-3100', instagram: 'https://www.instagram.com/rauschcreek', facebook: 'https://www.facebook.com/rauschcreekoffroadpark', coordinates: '40.64° N, 76.45° W' },
  { slug: 'porsche-club-of-america', name: 'Porsche Club of America', category: 'club', location: 'Columbia, MD', website: 'https://www.pca.org', email: 'admin@pca.org', phone: '(410) 381-0910', instagram: 'https://www.instagram.com/porscheclub', facebook: 'https://www.facebook.com/PorscheClubOfAmerica', coordinates: '39.20° N, 76.84° W' },
  { slug: 'bmw-car-club-of-america', name: 'BMW Car Club of America', category: 'club', location: 'Greer, SC', website: 'https://www.bmwcca.org', email: 'questions@bmwcca.org', phone: '(864) 250-0022', instagram: 'https://www.instagram.com/bmwcca', facebook: 'https://www.facebook.com/BMWCCA', coordinates: '34.93° N, 82.25° W' },
  { slug: 'mercer-county-motorsports', name: 'Mercer County Motorsports Park', category: 'dirt_track', location: 'Viola, IL', website: 'https://www.mercer-motorsports.com', email: 'contact@mercer-motorsports.com', phone: '(309) 596-2244', instagram: 'https://www.instagram.com/mercercountymotorsports', facebook: 'https://www.facebook.com/MercerCountyMotorsportsPark', coordinates: '41.20° N, 90.58° W' },
  { slug: 'viola-auto-care', name: 'Viola Auto Care & Muffler', category: 'auto_shop', location: 'Viola, IL', website: 'https://www.viola-autocare.com', email: 'service@viola-autocare.com', phone: '(309) 596-2911', instagram: 'https://www.instagram.com/violaautocare', facebook: 'https://www.facebook.com/ViolaAutoCareMuffler', coordinates: '41.20° N, 90.58° W' },
  { slug: 'blackwood-mx-park', name: 'Blackwood Motocross Park', category: 'mx', location: 'Viola, IL', website: 'https://www.blackwoodmx.com', email: 'info@blackwoodmx.com', phone: '(309) 596-8511', instagram: 'https://www.instagram.com/blackwoodmx', facebook: 'https://www.facebook.com/BlackwoodMX', coordinates: '41.22° N, 90.56° W' },
  { slug: 'mercer-county-offroad', name: 'Mercer County Offroad Lands', category: 'open_land', location: 'Aledo, IL', website: 'https://www.mercer-offroad.com', email: 'explore@mercer-offroad.com', phone: '(309) 582-5500', instagram: 'https://www.instagram.com/mercercooffroad', facebook: 'https://www.facebook.com/MercerCountyOffroadLands', coordinates: '41.20° N, 90.75° W' }
];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ClaimPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const lead = LEADS_DATABASE.find(l => l.slug === slug) || LEADS_DATABASE[0];
  const isAutoShop = lead.category === 'auto_shop';
  const isGrassroots = lead.category === 'dirt_track' || lead.category === 'mx' || lead.category === 'open_land';

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [onboarded, setOnboarded] = useState(false);
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  // Form inputs
  const [managerEmail, setManagerEmail] = useState(lead ? lead.email : '');
  const [taxId, setTaxId] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [legalBusinessName, setLegalBusinessName] = useState(lead ? lead.name : '');

  // Firestore synchronization logic
  useEffect(() => {
    if (!slug) return;
    const docRef = doc(db, 'voyage_claims', slug);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      setIsSyncing(false);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLegalBusinessName(data.legalBusinessName || lead.name);
        setManagerEmail(data.managerEmail || lead.email);
        setTaxId(data.taxId || '');
        setRoutingNumber(data.routingNumber || '');
        setOnboarded(true);
        setActiveStep(3);
      } else {
        setOnboarded(false);
        setActiveStep(1);
      }
    });

    return () => unsubscribe();
  }, [slug, lead]);

  const triggerStripeOnboarding = () => {
    setIsStripeModalOpen(true);
  };

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStripeLoading(true);
    
    try {
      const docRef = doc(db, 'voyage_claims', slug);
      await setDoc(docRef, {
        slug,
        legalBusinessName,
        managerEmail,
        taxId,
        routingNumber,
        accountNumber: accountNumber.replace(/./g, '*'), // secure mask for storage
        onboarded: true,
        onboardedAt: serverTimestamp(),
        status: 'active'
      });

      await logEvent(
        'success',
        'system',
        `Business claimed via Stripe Connect: ${lead.name} (${slug})`,
        {
          slug,
          legalBusinessName,
          managerEmail,
          category: lead.category
        }
      );

      setIsStripeLoading(false);
      setIsStripeModalOpen(false);
      setOnboarded(true);
      setActiveStep(3);
    } catch (err) {
      console.error("Failed to persist business claim:", err);
      alert("Failed to save claim details: " + err);
      setIsStripeLoading(false);
    }
  };

  const handleResetClaim = async () => {
    if (window.confirm(`Developer Check: Are you sure you want to delete the claim status for ${lead.name}?`)) {
      try {
        await deleteDoc(doc(db, 'voyage_claims', slug));
        await logEvent('info', 'system', `Developer reset claim status for ${lead.name} (${slug})`);
        alert("Claim status deleted successfully.");
      } catch (err) {
        console.error("Failed to delete claim:", err);
        alert("Delete failed: " + err);
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden flex flex-col pt-28">
      {/* Ambient glass glows */}
      <div className="mesh-glow" />

      <Navbar />

      <section className="relative max-w-5xl mx-auto px-6 py-8 flex-1 z-10 w-full space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-900 pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              <Building className="w-3.5 h-3.5 text-blue-500" /> Self-Serve Business Onboarding
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none">
              Claim {lead.name}
            </h1>
            <p className="text-neutral-400 text-xs font-semibold">
              {isAutoShop 
                ? "Unlock dynamic scheduling deposits, local customer service routing, and $49/mo premium hosting."
                : isGrassroots
                ? "Unlock cashless spectator gate check-ins, paperless safety waivers, and $49/mo premium hosting."
                : "Unlock dynamic payment routing, live spectator waiver collections, and $49/mo premium hosting."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href={`/previews/${lead.slug}`}
              className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded-xl text-xs font-bold uppercase transition-all"
            >
              ← Back to Preview Site
            </Link>
          </div>
        </div>

        {/* STEPPER TRACKER */}
        <div className="grid grid-cols-3 gap-4 border-b border-neutral-900 pb-6 text-center">
          <div className={`space-y-1 ${activeStep >= 1 ? 'text-blue-400' : 'text-neutral-600'}`}>
            <span className="text-[10px] font-black uppercase tracking-wider block">Step 1</span>
            <span className="text-xs font-bold">Verify Authority</span>
          </div>
          <div className={`space-y-1 ${activeStep >= 2 ? 'text-cyan-400' : 'text-neutral-600'}`}>
            <span className="text-[10px] font-black uppercase tracking-wider block">Step 2</span>
            <span className="text-xs font-bold">Stripe KYC Ledger</span>
          </div>
          <div className={`space-y-1 ${activeStep >= 3 ? 'text-emerald-400' : 'text-neutral-600'}`}>
            <span className="text-[10px] font-black uppercase tracking-wider block">Step 3</span>
            <span className="text-xs font-bold">Activate Subscription</span>
          </div>
        </div>

        {/* LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* MAIN CONFIGURATION LAYER */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* STEP 1: VERIFY AUTHORITY */}
            {activeStep === 1 && (
              <div className="glass-card p-6 rounded-3xl border-neutral-900 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    {isAutoShop ? "Verify Shop Authority" : "Verify Gate Authority"}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-semibold">
                    {isAutoShop
                      ? `To protect service booking schedules, only designated mechanics, shop owners, or managers of ${lead.name} are permitted to claim this billing route.`
                      : `To protect paddock operations, only designated officials, administrators, or managers of ${lead.name} are permitted to claim this billing route.`}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Manager Contact Email</label>
                    <input
                      type="email"
                      required
                      placeholder={isAutoShop ? "e.g. service@viola-autocare.com" : "e.g. manager@sonomaraceway.com"}
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <p className="text-[9px] text-neutral-600 font-semibold leading-relaxed">
                      * Pre-populated from lead crawler index validation registers.
                    </p>
                  </div>

                  <div className="p-4 bg-neutral-950/60 rounded-2xl border border-neutral-900 flex items-start gap-3">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">
                      {isAutoShop
                        ? `By proceeding, you verify under perjury protocols that you possess valid authority over scheduling calendars, service diagnostics deposits, and mechanic check-ins for `
                        : `By proceeding, you verify under perjury protocols that you possess valid authority over gate scheduling, waivers, and entry collections for `}
                      <strong>{lead.name}</strong>.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStep(2)}
                  disabled={!managerEmail}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 cursor-pointer"
                >
                  Continue to Stripe Express <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: STRIPE CONNECT EXPRESS ONBOARDING MOCK */}
            {activeStep === 2 && (
              <div className="glass-card p-6 rounded-3xl border-neutral-900 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Payout Account Ledger</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-semibold">
                    {isAutoShop
                      ? "We use Stripe Connect Express to process all scheduling deposits and service ticket transactions. Stripe gathers your KYC (Know Your Customer) information and routes booking revenue directly to your shop's bank account."
                      : "We use Stripe Connect Express to process all ticket transactions and deploy funds. Stripe gathers your KYC (Know Your Customer) information and connects directly to your routing system."}
                  </p>
                </div>

                <div className="p-8 bg-neutral-950/80 rounded-2xl border border-neutral-900 text-center space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                  
                  <div className="h-16 w-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mx-auto">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-white uppercase">Initialize Connect Express Verification</h4>
                    <p className="text-[11px] text-neutral-500 max-w-xs mx-auto leading-relaxed">
                      Stripe will handle all identity KYC verification, secure dispute holds, and automatic rolling payout splits dynamically.
                    </p>
                  </div>

                  <button
                    onClick={triggerStripeOnboarding}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mx-auto cursor-pointer"
                  >
                    Launch Stripe Connect <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SAAS SUBSCRIPTION ACTIVATION */}
            {activeStep === 3 && (
              <div className="glass-card p-6 rounded-3xl border-neutral-900 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Secure SaaS Premium Activation</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-semibold">
                    You have successfully registered authority & payout splits! The final step is activating the monthly hosting and ticketing subscription.
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-blue-950/20 to-neutral-950 border border-neutral-900 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Plan</span>
                      <h4 className="text-lg font-black text-white uppercase">
                        {isAutoShop ? "Gridpass Automotive Hosting" : "Gridpass Venue Hosting"}
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-semibold leading-relaxed">
                        • Pre-built {isAutoShop ? "Service Booking Hub" : "Events Website"} live at `/previews/${lead.slug}`<br />
                        • Flat 1% + $1.50 dynamic split payout billing protection<br />
                        • {isAutoShop 
                            ? "Mechanics companion app access for check-ins and job status updates"
                            : "Windshield QR gate scanner marshals companion app access"}<br />
                        • Custom DNS routing (`{isAutoShop ? "bookings" : "tickets"}.${lead.slug}.com` integration)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">$49</span>
                      <span className="text-xs text-neutral-500 block">/ Month</span>
                    </div>
                  </div>

                  <div className="h-[1px] bg-neutral-900 border-dashed" />
                  <div className="flex justify-between text-xs text-neutral-400 font-bold">
                    <span>KYC Stripe State:</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 fill-emerald-500/10 text-emerald-400" /> CONNECTED
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setOnboarded(true);
                    alert(isAutoShop 
                      ? "Autopilot Live Integration Successful! Your scheduling portal is active, subscription is live, and diagnostic split ledger is active."
                      : "Autopilot Live Integration Successful! Your site is active, subscription is live, and ticketing split ledger is active.");
                    window.location.href = `/previews/${lead.slug}`;
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15 cursor-pointer animate-pulse"
                >
                  {isAutoShop ? "Activate Scheduling Hub & Open Booking Deposits" : "Activate Site & Open Gate Payouts"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* SIDEBAR ANALYTICS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 rounded-3xl border-neutral-900 space-y-4">
              <h4 className="text-xs font-black text-neutral-500 uppercase tracking-wider">Preview Site Diagnostic</h4>
              
              <div className="space-y-4 text-xs font-semibold">
                <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">PRE-BUILT WEB TEMPLATE</span>
                  <Link href={`/previews/${lead.slug}`} className="text-blue-400 hover:underline flex items-center gap-1 truncate">
                    /previews/{lead.slug} <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">
                    {isAutoShop ? "SCHEDULED BOOKINGS METRIC" : "PADDOCK SCANS METRIC"}
                  </span>
                  <div className="text-white">
                    {isAutoShop ? "48 Bookings In Area" : "142 Scans In Area"}
                  </div>
                </div>

                <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">
                    {isAutoShop ? "PRE-ASSIGNED CALENDAR SLOTS" : "PRE-ASSIGNED PHYSICAL TAGS"}
                  </span>
                  <div className="text-white">
                    {isAutoShop ? "250 Slots Monthly" : "1,000 QR Codes Mapped"}
                  </div>
                </div>

                <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">PLATFORM SPLIT INTAKE</span>
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                    {isAutoShop ? "1% + $1.50 per deposit booking" : "1% + $1.50 per scan"}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-3xl border-neutral-900 text-center space-y-2.5">
              <Lock className="w-6 h-6 text-blue-400 mx-auto" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Stripe Escrow Disputes Shield</h4>
              <p className="text-[10px] text-neutral-500 leading-relaxed max-w-xs mx-auto">
                All claims are isolated to Connect merchant codes. In case of disputed charges, the platform escrow is shielded completely, avoiding financial platform liability.
              </p>
            </div>

            {/* Developer Reset Widget */}
            <div className="glass-card p-6 rounded-3xl border-red-950/30 text-center space-y-2.5 bg-red-950/5">
              <RefreshCw className="w-6 h-6 text-red-500 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Developer Sandbox Reset</h4>
              <p className="text-[10px] text-neutral-500 leading-relaxed max-w-xs mx-auto">
                Clear the persistent claim status in Firestore for this lead to re-run the onboarding flow.
              </p>
              <button
                onClick={handleResetClaim}
                className="w-full mt-2 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-900/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Reset Claim State
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STRIPE CONNECT MOCK MODAL GATEWAY */}
      {isStripeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-[2.5rem] border-blue-500/25 bg-[#0e1117] p-8 shadow-2xl relative overflow-hidden text-neutral-300">
            {/* Stripe branding element */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500" />
            
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
              <span className="font-extrabold text-sm tracking-widest text-indigo-400 uppercase">STRIPE CONNECT</span>
              <span className="text-[9px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-black uppercase">EXPRESS GATEWAY</span>
            </div>

            {isStripeLoading ? (
              <div className="py-12 text-center space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
                <p className="text-sm font-black text-white uppercase tracking-widest">Deploying Connected Split Ledger...</p>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  Configuring Express account profiles and generating secure waiver cryptographic database nodes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleStripeSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Onboard {lead.name}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed font-semibold">
                    Complete your payout details. Funds will route directly to this account daily.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Legal Business / Entity Name</label>
                    <input
                      type="text"
                      required
                      value={legalBusinessName}
                      onChange={(e) => setLegalBusinessName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-semibold text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Business Tax ID (EIN)</label>
                      <input
                        type="text"
                        required
                        placeholder="XX-XXXXXXX"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-semibold text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Bank Routing Number</label>
                      <input
                        type="text"
                        required
                        placeholder="021000021"
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-semibold text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Bank Account Number</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-semibold text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setIsStripeModalOpen(false)}
                    className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors text-center"
                  >
                    Authorize & Complete
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
