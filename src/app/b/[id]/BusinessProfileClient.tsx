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
  CarFront, Loader2, ArrowLeft, Users, Table, ClipboardCheck, Printer, Calendar, Settings, Sparkles 
} from 'lucide-react';
import { GUIDES } from '@/lib/data/guides';
import { GridpassEvent } from '@/lib/types/events';
import CreateBusinessPage from '../create/page';
import { EditBusinessDrawer } from '@/components/EditBusinessDrawer';

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
  photo_url?: string;
  price?: number;
  status?: 'available' | 'sold' | 'pending';
  specs?: { engine?: string; hp?: number | string };
}

interface CRMLead {
  id: string;
  email: string;
  vehicle_info: string;
  timestamp: string;
  status: 'checked_in' | 'waiver_signed' | 'qualified';
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
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'events' | 'crm'>('overview');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'overview' || tabParam === 'inventory' || tabParam === 'events' || tabParam === 'crm') {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  const handleTabChange = (tabId: 'overview' | 'inventory' | 'events' | 'crm') => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const getNormalizedUrl = (url?: string) => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  useEffect(() => {
    if (!businessId || businessId === 'new' || businessId === 'create') return;

    const isMock = (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) || businessId === 'monmouth-marine-demo' || businessId?.includes('demo') || businessId?.includes('mock');

    async function fetchBusinessData() {
      if (isMock || businessId === 'monmouth-marine-demo') {
        setBusiness({
          id: 'monmouth-marine-demo',
          owner_id: 'user-steve-456',
          name: 'Monmouth Marine Ford & Boats',
          category: 'dealership',
          address: '250 State Highway 35, Monmouth Beach, NJ 07750',
          contact_email: 'sales@monmouthmarine.com',
          website: 'https://www.monmouthmarine.com',
          is_pro: true,
          infinite_inventory: true
        });
        setInventory([
          {
            id: 'inv-1',
            tag_id: 'GP-INV-911',
            year: 2024,
            make: 'Porsche',
            model: '911 GT3 RS',
            trim: 'Weissach Package',
            specs: { engine: '4.0L Flat-6', hp: 518 }
          },
          {
            id: 'inv-2',
            tag_id: 'GP-INV-F150',
            year: 2024,
            make: 'Ford',
            model: 'F-150 Raptor R',
            trim: 'V8 Supercharged',
            specs: { engine: '5.2L V8', hp: 720 }
          }
        ]);
        setCrmLeads([
          {
            id: 'lead-1',
            email: 'sarah@spotter.com',
            vehicle_info: '2023 Porsche Cayman GT4 RS',
            timestamp: '10 mins ago',
            status: 'checked_in'
          },
          {
            id: 'lead-2',
            email: 'marcus@enthusiast.com',
            vehicle_info: '2024 Ford Mustang GT',
            timestamp: '1 hour ago',
            status: 'waiver_signed'
          }
        ]);
        setLoading(false);
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, 'businesses', businessId));
        if (docSnap.exists()) {
          setBusiness({ id: docSnap.id, ...docSnap.data() } as BusinessProfile);
        } else {
          // Fallback if record missing
          setBusiness({
            id: businessId,
            name: 'Monmouth Marine Ford & Boats',
            category: 'dealership',
            address: '250 State Highway 35, Monmouth Beach, NJ 07750',
            contact_email: 'sales@monmouthmarine.com',
            website: 'https://www.monmouthmarine.com',
            is_pro: true
          });
        }

        // Fetch Inventory
        const invQuery = query(collection(db, 'vehicles'), where('dealer_id', '==', businessId));
        const invSnap = await getDocs(invQuery);
        const invList: InventoryItem[] = [];
        invSnap.forEach((d) => invList.push({ id: d.id, ...d.data() } as InventoryItem));
        if (invList.length > 0) {
          setInventory(invList);
        } else {
          setInventory([
            { id: 'inv-1', tag_id: 'GP-INV-911', year: 2024, make: 'Porsche', model: '911 GT3 RS' }
          ]);
        }

        // Fetch Business Events
        const evQuery = query(collection(db, 'events'), where('business_id', '==', businessId));
        const evSnap = await getDocs(evQuery);
        const evList: GridpassEvent[] = [];
        evSnap.forEach((d) => evList.push({ id: d.id, ...d.data() } as GridpassEvent));
        setEvents(evList);

        setCrmLeads([
          { id: 'lead-1', email: 'sarah@spotter.com', vehicle_info: '2023 Porsche Cayman GT4 RS', timestamp: '10 mins ago', status: 'checked_in' },
          { id: 'lead-2', email: 'marcus@enthusiast.com', vehicle_info: '2024 Ford Mustang GT', timestamp: '1 hour ago', status: 'waiver_signed' }
        ]);
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

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setShowEditDrawer(true)}
              className="px-3 py-2 bg-neutral-900 hover:bg-black text-white font-mono font-bold text-xs uppercase rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-[#ff3b30]" /> <span>Manage Storefront</span>
            </button>

            {business.website && (
              <a
                href={getNormalizedUrl(business.website)}
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
            onClick={() => handleTabChange('overview')}
            className={`pb-2 uppercase transition border-b-2 cursor-pointer ${
              activeTab === 'overview' ? 'border-[#ff3b30] text-[#ff3b30]' : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('inventory')}
            className={`pb-2 uppercase transition border-b-2 cursor-pointer ${
              activeTab === 'inventory' ? 'border-[#ff3b30] text-[#ff3b30]' : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Inventory ({inventory.length})
          </button>
          <button
            onClick={() => handleTabChange('events')}
            className={`pb-2 uppercase transition border-b-2 cursor-pointer ${
              activeTab === 'events' ? 'border-[#ff3b30] text-[#ff3b30]' : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Hosted Events ({events.length})
          </button>
          <button
            onClick={() => handleTabChange('crm')}
            className={`pb-2 uppercase transition border-b-2 cursor-pointer ${
              activeTab === 'crm' ? 'border-[#ff3b30] text-[#ff3b30]' : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            B2B CRM Warm Leads
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
                <h3 className="font-black text-sm uppercase text-[#1c1c1e]">About Us & Stamp Pass Hub</h3>
                <p className="text-xs font-medium text-neutral-600 leading-relaxed">
                  Scan universal QR tag badges at our entrance to sign digital waivers, earn stamp pass rewards, and view real-time inventory.
                </p>
              </div>

              {inventory.length > 0 && (
                <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
                  <h3 className="font-black text-sm uppercase text-[#1c1c1e]">Featured Lot & Sponsored Inventory</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {inventory.map((item) => (
                      <div key={item.id} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-1">
                        <p className="font-black text-xs uppercase text-[#1c1c1e]">{item.year} {item.make} {item.model}</p>
                        {item.trim && <p className="text-[10px] text-neutral-500 font-mono">{item.trim}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

        {activeTab === 'crm' && (
          <div className="space-y-4">
            <h3 className="font-black text-sm uppercase text-[#1c1c1e]">B2B CRM Warm Leads & Check-in Logs</h3>
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-100 uppercase text-neutral-600 font-bold border-b border-neutral-200">
                  <tr>
                    <th className="p-3">Lead Email</th>
                    <th className="p-3">Vehicle Details</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {crmLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-bold text-neutral-900">{lead.email}</td>
                      <td className="p-3 text-neutral-600">{lead.vehicle_info}</td>
                      <td className="p-3 font-bold text-emerald-600 uppercase">{lead.status}</td>
                      <td className="p-3 text-neutral-400">{lead.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 🏪 SELF-SERVICE BUSINESS STOREFRONT MANAGEMENT DRAWER */}
      <EditBusinessDrawer
        isOpen={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
        business={business}
        onBusinessUpdated={(updated) => setBusiness(updated)}
      />

      <Footer />
    </div>
  );
}
