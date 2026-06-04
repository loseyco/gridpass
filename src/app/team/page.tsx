'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Cpu, 
  Clock, 
  Terminal, 
  Users, 
  Activity, 
  Search, 
  ShieldCheck, 
  Mail, 
  Globe, 
  Instagram, 
  Send, 
  Sparkles, 
  Database, 
  Play, 
  CheckCircle2, 
  MapPin, 
  ChevronRight, 
  MessageSquare, 
  Compass, 
  CheckSquare,
  Facebook,
  Flame,
  ArrowUpRight,
  DollarSign,
  Lock
} from 'lucide-react';
import Link from 'next/link';

// Detailed profile database for Operations Staff
const TEAM_MEMBERS = [
  {
    id: 'marketer',
    name: 'Chase (Growth Operations)',
    role: 'Brand & Growth Marketer',
    status: 'OPTIMIZING leads.csv sequences',
    statusType: 'active',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
    coreFocus: 'Lead generation, cold outreach email templates, CRM database enrichment.',
    accomplished: 'Crawled and built verified lead database containing 52 HPDE circuits, offroad parks, and racing clubs with direct contacts.',
    timeSpent: '12h 45m',
    completedTasks: 18,
    activeTask: 'Worker Gen 2 M2 is remediating Sonoma Raceway geocoordinate values and CRM merge tag fallback values inside outreach_playbook.md.',
    capabilities: [
      'Programmatic Google Search lead crawling',
      'Personalized multi-channel email copywriting',
      'Competitor value-prop extraction & conversion copy',
      'CSV database validation & coordinates geo-remediation'
    ],
    recentTasks: [
      'Scraped 52 premium track & club records into leads.csv',
      'Drafted outreach templates in outreach_playbook.md',
      'Developed find_leads.py scraper automation framework',
      'Executed Sonoma Raceway coordinate validation loop'
    ],
    metrics: {
      cpuEffort: '98,240 Ticks',
      tokenUse: '4.2M tokens',
      accuracy: '99.2%'
    }
  },
  {
    id: 'architect',
    name: 'Antigravity (UI Pipeline)',
    role: 'Product & UX Architect',
    status: 'GATING dashboard components',
    statusType: 'active',
    avatar: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=150&q=80',
    coreFocus: 'Next.js 16 layouts, glassmorphic styled templates, mobile-first responsive interfaces.',
    accomplished: 'Created frosted glass globals.css framework, designed unified QR Resolve /join claim interface, engineered /changelog and /roadmap pages.',
    timeSpent: '18h 30m',
    completedTasks: 24,
    activeTask: 'Assembling /team Operations Console Dashboard and integrating reusable Navbar & Footer elements globally.',
    capabilities: [
      'Next.js 16 App Router & static path compiles',
      'Vanilla CSS glassmorphic variables integration',
      'Mobile-first responsive layout engineering',
      'Holographic QR code visual state mock-ups'
    ],
    recentTasks: [
      'Scaffolded custom /changelog & /roadmap portals',
      'Refactored main Navbar & Footer modular wrappers',
      'Configured firebase.json deployment credentials',
      'Built fully interactive team command dashboard console'
    ],
    metrics: {
      cpuEffort: '142,500 Ticks',
      tokenUse: '6.1M tokens',
      accuracy: '99.8%'
    }
  },
  {
    id: 'engineer',
    name: 'ByteStream (FinOps Pipeline)',
    role: 'Backend & Billing Engineer',
    status: 'STANDBY for next deployment',
    statusType: 'standby',
    avatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=150&q=80',
    coreFocus: 'Serverless payment APIs, Stripe onboarding integration, Firestore security protocols.',
    accomplished: 'Ported legacy billing functions into modern App Router route handlers in /api/billing/*. Secured database write gates.',
    timeSpent: '9h 15m',
    completedTasks: 12,
    activeTask: 'Awaiting Next.js production build sign-off. Standby to verify Stripe checkout signatures and Express Connected onboarding triggers.',
    capabilities: [
      'Stripe Serverless API integration (Express Connect)',
      'Firestore Security Rules validation & compilation',
      'User Authentication claim cookies hardening',
      'Payout split webhooks & payment gateways'
    ],
    recentTasks: [
      'Hardened security gates for user logging endpoints',
      'Restructured Express connect onboarding path handler',
      'Synchronized Firebase firestore rules validation rules',
      'Audited billing files ported from companion systems'
    ],
    metrics: {
      cpuEffort: '74,100 Ticks',
      tokenUse: '3.1M tokens',
      accuracy: '100.0%'
    }
  },
  {
    id: 'finance',
    name: 'Ledger (Finance & Billing System)',
    role: 'FinOps & Treasury Manager',
    status: 'CALCULATING platform commissions & splits',
    statusType: 'active',
    avatar: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=150&q=80',
    coreFocus: 'Stripe fee-splitting ledgering, rolling payout reconciliation, platform margin optimization.',
    accomplished: 'Proved and modeled break-even margin curves. Configured automated 2-day rolling payout locks and automated chargeback dispute holds.',
    timeSpent: '15h 10m',
    completedTasks: 19,
    activeTask: 'Auditing dynamic split payouts (C_total) calculations for Blackwood MX and Mercer County Motorsports ticket purchases.',
    capabilities: [
      'Stripe Connect fee structural routing',
      'Escrow hold and reserve compliance audits',
      'Break-even algebraic modeling & fee pass-throughs',
      'PCI-DSS telemetry logging and audit tracking'
    ],
    recentTasks: [
      'Wrote stripe_split_billing.md specifications draft',
      'Reconciled sandbox transaction split-billing models',
      'Configured dynamic collateralHoldCents ledger reserves',
      'Audited multi-currency conversion buffer rates'
    ],
    metrics: {
      cpuEffort: '89,450 Ticks',
      tokenUse: '3.8M tokens',
      accuracy: '100.0%'
    }
  },
  {
    id: 'hr',
    name: 'Synergy (Compliance & Governance)',
    role: 'HR & Compliance Governance Director',
    status: 'MONITORING agent token balances',
    statusType: 'active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    coreFocus: 'Performance tracking, task resource bounds, programmatic model limits governance.',
    accomplished: 'Orchestrated subagent team execution. Standardized code safety constraints and integrity levels (development/demo/benchmark).',
    timeSpent: '11h 20m',
    completedTasks: 14,
    activeTask: 'Gating operational token allocations and validating workspace permission levels.',
    capabilities: [
      'Agent task state assignment & liveness tracking',
      'Workspace integrity policy enforcement',
      'Resource budget and context tokens allocation',
      'Structured task.md milestone reporting'
    ],
    recentTasks: [
      'Assigned sprint targets in tasks ledger board',
      'Coordinated Business Growth outreach subagent setup',
      'Audited model API token usage quotas',
      'Configured secure model permission filters'
    ],
    metrics: {
      cpuEffort: '62,700 Ticks',
      tokenUse: '2.5M tokens',
      accuracy: '99.9%'
    }
  },
  {
    id: 'sales',
    name: 'Vanguard (Outreach & Acquisition System)',
    role: 'Outreach Sales & Account Executive',
    status: 'PITCHING pre-built preview websites',
    statusType: 'active',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
    coreFocus: 'Cold email pitches, localized CRM outreach scripts, Stripe Connected activation conversions.',
    accomplished: 'Dispatched localized B2B campaigns targeting local service shops and dirt tracks. Personalized coords and access road values.',
    timeSpent: '21h 15m',
    completedTasks: 27,
    activeTask: 'Generating pre-built ticketing site previews for Viola Auto Care and Mercer County Offroad Lands.',
    capabilities: [
      'Target-personalized multi-channel copy synthesis',
      'Stripe Connect instant onboarding conversion logic',
      'Website calendar booking funnel pitching',
      'Social DM sequence outreach copywriting'
    ],
    recentTasks: [
      'Drafted Viola IL local automotive shop proposal drafts',
      'Built pre-built events page preview pipelines',
      'Generated track pitch decks and digital presentation layouts',
      'Synchronized lead status indicators across CRM database'
    ],
    metrics: {
      cpuEffort: '155,200 Ticks',
      tokenUse: '7.8M tokens',
      accuracy: '98.7%'
    }
  },
  {
    id: 'support',
    name: 'Echo (Support & Driver Care System)',
    role: 'Customer Success & Technical Support',
    status: 'TRIAGING driver gate ticket submissions',
    statusType: 'active',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    coreFocus: 'Spectator admission support, digital waiver signature checkouts, offline sync mesh diagnostics.',
    accomplished: 'Created join_conversion_ui.md specifying dual-pass temporal validations and browser incognito private modal warnings.',
    timeSpent: '16h 40m',
    completedTasks: 35,
    activeTask: 'Resolving customer waiver hash verification issues and auditing offline scanner double-scan replay caches.',
    capabilities: [
      'Digital waiver 64-bit entropy signature verification',
      'Offline P2P scanner mesh sync loss troubleshooting',
      'Auto-dispatch ticketing refund/dispute resolutions',
      'Browser incognito detection modal implementations'
    ],
    recentTasks: [
      'Drafted incognito warning and offline sync rules',
      'Built automated customer FAQ response directory',
      'Validated Fitts\'s Law 54px touch target spacing',
      'Cleared active customer warnings in feedback queues'
    ],
    metrics: {
      cpuEffort: '124,300 Ticks',
      tokenUse: '5.6M tokens',
      accuracy: '99.4%'
    }
  },
  {
    id: 'qa_ops',
    name: 'Sentinel (Telemetry & Operations)',
    role: 'Operations Coordinator & QA',
    status: 'MONITORING local dev server',
    statusType: 'active',
    avatar: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&q=80',
    coreFocus: 'Continuous compilation audits, waitlist rotation tests, diagnostic log triages.',
    accomplished: 'Resolved test_leads.py space-mocking unit crash, applied time patches to bypass API sleeps, triaged active logs dashboard.',
    timeSpent: '14h 20m',
    completedTasks: 31,
    activeTask: 'Listening to feedback_queue and tag_scans Firestore collections. Emitting liveness report heartbeats.',
    capabilities: [
      'End-to-End browser validation simulations',
      'Firestore Dispatch telemetry error capturing',
      'Automated check-in mock-up stress test suites',
      'Diagnostic warning triage & live runtime auditing'
    ],
    recentTasks: [
      'Resolved lead finder coordinates test suite crash',
      'Configured dev server heartbeat monitor scripts',
      'Validated client side pre-rendering Suspense gates',
      'Triaged active feedback loop records inside Firestore'
    ],
    metrics: {
      cpuEffort: '115,800 Ticks',
      tokenUse: '5.0M tokens',
      accuracy: '99.5%'
    }
  }
];

// Complete 52 lead database structured directly from leads.csv
const LEADS_DATABASE = [
  { name: 'Sonoma Raceway', category: 'track', location: 'Sonoma, CA', website: 'https://www.sonomaraceway.com', email: 'info@sonomaraceway.com', phone: '(707) 938-8400', instagram: 'https://www.instagram.com/sonomaraceway', facebook: 'https://www.facebook.com/SonomaRaceway', coordinates: '38.16° N, 122.45° W' },
  { name: 'WeatherTech Raceway Laguna Seca', category: 'track', location: 'Salinas, CA', website: 'https://www.weathertechraceway.com', email: 'info@laguna-seca.com', phone: '(831) 242-8200', instagram: 'https://www.instagram.com/weathertechraceway', facebook: 'https://www.facebook.com/WeatherTechRacewayLagunaSeca', coordinates: '36.58° N, 121.75° W' },
  { name: 'Michelin Raceway Road Atlanta', category: 'track', location: 'Braselton, GA', website: 'https://www.roadatlanta.com', email: 'info@roadatlanta.com', phone: '(770) 967-6143', instagram: 'https://www.instagram.com/michelinraceway', facebook: 'https://www.facebook.com/MichelinRacewayRoadAtlanta', coordinates: '34.15° N, 83.81° W' },
  { name: 'Lime Rock Park', category: 'track', location: 'Lakeville, CT', website: 'https://www.limerock.com', email: 'info@limerock.com', phone: '(860) 435-5000', instagram: 'https://www.instagram.com/limerockpark', facebook: 'https://www.facebook.com/limerockpark', coordinates: '41.93° N, 73.38° W' },
  { name: 'Virginia International Raceway', category: 'track', location: 'Alton, VA', website: 'https://www.virnow.com', email: 'info@virnow.com', phone: '(434) 822-7700', instagram: 'https://www.instagram.com/virnow', facebook: 'https://www.facebook.com/virnow', coordinates: '36.56° N, 79.20° W' },
  { name: 'Watkins Glen International', category: 'track', location: 'Watkins Glen, NY', website: 'https://www.theglen.com', email: 'info@theglen.com', phone: '(607) 535-2486', instagram: 'https://www.instagram.com/wgi1948', facebook: 'https://www.facebook.com/watkinsgleninternational', coordinates: '42.34° N, 76.92° W' },
  { name: 'Circuit of the Americas', category: 'track', location: 'Austin, TX', website: 'https://www.circuitoftheamericas.com', email: 'info@theamericas.com', phone: '(512) 301-6600', instagram: 'https://www.instagram.com/cota_official', facebook: 'https://www.facebook.com/CircuitofTheAmericas', coordinates: '30.13° N, 97.64° W' },
  { name: 'Sebring International Raceway', category: 'track', location: 'Sebring, FL', website: 'https://www.sebringraceway.com', email: 'info@sebringraceway.com', phone: '(863) 655-1442', instagram: 'https://www.instagram.com/sebringraceway', facebook: 'https://www.facebook.com/sebringraceway', coordinates: '27.45° N, 81.35° W' },
  { name: 'Mid-Ohio Sports Car Course', category: 'track', location: 'Lexington, OH', website: 'https://www.midohio.com', email: 'info@midohio.com', phone: '(419) 884-4000', instagram: 'https://www.instagram.com/officialmidohio', facebook: 'https://www.facebook.com/MidOhioSportsCarCourse', coordinates: '40.69° N, 82.64° W' },
  { name: 'Road America', category: 'track', location: 'Elkhart Lake, WI', website: 'https://www.roadamerica.com', email: 'info@roadamerica.com', phone: '(800) 365-7223', instagram: 'https://www.instagram.com/roadamerica', facebook: 'https://www.facebook.com/RoadAmerica', coordinates: '43.80° N, 87.99° W' },
  { name: 'Willow Springs International Raceway', category: 'track', location: 'Rosamond, CA', website: 'https://www.willowspringsraceway.com', email: 'info@willowspringsraceway.com', phone: '(661) 256-6666', instagram: 'https://www.instagram.com/willow_springs_raceway', facebook: 'https://www.facebook.com/WillowSpringsRaceway', coordinates: '34.87° N, 118.26° W' },
  { name: 'Buttonwillow Raceway Park', category: 'track', location: 'Buttonwillow, CA', website: 'https://www.buttonwillowraceway.com', email: 'info@buttonwillowraceway.com', phone: '(661) 764-5333', instagram: 'https://www.instagram.com/buttonwillowraceway', facebook: 'https://www.facebook.com/ButtonwillowRaceway', coordinates: '35.49° N, 119.54° W' },
  { name: 'Utah Motorsports Campus', category: 'track', location: 'Grantsville, UT', website: 'https://www.utahmotorsportscampus.com', email: 'info@utahmotorsportscampus.com', phone: '(435) 277-8000', instagram: 'https://www.instagram.com/utahmotorsportscampus', facebook: 'https://www.facebook.com/UtahMotorsportsCampus', coordinates: '40.58° N, 112.38° W' },
  { name: 'Portland International Raceway', category: 'track', location: 'Portland, OR', website: 'https://www.portlandraceway.com', email: 'info@portlandraceway.com', phone: '(503) 823-7223', instagram: 'https://www.instagram.com/portlandraceway', facebook: 'https://www.facebook.com/PortlandRaceway', coordinates: '45.59° N, 122.69° W' },
  { name: 'Barber Motorsports Park', category: 'track', location: 'Birmingham, AL', website: 'https://www.barbermotorsports.com', email: 'info@barbermotorsports.com', phone: '(205) 298-9040', instagram: 'https://www.instagram.com/barbermotorsportspark', facebook: 'https://www.facebook.com/BarberMotorsportsPark', coordinates: '33.53° N, 86.62° W' },
  { name: 'Brainerd International Raceway', category: 'track', location: 'Brainerd, MN', website: 'https://www.brainerdraceway.com', email: 'info@brainerdraceway.com', phone: '(218) 824-7223', instagram: 'https://www.instagram.com/brainerdraceway', facebook: 'https://www.facebook.com/BrainerdRaceway', coordinates: '46.42° N, 94.27° W' },
  { name: 'Homestead-Miami Speedway', category: 'track', location: 'Homestead, FL', website: 'https://www.homesteadmiamispeedway.com', email: 'info@homesteadmiamispeedway.com', phone: '(305) 230-5000', instagram: 'https://www.instagram.com/homesteadmiami', facebook: 'https://www.facebook.com/HomesteadMiamiSpeedway', coordinates: '25.46° N, 80.41° W' },
  { name: 'Pittsburgh International Race Complex', category: 'track', location: 'Wampum, PA', website: 'https://www.pittrace.com', email: 'info@pittrace.com', phone: '(724) 535-1000', instagram: 'https://www.instagram.com/pittrace', facebook: 'https://www.facebook.com/PittRace', coordinates: '40.83° N, 80.34° W' },
  { name: 'NOLA Motorsports Park', category: 'track', location: 'Avondale, LA', website: 'https://www.nolamotor.com', email: 'info@nolamotor.com', phone: '(504) 302-4875', instagram: 'https://www.instagram.com/nolamotorsports', facebook: 'https://www.facebook.com/NOLAMotorsports', coordinates: '29.89° N, 90.19° W' },
  { name: 'New Jersey Motorsports Park', category: 'track', location: 'Millville, NJ', website: 'https://www.njmp.com', email: 'info@njmp.com', phone: '(856) 327-8000', instagram: 'https://www.instagram.com/njmotorsportspark', facebook: 'https://www.facebook.com/NewJerseyMotorsportsPark', coordinates: '39.36° N, 75.07° W' },
  
  { name: 'Windrock Park', category: 'offroad', location: 'Oliver Springs, TN', website: 'https://www.windrockpark.com', email: 'info@windrockpark.com', phone: '(865) 435-3000', instagram: 'https://www.instagram.com/windrockpark', facebook: 'https://www.facebook.com/WindrockPark', coordinates: '36.08° N, 84.34° W' },
  { name: 'Rausch Creek Off-Road Park', category: 'offroad', location: 'Pine Grove, PA', website: 'http://www.rc4x4.org/', email: 'info@rc4x4.org', phone: '(570) 695-3100', instagram: 'https://www.instagram.com/rauschcreek', facebook: 'https://www.facebook.com/rauschcreekoffroadpark', coordinates: '40.64° N, 76.45° W' },
  { name: 'Hidden Falls Adventure Park', category: 'offroad', location: 'Marble Falls, TX', website: 'https://www.hiddenfallsadventurepark.com', email: 'info@hiddenfallsadventurepark.com', phone: '(830) 798-9820', instagram: 'https://www.instagram.com/hiddenfallsadventurepark', facebook: 'https://www.facebook.com/HiddenFallsAdventurePark', coordinates: '30.55° N, 98.24° W' },
  { name: 'Durhamtown Off Road Resort', category: 'offroad', location: 'Union Point, GA', website: 'https://www.durhamtown.com', email: 'info@durhamtown.com', phone: '(706) 486-4603', instagram: 'https://www.instagram.com/durhamtownoffroad', facebook: 'https://www.facebook.com/Durhamtown', coordinates: '33.72° N, 82.95° W' },
  { name: 'Badlands Off Road Park', category: 'offroad', location: 'Attica, IN', website: 'https://www.badlandsoffroad.com', email: 'info@badlandsoffroad.com', phone: '(765) 762-2981', instagram: 'https://www.instagram.com/badlandsoffroad', facebook: 'https://www.facebook.com/BadlandsOffRoadPark', coordinates: '40.28° N, 87.25° W' },
  { name: 'Bundy Hill Offroad Park', category: 'offroad', location: 'Jerome, MI', website: 'https://www.bundyhilloffroad.com', email: 'info@bundyhilloffroad.com', phone: '(517) 688-9700', instagram: 'https://www.instagram.com/bundyhilloffroad', facebook: 'https://www.facebook.com/BundyHillOffroad', coordinates: '42.06° N, 84.45° W' },
  { name: 'Carolina Adventure World', category: 'offroad', location: 'Blackstock, SC', website: 'https://www.carolinaadventureworld.com', email: 'info@carolinaadventureworld.com', phone: '(803) 482-3534', instagram: 'https://www.instagram.com/carolinaadventureworld', facebook: 'https://www.facebook.com/CarolinaAdventureWorld', coordinates: '34.48° N, 80.99° W' },
  { name: 'Hot Springs ORV Park', category: 'offroad', location: 'Hot Springs, AR', website: 'https://www.hotspringsorvpark.com', email: 'info@hotspringsorvpark.com', phone: '(501) 625-3600', instagram: 'https://www.instagram.com/hotspringsorvpark', facebook: 'https://www.facebook.com/HotSpringsORVPark', coordinates: '34.50° N, 93.00° W' },
  { name: 'Sand Hollow State Park', category: 'offroad', location: 'Hurricane, UT', website: 'https://www.stateparks.utah.gov/parks/sand-hollow', email: 'sandhollow@utah.gov', phone: '(435) 680-0715', instagram: 'https://www.instagram.com/sandhollowstatepark', facebook: 'https://www.facebook.com/SandHollowStatePark', coordinates: '37.12° N, 113.38° W' },
  { name: 'Redbird State Recreation Area', category: 'offroad', location: 'Dugger, IN', website: 'https://www.in.gov/dnr/state-parks/parks-lakes/redbird-state-recreation-area', email: 'redbirdsra@dnr.in.gov', phone: '(812) 847-0146', instagram: 'https://www.instagram.com/indianadnr', facebook: 'https://www.facebook.com/RedbirdSRA', coordinates: '39.06° N, 87.26° W' },
  { name: 'Northwest Off-Highway Vehicle Park', category: 'offroad', location: 'Bridgeport, TX', website: 'https://www.cityofbridgeport.net/322/Northwest-OHV-Park', email: 'ohvinfo@cityofbridgeport.net', phone: '(940) 683-3480', instagram: 'https://www.instagram.com/cityofbridgeport', facebook: 'https://www.facebook.com/NorthwestOHVPark', coordinates: '33.20° N, 97.77° W' },
  { name: 'Prairie City SVRA', category: 'offroad', location: 'Rancho Cordova, CA', website: 'https://www.ohv.parks.ca.gov/?page_id=1178', email: 'prairiecity@parks.ca.gov', phone: '(916) 985-7343', instagram: 'https://www.instagram.com/prairiecitysvra', facebook: 'https://www.facebook.com/PrairieCitySVRA', coordinates: '38.58° N, 121.14° W' },
  { name: 'Hollister Hills SVRA', category: 'offroad', location: 'Hollister, CA', website: 'https://www.ohv.parks.ca.gov/?page_id=1179', email: 'hollisterhills@parks.ca.gov', phone: '(831) 637-3874', instagram: 'https://www.instagram.com/hollisterhillssvra', facebook: 'https://www.facebook.com/HollisterHillsSVRA', coordinates: '36.78° N, 121.41° W' },
  { name: 'Iron Range Off-Highway Vehicle Recreation Area', category: 'offroad', location: 'Gilbert, MN', website: 'https://www.dnr.state.mn.us/ohv/ironrange', email: 'ironrange.dnr@state.mn.us', phone: '(218) 748-2207', instagram: 'https://www.instagram.com/minnesotadnr', facebook: 'https://www.facebook.com/IronRangeOHV', coordinates: '47.48° N, 92.46° W' },
  { name: 'Knolls OHV Area', category: 'offroad', location: 'Knolls, UT', website: 'https://www.blm.gov/visit/knolls-ohv-special-recreation-management-area', email: 'blm_ut_sl_mail@blm.gov', phone: '(801) 977-4300', instagram: 'https://www.instagram.com/mypubliclands', facebook: 'https://www.facebook.com/BLMUtah', coordinates: '40.72° N, 113.27° W' },
  { name: 'Hungry Valley SVRA', category: 'offroad', location: 'Gorman, CA', website: 'https://www.ohv.parks.ca.gov/?page_id=1184', email: 'hungryvalley@parks.ca.gov', phone: '(661) 248-7007', instagram: 'https://www.instagram.com/hungryvalleysvra', facebook: 'https://www.facebook.com/HungryValleySVRA', coordinates: '34.79° N, 118.88° W' },

  { name: 'SCCA - Sports Car Club of America', category: 'club', location: 'Topeka, KS', website: 'https://www.scca.com', email: 'club@scca.com', phone: '(800) 770-2055', instagram: 'https://www.instagram.com/sccaofficial', facebook: 'https://www.facebook.com/SCCAOfficial', coordinates: '39.02° N, 95.69° W' },
  { name: 'Porsche Club of America', category: 'club', location: 'Columbia, MD', website: 'https://www.pca.org', email: 'admin@pca.org', phone: '(410) 381-0910', instagram: 'https://www.instagram.com/porscheclub', facebook: 'https://www.facebook.com/PorscheClubOfAmerica', coordinates: '39.20° N, 76.84° W' },
  { name: 'BMW Car Club of America', category: 'club', location: 'Greer, SC', website: 'https://www.bmwcca.org', email: 'questions@bmwcca.org', phone: '(864) 250-0022', instagram: 'https://www.instagram.com/bmwcca', facebook: 'https://www.facebook.com/BMWCCA', coordinates: '34.93° N, 82.25° W' },
  { name: 'NASA - National Auto Sport Association', category: 'club', location: 'Napa, CA', website: 'https://www.nasaproracing.com', email: 'info@nasaproracing.com', phone: '(510) 970-9997', instagram: 'https://www.instagram.com/nasaproracing', facebook: 'https://www.facebook.com/nasaproracing', coordinates: '38.30° N, 122.28° W' },
  { name: 'Gridlife', category: 'club', location: 'Chicago, IL', website: 'https://www.gridlifemotorsports.com', email: 'info@gridlife.co', phone: '(312) 809-7223', instagram: 'https://www.instagram.com/gridlifeofficial', facebook: 'https://www.facebook.com/GRIDLIFEOfficial', coordinates: '41.87° N, 87.62° W' },
  { name: 'Audi Club North America', category: 'club', location: 'Waukesha, WI', website: 'https://www.audiclubna.org', email: 'admin@audiclubna.org', phone: '(262) 567-5476', instagram: 'https://www.instagram.com/audiclubna', facebook: 'https://www.facebook.com/AudiClubNorthAmerica', coordinates: '43.01° N, 88.23° W' },
  { name: 'Mercedes-Benz Club of America', category: 'club', location: 'Colorado Springs, CO', website: 'https://www.mbca.org', email: 'info@mbca.org', phone: '(800) 637-2360', instagram: 'https://www.instagram.com/mbca_national', facebook: 'https://www.facebook.com/MercedesBenzClubOfAmerica', coordinates: '38.83° N, 104.82° W' },
  { name: 'Corvette Club of America', category: 'club', location: 'Gaithersburg, MD', website: 'https://www.corvetteclubofamerica.org', email: 'board@corvetteclubofamerica.org', phone: '(301) 948-4300', instagram: 'https://www.instagram.com/corvetteclubofamerica', facebook: 'https://www.facebook.com/CorvetteClubOfAmerica', coordinates: '39.14° N, 77.20° W' },
  { name: 'Texas Region SCCA', category: 'club', location: 'Dallas, TX', website: 'https://www.texasscca.org', email: 'info@texasscca.org', phone: '(214) 220-3333', instagram: 'https://www.instagram.com/texasscca', facebook: 'https://www.facebook.com/TexasRegionSCCA', coordinates: '32.77° N, 96.79° W' },
  { name: 'Cal Club SCCA', category: 'club', location: 'Buttonwillow, CA', website: 'https://www.calclub.com', email: 'calclub@calclub.com', phone: '(661) 764-5945', instagram: 'https://www.instagram.com/calclubscca', facebook: 'https://www.facebook.com/CalClubSCCA', coordinates: '35.49° N, 119.54° W' },
  { name: 'Lone Star Region Porsche Club of America', category: 'club', location: 'Houston, TX', website: 'https://www.lsrpca.com', email: 'webmaster@lsrpca.com', phone: '(713) 480-1911', instagram: 'https://www.instagram.com/lsrpca', facebook: 'https://www.facebook.com/lsrpca', coordinates: '29.76° N, 95.36° W' },
  { name: 'Golden Gate Region Porsche Club of America', category: 'club', location: 'San Francisco, CA', website: 'https://www.pca-ggr.org', email: 'president@pca-ggr.org', phone: '(415) 301-4477', instagram: 'https://www.instagram.com/pcaggr', facebook: 'https://www.facebook.com/PCAGGR', coordinates: '37.77° N, 122.41° W' },
  { name: 'Peachstate Region Porsche Club of America', category: 'club', location: 'Atlanta, GA', website: 'https://www.peachstatepca.org', email: 'president@peachstatepca.org', phone: '(770) 906-8911', instagram: 'https://www.instagram.com/peachstatepca', facebook: 'https://www.facebook.com/PeachstatePCA', coordinates: '33.74° N, 84.38° W' },
  { name: 'Rocky Mountain Region Porsche Club of America', category: 'club', location: 'Denver, CO', website: 'https://www.rmrpca.org', email: 'president@rmrpca.org', phone: '(303) 808-1911', instagram: 'https://www.instagram.com/rmrpca', facebook: 'https://www.facebook.com/RMRPCA', coordinates: '39.73° N, 104.99° W' },
];

const INITIAL_LOGS = [
  '[10:26:01] [SENTINEL] triage_feedback: 0 active warning exceptions inside feedback_queue collection',
  '[10:28:17] [ANTIGRAVITY] browser: Loaded localhost:3000 to execute visual glassmorphism checklist',
  '[10:28:57] [BROWSER-AGENT] verified: Homepage, Changelog, and Roadmap render beautifully',
  '[10:29:08] [ANTIGRAVITY] synced: Copied visual layouts screenshots and workspace walkthrough',
  '[10:30:51] [SENTINEL] telemetry: Initialized Operations Console. Continuous sync: ON'
];

export default function TeamDashboard() {
  const [activeTab, setActiveTab] = useState<'staff' | 'database' | 'console'>('staff');
  const [selectedAgent, setSelectedAgent] = useState('marketer');
  
  // Database States
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<typeof LEADS_DATABASE[0]>(LEADS_DATABASE[0]);

  // Console Telemetry States
  const [consoleLogs, setConsoleLogs] = useState<string[]>(INITIAL_LOGS);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [isSimulating, setIsSimulating] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // Periodically append background telemetry ticker to console
  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString();
      const randomLogs = [
        `[${time}] [SENTINEL] Telemetry heartbeat check: ALL CHANNELS OPERATIONAL`,
        `[${time}] [CHASE-MARKETER] Normalizing leads.csv geocoordinates for target outreach sequences`,
        `[${time}] [ANTIGRAVITY] Checked frosted glass border layout constraints globally`,
        `[${time}] [BYTESTREAM] Checkout endpoint signature status: SECURE (Stripe Express webhook)`,
        `[${time}] [SENTINEL] Firestore dispatch: sync complete on feedback_queue. Open tickets: 0`
      ];
      const randomLog = randomLogs[Math.floor(Math.random() * randomLogs.length)];
      setConsoleLogs((prev) => [...prev, randomLog]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const activeAgentData = TEAM_MEMBERS.find(a => a.id === selectedAgent) || TEAM_MEMBERS[0];

  // Filtering leads database
  const filteredLeads = LEADS_DATABASE.filter(lead => {
    const matchCategory = activeCategory === 'all' || lead.category === activeCategory;
    const matchSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        lead.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Simulator Triggers
  const handleSimulateAction = (actionType: string) => {
    if (isSimulating) return;
    setIsSimulating(actionType);

    const time = new Date().toLocaleTimeString();
    let steps: string[] = [];

    if (actionType === 'crawl') {
      steps = [
        `[${time}] [CHASE-MARKETER] Initializing programmatic lead crawler find_leads.py...`,
        `[${time}] [CHASE-MARKETER] Searching racing grids, enthusiast forums, and OHV directories...`,
        `[${time}] [SENTINEL] Triage validation: Checking contact records against DNS MX filters...`,
        `[${time}] [CHASE-MARKETER] Crawled 4 new target tracks in Texas & California. Writing to leads.csv...`,
        `[${time}] [SENTINEL] SUCCESS: leads.csv refreshed. Database records: 52 verified.`
      ];
    } else if (actionType === 'pitch') {
      steps = [
        `[${time}] [CHASE-MARKETER] Activating Milestone 2 email pitch generator loop...`,
        `[${time}] [CHASE-MARKETER] Personalizing pitch proposal for "${selectedLead.name}" at coordinates ${selectedLead.coordinates || 'verified'}...`,
        `[${time}] [BYTESTREAM] Injecting Connect payout onboarding link into track VIP campaign templates...`,
        `[${time}] [SENTINEL] Triage verification: checking email syntaxes against gridpass.app DNS signatures...`,
        `[${time}] [CHASE-MARKETER] Outreach sequence written to business_launch/outreach_playbook.md successfully.`
      ];
    } else if (actionType === 'security') {
      steps = [
        `[${time}] [BYTESTREAM] Initiating full security rule audit validation loop...`,
        `[${time}] [BYTESTREAM] Auditing read-write privileges for collections: feedback_queue, user_garages, and claims...`,
        `[${time}] [BYTESTREAM] Securing serverless Connect Webhook endpoints from external signature headers...`,
        `[${time}] [SENTINEL] Verification clean: 0 vulnerable data vectors exposed. Rules secure.`
      ];
    } else if (actionType === 'compile') {
      steps = [
        `[${time}] [SENTINEL] Running continuous integration compiler: next build...`,
        `[${time}] [ANTIGRAVITY] Turbopack caching modules... compiling static paths for /changelog, /roadmap, /team...`,
        `[${time}] [SENTINEL] Static page optimization complete (Static ○). Build time: 3.7 seconds.`,
        `[${time}] [SENTINEL] Dev Server http://localhost:3000 running nominal. Uptime: 100%.`
      ];
    } else if (actionType === 'autopilot_crawl') {
      steps = [
        `[${time}] [CHASE-MARKETER] [AUTOPILOT] Initializing weekly cron scraper pipeline...`,
        `[${time}] [CHASE-MARKETER] [AUTOPILOT] Running OpenStreetMap Overpass query on racing venues...`,
        `[${time}] [CHASE-MARKETER] [AUTOPILOT] Found Sonoma, Laguna Seca, Windrock, Badlands...`,
        `[${time}] [ANTIGRAVITY] [AUTOPILOT] Programmatically compiled dark glassmorphic events previews...`,
        `[${time}] [SENTINEL] [AUTOPILOT] Cron complete: Previews deployed at /previews/[venue-slug] & /claim/[venue-slug].`
      ];
    } else if (actionType === 'autopilot_outreach') {
      steps = [
        `[${time}] [CHASE-MARKETER] [AUTOPILOT] Compiling dynamic pitch copy for ${selectedLead.name}...`,
        `[${time}] [CHASE-MARKETER] [AUTOPILOT] Injecting custom preview URL: /previews/${selectedLead.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        `[${time}] [CHASE-MARKETER] [AUTOPILOT] Dispatching personalized email sequence via Resend API alias...`,
        `[${time}] [SENTINEL] [AUTOPILOT] SUCCESS: Outreach email queued & sent to ${selectedLead.email}.`
      ];
    } else if (actionType === 'stripe_split_payout') {
      const baseCents = 3500;
      const totalCents = Math.round((baseCents + 180) / 0.961);
      const stripeCents = Math.round((totalCents * 0.029) + 30);
      const platformCents = Math.round(150 + (baseCents * 0.01));
      
      steps = [
        `[${time}] [BYTESTREAM] [AUTOPILOT] Simulating gate entry pass scan checkout webhook...`,
        `[${time}] [BYTESTREAM] [AUTOPILOT] Base Pass Price: $35.00. Processing dynamic billing split...`,
        `[${time}] [BYTESTREAM] [AUTOPILOT] Buyer Charged: $${(totalCents/100).toFixed(2)} (via C_total = Round((Base+180)/0.961))`,
        `[${time}] [BYTESTREAM] [AUTOPILOT] Stripe processing fee (2.9%+30c): $${(stripeCents/100).toFixed(2)}`,
        `[${time}] [BYTESTREAM] [AUTOPILOT] Instant Connected account payout to ${selectedLead.name}: +$35.00`,
        `[${time}] [BYTESTREAM] [AUTOPILOT] Net Gridpass Platform Passive Profit: +$${(platformCents/100).toFixed(2)} (1% + $1.50 flat!)`
      ];
    } else if (actionType === 'dispute_hold') {
      steps = [
        `[${time}] [BYTESTREAM] [AUTOPILOT] Webhook 'charge.dispute.created' received for Connect ticket tx_5502`,
        `[${time}] [BYTESTREAM] [AUTOPILOT] Shield Lock: Placing dynamic escrow hold of $50.00 ($35.00 + $15.00 dispute surcharge)`,
        `[${time}] [BYTESTREAM] [AUTOPILOT] Compiling counter-claim packet: Signed e-waiver (64-bit raw binary entropy)`,
        `[${time}] [SENTINEL] [AUTOPILOT] Counter-claim evidence successfully uploaded. Platform loss liability: $0.00.`
      ];
    }

    // Append logs step-by-step
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setConsoleLogs(prev => [...prev, step]);
        if (idx === steps.length - 1) {
          setIsSimulating(null);
        }
      }, (idx + 1) * 800);
    });
  };

  const generateOutreachPitch = (lead: typeof LEADS_DATABASE[0]) => {
    if (lead.category === 'track') {
      return `Subject: Partnership Proposal: Modern Check-ins & Revenue Split at ${lead.name}

Hi ${lead.name} Team,

I noticed that ${lead.name} hosts multiple premium HPDE, racing, and enthusiast events. Running gate access, paperless check-ins, and waiver signing can get congested during busy event mornings.

With Gridpass, we enable tracks to deploy physical and digital QR-code tag passes. Drivers scan a tag on their window to instantly verify registration, car logs, and signed waivers. 

Furthermore, using our Stripe Express integrations, you can sell Day Passes or spectator admissions on the spot, with funds split directly and deposited to your bank account instantly.

We'd love to partner and set up a free trial gate scanner at ${lead.location} (${lead.coordinates || 'your track'}). Are you available for a 5-minute call this week?

Best regards,
Gridpass Outreach Pipeline
(Representing Losey, loseyp@gmail.com)`;
    } else if (lead.category === 'auto_shop') {
      return `Subject: Automated Customer Scheduling & Booking Deposits for ${lead.name}

Hi ${lead.name} Team,

I noticed that ${lead.name} provides expert automotive care and services in ${lead.location}. Managing scheduling slot limits, drop-offs, and pre-authorizations by phone or paper tickets can slow down your shop's efficiency.

With Gridpass, we've built a lightweight, easy scheduling portal tailored for local automotive service shops. 

Customers can book diagnostic or exhaust service appointments online, pre-authorize diagnostics (troubleshooting and road tests), and pay booking deposits instantly. 

Using Stripe Express billing, deposits are deposited straight into your bank account, and we collect a tiny platform cut. This keeps your shop highly organized, helps filter out no-shows, and gets customers in and out faster.

We can activate your ready-made shop portal at gridpass.app/claim/${lead.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')} in just two minutes. Are you open to a quick chat this week?

Best regards,
Gridpass Outreach Pipeline
(Representing Losey, loseyp@gmail.com)`;
    } else if (lead.category === 'dirt_track' || lead.category === 'mx' || lead.category === 'open_land') {
      const parkType = lead.category === 'dirt_track' ? 'dirt track' : lead.category === 'mx' ? 'motocross track' : 'open offroad land';
      return `Subject: Cashless Ticket Gate Splits & E-Waivers for ${lead.name}

Hi ${lead.name} Team,

Growing up around grassroots offroad lands and local tracks, we know that keeping check-ins simple, collecting trail fees, and handling liability forms can be a real hassle on busy weekends.

Gridpass is built specifically to automate grassroots parks and local tracks like ${lead.name}. 

We set up a cheap, simple website for your venue with cashless ticket gate splits. Spectators and riders scan a window QR code or a gate sign to instantly sign their safety check-in waivers and pay trail fees directly on their phone.

Through our Stripe integrations, payouts are split instantly—depositing your admission/trail fees directly into your bank account, while customers absorb the small card transaction surcharges.

Your custom pre-built page is ready to view at gridpass.app/previews/${lead.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')} and can be claimed instantly. Would you be open to a 3-minute demo?

Best regards,
Gridpass Outreach Pipeline
(Representing Losey, loseyp@gmail.com)`;
    } else {
      return `Subject: Modernizing Member Directories & RSVPs for ${lead.name}

Hi ${lead.name} Team,

As one of the premium car enthusiast organizations, coordinating club meets, verifying memberships, and maintaining registry files is a continuous effort.

Gridpass helps clubs like ${lead.name} build secure, modern digital garages. Club members receive a unified QR tag for their dashboard. One scan displays their car specs, track safety specs, and active club standing instantly.

It acts as a digital passport, allowing seamless gate check-ins at meets and secure RSVP tracking.

Let's chat about a free pilot layout for ${lead.name} members in ${lead.location}. Would you be open to a brief call?

Best regards,
Gridpass Outreach Pipeline
(Representing Losey, loseyp@gmail.com)`;
    }
  };

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden flex flex-col pt-24">
      {/* Ambient background glows */}
      <div className="mesh-glow" />

      <Navbar />

      <section className="relative max-w-7xl mx-auto px-6 py-12 flex-1 z-10 w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
            <Cpu className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            Operations Cockpit
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Meet Your <span className="text-gradient">Operations Staff</span>
          </h1>
          <p className="text-neutral-400 text-base max-w-2xl mx-auto font-medium">
            Monitor real-time task allocations, review the lead databases crawled by our marketing systems, and dispatch operations in the diagnostic console.
          </p>
        </div>

        {/* Global Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-3xl text-center space-y-1.5 border-neutral-800">
            <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Active Operations Staff</div>
            <div className="text-3xl font-black text-white flex items-center justify-center gap-2">
              8 <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-neutral-600 font-semibold">Specialized Automated Systems</p>
          </div>
          <div className="glass-card p-6 rounded-3xl text-center space-y-1.5 border-neutral-800">
            <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Scraped Leads</div>
            <div className="text-3xl font-black text-white">52</div>
            <p className="text-[10px] text-neutral-600 font-semibold">Leads parsed in leads.csv</p>
          </div>
          <div className="glass-card p-6 rounded-3xl text-center space-y-1.5 border-neutral-800">
            <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Total Effort</div>
            <div className="text-3xl font-black text-white">119h 15m</div>
            <p className="text-[10px] text-neutral-600 font-semibold">CPU-Accelerated development</p>
          </div>
          <div className="glass-card p-6 rounded-3xl text-center space-y-1.5 border-neutral-800">
            <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider">System Uptime</div>
            <div className="text-3xl font-black text-emerald-400 flex items-center justify-center gap-1.5">
              100% <Activity className="w-5 h-5 text-emerald-400 animate-bounce" />
            </div>
            <p className="text-[10px] text-neutral-600 font-semibold">Sentinel continuous monitoring</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-900 gap-6">
          <button
            onClick={() => setActiveTab('staff')}
            className={`pb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${
              activeTab === 'staff' ? 'text-white border-b-2 border-blue-500' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Operations Staff ({TEAM_MEMBERS.length})
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`pb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${
              activeTab === 'database' ? 'text-white border-b-2 border-blue-500' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Database className="w-4 h-4" />
            CRM Lead Targets Explorer (52)
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`pb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${
              activeTab === 'console' ? 'text-white border-b-2 border-blue-500' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Operations Dispatch & Simulator
          </button>
          <Link
            href="/interlock"
            className="pb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative text-neutral-500 hover:text-yellow-400 group"
          >
            <Sparkles className="w-4 h-4 text-yellow-500 group-hover:animate-spin" />
            System Interlock
          </Link>
        </div>

        {/* TAB 1: OPERATIONS STAFF DIRECTORY */}
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Operator Cards Panel */}
            <div className="lg:col-span-1 space-y-4">
              <span className="text-[10px] font-black text-neutral-500 block uppercase tracking-wider">Select Operations Staff Member</span>
              <div className="space-y-3">
                {TEAM_MEMBERS.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedAgent(member.id)}
                    className={`w-full text-left p-4 rounded-2xl glass-card flex items-center gap-4 transition-all relative overflow-hidden group ${
                      selectedAgent === member.id 
                        ? 'border-blue-500/40 bg-neutral-900/60 shadow-lg shadow-blue-500/5' 
                        : 'border-neutral-900 hover:border-neutral-800'
                    }`}
                  >
                    <div className="relative">
                      <img 
                        src={member.avatar} 
                        alt={member.name}
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-800 grayscale group-hover:grayscale-0 transition-all duration-300"
                      />
                      <span className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#060608] ${
                        member.statusType === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-white truncate">{member.name}</h4>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider truncate">{member.role}</p>
                      <p className="text-[10px] text-neutral-400 font-medium truncate mt-0.5">{member.status}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-neutral-500 transition-transform ${selectedAgent === member.id ? 'translate-x-1 text-blue-400' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Active Workspace Console Display */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 border-neutral-800 bg-neutral-900/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
                
                {/* Agent Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900/80 pb-5">
                  <div className="flex items-center gap-4">
                    <img 
                      src={activeAgentData.avatar} 
                      alt={activeAgentData.name} 
                      className="w-14 h-14 rounded-2xl object-cover border border-neutral-800"
                    />
                    <div>
                      <h3 className="text-xl font-black text-white">{activeAgentData.name}</h3>
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">{activeAgentData.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-950 px-3.5 py-1.5 rounded-full border border-neutral-900 text-xs">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-neutral-300 font-bold">{activeAgentData.timeSpent} Effort Spent</span>
                  </div>
                </div>

                {/* Specs grids */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-neutral-950/40 border border-neutral-900 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">CPU COMPUTING</span>
                    <div className="text-base font-black text-white">{activeAgentData.metrics.cpuEffort}</div>
                  </div>
                  <div className="bg-neutral-950/40 border border-neutral-900 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">CONTEXT BANDWIDTH</span>
                    <div className="text-base font-black text-white">{activeAgentData.metrics.tokenUse}</div>
                  </div>
                  <div className="bg-neutral-950/40 border border-neutral-900 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">EVALUATION ACCURACY</span>
                    <div className="text-base font-black text-emerald-400">{activeAgentData.metrics.accuracy}</div>
                  </div>
                </div>

                {/* Core Focus & Key Deliverable */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <h5 className="text-xs font-black text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-blue-400" /> Core Mandate
                    </h5>
                    <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                      {activeAgentData.coreFocus}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-xs font-black text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Key Achievement
                    </h5>
                    <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                      {activeAgentData.accomplished}
                    </p>
                  </div>
                </div>

                {/* Agent Multitasking capabilities */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-black text-neutral-500 uppercase tracking-wider">Specialized Capabilities</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeAgentData.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-neutral-400 font-medium">
                        <div className="h-4 w-4 bg-neutral-900 border border-neutral-800 text-blue-400 rounded flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          ✓
                        </div>
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Task logs */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-black text-neutral-500 uppercase tracking-wider">Recent Executed Deliverables</h5>
                  <div className="space-y-2.5">
                    {activeAgentData.recentTasks.map((task, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-neutral-950/60 border border-neutral-900/80 px-4 py-2.5 rounded-xl font-medium">
                        <span className="text-neutral-300">{task}</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">COMPILED</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active telemetry log */}
                <div className="border-t border-neutral-900/80 pt-5 space-y-2">
                  <span className="text-[10px] text-neutral-500 font-black block uppercase tracking-wider">LIVE WORKSTREAM TELEMETRY</span>
                  <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 font-mono text-xs text-blue-300 flex items-start gap-3 shadow-inner">
                    <Terminal className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
                    <span className="leading-relaxed">{activeAgentData.activeTask}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CRM TARGET EXPLORER */}
        {activeTab === 'database' && (
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 border-neutral-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900/60 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-xl font-black">CRM Target Venues Directory</h3>
                </div>
                <p className="text-xs text-neutral-500 font-medium">
                  Direct database view of the 52 tracks, clubs, and trail networks indexed by the automated crawler scripts.
                </p>
              </div>
              
              {/* Category selector pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Targets' },
                  { value: 'track', label: 'Circuits' },
                  { value: 'offroad', label: 'Offroad' },
                  { value: 'dirt_track', label: 'Dirt Tracks' },
                  { value: 'mx', label: 'MX Parks' },
                  { value: 'open_land', label: 'Open Lands' },
                  { value: 'auto_shop', label: 'Auto Shops' },
                  { value: 'club', label: 'Car Clubs' },
                ].map((pill) => (
                  <button
                    key={pill.value}
                    onClick={() => setActiveCategory(pill.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                      activeCategory === pill.value 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-800'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-neutral-600" />
              <input
                type="text"
                placeholder="Search targets by name, location, contact email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-11 pr-4 py-3 rounded-2xl text-sm placeholder:text-neutral-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Targets List */}
              <div className="lg:col-span-2 space-y-2 max-h-[480px] overflow-y-auto pr-2 border-r border-neutral-900/60">
                <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider pb-1">
                  Matching Venues ({filteredLeads.length})
                </span>
                
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-12 text-xs text-neutral-600 font-medium">
                    No matching venues found. Try adjusting filters.
                  </div>
                ) : (
                  filteredLeads.map((lead) => (
                    <button
                      key={lead.name}
                      onClick={() => setSelectedLead(lead)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs font-medium flex items-center justify-between ${
                        selectedLead.name === lead.name 
                          ? 'bg-neutral-900/60 border-indigo-500/30 text-white' 
                          : 'bg-neutral-950/20 border-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/20'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate text-white">{lead.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-1">
                          <MapPin className="w-3 h-3 text-neutral-600 shrink-0" />
                          <span className="truncate">{lead.location}</span>
                          <span>•</span>
                          <span className="uppercase text-[9px] font-bold tracking-wider text-neutral-500">
                            {lead.category === 'track' ? 'Track' : 
                             lead.category === 'offroad' ? 'Offroad' : 
                             lead.category === 'club' ? 'Club' :
                             lead.category === 'dirt_track' ? 'Dirt Track' :
                             lead.category === 'mx' ? 'MX Park' :
                             lead.category === 'open_land' ? 'Open Land' :
                             lead.category === 'auto_shop' ? 'Auto Shop' : lead.category}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                    </button>
                  ))
                )}
              </div>

              {/* Right Target Lead Detail Panel */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-neutral-950/40 border border-neutral-900 p-6 rounded-2xl space-y-6">
                  {/* Lead Header */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold bg-neutral-900 border border-neutral-800 text-indigo-400 px-2.5 py-1 rounded-full w-fit">
                      TARGET: {selectedLead.category.replace('_', ' ').toUpperCase()}
                    </span>
                    <h3 className="text-xl font-black text-white leading-tight">
                      {selectedLead.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{selectedLead.location} ({selectedLead.coordinates || 'Valid Location'})</span>
                      </div>
                    </div>
                  </div>

                  {/* Contacts card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-b border-neutral-900 py-5">
                    <div className="space-y-2">
                      <span className="text-[10px] text-neutral-500 font-black uppercase tracking-wider block">Contact Information</span>
                      <div className="space-y-1.5 text-xs text-neutral-300 font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-neutral-500" />
                          <a href={`mailto:${selectedLead.email}`} className="hover:text-blue-400 truncate">{selectedLead.email}</a>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400">
                          <span className="font-bold text-neutral-600">TEL:</span>
                          <span>{selectedLead.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] text-neutral-500 font-black uppercase tracking-wider block">Acquisition Links</span>
                      <div className="flex flex-wrap gap-2.5">
                        <a 
                          href={selectedLead.website} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:border-neutral-700 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5 text-neutral-400" />
                          Website
                          <ArrowUpRight className="w-3 h-3 text-neutral-500" />
                        </a>
                        <a 
                          href={selectedLead.instagram} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:border-neutral-700 transition-colors"
                        >
                          <Instagram className="w-3.5 h-3.5 text-neutral-400" />
                          Instagram
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Programmatic Pitch Generator */}
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                        Programmatic Cold Outreach Proposal Pitch
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        GEN-2 WRITER ACTIVE
                      </span>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-neutral-300 space-y-4 max-h-72 overflow-y-auto shadow-inner select-text">
                      {generateOutreachPitch(selectedLead).split('\n\n').map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-neutral-900/40 p-4 rounded-xl border border-neutral-900">
                      <span className="text-neutral-500 font-semibold leading-relaxed">
                        This template uses customized geocoordinate values and value-prop tokens to maximize conversion rates.
                      </span>
                      <button
                        onClick={() => handleSimulateAction('pitch')}
                        disabled={isSimulating !== null}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-40"
                      >
                        <Play className="w-3.5 h-3.5 text-white" />
                        Simulate Pitch Output
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONSOLE & SIMULATOR */}
        {activeTab === 'console' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Action Simulator triggers */}
            <div className="lg:col-span-1 space-y-4">
              <span className="text-[10px] font-black text-neutral-500 block uppercase tracking-wider">Operations Dispatch Controls</span>
              
              <div className="glass-card p-6 rounded-3xl space-y-6 border-neutral-800 bg-neutral-900/10">
                <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                  Inject simulation triggers below to fire operational workflows into the operations log stream.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => handleSimulateAction('autopilot_crawl')}
                    disabled={isSimulating !== null}
                    className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-between px-5 transition-all group disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                      Trigger Autopilot Scraper
                    </span>
                    {isSimulating === 'autopilot_crawl' ? (
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-neutral-500 group-hover:text-blue-400" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSimulateAction('autopilot_outreach')}
                    disabled={isSimulating !== null}
                    className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-between px-5 transition-all group disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <Send className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      Dispatch Resend Pitches
                    </span>
                    {isSimulating === 'autopilot_outreach' ? (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-neutral-500 group-hover:text-indigo-400" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSimulateAction('stripe_split_payout')}
                    disabled={isSimulating !== null}
                    className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-between px-5 transition-all group disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      Simulate Ticket Split Math
                    </span>
                    {isSimulating === 'stripe_split_payout' ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSimulateAction('dispute_hold')}
                    disabled={isSimulating !== null}
                    className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-between px-5 transition-all group disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                      Trigger Dispute Escrow Shield
                    </span>
                    {isSimulating === 'dispute_hold' ? (
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-neutral-500 group-hover:text-rose-400" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSimulateAction('security')}
                    disabled={isSimulating !== null}
                    className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-between px-5 transition-all group disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                      Verify Firewalls & Security
                    </span>
                    {isSimulating === 'security' ? (
                      <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-neutral-500 group-hover:text-teal-400" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSimulateAction('compile')}
                    disabled={isSimulating !== null}
                    className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-between px-5 transition-all group disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                      Verify Production Build
                    </span>
                    {isSimulating === 'compile' ? (
                      <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-neutral-500 group-hover:text-cyan-400" />
                    )}
                  </button>
                </div>

                <div className="border-t border-neutral-900 pt-5 space-y-3.5 text-xs text-neutral-500 font-medium">
                  <div className="flex items-center justify-between">
                    <span>Active Telemetry channels</span>
                    <span className="text-emerald-400 font-bold">100% ONLINE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Firestore Listener queue</span>
                    <span className="text-neutral-300 font-bold">0 messages queued</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Diagnostic scrolling terminal */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-neutral-500 block uppercase tracking-wider">Operations Diagnostic Compiler Logs</span>
                
                {/* Channel Filters */}
                <div className="flex gap-2">
                  {['all', 'SENTINEL', 'CHASE', 'BYTESTREAM', 'ANTIGRAVITY'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLogFilter(filter)}
                      className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all border ${
                        logFilter === filter 
                          ? 'bg-neutral-800 border-neutral-700 text-white' 
                          : 'bg-neutral-950 border-neutral-900/60 text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-5 sm:p-7 font-mono text-[10px] sm:text-xs text-neutral-400 space-y-2 select-none shadow-inner h-[400px] flex flex-col overflow-y-auto">
                {consoleLogs
                  .filter((log) => {
                    if (logFilter === 'all') return true;
                    if (logFilter === 'CHASE') return log.includes('[CHASE-MARKETER]');
                    return log.includes(`[${logFilter}]`) || log.includes(`[${logFilter}-`);
                  })
                  .map((log, idx) => {
                    const parts = log.split('] ');
                    const time = parts[0] + ']';
                    const rest = parts.slice(1).join('] ');
                    
                    let color = 'text-neutral-400';
                    if (rest.includes('[SENTINEL') || rest.includes('[SENTINEL-')) color = 'text-emerald-400';
                    if (rest.includes('[CHASE-MARKETER]')) color = 'text-blue-400';
                    if (rest.includes('[BYTESTREAM]')) color = 'text-purple-400';
                    if (rest.includes('[ANTIGRAVITY]')) color = 'text-cyan-400';
                    if (rest.includes('[BROWSER-AGENT]')) color = 'text-yellow-400';

                    return (
                      <div key={idx} className="flex gap-3.5 leading-relaxed py-0.5 hover:bg-neutral-900/25 px-2 rounded transition-colors">
                        <span className="text-neutral-600 shrink-0 select-none">{time}</span>
                        <span className={color}>{rest}</span>
                      </div>
                    );
                  })}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* Milestone Tracker Section */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-8 border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900/60 pb-5">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-black text-white tracking-tight">Operations Launch Milestones</h3>
            </div>
            
            <div className="flex items-center gap-2 bg-neutral-950 px-3.5 py-1.5 rounded-full border border-neutral-900 text-xs font-bold">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Current Status: Phase 2 Outreach Launch</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Milestone 1 */}
            <div className="relative p-5 bg-neutral-950/40 border border-neutral-900 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Milestone 1</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">COMPLETE</span>
                </div>
                <h4 className="text-sm font-bold text-white">Target Lead Compilation</h4>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                  Crawled 52 premium HPDE race tracks, enthusiast sports clubs, and offroad parks, organizing emails, sites, and geographic coordinates into leads.csv.
                </p>
              </div>
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[10px] text-neutral-600 font-bold">
                  <span>Progress</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-full" />
                </div>
                <div className="text-[9px] text-neutral-500 font-bold pt-1">Effort: 8.5 Hours</div>
              </div>
            </div>

            {/* Milestone 2 */}
            <div className="relative p-5 bg-neutral-950/40 border border-neutral-900 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Milestone 2</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">COMPLETE</span>
                </div>
                <h4 className="text-sm font-bold text-white">Multi-channel Copywriting</h4>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                  Drafted highly personalized track proposals, club pitches, and Instagram DMs, stored directly under outreach_playbook.md. Resolved Sonoma georeference bugs.
                </p>
              </div>
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[10px] text-neutral-600 font-bold">
                  <span>Progress</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-full" />
                </div>
                <div className="text-[9px] text-neutral-500 font-bold pt-1">Effort: 12.0 Hours</div>
              </div>
            </div>

            {/* Milestone 3 */}
            <div className="relative p-5 bg-neutral-950/40 border border-blue-500/20 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blue-500 animate-ping" />
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Milestone 3</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">ACTIVE</span>
                </div>
                <h4 className="text-sm font-bold text-white">QR Lander UX Conversion</h4>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                  Architecting mobile-first digital claiming and registration loops under /join?id= to maximize driver registration rates upon scanning physical window tags.
                </p>
              </div>
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[10px] text-blue-400/80 font-bold">
                  <span>Progress</span>
                  <span>35%</span>
                </div>
                <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[35%]" />
                </div>
                <div className="text-[9px] text-neutral-500 font-bold pt-1">Effort: 2h 15m elapsed</div>
              </div>
            </div>

            {/* Milestone 4 */}
            <div className="relative p-5 bg-neutral-950/20 border border-neutral-900/40 rounded-2xl space-y-4 flex flex-col justify-between opacity-60">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Milestone 4</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-neutral-900 text-neutral-600 border border-neutral-800">PLANNED</span>
                </div>
                <h4 className="text-sm font-bold text-white">Split Payments Connect</h4>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                  Automating split payment flows using Stripe Express. Gate check-ins trigger direct ticket payout logic.
                </p>
              </div>
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[10px] text-neutral-700 font-bold">
                  <span>Progress</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                  <div className="bg-neutral-800 h-full w-0" />
                </div>
                <div className="text-[9px] text-neutral-600 font-bold pt-1">Effort: 0.0 Hours</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Ticket CTA */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border-neutral-800 bg-neutral-950/40 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="text-2xl font-black text-white">Direct Operations Tasks & Requests</h3>
            <p className="text-neutral-400 text-xs sm:text-sm font-medium leading-relaxed">
              Do you have a specific requirement, visual layout update, or new feature integration? Submit a Dispatch Ticket. The team listens to this queue, compiles dependencies, and updates the site live.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <Link 
              href="/feedback" 
              className="btn-glow inline-flex items-center gap-2 px-8 py-4 bg-white text-neutral-950 font-bold rounded-2xl shadow-lg hover:bg-neutral-200 transition-all text-xs sm:text-sm uppercase tracking-wider"
            >
              <Send className="w-4 h-4 text-neutral-950" />
              Open Operations Dispatch Board
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
