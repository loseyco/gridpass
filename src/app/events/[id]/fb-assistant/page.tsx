'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { GridpassEvent } from '@/lib/types/events';
import { 
  ArrowLeft, Copy, Check, ExternalLink, Calendar, MapPin, 
  Share2, Image as ImageIcon, Sparkles, FileText, CheckCircle2 
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import Link from 'next/link';

export default function FacebookEventAssistantPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<GridpassEvent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');

  useEffect(() => {
    if (!eventId) return;

    const loadEvent = async () => {
      setLoading(true);
      const targetId = eventId || 'maple-city-cruise';

      let loadedEvent: GridpassEvent | null = null;

      if (isMock || targetId === 'maple-city-cruise' || targetId.startsWith('mock-event')) {
        loadedEvent = {
          id: targetId,
          host_uid: 'seeded-organizer-uid',
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
          banner_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1600'
        } as GridpassEvent;
      } else {
        try {
          const ref = doc(db, 'events', targetId);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            loadedEvent = { id: snap.id, ...snap.data() } as GridpassEvent;
          }
        } catch (err) {
          console.error("Failed to load event for FB assistant:", err);
        }
      }

      // Merge any cached cover photo or video uploaded earlier in this session
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`gp_event_${targetId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.start_date && parsed.start_date.includes('2026-07-31')) {
              parsed.start_date = '2026-08-07T16:00';
              parsed.end_date = '2026-08-07T20:00';
              parsed.original_date = 'Friday, July 31, 2026 (4:00 PM - 8:00 PM)';
            }
            loadedEvent = { ...(loadedEvent || {}), ...parsed } as GridpassEvent;
          } catch (e) {
            console.warn("Failed to parse cached event for FB assistant:", e);
          }
        }
      }

      setEvent(loadedEvent);
      setLoading(false);
    };

    loadEvent();
  }, [eventId, isMock]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showToast({
        title: "Copied to Clipboard",
        message: `${fieldName} copied cleanly! Ready to paste into Facebook.`,
        icon: "📋"
      });
      setTimeout(() => setCopiedField(null), 2500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff3b30]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 p-8 text-center space-y-4">
        <h1 className="text-xl font-black uppercase">Event Not Found</h1>
        <Link href="/events" className="text-xs font-mono font-bold text-[#ff3b30] hover:underline">
          Return to Events Directory
        </Link>
      </div>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gridpass.app';
  const eventPublicUrl = `${baseUrl}/events/${event.id}`;

  const eventTitleText = event.title || event.name || 'GRIDPASS EVENT';
  
  const startDateObj = event.start_date || event.startDate ? new Date(event.start_date || event.startDate!) : null;
  const dateFormatted = startDateObj ? startDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'August 7, 2026';
  const timeFormatted = startDateObj ? startDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (event.start_time || '4:00 PM');

  const endDateObj = event.end_date || event.endDate ? new Date(event.end_date || event.endDate!) : null;
  const endDateFormatted = endDateObj ? endDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : dateFormatted;
  const endTimeFormatted = endDateObj ? endDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (event.end_time || '8:00 PM');

  const locationText = [
    event.location_name || event.locationName,
    event.physical_address || event.locationAddress
  ].filter(Boolean).join(', ') || 'Monmouth Public Square & Main Street, 100 Public Square, Monmouth, IL 61462';

  const descriptionText = `${event.description || ''}

${event.is_rescheduled ? `⚠️ RESCHEDULED NOTICE: ${event.reschedule_notice || 'Date changed due to weather forecast!'}\n\n` : ''}🏁 GRIDPASS EVENT HUB & STAGING LINK:
🚘 Drivers — Stage your vehicle & get windshield pass:
${eventPublicUrl}

🏬 Vendors & Food Trucks — Exhibitor RSVP:
${eventPublicUrl}

👤 Spectators — RSVP (Going / Interested):
${eventPublicUrl}

${!event.is_claimed ? `Are you an event organizer or host? Claim this listing on Gridpass to manage live check-ins!` : ''}`;

  const coverImageUrl = event.banner_url || event.cover_url || event.exampleImageUrl || 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1600';

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
          <Link
            href={`/events/${eventId}`}
            className="p-2.5 rounded-xl border border-neutral-200 hover:border-neutral-400 text-neutral-700 transition-colors"
            title="Back to Event Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="space-y-0.5 text-left">
            <span className="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-widest block">Facebook Event Creator Suite</span>
            <h1 className="text-xl md:text-2xl font-black uppercase text-neutral-900 tracking-tight">Facebook Event Setup Assistant</h1>
          </div>
        </div>

        {/* Intro Tip Card */}
        <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-3xl text-left space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-blue-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" /> Facebook Event Form Mapper
            </h3>
            <a
              href="https://www.facebook.com/events/create"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              Open Facebook Event Creation <ExternalLink className="w-3 h-3 text-white" />
            </a>
          </div>
          <p className="text-xs text-blue-800 font-medium leading-relaxed">
            Copy each field below directly into Facebook's <strong>Create Event</strong> form. Each box maps 1-to-1 with Facebook's required fields and embeds direct Gridpass links so attendees can stage vehicles, submit food truck RSVPs, and confirm attendance!
          </p>
        </div>

        {/* Field Mappers List */}
        <div className="space-y-6 text-left">
          
          {/* Field 1: Event Name */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ff3b30]" /> 1. Facebook Field: Event Name
              </label>
              <button
                onClick={() => copyToClipboard(eventTitleText, 'Event Name')}
                className="py-1.5 px-3.5 bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-800 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                {copiedField === 'Event Name' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                {copiedField === 'Event Name' ? 'Copied!' : 'Copy Event Name'}
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={eventTitleText}
              className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none"
            />
          </div>

          {/* Field 2: Date & Time (Start & End Schedule) */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4">
            <label className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#ff3b30]" /> 2. Facebook Field: Start &amp; End Schedule
            </label>

            {/* Start Date & Start Time */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">Start Schedule</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Start Date</span>
                    <button
                      onClick={() => copyToClipboard(dateFormatted, 'Start Date')}
                      className="text-[9px] font-mono font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" /> Copy Start Date
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={dateFormatted}
                    className="w-full p-3 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Start Time</span>
                    <button
                      onClick={() => copyToClipboard(timeFormatted, 'Start Time')}
                      className="text-[9px] font-mono font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" /> Copy Start Time
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={timeFormatted}
                    className="w-full p-3 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* End Date & End Time */}
            <div className="space-y-2 pt-2 border-t border-neutral-200/80">
              <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">End Schedule</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">End Date</span>
                    <button
                      onClick={() => copyToClipboard(endDateFormatted, 'End Date')}
                      className="text-[9px] font-mono font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" /> Copy End Date
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={endDateFormatted}
                    className="w-full p-3 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">End Time</span>
                    <button
                      onClick={() => copyToClipboard(endTimeFormatted, 'End Time')}
                      className="text-[9px] font-mono font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" /> Copy End Time
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={endTimeFormatted}
                    className="w-full p-3 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Field 3: Location */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ff3b30]" /> 3. Facebook Field: Location (In Person)
              </label>
              <button
                onClick={() => copyToClipboard(locationText, 'Location')}
                className="py-1.5 px-3.5 bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-800 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                {copiedField === 'Location' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                {copiedField === 'Location' ? 'Copied!' : 'Copy Location'}
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={locationText}
              className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none"
            />
          </div>

          {/* Field 4: Description (What are the details?) */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ff3b30]" /> 4. Facebook Field: What are the details? (Description)
              </label>
              <button
                onClick={() => copyToClipboard(descriptionText, 'Description')}
                className="py-1.5 px-3.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {copiedField === 'Description' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                {copiedField === 'Description' ? 'Copied Cleanly!' : 'Copy Description'}
              </button>
            </div>
            <textarea
              readOnly
              rows={11}
              value={descriptionText}
              className="w-full p-4 bg-white border border-neutral-200 rounded-2xl text-xs font-medium leading-relaxed text-neutral-800 focus:outline-none select-all"
            />
          </div>

          {/* Field 5: Cover Photo Banner */}
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#ff3b30]" /> 5. Facebook Field: Add Cover Photo
              </label>
              <button
                onClick={() => copyToClipboard(coverImageUrl, 'Cover Image URL')}
                className="py-1.5 px-3.5 bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-800 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                {copiedField === 'Cover Image URL' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                {copiedField === 'Cover Image URL' ? 'Copied URL!' : 'Copy Image URL'}
              </button>
            </div>

            <div className="relative aspect-21/9 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-900">
              {coverImageUrl.toLowerCase().endsWith('.mp4') || coverImageUrl.toLowerCase().endsWith('.webm') || coverImageUrl.toLowerCase().endsWith('.mov') || coverImageUrl.includes('video') || coverImageUrl.startsWith('data:video/') ? (
                <video
                  src={coverImageUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={coverImageUrl}
                  alt="Event Cover Banner"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

        </div>

        {/* Bottom Launcher Bar */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href={`/events/${eventId}`}
            className="py-3 px-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer w-full sm:w-auto text-center"
          >
            Return to Event Page
          </Link>
          <a
            href="https://www.facebook.com/events/create"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            Launch Facebook Event Creator <ExternalLink className="w-4 h-4 text-white" />
          </a>
        </div>

      </div>
    </div>
  );
}
