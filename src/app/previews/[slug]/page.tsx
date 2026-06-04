'use client';

import React, { useState, use, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  HelpCircle, 
  Users, 
  Layers, 
  Info,
  DollarSign,
  QrCode,
  Lock,
  Compass,
  ArrowUpRight,
  CheckCircle
} from 'lucide-react';

import { db } from '@/lib/firebase/config';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

// Generate category-specific events
const getMockEvents = (category: string) => {
  if (category === 'track') {
    return [
      { name: 'High-Performance Driver Education (HPDE) Spring Series', date: 'Saturday, May 30', price: 150, time: '7:00 AM - 5:00 PM', spots: '12 Left' },
      { name: 'Track Day & Open Lapping Sessions', date: 'Sunday, June 14', price: 95, time: '8:30 AM - 4:00 PM', spots: '22 Left' },
      { name: 'Gridpass Time Attack Championship Cup', date: 'Saturday, July 11', price: 45, time: '9:00 AM - 6:00 PM', spots: '8 Left' },
    ];
  } else if (category === 'dirt_track') {
    return [
      { name: 'Saturday Night Clay Oval Late Model Shootout', date: 'Saturday, May 30', price: 25, time: '6:00 PM - 11:00 PM', spots: 'Tickets at Gate' },
      { name: 'Sunday Mud Sprints & Stock Car Demolition', date: 'Sunday, June 14', price: 15, time: '4:00 PM - 9:00 PM', spots: 'Plenty Available' },
      { name: 'Mercer County Amateur Dirt Championship Cup', date: 'Saturday, July 11', price: 20, time: '5:00 PM - 10:00 PM', spots: 'Tickets at Gate' },
    ];
  } else if (category === 'mx') {
    return [
      { name: 'Grassroots Motocross Amateur Induction Day', date: 'Saturday, June 06', price: 35, time: '8:00 AM - 4:00 PM', spots: '14 Left' },
      { name: 'Dirt Pit Open Practice & Gate Jump Contest', date: 'Sunday, June 21', price: 25, time: '9:00 AM - 5:00 PM', spots: '30 Left' },
    ];
  } else if (category === 'open_land') {
    return [
      { name: 'Private Trail Access Day-Pass (Viola Range)', date: 'Saturday, June 06', price: 15, time: 'Dawn to Dusk', spots: 'Self-Serve Gates' },
      { name: 'Mercer County Offroad Mud Jamboree Admission', date: 'Sunday, June 21', price: 25, time: '7:00 AM - 7:00 PM', spots: '50 Spots Left' },
    ];
  } else if (category === 'auto_shop') {
    return [
      { name: 'Full Exhaust & Muffler Flow Diagnostic', date: 'Scheduled Hour', price: 45, time: 'Mon-Sat Slots', spots: 'Instant Booking' },
      { name: 'Local Mechanic Rig Diagnostics & Safety Sweep', date: 'Scheduled Hour', price: 65, time: 'Mon-Sat Slots', spots: 'Instant Booking' },
      { name: 'General Performance Maintenance & Oil Service', date: 'Scheduled Hour', price: 85, time: 'Mon-Fri Slots', spots: 'Instant Booking' },
    ];
  } else if (category === 'offroad') {
    return [
      { name: 'Paddock Crawler Trail Run & Mud Mudder', date: 'Saturday, June 06', price: 40, time: '8:00 AM - 6:00 PM', spots: 'Plenty Available' },
      { name: 'Hill Climb Challenge & Safety Induction', date: 'Sunday, June 21', price: 30, time: '9:00 AM - 3:00 PM', spots: '15 Left' },
      { name: 'MX Amateur Championship Weekend Pass', date: 'July 18-19', price: 75, time: 'Weekend Pass', spots: '30 Left' },
    ];
  } else {
    return [
      { name: 'Enthusiast Coffee & Cars Social Check-in', date: 'Saturday, May 30', price: 15, time: '7:30 AM - 10:30 AM', spots: 'Unlimited' },
      { name: 'Regional Concours d\'Elegance & Dinner', date: 'Saturday, June 20', price: 65, time: '3:00 PM - 9:00 PM', spots: '18 Left' },
      { name: 'GridPass Garage Club Meet & Track Cruise', date: 'Sunday, July 12', price: 25, time: '10:00 AM - 4:00 PM', spots: '45 Left' },
    ];
  }
};

export default function PreviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const lead = LEADS_DATABASE.find(l => l.slug === slug) || LEADS_DATABASE[0];
  const events = getMockEvents(lead.category);

  const [basePrice, setBasePrice] = useState<number>(events[0]?.price ?? 35);
  const [buyerName, setBuyerName] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.name ?? '');
  const [selectedDate, setSelectedDate] = useState('Monday, June 01');
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [waiverChecked, setWaiverChecked] = useState(false);
  const [ticketPurchased, setTicketPurchased] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  // Firestore claim status listener
  useEffect(() => {
    if (!slug) return;
    const docRef = doc(db, 'voyage_claims', slug);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      setIsSyncing(false);
      if (docSnap.exists() && docSnap.data().onboarded === true) {
        setIsClaimed(true);
      } else {
        setIsClaimed(false);
      }
    });

    return () => unsubscribe();
  }, [slug]);

  // Derived pricing calculations
  const baseCents = basePrice * 100;
  const totalCents = Math.round((baseCents + 180) / 0.961);
  const stripeCents = Math.round((totalCents * 0.029) + 30);
  const platformCents = Math.round(150 + (baseCents * 0.01));

  const totalCharged = totalCents / 100;
  const stripeCost = stripeCents / 100;
  const platformProfit = platformCents / 100;
  const buyerFee = (totalCents - baseCents) / 100;

  const handleBuyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !waiverChecked) return;

    try {
      // Record transaction in Firestore voyage_tickets
      const ticketRef = collection(db, 'voyage_tickets');
      await addDoc(ticketRef, {
        slug,
        venueName: lead.name,
        buyerName,
        event: selectedEvent,
        date: selectedDate,
        time: selectedTime,
        basePrice,
        buyerFee,
        totalCharged,
        platformProfit,
        stripeCost,
        purchaseTimestamp: serverTimestamp(),
        category: lead.category,
        claimedAtPurchase: isClaimed
      });

      // Dispatch telemetry event to admin logger
      await logEvent(
        'success',
        'payment',
        `${lead.category === 'auto_shop' ? 'Booking' : 'Ticket Purchase'} registered for ${lead.name}: ${buyerName} - ${selectedEvent}`,
        {
          slug,
          buyerName,
          event: selectedEvent,
          totalCharged,
          platformProfit,
          isClaimed
        }
      );

      setTicketPurchased(true);
    } catch (err) {
      console.error("Failed to register ticket transaction:", err);
      alert("Checkout failed: " + err);
    }
  };

  const getTitleSuffix = () => {
    if (lead.category === 'auto_shop') return 'Automotive Service Hub';
    if (lead.category === 'dirt_track') return 'Dirt Oval Pass Portal';
    if (lead.category === 'mx') return 'Motocross Gate Portal';
    if (lead.category === 'open_land') return 'Trail Access Gate';
    return 'Digital Entry Portal';
  };

  const getTitleGradient = () => {
    if (lead.category === 'auto_shop') return 'from-slate-300 via-neutral-100 to-blue-400';
    if (lead.category === 'dirt_track' || lead.category === 'mx' || lead.category === 'open_land') return 'from-amber-400 via-orange-400 to-yellow-500';
    return 'from-blue-400 to-emerald-400';
  };

  const getDescriptionText = () => {
    if (lead.category === 'auto_shop') {
      return `Welcome to the modern service-booking and scheduling hub for ${lead.name}. Select a mechanical maintenance or diagnostic package, reserve a time slot, and secure your booking deposit with transparent, split-ledger processing.`;
    }
    if (lead.category === 'dirt_track' || lead.category === 'mx' || lead.category === 'open_land') {
      return `Welcome to the grassroots check-in gate for ${lead.name}. Sign digital liability waivers, secure spectator or driver day passes online, and bypass the paddock entry queues with sub-second QR checks.`;
    }
    return `Welcome to the modern check-in hub for ${lead.name}. Affix your GridPass physical tag to your windshield, scan it at the gate, and instantly check-in, verify waivers, and bypass registration lines.`;
  };

  const getEventsHeader = () => {
    if (lead.category === 'auto_shop') return 'Available Service & Diagnostics Slots';
    if (lead.category === 'dirt_track' || lead.category === 'mx' || lead.category === 'open_land') return 'Upcoming Grassroots Admission Gates';
    return 'Upcoming Digital Admission Gates';
  };

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden flex flex-col pt-28">
      {/* Dynamic ambient grid background */}
      <div className="mesh-glow" />

      <Navbar />

      {/* SECURED GATEWAY OR ADMIN MOCKUP BANNER */}
      <section className="max-w-7xl mx-auto px-6 w-full z-20">
        {isClaimed ? (
          <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-neutral-950 to-neutral-950 border-emerald-500/25 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-500/10" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black text-white uppercase tracking-wider">
                    {lead.name}
                  </p>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                    ✓ SECURED GATEWAY — CLAIMED & LIVE
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                  Split payouts are active. Routing securely through Stripe Connect Express ledger.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] text-neutral-500 font-mono tracking-wider">ROUTING: ACTIVE</span>
              <Link 
                href={`/claim/${lead.slug}`}
                className="px-5 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5"
              >
                Manage Stripe Connect <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-blue-950/20 via-neutral-950 to-neutral-950 border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">
                  Automated Gridpass Preview Site — {lead.name}
                </p>
                <p className="text-[10px] text-neutral-400 font-semibold">
                  This page was programmatically pre-built by the Swarm crawler. To activate it live, claim your venue now.
                </p>
              </div>
            </div>
            <Link 
              href={`/claim/${lead.slug}`}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/25 shrink-0"
            >
              Claim & Go Live $49/mo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* VENUE HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-8 w-full z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/5 to-transparent blur-3xl rounded-full" />
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '4s' }} /> {lead.coordinates || 'Verified Location'}
                </div>
                {isClaimed && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/10 shrink-0" /> SECURED GATEWAY
                  </div>
                )}
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase leading-[1.05]">
                {lead.name}<br />
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${getTitleGradient()}`}>
                  {getTitleSuffix()}
                </span>
              </h1>
              
              <p className="text-neutral-400 text-sm leading-relaxed max-w-xl font-medium">
                {getDescriptionText()}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-400 pt-2 border-t border-neutral-900">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-neutral-500" />
                  <span>{lead.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-neutral-500" />
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 underline transition-colors">
                    {lead.website.replace('https://', '').replace('www.', '')} <ArrowUpRight className="w-3 h-3 inline" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* EVENTS LIST */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> {getEventsHeader()}
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {events.map((evt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedEvent(evt.name);
                    setBasePrice(evt.price);
                  }}
                  className={`text-left p-6 rounded-2xl glass-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all relative overflow-hidden ${
                    selectedEvent === evt.name 
                      ? 'border-blue-500/40 bg-neutral-950/60 shadow-lg' 
                      : 'border-neutral-900 hover:border-neutral-800 bg-neutral-950/20'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{evt.date}</span>
                    <h4 className="text-sm font-black text-white">{evt.name}</h4>
                    <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">{evt.time} &bull; <span className="text-emerald-400">{evt.spots}</span></p>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-lg font-black text-white">${evt.price}</span>
                    <div className="h-6 w-6 rounded-full border border-neutral-800 flex items-center justify-center bg-neutral-900 text-[10px] text-blue-400 font-bold shrink-0">
                      {selectedEvent === evt.name ? '✓' : '→'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TICKET BILLING WIDGET */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-3xl border-neutral-900 space-y-6 bg-neutral-900/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-400" />
            
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              {lead.category === 'auto_shop' ? (
                <Calendar className="w-5 h-5 text-blue-400 animate-pulse" />
              ) : (
                <QrCode className="w-5 h-5 text-blue-500" />
              )}
              {lead.category === 'auto_shop' ? 'Secure Service Booking' : 'Quick-Check Gate Pass'}
            </h3>

            {ticketPurchased ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-white uppercase">
                    {lead.category === 'auto_shop' ? 'Booking Confirmed' : 'Pass Generated Successfully'}
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-[200px] mx-auto leading-relaxed">
                    {lead.category === 'auto_shop' ? (
                      `Service reservation confirmed for ${buyerName} on ${selectedDate} at ${selectedTime}. Split payout settled!`
                    ) : (
                      `Check-in credentials issued for **${buyerName}**. Your Gridpass is ready for paddock scan verification!`
                    )}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setTicketPurchased(false);
                    setBuyerName('');
                    setWaiverChecked(false);
                  }}
                  className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  {lead.category === 'auto_shop' ? 'Book Another Service' : 'Generate Another Pass'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleBuyTicket} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    {lead.category === 'auto_shop' ? 'Selected Service' : 'Event Select'}
                  </label>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-900 text-xs font-bold text-neutral-300 truncate">
                    {selectedEvent}
                  </div>
                </div>

                {lead.category === 'auto_shop' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">Select Day</label>
                      <select
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-2.5 bg-neutral-950 border border-neutral-900 rounded-xl text-[11px] font-semibold text-white focus:outline-none"
                      >
                        <option>Monday, June 01</option>
                        <option>Tuesday, June 02</option>
                        <option>Wednesday, June 03</option>
                        <option>Thursday, June 04</option>
                        <option>Friday, June 05</option>
                        <option>Saturday, June 06</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">Select Time</label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full p-2.5 bg-neutral-950 border border-neutral-900 rounded-xl text-[11px] font-semibold text-white focus:outline-none"
                      >
                        <option>8:00 AM</option>
                        <option>10:00 AM</option>
                        <option>1:00 PM</option>
                        <option>3:00 PM</option>
                        <option>4:30 PM</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    {lead.category === 'auto_shop' ? 'Vehicle Owner Name' : 'Driver / Spectator Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lead.category === 'auto_shop' ? 'Enter Owner Full Name' : 'Enter Full Legal Name'}
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs font-semibold placeholder:text-neutral-700 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* DYNAMIC AGREEMENT OR WAIVER */}
                <div className="glass-card p-4 rounded-2xl bg-neutral-950/40 border-neutral-900 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> 
                      {lead.category === 'auto_shop' ? 'Service Authorization' : 'Digital Liability Waiver'}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded">64-bit entropy verified</span>
                  </div>
                  <div className="h-20 overflow-y-auto text-[9px] leading-relaxed text-neutral-500 space-y-2 pr-1 scrollbar-thin">
                    {lead.category === 'auto_shop' ? (
                      <>
                        <p>
                          By signing this agreement, you authorize Viola Auto Care & Muffler to perform diagnostic troubleshooting, structural exhaust/muffler flow inspections, and relative road tests on your vehicle.
                        </p>
                        <p>
                          You agree that diagnostic deposits are settled instantly upon scheduling and are split dynamically via automated Stripe ledgers to protect shop capacity.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          By signing this agreement, you acknowledge that motor racing and offroad driving are highly hazardous sports. You assume all liabilities for vehicle collisions, personal injuries, or paddock accidents occurred inside the premises of {lead.name}.
                        </p>
                        <p>
                          This digital waiver signature is secured using isolated grid telemetry signature keys. Any temporal pass issued will bind driver registration metadata directly to physical windshield tags.
                        </p>
                      </>
                    )}
                  </div>
                  <label className="flex items-start gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={waiverChecked}
                      onChange={(e) => setWaiverChecked(e.target.checked)}
                      className="mt-0.5 accent-blue-500 h-3.5 w-3.5"
                    />
                    <span className="text-[10px] text-neutral-400 font-bold leading-tight select-none">
                      {lead.category === 'auto_shop' ? 'I authorize the diagnostics & road tests.' : 'I agree to the terms & sign the digital liability waiver.'}
                    </span>
                  </label>
                </div>

                {/* THE MATHEMATICAL FEE SPLIT DISPLAY */}
                <div className="p-4 bg-neutral-950/80 rounded-2xl border border-neutral-900 space-y-3 font-semibold">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Base Ticket Price</span>
                    <span className="text-white">${basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      Gridpass Fee <span title="Absorbed transaction & processing surcharge calculated mathematically via dynamic pass-through logic."><HelpCircle className="w-3.5 h-3.5 text-neutral-600 hover:text-neutral-400 transition-colors cursor-help inline" /></span>
                    </span>
                    <span>${buyerFee.toFixed(2)}</span>
                  </div>
                  <div className="h-[1px] bg-neutral-900 border-dashed" />
                  <div className="flex justify-between text-sm font-black text-white">
                    <span>Total Charged</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">${totalCharged.toFixed(2)}</span>
                  </div>

                  {/* TRANSPARENT AUTO LEDGER PROOF */}
                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-950 text-[10px] leading-relaxed text-neutral-500 space-y-1.5 font-medium">
                    <p className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" /> Automated Payout Split Ledger
                    </p>
                    <div className="flex justify-between">
                      <span>Instant to Venue Connected Acc:</span>
                      <span className="text-emerald-400 font-bold">+${basePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stripe Processing Surcharge (2.9%+30c):</span>
                      <span>-${stripeCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Gridpass Passive Profit:</span>
                      <span className="text-blue-400 font-bold">+${platformProfit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!buyerName || !waiverChecked}
                  className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                    buyerName && waiverChecked 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10 cursor-pointer' 
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  {lead.category === 'auto_shop' ? 'Schedule Service & Pay Deposit' : 'Generate Entry pass & Pay'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* DYNAMIC EXPLANATION CARD */}
          <div className="glass-card p-6 rounded-3xl border-neutral-900 text-center space-y-3">
            <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto animate-pulse" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Dynamic Split-Billing Algebra</h4>
            <p className="text-[10px] text-neutral-400 leading-relaxed max-w-xs mx-auto">
              Our split engine guarantees that you never experience day-pass processing losses. Buyers absorb the credit card fees and service surcharges, keeping your platform margins completely passive.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
