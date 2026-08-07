'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import { getEvent } from '@/lib/actions/events';
import { getGlobalVehicleClasses } from '@/lib/actions/stagingClasses';
import { db, storage } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GridpassEvent, EventFrequency } from '@/lib/types/events';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  DollarSign,
  Camera,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Tag,
  Car,
  UserCheck,
  Building2,
  Clock,
  Video,
  UploadCloud,
  Film,
  Lock,
  Crosshair,
  AlertTriangle,
  Share2,
  ExternalLink,
  ClipboardCheck
} from 'lucide-react';

const InteractivePinMap = dynamic(
  () => import('@/components/events/InteractivePinMap'),
  { ssr: false }
);

// Motorsport Photo Presets
const COVER_PRESETS = [
  { name: 'Classics & Cruise Night', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1600' },
  { name: 'Supercars & Track Grid', url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=1600' },
  { name: 'Off-Road Trail & Crawl', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1600' },
  { name: 'Powersports Watercraft', url: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=1600' }
];

const DEFAULT_STAGING_CLASSES = [
  'Classics',
  'Hot Rods',
  'Muscle',
  'Off-Road / Trucks',
  'Imports',
  'Motorcycles',
  'Onewheels & PEVs',
  'Bicycles & E-Bikes',
  'Exotics & Supercars',
  'PWC / Marine',
  'EV & Modern'
];

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const eventId = params.id as string;
  const [event, setEvent] = useState<GridpassEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [frequency, setFrequency] = useState<string>('One-Time Event / Gathering');
  const [allowVehicles, setAllowVehicles] = useState(true);
  const [allowIndividuals, setAllowIndividuals] = useState(true);
  const [allowBusinesses, setAllowBusinesses] = useState(true);
  const [requireWaiver, setRequireWaiver] = useState(true);
  const [requireTechCheck, setRequireTechCheck] = useState(false);
  const [registrationFee, setRegistrationFee] = useState<number>(0);
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(1.0);

  // Staging Vehicle Classes & Groups States
  const [allowAllClasses, setAllowAllClasses] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(DEFAULT_STAGING_CLASSES);
  const [customClassInput, setCustomClassInput] = useState('');

  // Weather Alert & Event Reschedule States
  const [isRescheduled, setIsRescheduled] = useState(false);
  const [rescheduleNotice, setRescheduleNotice] = useState('');

  // Combined Date & Time Picker States (datetime-local format: YYYY-MM-DDTHH:mm)
  const [startDateTime, setStartDateTime] = useState('2026-08-07T16:00');
  const [endDateTime, setEndDateTime] = useState('2026-08-07T20:00');
  const [originalStartDateTime, setOriginalStartDateTime] = useState('2026-07-31T16:00');
  const [originalEndDateTime, setOriginalEndDateTime] = useState('2026-07-31T20:00');

  // Format Combined datetime-local value (YYYY-MM-DDTHH:mm) to clean human readable string
  const formatDateTimeCombo = (val: string) => {
    if (!val) return { dateStr: '', timeStr: '', fullStr: '' };
    const d = new Date(val);
    if (isNaN(d.getTime())) return { dateStr: val, timeStr: '', fullStr: val };
    const dateStr = d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return { dateStr, timeStr, fullStr: `${dateStr} at ${timeStr}` };
  };

  // Map Pin Coordinates & GPS States
  const [pinLat, setPinLat] = useState<number>(40.9114);
  const [pinLng, setPinLng] = useState<number>(-90.6476);
  const [gettingGPS, setGettingGPS] = useState(false);

  // Media Banner File Upload States
  const [uploadingMediaFile, setUploadingMediaFile] = useState(false);

  // Helper to detect video URLs
  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const clean = url.toLowerCase();
    return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') || clean.includes('video') || clean.startsWith('data:video/');
  };

  // Automatically enforce End Date cannot be before Start Date
  const handleStartDateTimeChange = (val: string) => {
    setStartDateTime(val);
    if (val && endDateTime && new Date(endDateTime) < new Date(val)) {
      // Auto-adjust endDateTime to 4 hours after start time on same date
      const startObj = new Date(val);
      const endObj = new Date(startObj.getTime() + 4 * 60 * 60 * 1000);
      const year = endObj.getFullYear();
      const month = String(endObj.getMonth() + 1).padStart(2, '0');
      const day = String(endObj.getDate()).padStart(2, '0');
      const hours = String(endObj.getHours()).padStart(2, '0');
      const mins = String(endObj.getMinutes()).padStart(2, '0');
      setEndDateTime(`${year}-${month}-${day}T${hours}:${mins}`);
    }
  };

  const handleOriginalStartDateTimeChange = (val: string) => {
    setOriginalStartDateTime(val);
    if (val && originalEndDateTime && new Date(originalEndDateTime) < new Date(val)) {
      const startObj = new Date(val);
      const endObj = new Date(startObj.getTime() + 4 * 60 * 60 * 1000);
      const year = endObj.getFullYear();
      const month = String(endObj.getMonth() + 1).padStart(2, '0');
      const day = String(endObj.getDate()).padStart(2, '0');
      const hours = String(endObj.getHours()).padStart(2, '0');
      const mins = String(endObj.getMinutes()).padStart(2, '0');
      setOriginalEndDateTime(`${year}-${month}-${day}T${hours}:${mins}`);
    }
  };

  useEffect(() => {
    if (!eventId) return;

    const loadEvent = async () => {
      try {
        let data = await getEvent(eventId);

        // Preseed fallback for mock events or maple-city-cruise
        if (!data && (eventId === 'maple-city-cruise' || eventId.startsWith('mock-event'))) {
          data = {
            id: eventId,
            host_uid: 'seeded-organizer-uid',
            title: '26TH ANNUAL MONMOUTH CRUISE NIGHT (MAPLE CITY STREET MACHINES)',
            name: '26TH ANNUAL MONMOUTH CRUISE NIGHT (MAPLE CITY STREET MACHINES)',
            date: 'Friday, August 7th, 2026',
            event_date: 'Friday, August 7th, 2026',
            time: '4:00 PM - 8:00 PM',
            location_name: 'Monmouth Public Square & Main Street',
            physical_address: '100 Public Square, Monmouth, IL 61462',
            description: `Celebrated for nearly three decades, the Monmouth Cruise Night is one of the largest single-day cruise-in car shows in the Midwest, drawing over 30,000 spectators and 3,500+ vehicles to historic downtown Monmouth, Illinois. Spearheaded by Club President Clifford Adams and the Maple City Street Machines, this legendary gathering fills the downtown public square with classic hot rods, muscle cars, vintage customs, off-road builds, and rare imports. Named after Monmouth's historic moniker 'Maple City'—given by 19th-century pioneers for the majestic maple trees welcoming travelers into town—the event features live music, local food truck rows, custom pinstriped pedal car raffles, and famous guest vehicle exhibits!`,
            cover_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1600',
            banner_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1600',
            frequency: 'one_time',
            allow_vehicles: true,
            allow_spectators: true,
            allow_vendors: true,
            registration_fee: 0
          } as GridpassEvent;
        }

        // Merge any cached cover photo or video uploaded earlier in this session
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(`gp_event_${eventId}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              data = { ...data, ...parsed };
            } catch (e) {
              console.warn("Failed to parse cached event data:", e);
            }
          }
        }

        if (data) {
          setEvent(data);
          setTitle(data.name || data.title || '');
          
          if (data.start_datetime) setStartDateTime(data.start_datetime);
          if (data.end_datetime) setEndDateTime(data.end_datetime);

          setLocationName(data.location_name || data.locationName || '');
          setPhysicalAddress(data.physical_address || data.locationAddress || '');
          setDescription(data.description || '');
          setCoverUrl(data.cover_url || data.banner_url || '');
          setFrequency(data.frequency || data.category || 'One-Time Event / Gathering');
          setAllowVehicles(data.allow_vehicles ?? true);
          setAllowIndividuals(data.allow_individuals ?? true);
          setAllowBusinesses(data.allow_businesses ?? true);
          setRequireWaiver(data.require_waiver ?? true);
          setRequireTechCheck(!!data.require_tech_check);
          setRegistrationFee(data.registration_fee || 0);
          setGeofenceEnabled(data.geofence_enabled ?? true);
          setGeofenceRadius(data.geofence_radius_miles ?? 1.0);

          try {
            const globalClasses = await getGlobalVehicleClasses();
            const activeClassNames = globalClasses.filter(c => c.active).map(c => c.name);
            if (data.staging_groups && Array.isArray(data.staging_groups) && data.staging_groups.length > 0) {
              setAllowAllClasses(false);
              setSelectedClasses(data.staging_groups);
            } else {
              setAllowAllClasses(true);
              setSelectedClasses(activeClassNames.length > 0 ? activeClassNames : DEFAULT_STAGING_CLASSES);
            }
          } catch (e) {
            setSelectedClasses(DEFAULT_STAGING_CLASSES);
          }

          setIsRescheduled(data.is_rescheduled ?? false);
          if (data.original_start_datetime) setOriginalStartDateTime(data.original_start_datetime);
          if (data.original_end_datetime) setOriginalEndDateTime(data.original_end_datetime);

          setRescheduleNotice(data.reschedule_notice || 'Rescheduled due to weather forecast and lightning safety concerns.');
        }
      } catch (err) {
        console.error("Failed to load event for editing:", err);
        showToast({
          title: "Error Loading Event",
          message: "Unable to load event details.",
          icon: "⚠️"
        });
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  // Handle GPS location lock
  const handleGetCurrentGPS = () => {
    if (!navigator.geolocation) {
      showToast({
        title: "GPS Unavailable",
        message: "Geolocation is not supported by your browser.",
        icon: "⚠️"
      });
      return;
    }

    setGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPinLat(lat);
        setPinLng(lng);
        const geoAddress = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° W (Current Device GPS Location)`;
        setPhysicalAddress(geoAddress);
        setGettingGPS(false);
        showToast({
          title: "Location Locked",
          message: "Map pin updated to your current GPS position!",
          icon: "📍"
        });
      },
      (err) => {
        console.error("GPS location error:", err);
        setGettingGPS(false);
        showToast({
          title: "Location Access Denied",
          message: "Unable to fetch GPS. You can click on the map or type an address.",
          icon: "⚠️"
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Geocode typed physical address to update map pin & center
  useEffect(() => {
    if (!physicalAddress || physicalAddress.includes('° N') || physicalAddress.length < 4) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(physicalAddress)}`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            setPinLat(lat);
            setPinLng(lng);
          }
        }
      } catch (err) {
        console.warn("Address geocoding lookup failed:", err);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [physicalAddress]);

  // Handle map pin drag or click with optional reverse geocoding
  const handlePinChange = async (lat: number, lng: number) => {
    setPinLat(lat);
    setPinLng(lng);

    // Set fallback coordinate string immediately
    setPhysicalAddress(`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° W (Venue Map Pin)`);

    // Fetch human-readable street address via reverse geocode
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        setPhysicalAddress(data.display_name);
      }
    } catch (err) {
      console.warn("Reverse geocoding failed:", err);
    }
  };

  // Handle direct photo or video upload for cover banner
  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMediaFile(true);
    const isVideo = file.type.startsWith('video/');

    // Instant local preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setCoverUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    try {
      const storageRef = ref(storage, `event_covers/${eventId}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setCoverUrl(downloadUrl);
      showToast({
        title: isVideo ? "Video Uploaded!" : "Photo Uploaded!",
        message: `${isVideo ? 'Video' : 'Photo'} uploaded successfully and set as cover banner.`,
        icon: isVideo ? "🎥" : "📷"
      });
    } catch (err) {
      console.warn("Storage upload warning, using local preview:", err);
      showToast({
        title: "File Loaded",
        message: "File loaded into preview.",
        icon: "🖼️"
      });
    } finally {
      setUploadingMediaFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDateTime) {
      showToast({
        title: "Missing Information",
        message: "Please enter an event title and start date/time.",
        icon: "⚠️"
      });
      return;
    }

    if (endDateTime && new Date(endDateTime) < new Date(startDateTime)) {
      showToast({
        title: "Invalid Schedule",
        message: "End date & time cannot be before start date & time.",
        icon: "⚠️"
      });
      return;
    }

    if (isRescheduled && originalEndDateTime && new Date(originalEndDateTime) < new Date(originalStartDateTime)) {
      showToast({
        title: "Invalid Reschedule Schedule",
        message: "Original end date & time cannot be before original start date & time.",
        icon: "⚠️"
      });
      return;
    }

    const startInfo = formatDateTimeCombo(startDateTime);
    const endInfo = formatDateTimeCombo(endDateTime);
    const origStartInfo = formatDateTimeCombo(originalStartDateTime);
    const origEndInfo = formatDateTimeCombo(originalEndDateTime);

    setSaving(true);
    const updatedData: Partial<GridpassEvent> = {
      name: title.trim(),
      title: title.trim(),
      date: startInfo.dateStr,
      event_date: startInfo.dateStr,
      start_date: startDateTime,
      end_date: endDateTime,
      start_datetime: startDateTime,
      end_datetime: endDateTime,
      time: `${startInfo.timeStr} - ${endInfo.timeStr}`,
      start_time: startInfo.timeStr,
      end_time: endInfo.timeStr,
      location_name: locationName.trim(),
      locationName: locationName.trim(),
      physical_address: physicalAddress.trim(),
      locationAddress: physicalAddress.trim(),
      description: description.trim(),
      cover_url: coverUrl.trim(),
      banner_url: coverUrl.trim(),
      frequency: frequency.trim() as EventFrequency,
      category: frequency.trim(),
      allow_vehicles: allowVehicles,
      allow_individuals: allowIndividuals,
      allow_businesses: allowBusinesses,
      require_waiver: requireWaiver,
      require_tech_check: requireTechCheck,
      geofence_enabled: geofenceEnabled,
      geofence_radius_miles: geofenceRadius,
      staging_groups: allowAllClasses ? DEFAULT_STAGING_CLASSES : selectedClasses,
      registration_fee: registrationFee,
      is_rescheduled: isRescheduled,
      original_date: isRescheduled ? `${origStartInfo.dateStr} (${origStartInfo.timeStr} - ${origEndInfo.timeStr})` : '',
      original_start_datetime: isRescheduled ? originalStartDateTime : '',
      original_end_datetime: isRescheduled ? originalEndDateTime : '',
      reschedule_notice: isRescheduled ? rescheduleNotice.trim() : '',
      updatedAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`gp_event_${eventId}`, JSON.stringify(updatedData));
      } catch (e) {
        console.warn("Failed to persist updated event:", e);
      }
    }

    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, updatedData as any);
      showToast({
        title: "Event Updated",
        message: "Your event details have been updated live!",
        icon: "✅"
      });
      router.push(`/events/${eventId}`);
    } catch (err) {
      console.error("Failed to update event:", err);
      showToast({
        title: "Event Saved Locally",
        message: "Event details updated successfully!",
        icon: "✅"
      });
      router.push(`/events/${eventId}`);
    } finally {
      setSaving(false);
    }
  };

  // Strict Permission Check: Only Logged-In Site Founder, Site Admin, or Event Owner can Edit
  const canEditEvent = !!user && (
    !!user.email?.toLowerCase().includes('losey') ||
    !!user.email?.toLowerCase().endsWith('@gridpass.app') ||
    (!!event && (
      user.uid === event.host_uid ||
      user.uid === event.organizer_id ||
      user.uid === event.owner_id ||
      user.uid === event.creatorId
    ))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-xs font-mono font-bold">
          <Loader2 className="w-6 h-6 text-[#ff3b30] animate-spin" /> Loading Event Editor...
        </div>
      </div>
    );
  }

  if (!canEditEvent) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-[#ff3b30]" />
        <h1 className="text-xl font-black uppercase tracking-tight">Access Restricted</h1>
        <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
          Only verified Event Organizers, Site Admins, and Platform Founders have permission to edit event details.
        </p>
        <Link
          href={user ? `/events/${eventId}` : '/login'}
          className="py-3 px-6 bg-[#ff3b30] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#bd2925] transition-all shadow-md"
        >
          {user ? 'Return to Event Hub' : 'Sign In as Organizer'}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/events/${eventId}`}
            className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel &amp; Back
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-1 bg-red-50 text-[#ff3b30] border border-red-200 rounded-full">
              Community Editor
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8 text-left">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-black uppercase text-neutral-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#ff3b30]" /> Edit Event Details
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Update date, schedule times, venue map location, description, registration permissions, and cover banner media for this event.
          </p>
        </div>

        {/* Facebook Assistant Kit Launch Banner (For Organizers) */}
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1 text-left">
            <span className="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-widest block">Facebook Event Suite</span>
            <h3 className="text-sm font-black uppercase text-blue-950 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" /> Facebook Event Setup Assistant
            </h3>
            <p className="text-xs text-blue-800 font-medium">
              Copy-paste pre-formatted event details, schedule dates, map locations &amp; cover photos directly into Facebook Events.
            </p>
          </div>
          <Link
            href={`/events/${eventId}/fb-assistant`}
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-blue-500/10"
          >
            Launch FB Assistant <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card 1: Event Identity & Scope */}
          <div className="p-6 md:p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm space-y-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Tag className="w-4 h-4 text-[#ff3b30]" /> Event Identity
            </h2>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Event Title / Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Cars & Coffee, Cruise Night, Track Day"
                required
                className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Event Category / Scope</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              >
                <option value="One-Time Event / Gathering">One-Time Event / Gathering (Car Show, Rally, Cruise Night)</option>
                <option value="Repeating Meet">Repeating Meet / Monthly Cruise Night</option>
                <option value="Permanent Venue / Destination">Permanent Venue / Destination (Track, Food Truck Park, Trailhead)</option>
              </select>
            </div>
          </div>

          {/* Card 2: Date, Time & Interactive Map Location */}
          <div className="p-6 md:p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm space-y-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Calendar className="w-4 h-4 text-[#ff3b30]" /> Date, Schedule &amp; Map Location
            </h2>

            {/* New Event Schedule: Start Date & Time + End Date & Time (Combined Pickers) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
              {/* Event Start Date & Time */}
              <div className="space-y-2">
                <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#ff3b30]" /> Start Date &amp; Time
                </label>
                <div className="space-y-1">
                  <input
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => handleStartDateTimeChange(e.target.value)}
                    required
                    className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] cursor-pointer"
                  />
                  <p className="text-[10px] text-neutral-500 font-medium px-1">
                    📅 {formatDateTimeCombo(startDateTime).fullStr || 'Select start date & time'}
                  </p>
                </div>
              </div>

              {/* Event End Date & Time */}
              <div className="space-y-2">
                <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-500" /> End Date &amp; Time
                </label>
                <div className="space-y-1">
                  <input
                    type="datetime-local"
                    value={endDateTime}
                    min={startDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] cursor-pointer"
                  />
                  <p className="text-[10px] text-neutral-500 font-medium px-1">
                    📅 {formatDateTimeCombo(endDateTime).fullStr || 'Select end date & time'}
                  </p>
                </div>
              </div>
            </div>

            {/* Weather Alert & Reschedule Controls */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black uppercase text-neutral-900">
                    Event Rescheduled or Weather Postponed
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isRescheduled}
                  onChange={(e) => setIsRescheduled(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
              </label>

              {isRescheduled && (
                <div className="space-y-3 pt-2 border-t border-amber-200/80 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Original Start Date & Time */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono font-bold text-amber-800 uppercase">
                        Original Start Date &amp; Time (WAS: ...)
                      </label>
                      <div className="space-y-1">
                        <input
                          type="datetime-local"
                          value={originalStartDateTime}
                          onChange={(e) => handleOriginalStartDateTimeChange(e.target.value)}
                          className="w-full p-3 bg-white border border-amber-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                        />
                        <p className="text-[10px] text-amber-700 font-medium px-1">
                          WAS: {formatDateTimeCombo(originalStartDateTime).fullStr || 'Select original start date'}
                        </p>
                      </div>
                    </div>

                    {/* Original End Date & Time */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono font-bold text-amber-800 uppercase">
                        Original End Date &amp; Time
                      </label>
                      <div className="space-y-1">
                        <input
                          type="datetime-local"
                          value={originalEndDateTime}
                          min={originalStartDateTime}
                          onChange={(e) => setOriginalEndDateTime(e.target.value)}
                          className="w-full p-3 bg-white border border-amber-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                        />
                        <p className="text-[10px] text-amber-700 font-medium px-1">
                          WAS: {formatDateTimeCombo(originalEndDateTime).fullStr || 'Select original end date'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[9px] font-mono font-bold text-amber-800 uppercase">
                      Reschedule Reason &amp; Notice Banner Text
                    </label>
                    <input
                      type="text"
                      value={rescheduleNotice}
                      onChange={(e) => setRescheduleNotice(e.target.value)}
                      placeholder="e.g. Rescheduled due to severe weather forecast and lightning safety concerns."
                      className="w-full p-3 bg-white border border-amber-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                    💡 An Amber Reschedule Alert banner will display at the top of your Event Hub showing the date change and safety notice.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Venue / Destination Name</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Downtown Plaza, Raceway Staging Area, Beachfront Lot"
                className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            {/* Address & GPS Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Physical Address (Google Maps)</label>
                <button
                  type="button"
                  onClick={handleGetCurrentGPS}
                  disabled={gettingGPS}
                  className="text-[10px] font-bold text-[#ff3b30] hover:text-[#bd2925] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Crosshair className={`w-3 h-3 ${gettingGPS ? 'animate-spin' : ''}`} />
                  <span>{gettingGPS ? 'Locking GPS...' : '📍 Use Current GPS'}</span>
                </button>
              </div>
              <input
                type="text"
                value={physicalAddress}
                onChange={(e) => setPhysicalAddress(e.target.value)}
                placeholder="e.g. 100 Main St, City, State ZIP"
                className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            {/* Embedded Interactive Map Pin Picker */}
            <div className="space-y-2 pt-2">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase flex items-center justify-between">
                <span>Drag Pin or Click Map to Set Venue Spot</span>
                <span className="text-neutral-500 font-normal">Google Maps Vector Tiles</span>
              </label>
              <div className="w-full h-56 rounded-2xl overflow-hidden border border-neutral-200 shadow-inner relative">
                <InteractivePinMap
                  initialLat={pinLat}
                  initialLng={pinLng}
                  pinType="amenity"
                  amenityCategory="info"
                  onPinChange={handlePinChange}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Registration Permissions & Entry Fees */}
          <div className="p-6 md:p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm space-y-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Car className="w-4 h-4 text-[#ff3b30]" /> Registration Permissions &amp; Fees
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                allowVehicles ? 'bg-red-50/50 border-[#ff3b30]' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <div className="space-y-0.5">
                  <div className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-[#ff3b30]" /> Vehicles
                  </div>
                  <div className="text-[10px] text-neutral-500">Allow car/rig RSVP</div>
                </div>
                <input
                  type="checkbox"
                  checked={allowVehicles}
                  onChange={(e) => setAllowVehicles(e.target.checked)}
                  className="w-4 h-4 accent-[#ff3b30] cursor-pointer"
                />
              </label>

              <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                allowIndividuals ? 'bg-emerald-50/50 border-emerald-600' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <div className="space-y-0.5">
                  <div className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Spectators
                  </div>
                  <div className="text-[10px] text-neutral-500">Allow guest RSVP</div>
                </div>
                <input
                  type="checkbox"
                  checked={allowIndividuals}
                  onChange={(e) => setAllowIndividuals(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </label>

              <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                allowBusinesses ? 'bg-blue-50/50 border-blue-600' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <div className="space-y-0.5">
                  <div className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" /> Businesses
                  </div>
                  <div className="text-[10px] text-neutral-500">Allow food trucks/booths</div>
                </div>
                <input
                  type="checkbox"
                  checked={allowBusinesses}
                  onChange={(e) => setAllowBusinesses(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>
            </div>

            {/* Waiver & Tech Inspection Requirements Controls */}
            <div className="space-y-2 pt-1 border-t border-neutral-100">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase block">
                Safety &amp; Compliance Requirements
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  requireWaiver ? 'bg-emerald-50/70 border-emerald-600' : 'bg-neutral-50 border-neutral-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Digital Safety Release Waiver
                    </div>
                    <div className="text-[10px] text-neutral-500">Require digital waiver check before staging</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireWaiver}
                    onChange={(e) => setRequireWaiver(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </label>

                <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  requireTechCheck ? 'bg-blue-50/70 border-blue-600' : 'bg-neutral-50 border-neutral-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4 text-blue-600" /> Tech Check / Vehicle Inspection
                    </div>
                    <div className="text-[10px] text-neutral-500">Require technical inspection clearance</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireTechCheck}
                    onChange={(e) => setRequireTechCheck(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Event Grounds Geofence Radius Settings */}
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                      <Crosshair className="w-4 h-4 text-[#ff3b30]" /> Event Grounds Geofence Boundary
                    </div>
                    <p className="text-[10px] text-neutral-500 font-medium">
                      Require attendees to be physically at the event venue to drop live GPS map pins.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={geofenceEnabled}
                    onChange={(e) => setGeofenceEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#ff3b30] cursor-pointer"
                  />
                </div>

                {geofenceEnabled && (
                  <div className="space-y-1.5 pt-2 border-t border-neutral-200">
                    <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase block">
                      Geofence Radius Distance Limit
                    </label>
                    <select
                      value={geofenceRadius}
                      onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                      className="w-full p-3 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] cursor-pointer"
                    >
                      <option value={0.25}>0.25 Miles (Compact Lot / Indoor Staging)</option>
                      <option value={0.5}>0.5 Miles (Downtown Core / Square)</option>
                      <option value={1.0}>1.0 Mile (Standard Venue Grounds - Recommended)</option>
                      <option value={2.0}>2.0 Miles (Extended Dragstrip / Track Complex)</option>
                      <option value={5.0}>5.0 Miles (Regional Cruise Boundary)</option>
                      <option value={0}>Disabled / Nationwide (No Distance Limit)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Staging Vehicle Classes & Groups Selector */}
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">
                  Allowed Vehicle Classes &amp; Staging Groups
                </label>
                <span className="text-[9px] font-mono font-bold text-emerald-600 uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {allowAllClasses ? '🌐 All Classes Allowed (Default)' : `🎯 ${selectedClasses.length} Specific Classes Allowed`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAllowAllClasses(true);
                    setSelectedClasses(DEFAULT_STAGING_CLASSES);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    allowAllClasses ? 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600' : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <div className="text-xs font-black uppercase text-neutral-900 flex items-center justify-between">
                    <span>🌐 Allow All Vehicle Classes</span>
                    {allowAllClasses && <span className="text-emerald-600 font-mono text-[10px]">✓ ACTIVE</span>}
                  </div>
                  <p className="text-[10px] text-neutral-500 pt-1">
                    Open to all classics, hot rods, muscle, trucks, imports, bikes, exotics &amp; PWC.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAllowAllClasses(false)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    !allowAllClasses ? 'bg-[#ff3b30]/10 border-[#ff3b30] ring-1 ring-[#ff3b30]' : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <div className="text-xs font-black uppercase text-neutral-900 flex items-center justify-between">
                    <span>🎯 Restrict / Specific Classes</span>
                    {!allowAllClasses && <span className="text-[#ff3b30] font-mono text-[10px]">✓ CUSTOM</span>}
                  </div>
                  <p className="text-[10px] text-neutral-500 pt-1">
                    Select specific vehicle categories or add custom competition classes.
                  </p>
                </button>
              </div>

              {/* Class Badges Picker */}
              {!allowAllClasses && (
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">
                    Toggle Allowed Vehicle Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_STAGING_CLASSES.map((cls) => {
                      const isSelected = selectedClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (selectedClasses.length > 1) {
                                setSelectedClasses(selectedClasses.filter(c => c !== cls));
                              }
                            } else {
                              setSelectedClasses([...selectedClasses, cls]);
                            }
                          }}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold uppercase transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-[#ff3b30] text-white border-[#ff3b30] shadow-sm'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{cls}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Class Field */}
                  <div className="pt-2 border-t border-neutral-200/60 space-y-1.5">
                    <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Add Custom Class / Staging Group</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customClassInput}
                        onChange={(e) => setCustomClassInput(e.target.value)}
                        placeholder="e.g. 1/8 Mile Pro Street or Overland Pits"
                        className="flex-1 p-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customClassInput.trim() && !selectedClasses.includes(customClassInput.trim())) {
                            setSelectedClasses([...selectedClasses, customClassInput.trim()]);
                            setCustomClassInput('');
                          }
                        }}
                        className="py-2.5 px-4 bg-neutral-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shrink-0"
                      >
                        + Add Class
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Registration Fee (Locked at $0 Free - Coming Soon Feature) */}
            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">
                  Registration Entry Fee ($0 = Free Entry)
                </label>
                <span className="text-[9px] font-mono font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-600" /> Paid Registration Coming Soon ($0 Free Default)
                </span>
              </div>
              <div className="relative opacity-75">
                <DollarSign className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  disabled
                  value={0}
                  placeholder="0"
                  className="w-full pl-10 p-3.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Details & Media Banner Uploader */}
          <div className="p-6 md:p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm space-y-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-3">
              <FileText className="w-4 h-4 text-[#ff3b30]" /> Details &amp; Cover Media
            </h2>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Event Description</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe schedule, parking rules, food trucks, stage area, and guidelines..."
                className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] leading-relaxed"
              />
            </div>

            {/* Photo & Video Cover Uploader */}
            <div className="space-y-3 pt-2">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">
                Cover Photo or Video Banner
              </label>

              {/* Media Preview Player */}
              {coverUrl && (
                <div className="w-full h-40 rounded-2xl overflow-hidden border border-neutral-200 relative bg-neutral-900 shadow-inner">
                  {isVideoUrl(coverUrl) ? (
                    <video
                      src={coverUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={coverUrl}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-2.5 right-2.5 bg-neutral-900/80 backdrop-blur-md text-white text-[9px] font-mono font-bold uppercase px-3 py-1 rounded-lg flex items-center gap-1.5">
                    {isVideoUrl(coverUrl) ? <Film className="w-3.5 h-3.5 text-[#ff3b30]" /> : <Camera className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isVideoUrl(coverUrl) ? 'Video Banner' : 'Photo Cover'}</span>
                  </div>
                </div>
              )}

              {/* Direct File Drop Zone */}
              <div className="p-4 bg-neutral-50 border-2 border-dashed border-neutral-200 hover:border-[#ff3b30] rounded-2xl text-center space-y-2 transition-all">
                <input
                  type="file"
                  id="edit-cover-file"
                  accept="image/*,video/*"
                  onChange={handleMediaFileUpload}
                  className="hidden"
                />
                <label htmlFor="edit-cover-file" className="cursor-pointer flex flex-col items-center gap-1.5">
                  <UploadCloud className="w-6 h-6 text-[#ff3b30]" />
                  <span className="text-xs font-black uppercase text-neutral-900">
                    {uploadingMediaFile ? 'Uploading Media...' : 'Upload Photo or Video Clip'}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium">
                    Supports MP4, WEBM, MOV video loops and WebP, JPG, PNG photos
                  </span>
                </label>
              </div>

              {/* URL Input */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Or Paste Media URL</label>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or video.mp4"
                  className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              {/* Motorsport Presets */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Or Choose Motorsport Photo Preset</label>
                <div className="grid grid-cols-2 gap-2">
                  {COVER_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setCoverUrl(preset.url)}
                      className={`p-2 bg-neutral-50 border rounded-xl overflow-hidden text-left transition-all cursor-pointer group ${
                        coverUrl === preset.url ? 'border-[#ff3b30] ring-1 ring-[#ff3b30]' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="w-full h-12 rounded-lg overflow-hidden bg-neutral-200 mb-1">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-neutral-800 uppercase block truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href={`/events/${eventId}`}
              className="py-3 px-6 bg-transparent hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || uploadingMediaFile}
              className="py-3 px-8 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-red-500/10"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" /> Saving Event...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Save Event Details
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
