'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import CreateBusinessPage from '../create/page';

interface BusinessProfile {
  id: string;
  name: string;
  type?: 'dealership' | 'service_center' | 'racetrack' | 'offroad_park' | 'food_truck';
  category?: string;
  tag_id?: string;
  owner_id?: string;
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

interface BusinessProfileClientProps {
  businessId: string;
  initialBusiness?: any;
}

export default function BusinessProfileClient({ businessId, initialBusiness }: BusinessProfileClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [business, setBusiness] = useState<BusinessProfile | null>(initialBusiness || null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [events, setEvents] = useState<GridpassEvent[]>([]);
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>([]);
  
  const [loading, setLoading] = useState(!initialBusiness);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'events' | 'crm'>('overview');

  useEffect(() => {
    if (!businessId || businessId === 'new' || businessId === 'create') return;

    async function fetchBusinessData() {
      try {
        const docSnap = await getDoc(doc(db, 'businesses', businessId));
        if (docSnap.exists()) {
          setBusiness({ id: docSnap.id, ...docSnap.data() } as BusinessProfile);
        }

        // Fetch Inventory
        const invQuery = query(collection(db, 'vehicles'), where('dealer_id', '==', businessId));
        const invSnap = await getDocs(invQuery);
        const invList: InventoryItem[] = [];
        invSnap.forEach((d) => invList.push({ id: d.id, ...d.data() } as InventoryItem));
        setInventory(invList);

        // Fetch Business Events
        const evQuery = query(collection(db, 'events'), where('business_id', '==', businessId));
        const evSnap = await getDocs(evQuery);
        const evList: GridpassEvent[] = [];
        evSnap.forEach((d) => evList.push({ id: d.id, ...d.data() } as GridpassEvent));
        setEvents(evList);
      } catch (err) {
        console.error('Error fetching business page data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBusinessData();
  }, [businessId]);

  if (businessId === 'new' || businessId === 'create') {
    return <CreateBusinessPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Loading Business Stamp Pass...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col justify-between">
        <Navbar />
        <main className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
          <Building2 className="w-12 h-12 text-neutral-300 mx-auto" />
          <h1 className="text-xl font-black uppercase text-[#1c1c1e]">Business Profile Not Found</h1>
          <p className="text-xs font-medium text-neutral-600">
            This business or venue passport does not exist or has been relocated.
          </p>
          <Link href="/explore" className="inline-block px-4 py-2 bg-[#ff3b30] text-white font-bold text-xs uppercase rounded-lg">
            Explore Business Directory ↗
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col justify-between">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-8 w-full space-y-6">
        {/* Business Header Banner */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-neutral-900 text-white rounded-xl flex items-center justify-center font-black text-xl uppercase shrink-0">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                business.name.substring(0, 2)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-neutral-900 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                  {(business.type || business.category || 'Automotive Business').replace('_', ' ')}
                </span>
                {business.is_pro && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                    ★ PRO VERIFIED
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-[#1c1c1e] uppercase tracking-tight mt-1">{business.name}</h1>
              {business.address && (
                <p className="text-xs text-neutral-500 flex items-center gap-1 font-medium mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {business.address}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs uppercase rounded-lg border border-neutral-300 transition flex items-center gap-1"
              >
                <Link2 className="w-3.5 h-3.5" /> Website ↗
              </a>
            )}
            <Link
              href={`/join?id=${business.tag_id || business.id}`}
              className="px-4 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase rounded-lg shadow-sm transition flex items-center gap-1"
            >
              <span>Stamp Pass QR</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-neutral-200 flex items-center gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 uppercase transition border-b-2 ${
              activeTab === 'overview' ? 'border-[#ff3b30] text-[#ff3b30]' : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-2 uppercase transition border-b-2 ${
              activeTab === 'inventory' ? 'border-[#ff3b30] text-[#ff3b30]' : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Inventory ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`pb-2 uppercase transition border-b-2 ${
              activeTab === 'events' ? 'border-[#ff3b30] text-[#ff3b30]' : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Hosted Events ({events.length})
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
                <h3 className="font-black text-sm uppercase text-[#1c1c1e]">About {business.name}</h3>
                <p className="text-xs font-medium text-neutral-600 leading-relaxed">
                  Welcome to {business.name}. Scan universal QR tag badges at our entrance to sign digital waivers, earn stamp pass rewards, and view real-time inventory.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-2">
                <h4 className="font-black text-xs uppercase text-neutral-800">Business Details</h4>
                <div className="text-xs space-y-1 font-medium text-neutral-600">
                  <p>Tag ID: <code className="font-mono text-neutral-900 font-bold">{business.tag_id || business.id}</code></p>
                  <p>Contact: {business.contact_email || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <h3 className="font-black text-sm uppercase text-[#1c1c1e]">Available Inventory & Vehicles</h3>
            {inventory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {inventory.map((item) => (
                  <div key={item.id} className="bg-white border border-neutral-200 rounded-xl p-4 space-y-2">
                    <p className="font-black text-xs uppercase text-[#1c1c1e]">{item.year} {item.make} {item.model}</p>
                    <Link href={`/v/${item.id}`} className="text-[10px] font-bold text-[#ff3b30] uppercase inline-block">
                      View Vehicle Passport ↗
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-neutral-400 uppercase py-8 text-center bg-neutral-50 rounded-xl">
                No active inventory items listed.
              </p>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <h3 className="font-black text-sm uppercase text-[#1c1c1e]">Hosted Events & Gatherings</h3>
            {events.length > 0 ? (
              <div className="space-y-2">
                {events.map((ev) => (
                  <div key={ev.id} className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-black text-xs uppercase text-[#1c1c1e]">{ev.title}</p>
                      <p className="text-[10px] text-neutral-500 font-mono">{ev.location_name}</p>
                    </div>
                    <Link href={`/events/${ev.id}`} className="text-[10px] font-bold text-[#ff3b30] uppercase">
                      Event Hub ↗
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-neutral-400 uppercase py-8 text-center bg-neutral-50 rounded-xl">
                No upcoming hosted events scheduled.
              </p>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
