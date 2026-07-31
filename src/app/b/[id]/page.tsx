'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  Building2, MapPin, Compass, ShieldCheck, Mail, Link2, 
  CarFront, Loader2, ArrowLeft, Users, Table, ClipboardCheck, Printer, Calendar 
} from 'lucide-react';
import { GUIDES } from '@/lib/data/guides';
import { GridpassEvent } from '@/lib/types/events';

interface BusinessProfile {
  id: string;
  name: string;
  type: 'dealership' | 'service_center' | 'racetrack' | 'offroad_park' | 'food_truck';
  tag_id: string;
  owner_id: string;
  address?: string;
  contact_email?: string;
  website?: string;
  logo_url?: string;
  is_pro?: boolean;
  infinite_inventory?: boolean;
}

interface InventoryItem {
  id: string;
  tag_id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  specs?: { engine?: string; hp?: number | string };
}

interface CRMLead {
  id: string;
  email: string;
  vehicle_info: string;
  timestamp: string;
  status: 'checked_in' | 'waiver_signed' | 'vibe_check';
}

export default function BusinessProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const businessId = (params?.id as string) || '';

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>([]);
  const [events, setEvents] = useState<GridpassEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'leads' | 'events'>('inventory');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const handlePrint = () => {
    if (!business) return;
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Badge - Gridpass</title>
            <style>
              body {
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: white;
              }
              svg {
                width: 80%;
                max-width: 400px;
                height: auto;
              }
            </style>
          </head>
          <body>
            ${getBadgeSVGMarkup()}
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getBadgeSVGMarkup = () => {
    if (!business) return '';
    const qrRedirectUrl = `${window.location.origin}/qr/${business.tag_id}`;
    const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrRedirectUrl)}`;
    const escapedQrCodeImgSrc = qrCodeImgSrc.replace(/&/g, '&amp;');
    const badgeTitle = business.name;
    const tagId = business.tag_id;
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <defs>
          <linearGradient id="mGrad" x1="60" y1="22" x2="60" y2="70" gradientUnits="userSpaceOnUse">
            <stop stop-color="#ff3b30" />
            <stop offset="1" stop-color="#1c1c1f" />
          </linearGradient>
        </defs>
        <rect x="5" y="5" width="290" height="290" rx="20" fill="none" stroke="#ff3b30" stroke-width="8"/>
        <rect x="20" y="20" width="260" height="260" rx="12" fill="none" stroke="#262626" stroke-width="2" stroke-dasharray="8,4"/>
        <image href="${escapedQrCodeImgSrc}" x="85" y="75" width="130" height="130"/>
        
        <!-- Center logo peaks overlay -->
        <rect x="134" y="124" width="32" height="32" rx="4" fill="#ffffff" />
        <g transform="translate(136, 126) scale(${28/120}, ${28/100})">
          <path d="M10 70 L42 22 L65 52 L88 28 L110 70 Z" fill="url(#mGrad)" stroke="#1c1c1f" stroke-width="6" stroke-linejoin="round" />
          <path d="M42 22 L52 42 M88 28 L98 48" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
          <path d="M18 86 C 48 86, 56 59, 96 59" stroke="#ff3b30" stroke-width="12" stroke-linecap="round" />
        </g>

        <text x="150" y="52" fill="#1c1c1f" font-family="sans-serif" font-size="16" font-weight="900" letter-spacing="4" text-anchor="middle">GRIDPASS</text>
        <text x="150" y="230" fill="#1c1c1f" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${badgeTitle}</text>
        <text x="150" y="255" fill="#ff3b30" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">${tagId}</text>
      </svg>
    `;
  };

  const handleDownloadSVG = () => {
    if (!business) return;
    const svgContent = getBadgeSVGMarkup();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gridpass-${business.tag_id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');
  
  // A B2B owner is Steve (GM) or the authenticated owner of this business
  const isBusinessOwner = user && (
    (business && user.uid === business.owner_id) ||
    (isMock && user.email === 'steve@monmouthmarine.com')
  );

  const handleClaimProfile = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!business) return;

    setClaiming(true);

    if (isMock) {
      setBusiness(prev => prev ? { ...prev, owner_id: user.uid } : null);
      
      const stored = localStorage.getItem('__mock_businesses__');
      const list = stored ? JSON.parse(stored) : [];
      const bizIdx = list.findIndex((b: any) => b.id === business.id);
      if (bizIdx !== -1) {
        list[bizIdx].owner_uid = user.uid;
        list[bizIdx].owner_id = user.uid;
      } else {
        list.push({
          id: business.id,
          name: business.name,
          category: 'dealership',
          location_name: business.address || 'USA',
          owner_uid: user.uid,
          owner_id: user.uid
        });
      }
      localStorage.setItem('__mock_businesses__', JSON.stringify(list));
      
      setClaiming(false);
      alert("Success! You have claimed this business profile page. You can now manage catalog inventories and leads from your dashboard!");
      return;
    }

    try {
      const bizRef = doc(db, 'businesses', business.id);
      await updateDoc(bizRef, {
        owner_uid: user.uid,
        owner_id: user.uid
      });

      setBusiness(prev => prev ? { ...prev, owner_id: user.uid } : null);
      alert("Success! You have claimed this business profile page. You can now manage catalog inventories and leads from your dashboard!");
    } catch (err) {
      console.error("Failed to claim business:", err);
      alert("Failed to claim profile. Please contact Gridpass Support.");
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    async function loadBusinessProfile() {
      if (isMock) {
        // Return simulated mock business storefront profile for E2E tests
        await new Promise(r => setTimeout(r, 100));
        
        const mockBusiness: BusinessProfile = {
          id: businessId || 'monmouth-marine-demo',
          name: 'Monmouth Marine Ford & Boats',
          type: 'dealership',
          tag_id: 'GP-BIZ-MONMOUTH',
          owner_id: 'user-steve-456',
          address: '250 State Highway 35, Monmouth Beach, NJ 07750',
          contact_email: 'sales@monmouthmarine.com',
          website: 'www.monmouthmarine.com',
          is_pro: true
        };

        const mockInventory: InventoryItem[] = [
          {
            id: 'mock-v1',
            tag_id: 'GP-MARCUS-GT',
            year: 2024,
            make: 'Ford',
            model: 'Mustang GT',
            trim: 'Premium',
            specs: { engine: '5.0L Coyote V8', hp: 480 }
          },
          {
            id: 'mock-unclaimed-v1',
            tag_id: 'GP-MOCK-UNCLAIMED',
            year: 2021,
            make: 'Porsche',
            model: '911 GT3 RS',
            specs: { engine: '4.0L Boxer H6', hp: 502 }
          }
        ];

        const mockLeads: CRMLead[] = [
          {
            id: 'lead-1',
            email: 'sarah@spotter.com',
            vehicle_info: '2024 Ford Mustang GT',
            timestamp: new Date().toISOString(),
            status: 'vibe_check'
          },
          {
            id: 'lead-2',
            email: 'marcus@enthusiast.com',
            vehicle_info: '2021 Porsche 911 GT3 RS',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'checked_in'
          }
        ];

        const mockEvents: GridpassEvent[] = [
          {
            id: 'mock-evt-1',
            host_uid: 'mock-owner-123',
            host_business_id: mockBusiness.id,
            title: 'THURSDAY NIGHT DRAG BOAT RACE STAGING',
            description: 'Weekly drag boat check-in, waiver clearance, and transom safety tech stamps.',
            frequency: 'repeating',
            recurrence_rule: 'Every Thursday evening, 4:00 PM - Sunset',
            location_name: 'Blarney Island Transom Gate',
            require_waiver: true,
            require_tech_check: true,
            staging_groups: ['Class A Outlaws', 'Class B Jets', 'Cruiser Fleet']
          }
        ];

        if (isMounted) {
          setBusiness(mockBusiness);
          setInventory(mockInventory);
          setCrmLeads(mockLeads);
          setEvents(mockEvents);
          setLoading(false);
        }
        return;
      }

      if (!businessId) {
        setLoading(false);
        return;
      }

      try {
        if (businessId === 'shaw-daddys' || businessId === 'shaw-food-truck') {
          const shawBusiness: BusinessProfile = {
            id: 'shaw-daddys',
            name: "Shaw's Food Truck & Gourmet Paddock Eats",
            type: 'food_truck',
            tag_id: 'GP-FOOD-SHAW',
            owner_id: 'user-zach-shaw',
            address: 'Paddock Bay #4, Midwest Dragway & Track Events',
            contact_email: 'zach@shawdaddys.com',
            website: 'www.shawdaddys.com',
            is_pro: true,
          };
          if (isMounted) {
            setBusiness(shawBusiness);
            setLoading(false);
          }
          return;
        }

        const bDoc = await getDoc(doc(db, 'businesses', businessId));
        if (bDoc.exists()) {
          const bData = bDoc.data();
          const loadedBusiness: BusinessProfile = {
            id: bDoc.id,
            name: bData.name || 'Anonymous Business',
            type: bData.type || 'service_center',
            tag_id: bData.tag_id || '',
            owner_id: bData.owner_id || bData.owner_uid || '',
            address: bData.address || bData.physical_address || '',
            contact_email: bData.contact_email || '',
            website: bData.website || bData.website_url || '',
            logo_url: bData.logo_url || '',
            is_pro: bData.is_pro === true
          };

          if (isMounted) setBusiness(loadedBusiness);

          // Fetch active Lot sponsored inventories
          const lotQuery = query(collection(db, 'vehicles'), where('partner_dealer', '==', loadedBusiness.name));
          const lotSnap = await getDocs(lotQuery);
          const lotList = lotSnap.docs.map(vDoc => {
            const vData = vDoc.data();
            return {
              id: vDoc.id,
              tag_id: vData.tag_id || '',
              year: vData.year || 2024,
              make: vData.make || '',
              model: vData.model || '',
              trim: vData.trim,
              specs: vData.specs
            } as InventoryItem;
          });

          if (isMounted) setInventory(lotList);

          // Fetch hosted events
          const evtsQuery = query(collection(db, 'events'), where('host_business_id', '==', bDoc.id));
          const evtsSnap = await getDocs(evtsQuery);
          const evtsList = evtsSnap.docs.map(eDoc => {
            const eData = eDoc.data();
            return {
              id: eDoc.id,
              ...eData
            } as GridpassEvent;
          });
          if (isMounted) setEvents(evtsList);

          // Fetch CRM Leads (If Business Owner)
          if (user?.uid === loadedBusiness.owner_id) {
            // CRM lead checkins on this business ID
            const checkinsQuery = query(collection(db, 'checkins'), where('target_id', '==', bDoc.id));
            const checkinsSnap = await getDocs(checkinsQuery);
            const checkinsList = checkinsSnap.docs.map(cDoc => {
              const cData = cDoc.data();
              return {
                id: cDoc.id,
                email: cData.user_email || 'anonymous-lead@gridpass.app',
                vehicle_info: cData.vehicle_info || 'Unknown Vehicle',
                timestamp: cData.timestamp || new Date().toISOString(),
                status: cData.status || 'checked_in'
              } as CRMLead;
            });
            if (isMounted) setCrmLeads(checkinsList);
          }
        } else {
          // Attempt to find inside guides fallback if not found in Firebase
          const allLaunches = GUIDES.flatMap(g => g.launches || []);
          const foundLaunchSpot = allLaunches.find(l => {
            const slug = l.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return slug === businessId;
          });

          if (foundLaunchSpot) {
            const loadedBusiness: BusinessProfile = {
              id: businessId,
              name: foundLaunchSpot.name,
              type: foundLaunchSpot.name.toLowerCase().includes('marina') ? 'service_center' : 'offroad_park',
              tag_id: `GP-BIZ-${businessId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)}`,
              owner_id: '', // Unclaimed!
              address: foundLaunchSpot.location,
              website: foundLaunchSpot.mapsUrl.includes('query=') ? undefined : foundLaunchSpot.mapsUrl,
              is_pro: false
            };

            if (isMounted) {
              setBusiness(loadedBusiness);
              setInventory([]);
              setCrmLeads([]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load business profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBusinessProfile();

    return () => { isMounted = false; };
  }, [businessId, user, authLoading, isMock]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center space-y-4">
        <Building2 className="w-16 h-16 text-neutral-300" />
        <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-800">Business Profile Not Found</h2>
        <Link href="/businesses" className="text-xs font-mono text-[#ff3b30] hover:underline flex items-center gap-1 font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      </div>
    );
  }

  const isUnclaimed = !business.owner_id || business.owner_id === 'seeded';

  return (
    <main className="min-h-screen bg-white text-neutral-900 font-sans relative flex flex-col">

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-16 w-full flex-1 space-y-8">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <Link href="/businesses" className="text-xs font-mono text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 uppercase font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Partners
          </Link>
          <div className="flex items-center gap-2.5">
            {isBusinessOwner && (
              <Link
                href={`/dash/businesses/edit?id=${business.id}`}
                className="text-[10px] font-mono font-bold bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-800 px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 transition-all"
              >
                Edit Business Settings
              </Link>
            )}
            {isBusinessOwner ? (
              <span className="text-[10px] font-mono font-bold bg-[#ff3b30]/5 border border-[#ff3b30]/15 text-[#ff3b30] px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#ff3b30]" /> You Manage This Business
              </span>
            ) : business.is_pro ? (
              <span className="text-[10px] font-mono font-bold bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Partner
              </span>
            ) : isUnclaimed ? (
              <span className="text-[10px] font-mono font-bold bg-yellow-50 border border-yellow-200 text-yellow-600 px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <Building2 className="w-3.5 h-3.5" /> Unclaimed Business
              </span>
            ) : null}
          </div>
        </div>

        {/* Unclaimed Business Banner Callout */}
        {isUnclaimed && (
          <div className="p-6 rounded-2xl border border-yellow-200 bg-yellow-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-neutral-900 uppercase flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                Is this your business?
              </h4>
              <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
                Claim this business profile page to update details, address location, and website. Plus, warm warm leads capture and client waiver stamping directly to your dashboard!
              </p>
            </div>
            
            <button 
              onClick={handleClaimProfile}
              disabled={claiming}
              className="bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-350 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all self-stretch md:self-auto text-center shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Claiming...
                </>
              ) : (
                'Claim Ownership'
              )}
            </button>
          </div>
        )}

        {/* Storefront Info Header */}
        <div className="bg-neutral-50 border border-neutral-200 p-6 md:p-8 rounded-2xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2.5 text-left">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest bg-neutral-200 px-2.5 py-0.5 rounded">
                Business ID: {business.tag_id}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900 uppercase tracking-tight leading-none">
                {business.name}
              </h1>
              {business.address && (
                <p className="text-xs text-neutral-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-450" /> {business.address}
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {business.contact_email && (
                <a 
                  href={`mailto:${business.contact_email}`}
                  className="px-4 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-[10px] font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5 transition-all w-full md:w-auto justify-center"
                >
                  <Mail className="w-3.5 h-3.5 text-neutral-500" /> Email Sales
                </a>
              )}
              {business.website && (
                <a 
                  href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-[10px] font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5 transition-all w-full md:w-auto justify-center"
                >
                  <Link2 className="w-3.5 h-3.5 text-neutral-500" /> Visit Website
                </a>
              )}
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer w-full md:w-auto justify-center"
              >
                <Printer className="w-3.5 h-3.5 text-white" /> PRINT FREE QR BADGE
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="border-b border-neutral-200 flex gap-6">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'inventory' ? 'border-[#ff3b30] text-[#ff3b30]' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {business.type === 'food_truck' || business.id === 'shaw-daddys' ? (
              <>🍔 Food Truck Menu &amp; Paddock Orders</>
            ) : (
              <><CarFront className="w-4 h-4" /> Lot Sponsored Inventory</>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('events')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'events' ? 'border-[#ff3b30] text-[#ff3b30]' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Calendar className="w-4 h-4" /> Events Hosted ({events.length})
          </button>
          
          {isBusinessOwner && (
            <button 
              onClick={() => setActiveTab('leads')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'leads' ? 'border-[#ff3b30] text-[#ff3b30]' : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Users className="w-4 h-4" /> B2B CRM Warm Leads
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="space-y-6 text-left">

          {/* TAB 1: Food Truck Menu OR Sponsored Inventory Feed */}
          {activeTab === 'inventory' && (
            <div className="bg-neutral-50 border border-neutral-200 p-6 md:p-8 rounded-2xl space-y-6">
              
              {business.type === 'food_truck' || business.id === 'shaw-daddys' ? (
                /* FOOD TRUCK MENU VIEW */
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                    <div>
                      <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest">Paddock Gourmet Menu Specials</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">Order from your phone for express paddock pickup window!</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-white bg-[#ff3b30] px-2.5 py-1 rounded-full uppercase">
                      ● Truck Kitchen Open
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-sm uppercase text-neutral-900">The Paddock Smashburger</h4>
                          <span className="font-black text-sm text-[#ff3b30]">$12.00</span>
                        </div>
                        <p className="text-xs text-neutral-600">Double aged beef smash patty, smoked cheddar, garlic aioli, caramelized onions on toasted brioche.</p>
                      </div>
                      <button onClick={() => alert("Added to Paddock Express Pickup Order!")} className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs uppercase rounded-lg transition">
                        + Express Order
                      </button>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-sm uppercase text-neutral-900">Loaded Trackday Fries</h4>
                          <span className="font-black text-sm text-[#ff3b30]">$10.00</span>
                        </div>
                        <p className="text-xs text-neutral-600">Crispy seasoned fries, slow-smoked pulled pork, house queso, pickled jalapeños, BBQ drizzle.</p>
                      </div>
                      <button onClick={() => alert("Added to Paddock Express Pickup Order!")} className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs uppercase rounded-lg transition">
                        + Express Order
                      </button>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-sm uppercase text-neutral-900">Monster Energy Ice Cream Float</h4>
                          <span className="font-black text-sm text-[#ff3b30]">$6.00</span>
                        </div>
                        <p className="text-xs text-neutral-600">Ice-cold Monster Energy drink over two scoops of vanilla bean ice cream with cherry drizzle.</p>
                      </div>
                      <button onClick={() => alert("Added to Paddock Express Pickup Order!")} className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs uppercase rounded-lg transition">
                        + Express Order
                      </button>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-sm uppercase text-neutral-900">Driver Champion Combo Pack</h4>
                          <span className="font-black text-sm text-[#ff3b30]">$22.00</span>
                        </div>
                        <p className="text-xs text-neutral-600">Double Smashburger + Loaded Fries + Monster Float. Complete fuel for track sessions!</p>
                      </div>
                      <button onClick={() => alert("Added to Paddock Express Pickup Order!")} className="w-full py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase rounded-lg transition">
                        + Express Order Combo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* AUTOMOTIVE LOT SPONSORED INVENTORY VIEW */
                <>
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                    <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest">Sponsored Inventory</h3>
                    <span className="text-[10px] font-mono font-bold text-neutral-500 bg-neutral-200 px-2.5 py-1 rounded-full uppercase">
                      {inventory.length} active listings
                    </span>
                  </div>

              {inventory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inventory.map((v) => (
                    <Link 
                      key={v.id} 
                      href={`/v/${v.id}`}
                      className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-[#ff3b30] hover:bg-[#ff3b30]/5 transition-all group flex flex-col justify-between min-h-[160px] cursor-pointer"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest group-hover:text-[#ff3b30] transition-colors">
                            {v.tag_id}
                          </span>
                          {!v.id.includes('unclaimed') && (
                            <span className="text-[8px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase">
                              SOLD
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-neutral-900 uppercase tracking-tight leading-snug">
                          {v.year} {v.make} {v.model}
                        </h4>
                        {v.specs?.engine && (
                          <p className="text-[10px] font-mono font-bold text-neutral-500">{v.specs.engine}</p>
                        )}
                      </div>
                      
                      <div className="text-[9px] font-black text-[#ff3b30] uppercase tracking-wider pt-6 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Explore vehicle build passport →
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-neutral-400 space-y-3">
                  <CarFront className="w-12 h-12 mx-auto opacity-35" />
                  <p className="text-xs uppercase font-mono font-bold">No Lot sponsored inventory vehicles listed.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

          {/* TAB 3: Events Hosted */}
          {activeTab === 'events' && (
            <div className="bg-neutral-50 border border-neutral-200 p-6 md:p-8 rounded-2xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest">Events Hosted</h3>
                <span className="text-[10px] font-mono font-bold text-neutral-500 bg-neutral-200 px-2.5 py-1 rounded-full uppercase">
                  {events.length} active listings
                </span>
              </div>

              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((event) => (
                    <div 
                      key={event.id}
                      className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col justify-between min-h-[160px] text-left"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 uppercase tracking-widest">
                            {event.frequency === 'one_time' ? 'One-Time' : event.frequency === 'repeating' ? 'Repeating' : 'Permanent Venue'}
                          </span>
                          {event.require_waiver && (
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 uppercase tracking-wider flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Waiver
                            </span>
                          )}
                          {event.require_tech_check && (
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 uppercase tracking-wider flex items-center gap-0.5">
                              <ClipboardCheck className="w-3 h-3" /> Tech Check
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-base font-black text-neutral-900 uppercase tracking-tight leading-snug">
                          {event.title}
                        </h4>
                        
                        <p className="text-[11px] text-neutral-500 line-clamp-2">
                          {event.description}
                        </p>

                        <div className="text-[9px] font-mono font-bold text-neutral-450 uppercase flex flex-col gap-0.5 pt-1">
                          <span>Hours/Schedule: {event.recurrence_rule || event.operating_hours || 'One-Time'}</span>
                          <span>Location: {event.location_name}</span>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Link
                          href={`/events/${event.id}`}
                          className="py-2 px-4 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all"
                        >
                          View Staging Hub
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-neutral-450 space-y-3">
                  <Calendar className="w-12 h-12 mx-auto opacity-35" />
                  <p className="text-xs uppercase font-mono font-bold">No events hosted by this business profile yet.</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: B2B CRM Warm Leads table (Owner Gated) */}
          {activeTab === 'leads' && isBusinessOwner && (
            <div className="bg-neutral-50 border border-neutral-200 p-6 md:p-8 rounded-2xl space-y-6 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-emerald-600" /> Warm Sales Leads Capture
                </h3>
                <span className="text-[10px] font-mono font-bold text-neutral-500 bg-neutral-200 px-2.5 py-1 rounded-full uppercase">
                  {crmLeads.length} Lead Events
                </span>
              </div>

              {crmLeads.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-4">Lead Email / Contact</th>
                        <th className="p-4">Vehicle Engaged</th>
                        <th className="p-4">Activity Status</th>
                        <th className="p-4">Check-in Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-medium text-neutral-700">
                      {crmLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-neutral-50/50">
                          <td className="p-4 font-mono font-bold text-neutral-900">{lead.email}</td>
                          <td className="p-4 uppercase">{lead.vehicle_info}</td>
                          <td className="p-4">
                            <span className={`inline-flex text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                              lead.status === 'vibe_check' 
                                ? 'bg-red-50 border-red-100 text-[#ff3b30]' 
                                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            }`}>
                              {lead.status === 'vibe_check' ? 'Vibe-Checked Lot item' : 'Scanned Check-in'}
                            </span>
                          </td>
                          <td className="p-4 text-neutral-450">
                            {new Date(lead.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-neutral-450 space-y-3">
                  <Users className="w-12 h-12 mx-auto opacity-35" />
                  <p className="text-xs uppercase font-mono font-bold">No warm leads captured on Lot QR scans yet.</p>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Print QR Code Badge Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-[2rem] p-6 max-w-sm w-full space-y-6 shadow-xl animate-in zoom-in-95 duration-150 text-center">
            
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase text-neutral-900">Print Storefront Badge</h3>
              <p className="text-xs text-neutral-500 leading-normal">
                Place this QR sticker card on your service counter, gates, or dealerships. Drivers scan it to check-in instantly.
              </p>
            </div>

            {/* Simulated Badge Frame */}
            <div className="border border-neutral-200 p-4 rounded-2xl bg-neutral-50 flex items-center justify-center max-w-[200px] mx-auto shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/qr/${business.tag_id}`)}`} 
                alt="QR Code" 
                className="w-full h-auto"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="py-2.5 bg-transparent hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Print Badge
              </button>
            </div>

            <button
              onClick={handleDownloadSVG}
              className="w-full text-center text-[10px] font-bold text-[#ff3b30] hover:underline uppercase tracking-wide cursor-pointer"
            >
              Download SVG Vector File
            </button>

          </div>
        </div>
      )}
    </main>
  );
}
