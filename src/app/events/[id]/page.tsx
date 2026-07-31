'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { getEvent, registerVehicleToEvent } from '@/lib/actions/events';
import { getBusinessProfile } from '@/lib/actions/business';
import { GridpassEvent } from '@/lib/types/events';
import { BusinessProfile } from '@/lib/types/business';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  Loader2, Calendar, MapPin, ShieldCheck, ClipboardCheck, 
  CarFront, Building2, UserCheck, Plus, CheckCircle2, 
  DollarSign, Sparkles, ArrowLeft, Mail, Info 
} from 'lucide-react';
import Link from 'next/link';

export default function EventHubPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const eventId = params.id as string;

  // States
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<GridpassEvent | null>(null);
  const [vendorProfiles, setVendorProfiles] = useState<BusinessProfile[]>([]);
  const [userVehicles, setUserVehicles] = useState<any[]>([]);
  
  // Registration Modal States
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [signedWaiver, setSignedWaiver] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [registering, setRegistering] = useState(false);

  // Claim/Upgrade Action States
  const [claiming, setClaiming] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Check if we are running in the Playwright mock sandbox
  const isMock = typeof window !== 'undefined' && localStorage.getItem('__playwright_mock__') === 'true';

  useEffect(() => {
    if (!eventId) return;

    const loadEventData = async () => {
      setLoading(true);

      if (isMock || eventId === 'maple-city-cruise' || eventId.startsWith('mock-event')) {
        // Preseed a simulated high-impact Monmouth Maple City Cruise Night Event Hub
        const mockEvent: GridpassEvent = {
          id: eventId || 'maple-city-cruise',
          host_uid: 'seeded-organizer-uid',
          title: '27TH ANNUAL CRUISE NIGHT IN THE MAPLE CITY',
          description: 'Join Pat Sherman and the Maple City Street Machines for Monmouth\'s legendary Cruise Night! Showcases classics, hot rods, muscle cars, and off-road builds. Food and non-food vendors contact Keith Patterson.',
          frequency: 'one_time',
          start_date: '2026-08-15T16:00',
          end_date: '2026-08-15T22:00',
          location_name: 'Monmouth Public Square & Main Street',
          physical_address: '100 Public Square, Monmouth, IL 61462',
          require_waiver: true,
          require_tech_check: false,
          staging_groups: ['Classics', 'Hot Rods', 'Muscle', 'Off-Road / PWC', 'Imports'],
          is_claimed: false, // Unclaimed - PJ can pitch and sell!
          is_pro: false,
          vendors: ['nielsens', 'blarney-island'],
          entrants: {
            'v1': {
              vehicle_id: 'v1',
              make: 'Chevrolet',
              model: 'Corvette Z06',
              year: 2023,
              owner_name: 'Marcus Enthusiast',
              photo_url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800',
              status: 'checked_in',
              staging_group: 'Muscle'
            },
            'v2': {
              vehicle_id: 'v2',
              make: 'Jeep',
              model: 'Wrangler Rubicon',
              year: 2022,
              owner_name: 'Sarah Ranger',
              photo_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
              status: 'registered',
              staging_group: 'Off-Road / PWC'
            }
          }
        };

        setEvent(mockEvent);

        // Preseed vendor profile data
        setVendorProfiles([
          {
            id: 'nielsens',
            owner_uid: 'vendor-1',
            name: 'Nielsen Enterprises Powersports',
            description: 'Local food truck and powersport sponsor providing club-approved golf carts.',
            category: 'dealership',
            location_name: 'Lake Villa, IL',
            contact_email: 'sales@nielsens.com'
          },
          {
            id: 'blarney-island',
            owner_uid: 'vendor-2',
            name: 'Keith Patterson Food Vendor',
            description: 'Official food court coordinator. Contact fydoc007@gmail.com for placement.',
            category: 'shop_garage',
            location_name: 'Monmouth, IL',
            contact_email: 'fydoc007@gmail.com'
          }
        ]);

        // Preseed user vehicles for the registration selector
        setUserVehicles([
          {
            id: 'my-pwc-1',
            make: 'Sea-Doo',
            model: 'RXP-X 325',
            year: 2024,
            imageUrl: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=800'
          }
        ]);

        setLoading(false);
        return;
      }

      try {
        const loadedEvent = await getEvent(eventId);
        if (loadedEvent) {
          setEvent(loadedEvent);

          // Load vendor profiles
          if (loadedEvent.vendors && loadedEvent.vendors.length > 0) {
            const list: BusinessProfile[] = [];
            for (const vId of loadedEvent.vendors) {
              const profile = await getBusinessProfile(vId);
              if (profile) list.push(profile);
            }
            setVendorProfiles(list);
          }

          // Load user vehicles if logged in
          if (user) {
            const vQuery = query(collection(db, 'vehicles'), where('owner_id', '==', user.uid));
            const vSnap = await getDocs(vQuery);
            const vList = vSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUserVehicles(vList);
          }
        }
      } catch (err) {
        console.error("Failed to load Event Hub page data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId, user, isMock]);

  // Claim Event Flow (Pitch mode)
  const handleClaimEvent = async () => {
    if (!user || !event) {
      router.push('/login');
      return;
    }
    setClaiming(true);

    if (isMock || event.id === 'maple-city-cruise' || event.id.startsWith('mock-event')) {
      const updated = {
        ...event,
        is_claimed: true,
        host_uid: user.uid
      };
      setEvent(updated);
      setClaiming(false);
      alert("Success! You claimed this event profile. You can now manage registrations and features!");
      return;
    }

    try {
      const ref = doc(db, 'events', event.id);
      await updateDoc(ref, {
        is_claimed: true,
        host_uid: user.uid
      });
      setEvent(prev => prev ? { ...prev, is_claimed: true, host_uid: user.uid } : null);
      alert("Success! You claimed this event profile.");
    } catch (err) {
      console.error("Failed to claim event profile:", err);
    } finally {
      setClaiming(false);
    }
  };

  // Upgrade Event to Pro (Revenue mode)
  const handleUpgradeEvent = async () => {
    if (!event) return;
    setUpgrading(true);

    if (isMock || event.id === 'maple-city-cruise' || event.id.startsWith('mock-event')) {
      const updated = {
        ...event,
        is_pro: true
      };
      setEvent(updated);
      setUpgrading(false);
      alert("Pro features unlocked! Customized landing grids and sponsor banners are active.");
      return;
    }

    try {
      const ref = doc(db, 'events', event.id);
      await updateDoc(ref, {
        is_pro: true
      });
      setEvent(prev => prev ? { ...prev, is_pro: true } : null);
      alert("Pro features unlocked!");
    } catch (err) {
      console.error("Failed to upgrade event profile:", err);
    } finally {
      setUpgrading(false);
    }
  };

  // Register Driver Vehicle to Grid
  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !event || !selectedVehicleId || (event.require_waiver && !signedWaiver)) return;
    setRegistering(true);

    const vehicle = userVehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    const entrantData = {
      make: vehicle.make,
      model: vehicle.model,
      year: Number(vehicle.year),
      owner_name: user.displayName || 'Gridpass Driver',
      photo_url: vehicle.photo_url || vehicle.imageUrl || '',
      staging_group: selectedGroup || 'Pending'
    };

    if (isMock || event.id === 'maple-city-cruise' || event.id.startsWith('mock-event')) {
      const updatedEntrants = {
        ...event.entrants,
        [selectedVehicleId]: {
          vehicle_id: selectedVehicleId,
          ...entrantData,
          status: 'registered' as const
        }
      };
      setEvent(prev => prev ? { ...prev, entrants: updatedEntrants } : null);
      setRegistering(false);
      setShowRegModal(false);
      alert("Gridpass active! Your vehicle is staged for checkout.");
      return;
    }

    try {
      await registerVehicleToEvent(event.id, selectedVehicleId, user.uid, entrantData);
      
      // Refresh event entrants locally
      const updatedEntrants = {
        ...event.entrants,
        [selectedVehicleId]: {
          vehicle_id: selectedVehicleId,
          ...entrantData,
          status: 'registered' as const
        }
      };
      setEvent(prev => prev ? { ...prev, entrants: updatedEntrants } : null);

      setShowRegModal(false);
      alert("Gridpass active! Your vehicle is staged for checkout.");
    } catch (err) {
      console.error("Failed to register vehicle to event:", err);
    } finally {
      setRegistering(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-xl font-black uppercase text-neutral-900 tracking-tight">Event Hub Not Found</h1>
        <p className="text-xs text-neutral-400">The staging registry for this event has expired or is invalid.</p>
        <Link href="/dash" className="py-2.5 px-6 bg-[#ff3b30] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#bd2925] transition-all shadow-sm">
          Return to Garage
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-16">
      
      {/* Top Banner Cover */}
      <div className="w-full h-48 bg-neutral-950 relative flex items-end">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
        <div className="absolute top-4 left-4 z-20">
          <Link href="/dash" className="p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-xl text-white transition-all flex items-center gap-1.5 text-xs font-bold border border-white/10">
            <ArrowLeft className="w-4 h-4" /> Garage
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-20 -mt-10 space-y-8">
        
        {/* Main Event Card Header */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-lg space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-[#ff3b30] border border-red-100 uppercase tracking-widest block w-fit">
                {event.frequency === 'one_time' ? 'One-Time Motorsport Show' : event.frequency === 'repeating' ? 'Repeating Meet' : 'Permanent Venue'}
              </span>
              <h1 className="text-xl md:text-2xl font-black uppercase text-neutral-900 tracking-tight leading-tight">
                {event.title}
              </h1>
              <div className="text-[10px] text-neutral-500 font-mono font-bold flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#ff3b30]" /> {event.location_name}</span>
                {event.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#ff3b30]" /> 
                    {new Date(event.start_date).toLocaleDateString()} at {new Date(event.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                )}
              </div>
            </div>

            {/* RSVP / Registration Trigger */}
            <button
              onClick={() => {
                if (!user) {
                  router.push('/login');
                  return;
                }
                setShowRegModal(true);
              }}
              className="py-3 px-6 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center gap-1.5 self-stretch md:self-auto text-center justify-center"
            >
              <Plus className="w-4 h-4" /> Register Vehicle
            </button>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed font-medium">
            {event.description}
          </p>

          {/* Admission Rules badges */}
          <div className="flex gap-3 flex-wrap pt-2 border-t border-neutral-100">
            {event.require_waiver && (
              <span className="text-[8px] font-mono font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Waiver Required
              </span>
            )}
            {event.require_tech_check && (
              <span className="text-[8px] font-mono font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider flex items-center gap-1">
                <ClipboardCheck className="w-3.5 h-3.5" /> Tech Stamp Clearance Required
              </span>
            )}
            {event.is_pro && (
              <span className="text-[8px] font-mono font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-amber-600/10" /> Gridpass Pro Event
              </span>
            )}
          </div>
        </div>

        {/* B2B Upgrade / Claim Directory Callout Box */}
        <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-1.5 text-left">
            <h3 className="text-xs font-black text-neutral-900 uppercase flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#ff3b30]" /> Are you the Host / Coordinator?
            </h3>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              {!event.is_claimed 
                ? "This event listing was created for our community directory. Claim this page to export the entrant staging list, print official windshield QR codes, and monetize sponsored vendor banners!"
                : "Unlock Gridpass Pro to customize voting categories, manage gate waivers digitally, and export warm B2B marketing leads for your sponsors."}
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {!event.is_claimed ? (
              <button
                onClick={handleClaimEvent}
                disabled={claiming}
                className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
              >
                {claiming ? 'Claiming...' : 'Claim This Event Page'}
              </button>
            ) : (
              <div className="text-[10px] font-mono font-bold text-emerald-600 flex items-center gap-1 justify-center py-1">
                <UserCheck className="w-4 h-4" /> Claimed by Host
              </div>
            )}

            {!event.is_pro && (
              <button
                onClick={handleUpgradeEvent}
                disabled={upgrading}
                className="py-2.5 px-4 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-900 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 shadow-sm"
              >
                <DollarSign className="w-3.5 h-3.5 text-amber-500" /> Upgrade Event to Pro
              </button>
            )}
          </div>
        </div>

        {/* Two-Column Grid: Entrants Staged vs. Attending Vendors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Staged Vehicles (Entrants Grid) */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center justify-between border-b border-neutral-100 pb-2">
              <span>Staged Vehicles</span>
              <span className="font-mono text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-full">
                {event.entrants ? Object.keys(event.entrants).length : 0} Staged
              </span>
            </h2>

            <div className="space-y-3">
              {event.entrants && Object.keys(event.entrants).length > 0 ? (
                Object.values(event.entrants).map((entrant) => (
                  <Link
                    href={`/v/${entrant.vehicle_id}`}
                    key={entrant.vehicle_id}
                    className="p-4 bg-neutral-50 border border-neutral-200 hover:border-[#ff3b30] rounded-2xl flex items-center justify-between gap-4 transition-all group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-16 h-12 rounded-xl bg-neutral-200 border border-neutral-300 overflow-hidden shrink-0">
                        {entrant.photo_url ? (
                          <img src={entrant.photo_url} alt="Entrant" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CarFront className="w-6 h-6 text-neutral-400" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[8px] font-mono font-bold text-neutral-400 bg-neutral-200/50 px-1.5 py-0.2 rounded uppercase">
                          {entrant.staging_group || 'General'}
                        </span>
                        <h4 className="text-xs font-black uppercase text-neutral-900 group-hover:text-[#ff3b30] transition-colors truncate">
                          {entrant.year} {entrant.make} {entrant.model}
                        </h4>
                        <p className="text-[9px] font-mono text-neutral-400 uppercase">
                          Owner: {entrant.owner_name}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex text-[8px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                      entrant.status === 'checked_in'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        : entrant.status === 'tech_passed'
                        ? 'bg-blue-50 border-blue-100 text-blue-600'
                        : 'bg-neutral-100 border-neutral-200 text-neutral-500'
                    }`}>
                      {entrant.status === 'checked_in' ? 'Staged' : entrant.status === 'tech_passed' ? 'Tech Ok' : 'Registered'}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-neutral-200 rounded-2xl text-neutral-400 space-y-2">
                  <CarFront className="w-8 h-8 mx-auto opacity-35" />
                  <p className="text-[10px] uppercase font-mono font-bold">No vehicles registered to grid yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Vendors & Sponsors Column */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center justify-between border-b border-neutral-100 pb-2">
              <span>Vendors & Sponsors</span>
              <span className="font-mono text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-full">
                {vendorProfiles.length} Listed
              </span>
            </h2>

            <div className="space-y-3">
              {vendorProfiles.length > 0 ? (
                vendorProfiles.map((vendor) => (
                  <Link
                    href={`/b/${vendor.id}`}
                    key={vendor.id}
                    className="p-4 bg-neutral-50 border border-neutral-200 hover:border-[#ff3b30] rounded-2xl flex flex-col justify-between min-h-[110px] transition-all text-left cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono font-bold text-[#ff3b30] uppercase tracking-wider block">
                        {vendor.category === 'dealership' ? 'Dealer Sponsor' : 'Event Vendor'}
                      </span>
                      <h4 className="text-xs font-black uppercase text-neutral-900 group-hover:text-[#ff3b30] transition-colors truncate">
                        {vendor.name}
                      </h4>
                      <p className="text-[10px] text-neutral-550 leading-snug line-clamp-2">
                        {vendor.description}
                      </p>
                    </div>
                    
                    {vendor.contact_email && (
                      <span className="text-[8px] font-mono text-neutral-400 pt-2 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {vendor.contact_email}
                      </span>
                    )}
                  </Link>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-neutral-200 rounded-2xl text-neutral-400 space-y-2">
                  <Building2 className="w-8 h-8 mx-auto opacity-35" />
                  <p className="text-[10px] uppercase font-mono font-bold">No exhibitors listed.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Driver Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form 
            onSubmit={handleRegisterVehicle}
            className="bg-white max-w-md w-full p-6 md:p-8 rounded-[2rem] border border-neutral-200 text-left relative shadow-2xl space-y-6"
          >
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-wider">Register Vehicle to Grid</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Choose one of your registered garage vehicles to enter. Your vehicle specs will be public on the Event Hub.
              </p>
            </div>

            {/* Vehicle Selector */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Select Garage Vehicle</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              >
                <option value="">-- Choose Vehicle --</option>
                {userVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
                ))}
              </select>
            </div>

            {/* Staging class group */}
            {event.staging_groups && event.staging_groups.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Select Staging Group / Class</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                >
                  <option value="">-- General / Pending --</option>
                  {event.staging_groups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Digital Waiver Checkbox */}
            {event.require_waiver && (
              <label className="flex items-start gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:border-neutral-300 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={signedWaiver}
                  onChange={(e) => setSignedWaiver(e.target.checked)}
                  className="w-4 h-4 text-[#ff3b30] border-neutral-300 rounded focus:ring-[#ff3b30] mt-0.5"
                />
                <div>
                  <div className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1 text-emerald-600">
                    <ShieldCheck className="w-4 h-4" /> Digital Safety Release Waiver
                  </div>
                  <div className="text-[10px] text-neutral-400 pt-1 leading-relaxed">
                    I agree to verify vehicle safety compliance, obey event coordinators, and release the hosts from track staging liabilities.
                  </div>
                </div>
              </label>
            )}

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="py-3 bg-transparent hover:bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={registering}
                className="py-3 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                {registering ? 'Staging...' : 'Enter Staging'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowRegModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white text-sm font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
