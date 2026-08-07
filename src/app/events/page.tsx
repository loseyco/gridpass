'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { GridpassEvent } from '@/lib/types/events';
import { 
  Calendar, MapPin, ShieldCheck, ClipboardCheck, Plus, 
  Loader2, Search, ArrowRight, Archive, Clock 
} from 'lucide-react';

const PRESEEDED_SYSTEM_EVENTS: GridpassEvent[] = [
  {
    id: 'maple-city-cruise',
    host_uid: 'seeded-organizer-uid',
    host_business_id: 'maple-city-street-machines',
    host_name: 'Maple City Street Machines',
    title: '26TH ANNUAL MONMOUTH CRUISE NIGHT (MAPLE CITY STREET MACHINES)',
    description: 'Over 30,000 spectators and 3,500 cars fill the streets for Monmouth\'s legendary Cruise Night organized by Clifford Adams and Maple City Street Machines! Showcases classics, hot rods, muscle cars, off-road trucks, and imports.',
    frequency: 'one_time',
    start_date: '2026-08-07T16:00',
    end_date: '2026-08-07T20:00',
    location_name: 'Monmouth Public Square & Main Street',
    physical_address: '100 Public Square, Monmouth, IL 61462',
    allow_vehicles: true,
    allow_spectators: true,
    allow_vendors: true,
    is_rescheduled: true,
    original_date: 'Friday, July 31, 2026',
    reschedule_notice: 'Rescheduled to Friday, August 7th (4 PM - 8 PM) due to weather forecast and lightning safety concerns.',
    require_waiver: true,
    require_tech_check: false,
    staging_groups: ['Classics', 'Hot Rods', 'Muscle', 'Off-Road / Trucks', 'Imports', 'Motorcycles'],
    is_claimed: false,
    claim_status: 'unclaimed',
    banner_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1600'
  }
];

// Helper to overlay dynamic localStorage updates onto system/database events
function mergeLocalEventData(evt: GridpassEvent): GridpassEvent {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`gp_event_${evt.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...evt, ...parsed };
      }
    } catch (e) {
      console.warn("Failed to parse local stored event overlay:", e);
    }
  }
  return evt;
}

export default function EventsDirectoryPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<GridpassEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Check if running in Playwright mock sandbox
  const isMock = typeof window !== 'undefined' && localStorage.getItem('__playwright_mock__') === 'true';

  useEffect(() => {
    let unsubscribe = () => {};

    if (isMock) {
      // Preseed mock events list for isolated E2E testing
      const mockList = PRESEEDED_SYSTEM_EVENTS.map(mergeLocalEventData);
      const stored = localStorage.getItem('__mock_events__');
      if (stored) {
        try {
          const list = JSON.parse(stored);
          mockList.push(...list.map(mergeLocalEventData));
        } catch (e) {
          console.error("Error parsing stored mock events:", e);
        }
      }

      setEvents(mockList);
      setLoading(false);
    } else {
      // Rule 9: Real-time live reactive listener merged with system preseeded events & local cover overrides
      const eventsRef = collection(db, 'events');
      unsubscribe = onSnapshot(eventsRef, (snap) => {
        const eventsMap = new Map<string, GridpassEvent>();
        
        // Add preseeded system events first with local cover photo merge
        PRESEEDED_SYSTEM_EVENTS.forEach(evt => eventsMap.set(evt.id, mergeLocalEventData(evt)));
        
        // Merge Firestore collection documents with local cover photo merge
        snap.forEach(docSnap => {
          const rawEvt = {
            id: docSnap.id,
            ...docSnap.data()
          } as GridpassEvent;
          eventsMap.set(docSnap.id, mergeLocalEventData(rawEvt));
        });

        setEvents(Array.from(eventsMap.values()));
        setLoading(false);
      }, (err) => {
        console.error("Failed to sync live events directory:", err);
        // Fallback to preseeded events on network/quota error
        setEvents(PRESEEDED_SYSTEM_EVENTS.map(mergeLocalEventData));
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, [isMock]);

  // Helper to check if an event recently ended (within 48 hours) and is in the "Archiving Soon" grace period
  const isEventArchivingSoon = (event: GridpassEvent): boolean => {
    if (event.frequency === 'repeating' || event.frequency === 'permanent_venue') {
      return false;
    }
    if (event.status === 'archived' || event.is_archived) {
      return false;
    }
    if (event.status === 'archiving_soon') {
      return true;
    }
    const eventTime = event.end_date || event.endDate || event.start_date || event.startDate;
    if (eventTime) {
      const eventDate = new Date(eventTime);
      if (!isNaN(eventDate.getTime())) {
        const diffMs = Date.now() - eventDate.getTime();
        // If event ended in the past, but less than 48 hours ago (172800000 ms)
        if (diffMs > 0 && diffMs <= 48 * 60 * 60 * 1000) {
          return true;
        }
      }
    }
    return false;
  };

  // Helper to determine if an event is permanently past / archived (> 48h after end date)
  const isEventArchived = (event: GridpassEvent): boolean => {
    if (event.is_archived || event.status === 'archived' || event.status === 'past') {
      return true;
    }
    if (event.frequency === 'repeating' || event.frequency === 'permanent_venue') {
      return false;
    }

    // Rescheduled notice guard: if event is rescheduled and new date is upcoming/future, it is NOT archived
    if (event.is_rescheduled) {
      const checkTime = event.start_date || event.startDate || event.end_date || event.endDate;
      if (checkTime) {
        const eventDate = new Date(checkTime);
        if (!isNaN(eventDate.getTime()) && eventDate.getTime() >= Date.now() - 86400000) {
          return false;
        }
      }
      return false;
    }

    // If event is in the 48h "Archiving Soon" grace window, keep it active in directory feed
    if (isEventArchivingSoon(event)) {
      return false;
    }

    const eventTime = event.end_date || event.endDate || event.start_date || event.startDate;
    if (eventTime) {
      const eventDate = new Date(eventTime);
      // Only archive permanently if ended more than 48 hours ago
      if (!isNaN(eventDate.getTime()) && (Date.now() - eventDate.getTime() > 48 * 60 * 60 * 1000)) {
        return true;
      }
    }
    return false;
  };

  const archivedCount = events.filter(isEventArchived).length;

  // Filter events by title or location search, keeping past/archived events hidden by default unless searched or toggled
  const filteredEvents = events.filter(event => {
    const archived = isEventArchived(event);
    const term = (searchQuery || '').trim().toLowerCase();

    // Hide archived events by default when search query is empty and showArchived toggle is off
    if (!showArchived && !term && archived) {
      return false;
    }

    const title = (event?.title || event?.name || '').toLowerCase();
    const location = (event?.location_name || event?.locationName || event?.locationAddress || '').toLowerCase();
    const description = (event?.description || '').toLowerCase();
    
    return !term || (
      title.includes(term) ||
      location.includes(term) ||
      description.includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white text-neutral-900 flex flex-col max-w-4xl mx-auto w-full px-3 sm:px-6 pt-16 pb-12 space-y-4">
      
      {/* Top Header & Search Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-left border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="py-1 px-3 bg-neutral-900 hover:bg-[#ff3b30] text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-colors inline-flex items-center gap-1 shrink-0 shadow-2xs"
          >
            ← Explore
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-neutral-900 uppercase tracking-tight leading-none">
              Events &amp; Meets
            </h1>
            <span className="text-[10px] text-neutral-500 font-mono font-semibold">
              {filteredEvents.length} Active Gatherings
            </span>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, track, city..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#ff3b30] transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`py-1.5 px-2.5 text-[10px] font-mono font-bold uppercase rounded-xl border transition-all shrink-0 ${
              showArchived
                ? 'bg-neutral-900 border-neutral-900 text-white'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600'
            }`}
          >
            {showArchived ? 'Active Only' : `Archive (${archivedCount})`}
          </button>

          <Link
            href="/events/create"
            className="py-1.5 px-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-colors inline-flex items-center gap-1 shrink-0 shadow-2xs"
          >
            + Host
          </Link>
        </div>
      </div>

      {/* High-Density Compact Horizontal List Rows */}
      <div className="space-y-2 text-left">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const coverImg = event.banner_url || event.cover_url || event.exampleImageUrl || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80';

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#ff3b30] p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-md group"
              >
                {/* Thumbnail */}
                <div className="w-20 h-16 rounded-xl bg-neutral-200 border border-neutral-300 overflow-hidden shrink-0">
                  <img src={coverImg} alt={event.title || 'Event'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {event.is_rescheduled && (
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white uppercase">
                        🌧️ Rescheduled
                      </span>
                    )}
                    {isEventArchivingSoon(event) ? (
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-orange-100 border border-orange-200 text-orange-800 uppercase">
                        Archiving Soon
                      </span>
                    ) : isEventArchived(event) ? (
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-amber-700 uppercase">
                        Past / Archived
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                        {event.frequency === 'one_time' ? 'One-Time' : event.frequency === 'repeating' ? 'Repeating' : 'Permanent Venue'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-black text-neutral-900 uppercase truncate group-hover:text-[#ff3b30] transition-colors">
                    {event.title || event.name || 'Untitled Event'}
                  </h3>

                  <p className="text-[10px] text-neutral-500 font-mono font-bold truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#ff3b30] shrink-0" /> {event.location_name || event.locationName || event.locationAddress || 'Location Unspecified'}
                  </p>
                </div>

                {/* Action Pill */}
                <div className="shrink-0">
                  <span className="py-1 px-3 bg-[#ff3b30] group-hover:bg-[#bd2925] text-white text-[9px] font-mono font-bold uppercase rounded-xl transition-colors inline-block shadow-2xs">
                    View →
                  </span>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="py-16 text-center text-neutral-400 font-mono text-xs uppercase bg-neutral-50 border border-neutral-200 rounded-2xl">
            No events match your search criteria.
          </div>
        )}
      </div>

    </div>
  );
}


