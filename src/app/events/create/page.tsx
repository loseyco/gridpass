'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { getUserManagedBusinesses } from '@/lib/actions/business';
import { publishEvent, getEvent } from '@/lib/actions/events';
import { BusinessProfile } from '@/lib/types/business';
import { EventFrequency, GridpassEvent } from '@/lib/types/events';
import { Loader2, ArrowLeft, Plus, Calendar, MapPin, ShieldCheck, ClipboardCheck, Building2 } from 'lucide-react';
import Link from 'next/link';

function CreateEventForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');
  const isNew = !eventId;

  // Loading states
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [managedBusinesses, setManagedBusinesses] = useState<BusinessProfile[]>([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<EventFrequency>('one_time');
  const [locationName, setLocationName] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  
  // Schedule state toggles
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [operatingHours, setOperatingHours] = useState('');

  // Rules
  const [requireWaiver, setRequireWaiver] = useState(false);
  const [requireTechCheck, setRequireTechCheck] = useState(false);
  const [stagingGroupsInput, setStagingGroupsInput] = useState('');
  const [vendorsInput, setVendorsInput] = useState('');

  // Host selection
  const [hostType, setHostType] = useState<'personal' | 'business'>('personal');
  const [selectedBusinessId, setSelectedBusinessId] = useState('');

  // Check Mock environment
  const isMock = typeof window !== 'undefined' && localStorage.getItem('__playwright_mock__') === 'true';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load existing event data if editing
  useEffect(() => {
    if (isNew) return;

    const loadEventData = async () => {
      setLoading(true);
      if (isMock) {
        // Preload mock event
        const stored = localStorage.getItem('__mock_events__');
        let match;
        if (stored) {
          const list = JSON.parse(stored);
          match = list.find((e: any) => e.id === eventId);
        }
        if (!match && eventId === 'maple-city-cruise') {
          match = {
            id: 'maple-city-cruise',
            host_uid: user?.uid || 'host-123',
            title: '27TH ANNUAL CRUISE NIGHT IN THE MAPLE CITY',
            description: 'Monmouth\'s legendary Cruise Night!',
            frequency: 'one_time',
            start_date: '2026-08-15T16:00',
            end_date: '2026-08-15T22:00',
            location_name: 'Monmouth Public Square & Main St',
            require_waiver: true,
            require_tech_check: false,
            staging_groups: ['Classics', 'Hot Rods', 'Muscle', 'Off-Road'],
            vendors: []
          };
        }
        if (match) {
          populateForm(match);
        }
        setLoading(false);
        return;
      }

      try {
        const evt = await getEvent(eventId!);
        if (evt) {
          populateForm(evt);
        } else {
          alert('Staging event profile not found.');
          router.push('/dash');
        }
      } catch (err) {
        console.error("Error loading event:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId, isNew, isMock, user]);

  const populateForm = (evt: GridpassEvent) => {
    setTitle(evt.title);
    setDescription(evt.description || '');
    setFrequency(evt.frequency);
    setLocationName(evt.location_name);
    setPhysicalAddress(evt.physical_address || '');
    setStartDate(evt.start_date || '');
    setEndDate(evt.end_date || '');
    setRecurrenceRule(evt.recurrence_rule || '');
    setOperatingHours(evt.operating_hours || '');
    setRequireWaiver(!!evt.require_waiver);
    setRequireTechCheck(!!evt.require_tech_check);
    setStagingGroupsInput(evt.staging_groups ? evt.staging_groups.join(', ') : '');
    setVendorsInput(evt.vendors ? evt.vendors.join(', ') : '');
    if (evt.host_business_id) {
      setHostType('business');
      setSelectedBusinessId(evt.host_business_id);
    } else {
      setHostType('personal');
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const loadBusinesses = async () => {
      if (isMock) {
        // Preload a mock business profile
        setManagedBusinesses([
          {
            id: 'nielsens',
            owner_uid: user.uid,
            name: 'NIELSEN ENTERPRISES',
            description: 'Powersports and Marine Dealership',
            category: 'dealership',
            location_name: 'Lake Villa, IL'
          }
        ]);
        return;
      }

      try {
        const list = await getUserManagedBusinesses(user.uid);
        setManagedBusinesses(list);
      } catch (err) {
        console.error("Failed to load managed businesses:", err);
      }
    };

    loadBusinesses();
  }, [user, isMock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !locationName) return;
    setSaving(true);

    const stagingGroups = stagingGroupsInput
      .split(',')
      .map(g => g.trim())
      .filter(Boolean);

    const vendors = vendorsInput
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    const eventPayload: any = {
      host_uid: user.uid,
      title: title.trim(),
      description: description.trim(),
      frequency,
      location_name: locationName.trim(),
      physical_address: physicalAddress.trim(),
      require_waiver: requireWaiver,
      require_tech_check: requireTechCheck,
      staging_groups: stagingGroups,
      vendors: vendors,
      entrants: {}
    };

    // Include frequency schedule data
    if (frequency === 'one_time') {
      eventPayload.start_date = startDate;
      eventPayload.end_date = endDate;
    } else if (frequency === 'repeating') {
      eventPayload.recurrence_rule = recurrenceRule.trim();
    } else if (frequency === 'permanent_venue') {
      eventPayload.operating_hours = operatingHours.trim();
    }

    // Set business host if selected
    if (hostType === 'business' && selectedBusinessId) {
      eventPayload.host_business_id = selectedBusinessId;
    }

    if (isMock) {
      const stored = localStorage.getItem('__mock_events__');
      const list = stored ? JSON.parse(stored) : [];
      const idToSave = isNew ? 'mock-event-' + Date.now() : eventId!;
      
      const payloadWithId = {
        id: idToSave,
        ...eventPayload
      };

      if (isNew) {
        list.push(payloadWithId);
      } else {
        const idx = list.findIndex((evt: any) => evt.id === eventId);
        if (idx !== -1) list[idx] = payloadWithId;
        else list.push(payloadWithId);
      }
      
      localStorage.setItem('__mock_events__', JSON.stringify(list));
      setSaving(false);
      router.push('/dash');
      return;
    }

    try {
      await publishEvent({
        ...eventPayload,
        id: isNew ? undefined : eventId!
      });
      router.push('/dash');
    } catch (err) {
      console.error("Failed to publish motorsport event:", err);
      alert("Error saving event profile. Please check credentials.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Back header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/dash" 
            className="p-2 hover:bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="text-left">
            <h1 className="text-sm font-mono font-bold text-neutral-400 uppercase tracking-widest">Motorsports Event Management</h1>
            <h2 className="text-xl font-black uppercase text-neutral-900 tracking-tight">{isNew ? 'Create Staging Event' : 'Edit Staging Event'}</h2>
          </div>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-8 pt-4 border-t border-neutral-100">
          
          {/* Host Setup Selection */}
          <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-4">
            <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase block tracking-wider">Select Event Host Profile</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setHostType('personal')}
                className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  hostType === 'personal'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                    : 'bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                Personal Driver Profile
              </button>
              <button
                type="button"
                disabled={managedBusinesses.length === 0}
                onClick={() => setHostType('business')}
                className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-40 ${
                  hostType === 'business'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                    : 'bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                Business Profile
              </button>
            </div>

            {hostType === 'business' && managedBusinesses.length > 0 && (
              <div className="space-y-1.5 pt-2 animate-in slide-in-from-top-1 duration-150">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Select Managed Business</label>
                <select
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                  required={hostType === 'business'}
                  className="w-full p-2.5 bg-white border border-neutral-200 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                >
                  <option value="">-- Select Business Account --</option>
                  {managedBusinesses.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Basic Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-black text-neutral-900 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-[#ff3b30]" /> Event Information
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Event Title / Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Nielsen's Blarney Island Water Staging"
                required
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Event Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe check-in rules, track details, classes, and timing schedules."
                rows={3}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Event Frequency / Occurrence</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as EventFrequency)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] font-bold"
              >
                <option value="one_time">One-Time Motorsport Event</option>
                <option value="repeating">Repeating / Recurring Meet</option>
                <option value="permanent_venue">Permanent Motorsport Venue / Park</option>
              </select>
            </div>

            {/* Conditional Schedule Fields */}
            {frequency === 'one_time' && (
              <div className="grid grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-1 duration-150">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required={frequency === 'one_time'}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required={frequency === 'one_time'}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>
            )}

            {frequency === 'repeating' && (
              <div className="space-y-1 pt-2 animate-in slide-in-from-top-1 duration-150">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Recurrence Schedule</label>
                <input
                  type="text"
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value)}
                  placeholder="e.g. Every Saturday morning, 8:00 AM - 11:30 AM"
                  required={frequency === 'repeating'}
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>
            )}

            {frequency === 'permanent_venue' && (
              <div className="space-y-1 pt-2 animate-in slide-in-from-top-1 duration-150">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Operating Hours</label>
                <input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  placeholder="e.g. Open Daily, 9:00 AM - Sunset"
                  required={frequency === 'permanent_venue'}
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-black text-neutral-900 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#ff3b30]" /> Location
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Location / Venue Name</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Blarney Island Transom Gate, Road America Staging Pit"
                required
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Physical Address (Optional)</label>
              <input
                type="text"
                value={physicalAddress}
                onChange={(e) => setPhysicalAddress(e.target.value)}
                placeholder="e.g. 27843 W Grass Lake Rd, Antioch, IL 60002"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>

          {/* Gridpass Gate Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-black text-neutral-900 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#ff3b30]" /> Staging Check-in Admission Rules
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:border-neutral-300 transition-colors">
                <input
                  type="checkbox"
                  checked={requireWaiver}
                  onChange={(e) => setRequireWaiver(e.target.checked)}
                  className="w-4 h-4 text-[#ff3b30] border-neutral-300 rounded focus:ring-[#ff3b30]"
                />
                <div>
                  <div className="text-xs font-black uppercase text-neutral-900">Require Waiver</div>
                  <div className="text-[10px] text-neutral-400">Driver must sign digital safety waiver</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:border-neutral-300 transition-colors">
                <input
                  type="checkbox"
                  checked={requireTechCheck}
                  onChange={(e) => setRequireTechCheck(e.target.checked)}
                  className="w-4 h-4 text-[#ff3b30] border-neutral-300 rounded focus:ring-[#ff3b30]"
                />
                <div>
                  <div className="text-xs font-black uppercase text-neutral-900">Require Tech Stamp</div>
                  <div className="text-[10px] text-neutral-400">Marshal must stamp vehicle tech-passed</div>
                </div>
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5 text-neutral-400" /> Staging Groups / Classes (Comma-separated list)
              </label>
              <input
                type="text"
                value={stagingGroupsInput}
                onChange={(e) => setStagingGroupsInput(e.target.value)}
                placeholder="e.g. Group A, Group B, Novice, Import Row, Transom VIP"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-400" /> Event Vendors & Sponsors (Comma-separated list of business slugs)
              </label>
              <input
                type="text"
                value={vendorsInput}
                onChange={(e) => setVendorsInput(e.target.value)}
                placeholder="e.g. nielsens, grassroots-tacos, detailing-pro"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
              <span className="text-[8px] font-mono text-neutral-400 block pt-1 leading-normal">
                List food trucks, sponsors, tuning shops, or local clubs attending this event.
              </span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
            <Link
              href="/dash"
              className="py-3 bg-transparent hover:bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="py-3 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Save Event
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    }>
      <CreateEventForm />
    </Suspense>
  );
}
