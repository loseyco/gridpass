'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { 
  Building2, MapPin, Compass, ShieldCheck, Mail, Link2, 
  CarFront, Loader2, ArrowLeft, Users, Table, Phone, ClipboardCheck 
} from 'lucide-react';
import { GUIDES } from '@/lib/data/guides';

interface BusinessProfile {
  id: string;
  name: string;
  type: 'dealership' | 'service_center' | 'racetrack' | 'offroad_park';
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'leads'>('inventory');

  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;
  
  // A B2B owner is Steve (GM) or the authenticated owner of this business
  const isBusinessOwner = user && (
    (business && user.uid === business.owner_id) ||
    (isMock && user.email === 'steve@monmouthmarine.com')
  );

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

        if (isMounted) {
          setBusiness(mockBusiness);
          setInventory(mockInventory);
          setCrmLeads(mockLeads);
          setLoading(false);
        }
        return;
      }

      if (!businessId) {
        setLoading(false);
        return;
      }

      try {
        const bDoc = await getDoc(doc(db, 'businesses', businessId));
        if (bDoc.exists()) {
          const bData = bDoc.data();
          const loadedBusiness: BusinessProfile = {
            id: bDoc.id,
            name: bData.name || 'Anonymous Business',
            type: bData.type || 'service_center',
            tag_id: bData.tag_id || '',
            owner_id: bData.owner_id || '',
            address: bData.address,
            contact_email: bData.contact_email,
            website: bData.website,
            logo_url: bData.logo_url,
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

          // Fetch CRM Leads (If Business Owner)
          if (loadedBusiness.is_pro && (user?.uid === loadedBusiness.owner_id)) {
            // CRM lead scans on Lot Vehicles
            const checkinsQuery = query(collection(db, 'checkins'), where('target_id', '==', bDoc.id));
            const checkinsSnap = await getDocs(checkinsQuery);
            const checkinsList = checkinsSnap.docs.map(cDoc => {
              const cData = cDoc.data();
              return {
                id: cDoc.id,
                email: cData.user_email || 'anonymous-lead@gridpass.app',
                vehicle_info: cData.vehicle_info || 'Unknown Model',
                timestamp: cData.timestamp?.toDate() ? cData.timestamp.toDate().toISOString() : new Date().toISOString(),
                status: cData.status || 'checked_in'
              } as CRMLead;
            });

            if (isMounted) setCrmLeads(checkinsList);
          }
        } else {
          // Fallback: search all launch spots across all guides
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
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex flex-col items-center justify-center space-y-4">
        <Building2 className="w-16 h-16 text-neutral-700" />
        <h2 className="text-xl font-bold uppercase tracking-wider">Business Hub Not Found</h2>
        <Link href="/" className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Safety
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative flex flex-col">
      <div className="mesh-glow" />

      <Navbar />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 w-full flex-1 relative z-10 space-y-8">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <Link href="/dash" className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 uppercase font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Garage Dashboard
          </Link>
          {business.is_pro ? (
            <span className="text-[10px] font-mono font-bold bg-[#10b981]/5 border border-[#10b981]/25 text-[#10b981] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" /> Gridpass Verified Partner
            </span>
          ) : !business.owner_id ? (
            <span className="text-[10px] font-mono font-bold bg-yellow-500/5 border border-yellow-500/25 text-yellow-500 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <Building2 className="w-3.5 h-3.5 text-yellow-500" /> Unclaimed Hub
            </span>
          ) : null}
        </div>

        {/* Unclaimed Business Banner Callout */}
        {!business.owner_id && (
          <div className="glass-card p-6 rounded-[2rem] border border-yellow-500/20 bg-yellow-500/[0.01] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden text-left animate-in slide-in-from-top-4 duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/[0.02] to-transparent pointer-events-none" />
            
            <div className="space-y-1.5 relative z-10">
              <h4 className="text-sm font-bold text-white uppercase flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                Is this your business?
              </h4>
              <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                Claim this business passport page to update your launch fees, hours, and amenities. Plus, get direct warm sales lead check-ins when riders scan the QR code at your docks!
              </p>
            </div>
            
            <Link 
              href={`/join?claim=${business.id}`}
              className="btn-glow bg-yellow-500 hover:bg-yellow-400 text-black font-mono font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all self-stretch md:self-auto text-center shrink-0 z-10"
            >
              Claim This Page
            </Link>
          </div>
        )}

        {/* Storefront Info Header */}
        <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/40 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded">
                Business ID: {business.tag_id}
              </span>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
                {business.name}
              </h1>
              {business.address && (
                <p className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" /> {business.address}
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              {business.contact_email && (
                <a 
                  href={`mailto:${business.contact_email}`}
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5 transition-all"
                >
                  <Mail className="w-3.5 h-3.5 text-neutral-500" /> Email Sales
                </a>
              )}
              {business.website && (
                <a 
                  href={`https://${business.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5 transition-all"
                >
                  <Link2 className="w-3.5 h-3.5 text-neutral-500" /> Visit Website
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tab Selector (Inventory lot vs. CRM Leads) */}
        <div className="border-b border-neutral-900 flex gap-6">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'inventory' ? 'border-red-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <CarFront className="w-4 h-4" /> Lot Sponsored Inventory
          </button>
          
          {isBusinessOwner && (
            <button 
              onClick={() => setActiveTab('leads')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'leads' ? 'border-red-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Users className="w-4 h-4" /> B2B CRM Warm Leads
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="space-y-6">

          {/* TAB 1: Sponsored Inventory Feed */}
          {activeTab === 'inventory' && (
            <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/20 space-y-6">
              
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Sponsored Inventory</h3>
                <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-900 border border-neutral-850 px-2.5 py-1 rounded-full uppercase">
                  {inventory.length} active listings
                </span>
              </div>

              {inventory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inventory.map((v) => (
                    <Link 
                      key={v.id} 
                      href={`/v/${v.id}`}
                      className="glass-card p-5 rounded-3xl border-neutral-900 bg-neutral-950/40 hover:bg-red-600/5 hover:border-red-500/20 transition-all group flex flex-col justify-between min-h-[160px]"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest group-hover:text-red-400 transition-colors">
                            {v.tag_id}
                          </span>
                          {!v.id.includes('unclaimed') && (
                            <span className="text-[8px] font-mono font-bold text-[#10b981] bg-[#10b981]/5 px-2 py-0.5 rounded-full border border-[#10b981]/10 uppercase">
                              SOLD
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-white uppercase tracking-tight leading-snug">
                          {v.year} {v.make} {v.model}
                        </h4>
                        {v.specs?.engine && (
                          <p className="text-[10px] font-mono font-bold text-neutral-400">{v.specs.engine}</p>
                        )}
                      </div>
                      
                      <div className="text-[9px] font-black text-red-405 uppercase tracking-wider pt-6 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Explore vehicle build passport →
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-neutral-550 space-y-3">
                  <CarFront className="w-12 h-12 mx-auto opacity-35" />
                  <p className="text-xs uppercase font-mono font-bold">No Lot sponsored inventory vehicles listed.</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: B2B CRM Warm Leads table (Owner Gated) */}
          {activeTab === 'leads' && isBusinessOwner && (
            <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-neutral-900 bg-neutral-950/20 space-y-6 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-emerald-500" /> Warm Sales Leads Capture
                </h3>
                <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-900 border border-neutral-850 px-2.5 py-1 rounded-full uppercase">
                  {crmLeads.length} Lead Events
                </span>
              </div>

              {crmLeads.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-neutral-900 bg-neutral-950/40">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-900 bg-neutral-950 text-neutral-450 font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-4">Lead Email / Contact</th>
                        <th className="p-4">Vehicle Engaged</th>
                        <th className="p-4">Activity Status</th>
                        <th className="p-4">Check-in Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/50 font-medium text-neutral-300">
                      {crmLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-neutral-900/10">
                          <td className="p-4 font-mono font-bold text-white">{lead.email}</td>
                          <td className="p-4 uppercase">{lead.vehicle_info}</td>
                          <td className="p-4">
                            <span className={`inline-flex text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                              lead.status === 'vibe_check' 
                                ? 'bg-red-500/5 border-red-500/10 text-red-400' 
                                : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
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
                <div className="text-center py-16 text-neutral-550 space-y-3">
                  <ClipboardCheck className="w-12 h-12 mx-auto opacity-35" />
                  <p className="text-xs uppercase font-mono font-bold">No B2B CRM leads captured yet.</p>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      <Footer />
    </main>
  );
}
