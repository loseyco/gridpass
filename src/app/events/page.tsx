'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { GridpassEvent } from '@/lib/types/events';
import { 
  Calendar, MapPin, ShieldCheck, ClipboardCheck, Plus, 
  Loader2, Search, ArrowRight 
} from 'lucide-react';

export default function EventsDirectoryPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<GridpassEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if we are running in the Playwright mock sandbox
  const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);

      if (isMock) {
        // Preseed mock events list
        const mockEvents: GridpassEvent[] = [
          {
            id: 'maple-city-cruise',
            host_uid: 'host-123',
            title: '27TH ANNUAL CRUISE NIGHT IN THE MAPLE CITY',
            description: 'Monmouth\'s legendary Cruise Night! Showcases classics, hot rods, muscle cars, and off-road builds.',
            frequency: 'one_time',
            start_date: '2026-08-15T16:00',
            end_date: '2026-08-15T22:00',
            location_name: 'Monmouth Public Square & Main St',
            require_waiver: true,
            require_tech_check: false,
            staging_groups: ['Classics', 'Hot Rods', 'Muscle', 'Off-Road']
          },
          {
            id: 'mock-evt-1',
            host_uid: 'host-456',
            host_business_id: 'blarney-island',
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
        
        // Add any user-created mock events
        const stored = localStorage.getItem('__mock_events__');
        if (stored) {
          const list = JSON.parse(stored);
          mockEvents.push(...list);
        }

        setEvents(mockEvents);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDocs(collection(db, 'events'));
        const list: GridpassEvent[] = [];
        snap.forEach(docSnap => {
          list.push({
            id: docSnap.id,
            ...docSnap.data()
          } as GridpassEvent);
        });
        
        // If empty, fallback to basic mock items so the directory is never empty
        if (list.length === 0) {
          list.push({
            id: 'maple-city-cruise',
            host_uid: 'host-123',
            title: '27TH ANNUAL CRUISE NIGHT IN THE MAPLE CITY',
            description: 'Monmouth\'s legendary Cruise Night! Showcases classics, hot rods, muscle cars, and off-road builds.',
            frequency: 'one_time',
            start_date: '2026-08-15T16:00',
            end_date: '2026-08-15T22:00',
            location_name: 'Monmouth Public Square & Main St',
            require_waiver: true,
            require_tech_check: false,
            staging_groups: ['Classics', 'Hot Rods', 'Muscle', 'Off-Road']
          });
        }

        setEvents(list);
      } catch (err) {
        console.error("Failed to fetch events directory:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [isMock]);

  // Filter events by title or location search
  const filteredEvents = events.filter(event => {
    const term = searchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(term) ||
      event.location_name.toLowerCase().includes(term) ||
      (event.description || '').toLowerCase().includes(term)
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
    <div className="min-h-screen bg-white text-neutral-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Directory Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1 text-left">
            <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Gridpass Motorsports Network</span>
            <h1 className="text-xl md:text-2xl font-black uppercase text-neutral-900 tracking-tight leading-none">Events & Staging Hubs</h1>
          </div>

          <Link
            href="/events/create"
            className="py-2.5 px-5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
          >
            <Plus className="w-4 h-4" /> Host Event
          </Link>
        </div>

        {/* Search Filter Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, track, city, or organizer..."
            className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-950 placeholder-neutral-450 focus:outline-none focus:border-[#ff3b30] transition-colors"
          />
        </div>

        {/* Directory Rows */}
        <div className="space-y-3">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="p-4 bg-neutral-50 border border-neutral-200 hover:border-[#ff3b30] hover:shadow-sm rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all group cursor-pointer text-left"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  {/* Badge tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 uppercase tracking-widest">
                      {event.frequency === 'one_time' ? 'One-Time' : event.frequency === 'repeating' ? 'Repeating' : 'Permanent Venue'}
                    </span>
                    {event.require_waiver && (
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 uppercase tracking-wider flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Waiver Required
                      </span>
                    )}
                    {event.require_tech_check && (
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 uppercase tracking-wider flex items-center gap-0.5">
                        <ClipboardCheck className="w-3 h-3" /> Tech Check Required
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-black uppercase text-neutral-900 group-hover:text-[#ff3b30] transition-colors truncate tracking-tight">
                    {event.title}
                  </h3>

                  <p className="text-xs text-neutral-550 leading-relaxed font-medium line-clamp-2 max-w-2xl">
                    {event.description}
                  </p>

                  <div className="text-[9px] font-mono font-bold text-neutral-450 uppercase flex flex-col sm:flex-row sm:gap-4 gap-1 pt-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-neutral-450" /> {event.location_name}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-neutral-450" /> {event.recurrence_rule || event.operating_hours || 'One-Time Event Slot'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase tracking-wider self-end md:self-center shrink-0 group-hover:translate-x-1 transition-transform">
                  View Hub <ArrowRight className="w-3.5 h-3.5" />
                </div>

              </Link>
            ))
          ) : (
            <div className="text-center py-16 border border-dashed border-neutral-200 rounded-2xl text-neutral-400 space-y-2 bg-neutral-50/50">
              <Calendar className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs uppercase font-mono font-bold">No staging events found matching search criteria.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
