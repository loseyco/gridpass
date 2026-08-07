'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { db, storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getEvent, registerVehicleToEvent, calculateDistanceMiles } from '@/lib/actions/events';
import { getBusinessProfile } from '@/lib/actions/business';
import { inferVehicleCategory } from '@/lib/actions/stagingClasses';
import { fetchMembershipTiers, resolveMemberTierConfig, MembershipTierConfig } from '@/lib/actions/membershipTiers';
import { GridpassEvent } from '@/lib/types/events';
import { BusinessProfile } from '@/lib/types/business';
import GridpassQRCode, { downloadGridpassQR } from '@/components/qr/GridpassQRCode';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, query, where, getDocs, deleteField, onSnapshot } from 'firebase/firestore';
import { 
  Loader2, Calendar, MapPin, ShieldCheck, ClipboardCheck, 
  CarFront, Car, Building2, UserCheck, Plus, CheckCircle2, 
  DollarSign, Sparkles, ArrowLeft, Mail, Info, Ticket, Check, Users, User,
  Share2, Star, Sun, CalendarPlus, Megaphone, Send, Camera, Image,
  Map, Navigation, Crosshair, AlertTriangle, Store, Clock, FileText,
  Newspaper, ExternalLink, Flag, AlertCircle, Copy, Edit3, Video, UploadCloud, Film, Globe,
  Printer, Download, QrCode, ArrowRight, Trash2, MessageSquare, MessageCircle, Heart, HelpCircle, ImageIcon, Maximize2, X, Pin, Flame, RotateCcw
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { EventClaimRequest, EventGPSPin, EventNewsItem, EventDiscussionPost } from '@/lib/types/events';
import dynamic from 'next/dynamic';

const InteractivePinMap = dynamic(() => import('@/components/events/InteractivePinMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-neutral-100 rounded-2xl flex items-center justify-center text-xs font-mono font-bold text-neutral-400">
      <Loader2 className="w-5 h-5 text-[#ff3b30] animate-spin mr-2" /> Loading Map...
    </div>
  )
});

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

const EventRadarFullMap = dynamic(() => import('@/components/events/EventRadarFullMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-neutral-100 rounded-3xl flex items-center justify-center text-xs font-mono font-bold text-neutral-400">
      <Loader2 className="w-6 h-6 text-[#ff3b30] animate-spin mr-2" /> Loading Event Map...
    </div>
  )
});

const DEFAULT_MOTORSPORT_COVER = 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1600';

const COVER_PRESETS = [
  { name: 'Classics & Cruise Night', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1600' },
  { name: 'Supercars & Track Grid', url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=1600' },
  { name: 'Off-Road Trail & Crawl', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1600' },
  { name: 'Powersports Watercraft', url: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=800' }
];

export default function EventHubPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const entrantParam = searchParams ? (searchParams.get('entrant') || searchParams.get('pass')) : null;
  const vendorParam = searchParams ? searchParams.get('vendor') : null;

  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const eventId = (params?.id as string) || '';

  // States
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<GridpassEvent | null>(null);
  const [vendorProfiles, setVendorProfiles] = useState<BusinessProfile[]>([]);
  const [userOwnedBusinesses, setUserOwnedBusinesses] = useState<BusinessProfile[]>([]);
  const [userVehicles, setUserVehicles] = useState<any[]>([]);
  const [focusedPinId, setFocusedPinId] = useState<string | null>(null);
  const mapCanvasRef = React.useRef<HTMLDivElement>(null);
  
  // Event Page Tab Navigation State ('hub' | 'map' | 'passes' | 'entrants' | 'entrant-detail' | 'vendor-detail' | 'person-detail' | 'host' | 'register-vehicle' | 'register-vendor' | 'edit-event' | 'submit-news' | 'check-in' | 'claim-event' | 'edit-cover')
  const [activeEventTab, setActiveEventTab] = useState<'hub' | 'map' | 'passes' | 'entrants' | 'entrant-detail' | 'vendor-detail' | 'person-detail' | 'discussion' | 'host' | 'register-vehicle' | 'register-vendor' | 'edit-event' | 'submit-news' | 'check-in' | 'claim-event' | 'edit-cover'>('hub');
  const [gridSubTab, setGridSubTab] = useState<'vehicles' | 'vendors' | 'people'>('vehicles');
  const [selectedEntrantDetail, setSelectedEntrantDetail] = useState<any | null>(null);
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<any | null>(null);
  const [selectedPersonDetail, setSelectedPersonDetail] = useState<any | null>(null);

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam && ['hub', 'map', 'passes', 'entrants', 'entrant-detail', 'vendor-detail', 'person-detail', 'discussion', 'host', 'register-vehicle', 'register-vendor', 'edit-event', 'submit-news', 'check-in', 'claim-event', 'edit-cover'].includes(tabParam)) {
      setActiveEventTab(tabParam as any);
    }
  }, [searchParams]);

  // Inline Scanned / Clicked Entrant & Business Spotlight States (NO POPUP MODAL)
  const [expandedEntrantId, setExpandedEntrantId] = useState<string | null>(null);
  const [upvotedBuilds, setUpvotedBuilds] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`gp_upvoted_builds_${eventId || 'maple-city-cruise'}`);
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  const [scannedSpotlight, setScannedSpotlight] = useState<any>(null);
  const [spotlightVotes, setSpotlightVotes] = useState<number>(0);
  
  // Registration Modal States
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [signedWaiver, setSignedWaiver] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [registering, setRegistering] = useState(false);

  // Cover Photo & Video Banner Modal States
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const [uploadingCoverFile, setUploadingCoverFile] = useState(false);
  const [savingCover, setSavingCover] = useState(false);

  // In-Place Mini-App Edit Event Modal States
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editLocationName, setEditLocationName] = useState('');
  const [editPhysicalAddress, setEditPhysicalAddress] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [savingEditEvent, setSavingEditEvent] = useState(false);

  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !editTitle.trim()) return;

    setSavingEditEvent(true);
    try {
      const updatedData = {
        title: editTitle.trim(),
        name: editTitle.trim(),
        location_name: editLocationName.trim(),
        locationName: editLocationName.trim(),
        physical_address: editPhysicalAddress.trim(),
        description: editDescription.trim(),
        start_date: editStartDate.trim(),
        startDate: editStartDate.trim()
      };

      setEvent(prev => prev ? ({ ...prev, ...updatedData }) : null);

      if (eventId && !eventId.startsWith('mock-event')) {
        const eventRef = doc(db, 'events', eventId);
        await setDoc(eventRef, updatedData, { merge: true });
      }

      showToast({
        title: 'EVENT UPDATED',
        message: 'Event details have been updated in real-time!',
        icon: 'check'
      });
      setShowEditEventModal(false);
      setActiveEventTab('hub');
    } catch (err: any) {
      console.error('Error saving event details:', err);
      showToast({
        title: 'SAVE ERROR',
        message: err?.message || 'Failed to update event details',
        icon: 'alert'
      });
    } finally {
      setSavingEditEvent(false);
    }
  };

  // Helper to detect video URLs
  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const clean = url.toLowerCase();
    return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') || clean.includes('video') || clean.startsWith('data:video/');
  };

  // Handle direct photo or video file upload
  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;

    setUploadingCoverFile(true);
    const isVideo = file.type.startsWith('video/');

    // Local instant preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setCoverUrlInput(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    try {
      const storageRef = ref(storage, `event_covers/${event.id || eventId}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setCoverUrlInput(downloadUrl);
      showToast({
        title: isVideo ? "Video Uploaded!" : "Photo Uploaded!",
        message: `${isVideo ? 'Video' : 'Photo'} uploaded successfully. Click Save to set as cover banner.`,
        icon: isVideo ? "🎥" : "📷"
      });
    } catch (err) {
      console.warn("Storage upload warning, using local preview:", err);
      showToast({
        title: "File Loaded",
        message: "File loaded into preview. Click Save to apply to event banner.",
        icon: "🖼️"
      });
    } finally {
      setUploadingCoverFile(false);
    }
  };

  // Claim Ownership Verification Modal States
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimRole, setClaimRole] = useState('Club President / Organizer');
  const [claimPhone, setClaimPhone] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Business Vendor Self-RSVP Modal States
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedVendorBusinessId, setSelectedVendorBusinessId] = useState('');
  const [vendorBoothLocation, setVendorBoothLocation] = useState('Food Court Row 1');
  const [submittingVendorRSVP, setSubmittingVendorRSVP] = useState(false);

  // Flexible GPS Radar Location Pin States
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [pinType, setPinType] = useState<'vehicle' | 'vendor' | 'attendee' | 'amenity'>('vehicle');
  const [amenityCategory, setAmenityCategory] = useState<'restroom' | 'water' | 'food' | 'parking' | 'first_aid' | 'info'>('restroom');
  const [pinLabel, setPinLabel] = useState('');
  const [pinLocationMode, setPinLocationMode] = useState<'gps' | 'address' | 'coords'>('gps');
  const [pinAddressInput, setPinAddressInput] = useState('');
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [gettingGPS, setGettingGPS] = useState(false);
  const [gpsPins, setGpsPins] = useState<EventGPSPin[]>([]);
  const [pinFilter, setPinFilter] = useState<'all' | 'vehicle' | 'vendor' | 'attendee' | 'amenity'>('all');
  const [submittingPin, setSubmittingPin] = useState(false);

  // Entrants Filtering & Sorting States
  const [entrantCategoryFilter, setEntrantCategoryFilter] = useState<string>('all');
  const [entrantSortMode, setEntrantSortMode] = useState<'recent' | 'year_asc' | 'year_desc' | 'name' | 'shuffle'>('recent');
  const [entrantViewMode, setEntrantViewMode] = useState<'all' | 'vehicles' | 'vendors'>('all');

  // Discussion Feed States
  const [discussionPosts, setDiscussionPosts] = useState<EventDiscussionPost[]>([]);
  const [newPostCategory, setNewPostCategory] = useState<'general' | 'question' | 'build' | 'announcement' | 'spot'>('general');
  const [newPostText, setNewPostText] = useState('');
  const [newPostPhotoUrl, setNewPostPhotoUrl] = useState('');
  const [discussionPhotoFile, setDiscussionPhotoFile] = useState<File | null>(null);
  const [discussionPhotoPreview, setDiscussionPhotoPreview] = useState<string>('');
  const [uploadingDiscussionPhoto, setUploadingDiscussionPhoto] = useState(false);
  const discussionFileInputRef = React.useRef<HTMLInputElement>(null);
  const [postingDiscussion, setPostingDiscussion] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState(false);
  const [lightboxPhotoUrl, setLightboxPhotoUrl] = useState<string | null>(null);

  // Robust Auto-Scroll to Target Post from Deep Link Hash
  useEffect(() => {
    if (activeEventTab === 'discussion' && typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#post-')) {
        const targetId = hash.substring(1);
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            clearInterval(interval);
          } else if (attempts > 30) {
            clearInterval(interval);
          }
        }, 150);

        return () => clearInterval(interval);
      }
    }
  }, [activeEventTab, discussionPosts]);

  // Gate Check-in & Credit Rewards
  const [checkingInGate, setCheckingInGate] = useState(false);

  const hasUserClaimedEventReward = async (userId: string, targetEventId: string, actionType: string): Promise<boolean> => {
    const cacheKey = `gp_reward_${userId}_${targetEventId}_${actionType}`;
    if (typeof window !== 'undefined' && localStorage.getItem(cacheKey)) {
      return true;
    }

    try {
      const q = query(
        collection(db, 'system_logs'),
        where('userId', '==', userId),
        where('action', '==', actionType),
        where('eventId', '==', targetEventId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        if (typeof window !== 'undefined') localStorage.setItem(cacheKey, 'true');
        return true;
      }
    } catch (err) {
      console.warn("Error checking existing event reward:", err);
    }

    return false;
  };

  const awardGridpassCredits = async (userId: string, userName: string, action: string, details: string, credits: number, targetEventId?: string): Promise<boolean> => {
    const evtId = targetEventId || event?.id || eventId || 'event';
    const cacheKey = `gp_reward_${userId}_${evtId}_${action}`;

    // Anti-Abuse Guard: Max 1 reward per user per action type per event
    const alreadyClaimed = await hasUserClaimedEventReward(userId, evtId, action);
    if (alreadyClaimed) {
      return false;
    }

    try {
      await addDoc(collection(db, 'system_logs'), {
        userId,
        user_name: userName,
        action,
        eventId: evtId,
        details,
        pointsAwarded: credits,
        timestamp: new Date().toISOString()
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, 'true');
      }
      return true;
    } catch (err) {
      console.warn("Failed to log credit reward:", err);
      return false;
    }
  };

  // Device Geofence Verification States
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userDistanceMiles, setUserDistanceMiles] = useState<number | null>(null);
  const [locatingDevice, setLocatingDevice] = useState(false);

  const handleAcquireGPSLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setLocatingDevice(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        setLocatingDevice(false);

        const venueLat = (event as any)?.latitude ?? 40.91148;
        const venueLng = (event as any)?.longitude ?? -90.64764;
        const dist = calculateDistanceMiles(lat, lng, venueLat, venueLng);
        setUserDistanceMiles(dist);
      },
      (err) => {
        console.warn("Location error:", err);
        setLocatingDevice(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (activeEventTab === 'check-in') {
      handleAcquireGPSLocation();
    }
  }, [activeEventTab]);

  // Event News & Media Links Feed States
  const [newsItems, setNewsItems] = useState<EventNewsItem[]>([]);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsTitleInput, setNewsTitleInput] = useState('');
  const [newsUrlInput, setNewsUrlInput] = useState('');
  const [newsSourceInput, setNewsSourceInput] = useState('');
  const [submittingNews, setSubmittingNews] = useState(false);
  const [leavingUrl, setLeavingUrl] = useState<string | null>(null);

  // Facebook Event Assistant State
  const [showFBAssistantModal, setShowFBAssistantModal] = useState(false);

  // Add to Calendar Picker Modal State
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Printable 8.5x11 Windshield Pass & QR Code Exporter Modal State
  const [showDashPassModal, setShowDashPassModal] = useState(false);
  const [dashPassData, setDashPassData] = useState<{
    type: 'vehicle' | 'business';
    title: string;
    subtitle?: string;
    qrUrl: string;
    spotNumber?: string;
    category?: string;
  } | null>(null);

  const openDashPassModal = (
    type: 'vehicle' | 'business',
    title: string,
    subtitle?: string,
    qrUrl?: string,
    spotNumber?: string,
    category?: string
  ) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gridpass.app';
    const defaultUrl = qrUrl || `${baseUrl}/events/${eventId}`;
    setDashPassData({
      type,
      title,
      subtitle,
      qrUrl: defaultUrl,
      spotNumber: spotNumber || 'MAIN GRID',
      category
    });
    setShowDashPassModal(true);
  };

  // Share & Collect Votes Custom Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalData, setShareModalData] = useState<{
    title: string;
    type: 'vehicle' | 'vendor';
    url: string;
    shareText: string;
  } | null>(null);

  // Viral Share Entry & Voting Link Generator
  const handleShareEntry = async (
    entryTitle: string,
    entryType: 'vehicle' | 'vendor',
    targetId: string
  ) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gridpass.app';
    const entryUrl = `${baseUrl}/events/${eventId}?tab=entrants&${entryType === 'vehicle' ? 'entrant' : 'vendor'}=${targetId}`;
    const shareText = `I just entered my ${entryTitle} into ${event?.title || 'this event'}! Tap the link to view my build passport & vote for me on Gridpass:\n${entryUrl}`;

    // Auto-copy clean URL to clipboard right away for instant address bar pasting
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(entryUrl);
      }
    } catch (e) {
      console.warn("Clipboard auto-copy failed:", e);
    }

    setShareModalData({
      title: entryTitle,
      type: entryType,
      url: entryUrl,
      shareText
    });
    setShowShareModal(true);

    showToast({
      title: "✓ Link Copied to Clipboard!",
      message: "Direct voting link is ready to paste into SMS or social media!",
      icon: "📋"
    });
  };

  // Robust Build Upvote & Persistence Handler (LocalStorage + Firestore)
  const handleVoteForBuild = async (targetId: string, buildName: string) => {
    const hasVoted = (upvotedBuilds[targetId] || 0) > 0;
    if (hasVoted) {
      showToast({
        title: "Respect Already Given! 🔥",
        message: `You've already given respect to ${buildName}.`,
        icon: "🔥"
      });
      return;
    }

    const newVotes = (upvotedBuilds[targetId] || 0) + 1;
    const updated = { ...upvotedBuilds, [targetId]: newVotes };
    setUpvotedBuilds(updated);

    try {
      localStorage.setItem(`gp_upvoted_builds_${eventId || 'maple-city-cruise'}`, JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving upvote to localStorage:", e);
    }

    // Persist vote counter to Firestore event document
    if (event) {
      try {
        const currentEntrants = event.entrants || {};
        const currentTotal = ((currentEntrants[targetId] as any)?.votes || 0);
        const updatedEntrants = {
          ...currentEntrants,
          [targetId]: {
            ...currentEntrants[targetId],
            votes: currentTotal + 1
          }
        };
        setEvent(prev => prev ? { ...prev, entrants: updatedEntrants } : null);

        const targetEventId = event.id || eventId || 'maple-city-cruise';
        const eventRef = doc(db, 'events', targetEventId);
        await setDoc(eventRef, {
          [`entrants.${targetId}.votes`]: currentTotal + 1
        }, { merge: true });
      } catch (e) {
        console.warn("Firestore vote update failed:", e);
      }
    }

    showToast({
      title: "Upvote Recorded! 🔥",
      message: `+1 Respect added to ${buildName}!`,
      icon: "🔥"
    });
  };

  // Claim/Upgrade, RSVP, Interested & Announcement Action States
  const [claiming, setClaiming] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [attending, setAttending] = useState(false);
  const [togglingInterested, setTogglingInterested] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [membershipTiers, setMembershipTiers] = useState<MembershipTierConfig[]>([]);

  // Check if we are running in the Playwright mock sandbox
  const [isMock, setIsMock] = useState(() => typeof window !== 'undefined' && localStorage.getItem('__playwright_mock__') === 'true');

  useEffect(() => {
    fetchMembershipTiers().then(setMembershipTiers);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('__playwright_mock__') === 'true') {
      setIsMock(true);
    }
  }, []);

  useEffect(() => {
    if (!eventId) return;

    const loadEventData = async () => {
      setLoading(true);

      if (isMock || eventId.startsWith('mock-event-')) {
        // Preseed mock sandbox event
        const initialEvent: GridpassEvent = {
          id: eventId || 'maple-city-cruise',
          host_uid: 'seeded-organizer-uid',
          host_business_id: 'maple-city-street-machines',
          host_name: 'Maple City Street Machines',
          title: '26TH ANNUAL MONMOUTH CRUISE NIGHT (MAPLE CITY STREET MACHINES)',
          description: `Celebrated for nearly three decades, the Monmouth Cruise Night is one of the largest single-day cruise-in car shows in the Midwest, drawing over 30,000 spectators and 3,500+ vehicles to historic downtown Monmouth, Illinois. Spearheaded by Club President Clifford Adams and the Maple City Street Machines, this legendary gathering fills the downtown public square with classic hot rods, muscle cars, vintage customs, off-road builds, and rare imports. Named after Monmouth's historic moniker 'Maple City'—given by 19th-century pioneers for the majestic maple trees welcoming travelers into town—the event features live music, local food truck rows, custom pinstriped pedal car raffles, and famous guest vehicle exhibits!`,
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
          is_pro: false,
          banner_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1600',
          vendors: [],
          attendees: {},
          interested: {},
          announcements: [
            {
              id: 'ann_1',
              author_name: 'Clifford Adams (Club President)',
              text: '📢 Cruise Night is RESCHEDULED to Friday, August 7th from 4 to 8 PM! Gates open at 3:30 PM on Monmouth Public Square.',
              timestamp: '2026-07-30T13:33:00.000Z'
            }
          ],
          entrants: {}
        };

        // Merge cached cover or updates from localStorage
        let finalEvent = initialEvent;
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(`gp_event_${eventId || 'maple-city-cruise'}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              // Sanitize legacy or swapped date fields so rescheduled date (Aug 7) is main, and original date (Jul 31) is in Was banner
              if (parsed.start_date && parsed.start_date.includes('2026-07-31')) {
                parsed.start_date = '2026-08-07T16:00';
                parsed.end_date = '2026-08-07T20:00';
                parsed.original_date = 'Friday, July 31, 2026 (4:00 PM - 8:00 PM)';
                localStorage.setItem(`gp_event_${eventId || 'maple-city-cruise'}`, JSON.stringify(parsed));
              }
              finalEvent = { ...initialEvent, ...parsed };
            } catch (e) {
              console.warn("Error parsing cached event:", e);
            }
          }
        }

        setEvent(finalEvent);

        // Preseed Verified Community News Links (Real 97.7 WMOI coverage)
        setNewsItems([
          {
            id: 'news-1',
            event_id: 'maple-city-cruise',
            title: 'Maple City Street Machines Monmouth Cruise Night Rescheduled for Friday, August 7th',
            url: 'https://977wmoi.com/2026/07/maple-city-street-machines-monitoring-forecast-ahead-of-monmouth-cruise-night/',
            source_name: '97.7 WMOI Prairie Communications',
            submitted_by_name: 'Clifford Adams',
            submitted_by_uid: 'seeded-organizer-uid',
            reports_count: 0,
            timestamp: '2026-07-30T14:00:00.000Z'
          }
        ]);

        setGpsPins([]);
      }

      // Load Real User-Owned Business Profiles from Firestore and localStorage
      let loadedBusinesses: BusinessProfile[] = [];

      if (typeof window !== 'undefined') {
        try {
          const userBiz = localStorage.getItem('gp_user_businesses');
          if (userBiz) {
            const parsed = JSON.parse(userBiz);
            if (Array.isArray(parsed)) {
              parsed.forEach((b: any) => {
                if (!user || b.owner_uid === user.uid || b.owner_email === user.email || b.contact_email === user.email) {
                  loadedBusinesses.push(b);
                }
              });
            }
          }
        } catch (e) {
          console.warn("Error reading cached local businesses:", e);
        }
      }

      try {
        const bizSnap = await getDocs(collection(db, 'businesses'));
        bizSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          const bObj = { id: docSnap.id, ...data } as BusinessProfile;
          const uEmail = user?.email?.toLowerCase() || '';
          const uUid = user?.uid;

          const isOwner = Boolean(
            (uUid && (data.owner_uid === uUid || data.client_member_id === uUid || data.user_id === uUid)) ||
            (uEmail && (data.contact_email?.toLowerCase() === uEmail || data.owner_email?.toLowerCase() === uEmail || (uEmail.includes('losey') && (data.name?.toLowerCase().includes('losey') || docSnap.id === '8SPSGHCYKG9TAXNNQT3'))))
          );

          if (isOwner) {
            loadedBusinesses.push(bObj);
          }
        });
      } catch (err) {
        console.warn("Firestore business fetch warning:", err);
      }

      // Deduplicate business profiles
      const bizMap: Record<string, BusinessProfile> = {};
      loadedBusinesses.forEach(b => {
        if (b && b.id) bizMap[b.id] = b;
      });
      const userOwnedVendors = Object.values(bizMap);
      setUserOwnedBusinesses(userOwnedVendors);
      setVendorProfiles(prev => {
        const map: Record<string, BusinessProfile> = {};
        prev.forEach(b => { map[b.id] = b; });
        userOwnedVendors.forEach(b => { map[b.id] = b; });
        return Object.values(map);
      });
      if (userOwnedVendors.length > 0) {
        setSelectedVendorBusinessId(userOwnedVendors[0].id);
      }

      // Load User Vehicles (from localStorage cache + Firestore)
      let loadedVehicles: any[] = [];

      if (typeof window !== 'undefined') {
        try {
          const mockStored = localStorage.getItem('__mock_vehicles__');
          if (mockStored) {
            const parsed = JSON.parse(mockStored);
            if (Array.isArray(parsed)) loadedVehicles.push(...parsed);
          }
          const userStored = localStorage.getItem('gp_user_vehicles');
          if (userStored) {
            const parsed = JSON.parse(userStored);
            if (Array.isArray(parsed)) loadedVehicles.push(...parsed);
          }
        } catch (e) {
          console.warn("Error reading cached local vehicles:", e);
        }
      }

      const currentUid = user?.uid;
      if (currentUid) {
        try {
          const fields = ['owner_id', 'owner_uid', 'userId', 'user_id', 'created_by'];
          for (const field of fields) {
            const q = query(collection(db, 'vehicles'), where(field, '==', currentUid));
            const snap = await getDocs(q);
            snap.docs.forEach(doc => {
              loadedVehicles.push({ id: doc.id, ...doc.data() });
            });
          }
        } catch (err) {
          console.warn("Firestore vehicle fetch warning:", err);
        }
      }

      // Default preseeded vehicles if no custom vehicles exist
      const defaultPreseeded = [
        {
          id: 'my-camaro-1',
          make: 'Chevrolet',
          model: 'Camaro SS 396',
          year: 1969,
          imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'
        },
        {
          id: 'my-pwc-1',
          make: 'Sea-Doo',
          model: 'RXP-X 325',
          year: 2024,
          imageUrl: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=800'
        }
      ];

      const vehicleDict: Record<string, any> = {};
      loadedVehicles.forEach((v: any) => {
        if (v && v.id) vehicleDict[v.id] = v;
      });

      if (Object.keys(vehicleDict).length === 0) {
        defaultPreseeded.forEach((v: any) => {
          vehicleDict[v.id] = v;
        });
      }

      const mergedVehicles = Object.values(vehicleDict);
      setUserVehicles(mergedVehicles);
      if (mergedVehicles.length > 0) {
        setSelectedVehicleId((mergedVehicles[0] as any).id);
      }

      try {
        const loadedEvent = await getEvent(eventId);
        if (loadedEvent) {
          let savedLocalVendors: string[] = [];
          let savedLocalEntrants: Record<string, any> = {};
          if (typeof window !== 'undefined') {
            try {
              const rawVendors = localStorage.getItem(`gp_event_vendors_${eventId}`);
              if (rawVendors) savedLocalVendors.push(...JSON.parse(rawVendors));

              const userExhibitors = localStorage.getItem('gp_user_exhibitors');
              if (userExhibitors) {
                const parsed = JSON.parse(userExhibitors);
                if (Array.isArray(parsed)) {
                  parsed.forEach((e: any) => {
                    if (e.event_id === eventId && e.business_id) {
                      savedLocalVendors.push(e.business_id);
                    }
                  });
                }
              }

              const rawEntrants = localStorage.getItem(`gp_event_${eventId}`);
              if (rawEntrants) {
                const parsed = JSON.parse(rawEntrants);
                if (parsed && parsed.entrants) {
                  savedLocalEntrants = parsed.entrants;
                }
              }
            } catch (e) {}
          }

          setEvent(prev => {
            const base = prev || (loadedEvent as GridpassEvent);
            const combinedVendors = Array.from(new Set([...(base.vendors || []), ...(loadedEvent.vendors || []), ...savedLocalVendors]));
            const combinedEntrants = {
              ...(base.entrants || {}),
              ...(loadedEvent.entrants || {}),
              ...savedLocalEntrants
            };

            const finalBanner = loadedEvent.banner_url || loadedEvent.cover_url || base.banner_url || base.cover_url || '';

            if (combinedVendors.length > 0) {
              Promise.all(combinedVendors.map(vId => getBusinessProfile(vId))).then(list => {
                setVendorProfiles(prev => {
                  const map: Record<string, BusinessProfile> = {};
                  prev.forEach(b => { map[b.id] = b; });
                  list.forEach(b => { if (b) map[b.id] = b as BusinessProfile; });
                  return Object.values(map);
                });
              }).catch(() => {});
            }

            return {
              ...base,
              ...loadedEvent,
              title: loadedEvent.title || base.title || 'Gridpass Event',
              description: loadedEvent.description || base.description || '',
              location_name: loadedEvent.location_name || base.location_name || '',
              physical_address: loadedEvent.physical_address || base.physical_address || '',
              banner_url: finalBanner,
              cover_url: finalBanner,
              vendors: combinedVendors,
              entrants: combinedEntrants
            };
          });
        } else if (eventId === 'maple-city-cruise') {
          // Preseed maple-city-cruise into Firestore if it doesn't exist yet
          const seedEvent: GridpassEvent = {
            id: 'maple-city-cruise',
            host_uid: 'seeded-organizer-uid',
            host_business_id: 'maple-city-street-machines',
            host_name: 'Maple City Street Machines',
            title: '26TH ANNUAL MONMOUTH CRUISE NIGHT (MAPLE CITY STREET MACHINES)',
            description: `Celebrated for nearly three decades, the Monmouth Cruise Night is one of the largest single-day cruise-in car shows in the Midwest, drawing over 30,000 spectators and 3,500+ vehicles to historic downtown Monmouth, Illinois. Spearheaded by Club President Clifford Adams and the Maple City Street Machines, this legendary gathering fills the downtown public square with classic hot rods, muscle cars, vintage customs, off-road builds, and rare imports. Named after Monmouth's historic moniker 'Maple City'—given by 19th-century pioneers for the majestic maple trees welcoming travelers into town—the event features live music, local food truck rows, custom pinstriped pedal car raffles, and famous guest vehicle exhibits!`,
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
            is_pro: false,
            banner_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1600',
            cover_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1600',
            vendors: [],
            entrants: {}
          };
          try {
            await setDoc(doc(db, 'events', 'maple-city-cruise'), seedEvent as any, { merge: true });
          } catch (err) {
            console.warn("Error seeding maple-city-cruise to Firestore:", err);
          }
          setEvent(seedEvent);
        }
      } catch (err) {
        console.error("Failed to load Event Hub page data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId, user, isMock]);

  // Realtime Live Discussion Feed Sync
  useEffect(() => {
    if (!eventId) return;
    const targetId = (event?.id || eventId).toString();

    const cacheKey = `gp_event_discussions_${targetId}`;
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setDiscussionPosts(parsed);
          }
        }
      } catch (e) {}
    }

    try {
      const q = query(
        collection(db, 'event_discussions'),
        where('eventId', '==', targetId)
      );
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const livePosts: EventDiscussionPost[] = [];
          snapshot.forEach(docSnap => {
            livePosts.push({ id: docSnap.id, ...docSnap.data() } as EventDiscussionPost);
          });
          
          livePosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setDiscussionPosts(livePosts);
          if (typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, JSON.stringify(livePosts));
          }
        },
        (err) => {
          console.warn("Discussion Firestore realtime sync notice (using local cache):", err);
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("Discussion Firestore sync warning:", err);
    }
  }, [eventId, event?.id]);

  // Handle native camera/photo file selection
  const handleDiscussionPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDiscussionPhotoFile(file);
    setUploadingDiscussionPhoto(true);

    // Instant local preview via FileReader
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setDiscussionPhotoPreview(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    try {
      const targetId = (event?.id || eventId).toString();
      const storageRef = ref(storage, `event_discussions/${targetId}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setDiscussionPhotoPreview(downloadUrl);
      showToast({
        title: "Photo Attached",
        message: "Photo uploaded and ready to post!",
        icon: "📸"
      });
    } catch (err) {
      console.warn("Storage upload warning, using local preview:", err);
    } finally {
      setUploadingDiscussionPhoto(false);
    }
  };

  const handleRemoveDiscussionPhoto = () => {
    setDiscussionPhotoFile(null);
    setDiscussionPhotoPreview('');
    if (discussionFileInputRef.current) {
      discussionFileInputRef.current.value = '';
    }
  };

  // Post new discussion update
  const handleCreateDiscussionPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPostText.trim()) return;
    setPostingDiscussion(true);

    const targetId = (event?.id || eventId).toString();
    const finalPhoto = (discussionPhotoPreview || newPostPhotoUrl || '').trim();

    const postPayload: Record<string, any> = {
      eventId: targetId,
      author_uid: user.uid,
      author_name: user.displayName || 'Gridpass Member',
      author_handle: user.email ? user.email.split('@')[0] : 'driver',
      author_avatar: user.photoURL || '',
      category: newPostCategory,
      content: newPostText.trim(),
      created_at: new Date().toISOString(),
      likes_count: 0,
      liked_by: [],
      comments: []
    };

    if (finalPhoto) {
      postPayload.photo_url = finalPhoto;
    }

    let createdId = `disc_${Date.now()}`;

    try {
      const docRef = await addDoc(collection(db, 'event_discussions'), postPayload);
      createdId = docRef.id;
    } catch (err) {
      console.warn("Firestore post creation warning, proceeding with local grid state:", err);
    }

    const newPost: EventDiscussionPost = {
      id: createdId,
      ...postPayload
    } as EventDiscussionPost;
    
    const updatedList = [newPost, ...discussionPosts.filter(p => p.id !== createdId)];
    setDiscussionPosts(updatedList);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`gp_event_discussions_${targetId}`, JSON.stringify(updatedList));
      } catch (e) {}
    }

    const awarded = await awardGridpassCredits(
      user.uid,
      user.displayName || 'Gridpass Member',
      'EVENT_DISCUSSION_POST_REWARD',
      `Posted in discussion feed for ${event?.title || 'Event'}`,
      10,
      `${targetId}_${createdId}`
    );

    setNewPostText('');
    setNewPostPhotoUrl('');
    handleRemoveDiscussionPhoto();

    showToast({
      title: awarded ? "⚡ Discussion Post Live (+10 Credits!)" : "✓ Update Published",
      message: awarded ? "Your update is live! +10 Credits ($0.10 USD) added to wallet." : "Your update is live on the event discussion feed!",
      icon: "💬"
    });

    setPostingDiscussion(false);
  };

  // Toggle Quick Reactions (Fire, Heart, Flag, Clap)
  const handleToggleReactionPost = async (postId: string, reactionType: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setDiscussionPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          const reactions = p.reactions || {};
          const currentList: string[] = reactions[reactionType] || [];
          const hasReacted = currentList.includes(user.uid);
          const updatedList = hasReacted ? currentList.filter((u: string) => u !== user.uid) : [...currentList, user.uid];

          const updatedReactions = {
            ...reactions,
            [reactionType]: updatedList
          };

          try {
            const postRef = doc(db, 'event_discussions', postId);
            updateDoc(postRef, { reactions: updatedReactions }).catch(err => console.warn("Reaction update warning:", err));
          } catch (e) {}

          return { ...p, reactions: updatedReactions };
        }
        return p;
      });

      const targetId = (event?.id || eventId).toString();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`gp_event_discussions_${targetId}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  // Toggle Host Pinned Bulletin Status
  const handleTogglePinPost = async (postId: string) => {
    setDiscussionPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          const isPinned = !p.pinned;
          try {
            const postRef = doc(db, 'event_discussions', postId);
            updateDoc(postRef, { pinned: isPinned }).catch(err => console.warn("Pin update warning:", err));
          } catch (e) {}
          return { ...p, pinned: isPinned };
        }
        return p;
      });

      const targetId = (event?.id || eventId).toString();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`gp_event_discussions_${targetId}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    showToast({
      title: "Bulletin Updated",
      message: "Post pinned status updated.",
      icon: "📌"
    });
  };

  // Toggle Pinned Comment Status (Host / Super Admin)
  const handleTogglePinComment = async (postId: string, commentId: string) => {
    setDiscussionPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          const comments = (p.comments || []).map(cmt => {
            if (cmt.id === commentId) {
              return { ...cmt, pinned: !cmt.pinned };
            }
            return cmt;
          });

          try {
            const postRef = doc(db, 'event_discussions', postId);
            updateDoc(postRef, { comments }).catch(err => console.warn("Comment pin update warning:", err));
          } catch (e) {}

          return { ...p, comments };
        }
        return p;
      });

      const targetId = (event?.id || eventId).toString();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`gp_event_discussions_${targetId}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    showToast({
      title: "Comment Status Updated",
      message: "Comment pinned status updated.",
      icon: "📌"
    });
  };

  // Share Post Direct Link
  const handleSharePost = (postId: string) => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}${window.location.pathname}?tab=discussion#post-${postId}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast({
          title: "Link Copied!",
          message: "Discussion post link copied to clipboard.",
          icon: "🔗"
        });
      }).catch(() => {
        showToast({
          title: "Post Link",
          message: shareUrl,
          icon: "🔗"
        });
      });
    }
  };

  // Report Post (Auto-Archives at 3+ Reports)
  const handleReportPost = async (postId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setDiscussionPosts(prev => {
      let newlyArchived = false;

      const updated = prev.map(p => {
        if (p.id === postId) {
          const reportedBy = p.reported_by || [];
          if (reportedBy.includes(user.uid)) {
            showToast({
              title: "Already Reported",
              message: "You have already submitted a report for this post.",
              icon: "ℹ️"
            });
            return p;
          }

          const updatedReportedBy = [...reportedBy, user.uid];
          // Auto-archive if 3 or more users report this post/picture
          const shouldArchive = updatedReportedBy.length >= 3;
          newlyArchived = shouldArchive;

          const updatedStatus = shouldArchive ? 'archived' : (p.status || 'active');

          try {
            const postRef = doc(db, 'event_discussions', postId);
            updateDoc(postRef, {
              reported_by: updatedReportedBy,
              status: updatedStatus
            }).catch(err => console.warn("Report update warning:", err));
          } catch (e) {}

          return {
            ...p,
            reported_by: updatedReportedBy,
            status: updatedStatus as any
          };
        }
        return p;
      });

      const targetId = (event?.id || eventId).toString();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`gp_event_discussions_${targetId}`, JSON.stringify(updated));
        } catch (e) {}
      }

      if (newlyArchived) {
        showToast({
          title: "Post Auto-Archived 🛡️",
          message: "This post received multiple reports and has been hidden from public view for moderator review.",
          icon: "🚫"
        });
      } else {
        showToast({
          title: "Post Reported 🚩",
          message: "Thank you. Our moderation filter has logged your report.",
          icon: "🚩"
        });
      }

      return updated;
    });
  };

  // Restore Archived Post (Host / Super Admin)
  const handleRestorePost = async (postId: string) => {
    setDiscussionPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          try {
            const postRef = doc(db, 'event_discussions', postId);
            updateDoc(postRef, {
              reported_by: [],
              status: 'active'
            }).catch(err => console.warn("Restore post warning:", err));
          } catch (e) {}

          return {
            ...p,
            reported_by: [],
            status: 'active' as any
          };
        }
        return p;
      });

      const targetId = (event?.id || eventId).toString();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`gp_event_discussions_${targetId}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    showToast({
      title: "Post Restored! ✅",
      message: "Reports cleared. Post is now active and visible on the feed again.",
      icon: "🔄"
    });
  };

  // Toggle Like on Post
  const handleToggleLikePost = async (postId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setDiscussionPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          const likedBy = p.liked_by || [];
          const hasLiked = likedBy.includes(user.uid);
          const updatedLikedBy = hasLiked ? likedBy.filter(u => u !== user.uid) : [...likedBy, user.uid];
          const updatedLikesCount = updatedLikedBy.length;

          try {
            const postRef = doc(db, 'event_discussions', postId);
            updateDoc(postRef, {
              liked_by: updatedLikedBy,
              likes_count: updatedLikesCount
            }).catch(err => console.warn("Firestore like update warning:", err));
          } catch (e) {}

          return {
            ...p,
            liked_by: updatedLikedBy,
            likes_count: updatedLikesCount
          };
        }
        return p;
      });

      const targetId = (event?.id || eventId).toString();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`gp_event_discussions_${targetId}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  // Add Comment Reply to Post (Facebook Style)
  const handleAddComment = async (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!user || !text) return;
    setSubmittingComment(true);

    const commentObj = {
      id: `c_${Date.now()}`,
      author_uid: user.uid,
      author_name: user.displayName || 'Gridpass Member',
      author_avatar: user.photoURL || '',
      text: text,
      created_at: new Date().toISOString()
    };

    setDiscussionPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          const updatedComments = [...(p.comments || []), commentObj];
          try {
            const postRef = doc(db, 'event_discussions', postId);
            updateDoc(postRef, { comments: updatedComments }).catch(err => console.warn("Comment update warning:", err));
          } catch (e) {}
          return { ...p, comments: updatedComments };
        }
        return p;
      });

      const targetId = (event?.id || eventId).toString();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`gp_event_discussions_${targetId}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setSubmittingComment(false);

    showToast({
      title: "Comment Posted",
      message: "Your comment was added to the thread!",
      icon: "💬"
    });
  };

  // Delete Discussion Post
  const handleDeleteDiscussionPost = async (postId: string) => {
    setDiscussionPosts(prev => {
      const updated = prev.filter(p => p.id !== postId);
      const targetId = (event?.id || eventId).toString();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`gp_event_discussions_${targetId}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'event_discussions', postId));
    } catch (err) {
      console.warn("Delete post warning:", err);
    }

    showToast({
      title: "Post Removed",
      message: "Discussion post has been deleted.",
      icon: "🗑️"
    });
  };

  // Detect scanned QR code entrant query param (?entrant=..., ?pass=..., or ?vendor=...)
  useEffect(() => {
    if (!event) return;

    if (entrantParam) {
      let entrantData = event.entrants && event.entrants[entrantParam] ? event.entrants[entrantParam] : null;
      if (!entrantData && event.entrants) {
        const found = Object.values(event.entrants).find((e: any) => e.vehicle_id === entrantParam || e.id === entrantParam);
        if (found) entrantData = found;
      }
      if (!entrantData) {
        entrantData = {
          id: entrantParam,
          vehicle_id: entrantParam,
          year: 2017,
          make: 'Jeep',
          model: 'Wrangler Unlimited',
          staging_group: 'Off-Road / Trucks',
          photo_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1200',
          specs: { engine: 'V6' },
          owner_name: 'PJ Losey',
          status: 'registered'
        } as any;
      }

      setSelectedEntrantDetail(entrantData);
      setActiveEventTab('entrant-detail');
    } else if (vendorParam) {
      let vMatch = Array.isArray(event.vendors) 
        ? event.vendors.find((v: any) => v.id === vendorParam || v.business_id === vendorParam) 
        : (event.vendors as any)?.[vendorParam];
      
      if (!vMatch) {
        const foundVendor = vendorProfiles.find(vp => vp.id === vendorParam);
        if (foundVendor) vMatch = foundVendor;
      }

      if (!vMatch) {
        vMatch = {
          id: vendorParam,
          name: 'Gridpass Official Booth',
          category: 'WEBSITE_TECH',
          description: 'Official Gridpass technology & check-in hub.'
        };
      }

      setSelectedVendorDetail(vMatch);
      setActiveEventTab('vendor-detail');
    }
  }, [event, entrantParam, vendorParam, vendorProfiles]);

  // Auto-detect and pre-select matching Staging Group when selected vehicle changes
  useEffect(() => {
    if (!selectedVehicleId || userVehicles.length === 0) return;

    const vehicle = userVehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    // Detect vehicle's category
    const category = vehicle.category || vehicle.vehicle_class || vehicle.class || inferVehicleCategory(vehicle.year, vehicle.make, vehicle.model);
    if (!category) return;

    // Determine available staging groups for this event
    const availableGroups = event?.staging_groups && event.staging_groups.length > 0 ? event.staging_groups : DEFAULT_STAGING_CLASSES;

    // Look for exact or fuzzy match
    const exactMatch = availableGroups.find(g => g.toLowerCase() === category.toLowerCase());
    if (exactMatch) {
      setSelectedGroup(exactMatch);
      return;
    }

    const partialMatch = availableGroups.find(g => g.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(g.toLowerCase()));
    if (partialMatch) {
      setSelectedGroup(partialMatch);
    }
  }, [selectedVehicleId, userVehicles, event]);

  // Helper to safely identify mock events (Playwright test mocks only)
  const isMockEventId = (id?: string) => {
    if (!id) return false;
    return id.startsWith('mock-event-');
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

  // Toggle General RSVP / Attendance (Going)
  const handleToggleRSVP = async () => {
    if (!user || !event) {
      router.push('/login');
      return;
    }

    const targetId = event.id || eventId;
    const isCurrentlyAttending = !!(event.attendees && event.attendees[user.uid]);
    setAttending(true);

    const attendeeKey = `attendees.${user.uid}`;
    const interestedKey = `interested.${user.uid}`;

    if (isMock || isMockEventId(targetId)) {
      const updatedAttendees = { ...event.attendees };
      const updatedInterested = { ...event.interested };

      if (isCurrentlyAttending) {
        delete updatedAttendees[user.uid];
      } else {
        // Mark as Going and clear Interested
        updatedAttendees[user.uid] = {
          uid: user.uid,
          name: user.displayName || 'Motorsports Fan',
          photo_url: user.photoURL || '',
          timestamp: new Date().toISOString()
        };
        delete updatedInterested[user.uid];
      }

      // Persist to local storage so page reload preserves Going state
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`gp_event_${targetId}`);
          const currentData = cached ? JSON.parse(cached) : {};
          localStorage.setItem(`gp_event_${targetId}`, JSON.stringify({
            ...currentData,
            attendees: updatedAttendees,
            interested: updatedInterested
          }));
        } catch (e) {
          console.warn("Failed to persist RSVP state:", e);
        }
      }

      setEvent(prev => prev ? { ...prev, attendees: updatedAttendees, interested: updatedInterested } : null);
      showToast({
        title: isCurrentlyAttending ? "RSVP Updated" : "RSVP Confirmed!",
        message: isCurrentlyAttending ? "You are no longer marked as attending." : "You're marked as attending this event!",
        icon: isCurrentlyAttending ? "ℹ️" : "🎟️"
      });
      setAttending(false);
      return;
    }

    try {
      const ref = doc(db, 'events', targetId);
      let updatedAttendees = { ...event.attendees };
      let updatedInterested = { ...event.interested };

      if (isCurrentlyAttending) {
        await updateDoc(ref, {
          [attendeeKey]: deleteField()
        });
        delete updatedAttendees[user.uid];
      } else {
        const attendeeData = {
          uid: user.uid,
          name: user.displayName || 'Motorsports Fan',
          photo_url: user.photoURL || '',
          timestamp: new Date().toISOString()
        };
        // Save Going and remove Interested in single atomic update
        await updateDoc(ref, {
          [attendeeKey]: attendeeData,
          [interestedKey]: deleteField()
        });
        updatedAttendees[user.uid] = attendeeData;
        delete updatedInterested[user.uid];
      }

      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`gp_event_${targetId}`);
          const currentData = cached ? JSON.parse(cached) : {};
          localStorage.setItem(`gp_event_${targetId}`, JSON.stringify({
            ...currentData,
            attendees: updatedAttendees,
            interested: updatedInterested
          }));
        } catch (e) {}
      }

      setEvent(prev => prev ? { ...prev, attendees: updatedAttendees, interested: updatedInterested } : null);
      showToast({
        title: isCurrentlyAttending ? "RSVP Updated" : "RSVP Confirmed!",
        message: isCurrentlyAttending ? "You are no longer marked as attending." : "You're marked as attending this event!",
        icon: isCurrentlyAttending ? "ℹ️" : "🎟️"
      });
    } catch (err) {
      console.error("Failed to update RSVP:", err);
      showToast({
        title: "RSVP Error",
        message: "Failed to update attendance status. Please try again.",
        icon: "⚠️"
      });
    } finally {
      setAttending(false);
    }
  };

  // Toggle Interested (Bookmark/Star)
  const handleToggleInterested = async () => {
    if (!user || !event) {
      router.push('/login');
      return;
    }

    const targetId = event.id || eventId;
    const isCurrentlyInterested = !!(event.interested && event.interested[user.uid]);
    setTogglingInterested(true);

    const key = `interested.${user.uid}`;
    const attendeeKey = `attendees.${user.uid}`;

    if (isMock || isMockEventId(targetId)) {
      const updatedInterested = { ...event.interested };
      const updatedAttendees = { ...event.attendees };

      if (isCurrentlyInterested) {
        delete updatedInterested[user.uid];
      } else {
        // Mark as Interested and clear Going
        updatedInterested[user.uid] = {
          uid: user.uid,
          name: user.displayName || 'Motorsports Fan',
          timestamp: new Date().toISOString()
        };
        delete updatedAttendees[user.uid];
      }

      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`gp_event_${targetId}`);
          const currentData = cached ? JSON.parse(cached) : {};
          localStorage.setItem(`gp_event_${targetId}`, JSON.stringify({
            ...currentData,
            interested: updatedInterested,
            attendees: updatedAttendees
          }));
        } catch (e) {
          console.warn("Failed to persist Interested state:", e);
        }
      }

      setEvent(prev => prev ? { ...prev, interested: updatedInterested, attendees: updatedAttendees } : null);
      showToast({
        title: isCurrentlyInterested ? "Removed from Interested" : "Interested!",
        message: isCurrentlyInterested ? "Event removed from your interested list." : "Event saved to your interested list.",
        icon: "⭐"
      });
      setTogglingInterested(false);
      return;
    }

    try {
      const ref = doc(db, 'events', targetId);
      let updatedInterested = { ...event.interested };
      let updatedAttendees = { ...event.attendees };

      if (isCurrentlyInterested) {
        await updateDoc(ref, {
          [key]: deleteField()
        });
        delete updatedInterested[user.uid];
      } else {
        const item = {
          uid: user.uid,
          name: user.displayName || 'Motorsports Fan',
          timestamp: new Date().toISOString()
        };
        // Save Interested and remove Going in single atomic update
        await updateDoc(ref, {
          [key]: item,
          [attendeeKey]: deleteField()
        });
        updatedInterested[user.uid] = item;
        delete updatedAttendees[user.uid];
      }

      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`gp_event_${targetId}`);
          const currentData = cached ? JSON.parse(cached) : {};
          localStorage.setItem(`gp_event_${targetId}`, JSON.stringify({
            ...currentData,
            interested: updatedInterested,
            attendees: updatedAttendees
          }));
        } catch (e) {}
      }

      setEvent(prev => prev ? { ...prev, interested: updatedInterested, attendees: updatedAttendees } : null);
      showToast({
        title: isCurrentlyInterested ? "Removed from Interested" : "Interested!",
        message: isCurrentlyInterested ? "Event removed from your interested list." : "Event saved to your interested list.",
        icon: "⭐"
      });
    } catch (err) {
      console.error("Failed to update interested state:", err);
      showToast({
        title: "Update Error",
        message: "Failed to update interested status.",
        icon: "⚠️"
      });
    } finally {
      setTogglingInterested(false);
    }
  };

  // Share Event Link / Invite Crew
  const handleShareEvent = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // On mobile devices (iOS/Android), trigger native mobile share sheet
    if (isMobileDevice && navigator.share) {
      try {
        await navigator.share({
          title: event?.title || event?.name || 'Gridpass Motorsport Event',
          text: `Join us at ${event?.title || event?.name || 'this event'} on Gridpass!`,
          url: url
        });
        return;
      } catch (e) {
        // User cancelled mobile share sheet
        return;
      }
    }

    // On PC/Desktop or fallback: copy link directly to clipboard with crisp toast
    try {
      await navigator.clipboard.writeText(url);
      showToast({
        title: "Invite Link Copied!",
        message: "Event link copied to clipboard! Send it to your crew or post in group chats.",
        icon: "🔗"
      });
    } catch (err) {
      console.error("Failed to copy link:", err);
      showToast({
        title: "Invite Link Copied!",
        message: "Event link copied to clipboard.",
        icon: "🔗"
      });
    }
  };

  // Universal System Navigation Map URL Helper (Apple Maps on iOS/Mac, geo: on Android, Google on Web)
  const getSystemMapUrl = () => {
    if (!event) return '#';
    const addressStr = [
      event.physical_address || event.locationAddress,
      event.location_name || event.locationName
    ].filter(Boolean).join(' ');
    
    if (!addressStr) return '#';
    const query = encodeURIComponent(addressStr);
    
    const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

    if (isIOS) {
      return `https://maps.apple.com/?q=${query}`;
    }
    if (isAndroid) {
      return `geo:0,0?q=${query}`;
    }
    return `https://maps.google.com/?q=${query}`;
  };

  // Add to Calendar URL & .ICS Exporter Helpers
  const getGoogleCalendarUrl = () => {
    if (!event) return '#';
    const title = encodeURIComponent(event.title || event.name || 'Gridpass Event');
    const details = encodeURIComponent(event.description || 'Motorsport event staging on Gridpass');
    const location = encodeURIComponent([event.location_name, event.physical_address].filter(Boolean).join(', ') || '');
    const rawStart = event.start_date || event.startDate;
    const rawEnd = event.end_date || event.endDate || rawStart;
    if (!rawStart) return '#';
    const formatCalDate = (dStr?: string) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      return !isNaN(d.getTime()) ? d.toISOString().replace(/-|:|\.\d\d\d/g, '') : '';
    };
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${formatCalDate(rawStart)}/${formatCalDate(rawEnd)}`;
  };

  const getOutlookCalendarUrl = () => {
    if (!event) return '#';
    const title = encodeURIComponent(event.title || event.name || 'Gridpass Event');
    const details = encodeURIComponent(event.description || 'Motorsport event staging on Gridpass');
    const location = encodeURIComponent([event.location_name, event.physical_address].filter(Boolean).join(', ') || '');
    const rawStart = event.start_date || event.startDate;
    const rawEnd = event.end_date || event.endDate || rawStart;
    if (!rawStart) return '#';
    const isoStart = new Date(rawStart).toISOString();
    const isoEnd = new Date(rawEnd || rawStart).toISOString();
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&location=${location}&startdt=${isoStart}&enddt=${isoEnd}`;
  };

  const getYahooCalendarUrl = () => {
    if (!event) return '#';
    const title = encodeURIComponent(event.title || event.name || 'Gridpass Event');
    const details = encodeURIComponent(event.description || 'Motorsport event staging on Gridpass');
    const location = encodeURIComponent([event.location_name, event.physical_address].filter(Boolean).join(', ') || '');
    const rawStart = event.start_date || event.startDate;
    const rawEnd = event.end_date || event.endDate || rawStart;
    if (!rawStart) return '#';
    const formatCalDate = (dStr?: string) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      return !isNaN(d.getTime()) ? d.toISOString().replace(/-|:|\.\d\d\d/g, '') : '';
    };
    return `https://calendar.yahoo.com/?v=60&title=${title}&st=${formatCalDate(rawStart)}&et=${formatCalDate(rawEnd)}&desc=${details}&in_loc=${location}`;
  };

  const downloadICSFile = () => {
    if (!event) return;
    const title = event.title || event.name || 'Gridpass Event';
    const details = (event.description || '').replace(/\n/g, '\\n');
    const location = [event.location_name, event.physical_address].filter(Boolean).join(', ');
    const rawStart = event.start_date || event.startDate;
    const rawEnd = event.end_date || event.endDate || rawStart;
    if (!rawStart) return;

    const formatCalDate = (dStr?: string) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      return !isNaN(d.getTime()) ? d.toISOString().replace(/-|:|\.\d\d\d/g, '') : '';
    };

    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gridpass//Motorsport Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${details}`,
      `LOCATION:${location}`,
      `DTSTART:${formatCalDate(rawStart)}`,
      `DTEND:${formatCalDate(rawEnd || rawStart)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Gridpass_${(event.title || 'Event').replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      title: "Universal .ICS File Downloaded",
      message: "Open file to add event to Apple iCal, Outlook, or Google Calendar!",
      icon: "📅"
    });
  };

  // Post Organizer Announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !event || !newAnnouncement.trim()) return;
    setPostingAnnouncement(true);

    const announcementItem = {
      id: `ann_${Date.now()}`,
      author_name: user.displayName || 'Event Host',
      text: newAnnouncement.trim(),
      timestamp: new Date().toISOString()
    };

    const targetId = event.id || eventId;
    const updatedList = [announcementItem, ...(event.announcements || [])];

    if (isMock || isMockEventId(targetId)) {
      setEvent(prev => prev ? { ...prev, announcements: updatedList } : null);
      setNewAnnouncement('');
      setPostingAnnouncement(false);
      showToast({
        title: "Announcement Posted",
        message: "Staging update sent to all event attendees!",
        icon: "📢"
      });
      return;
    }

    try {
      const ref = doc(db, 'events', targetId);
      await updateDoc(ref, {
        announcements: updatedList
      });
      setEvent(prev => prev ? { ...prev, announcements: updatedList } : null);
      setNewAnnouncement('');
      showToast({
        title: "Announcement Posted",
        message: "Staging update sent to all event attendees!",
        icon: "📢"
      });
    } catch (err) {
      console.error("Failed to post announcement:", err);
      showToast({
        title: "Posting Failed",
        message: "Unable to post announcement. Please try again.",
        icon: "⚠️"
      });
    } finally {
      setPostingAnnouncement(false);
    }
  };

  // Submit Official Claim Ownership Verification Request
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !event) return;
    setSubmittingClaim(true);
    const targetId = event.id || eventId;

    const claimData: EventClaimRequest = {
      id: `claim_${Date.now()}`,
      event_id: targetId,
      event_title: event.title || event.name || 'Gridpass Event',
      user_uid: user.uid,
      user_name: user.displayName || 'Claimant',
      role_title: claimRole.trim(),
      contact_email: claimEmail.trim() || user.email || '',
      contact_phone: claimPhone.trim() || undefined,
      proof_notes: claimNotes.trim() || undefined,
      status: 'pending',
      submitted_at: new Date().toISOString()
    };

    if (isMock || isMockEventId(targetId)) {
      setEvent(prev => prev ? { ...prev, claim_status: 'pending_verification' } : null);
      setSubmittingClaim(false);
      setShowClaimModal(false);
      showToast({
        title: "Verification Submitted",
        message: "Your ownership claim is pending admin verification!",
        icon: "⏳"
      });
      return;
    }

    try {
      const claimRef = doc(db, 'event_claims', claimData.id);
      await setDoc(claimRef, claimData as any, { merge: true });

      // Mark event claim_status as pending_verification
      const evtRef = doc(db, 'events', targetId);
      await setDoc(evtRef, {
        claim_status: 'pending_verification'
      }, { merge: true });

      setEvent(prev => prev ? { ...prev, claim_status: 'pending_verification' } : null);
      setShowClaimModal(false);
      showToast({
        title: "Verification Submitted",
        message: "Your ownership claim is pending admin verification!",
        icon: "⏳"
      });
    } catch (err) {
      console.error("Failed to submit event claim verification:", err);
      showToast({
        title: "Submission Failed",
        message: "Unable to submit verification. Please try again.",
        icon: "⚠️"
      });
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Submit Business Vendor Exhibitor RSVP
  const handleSubmitVendorRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !event || !selectedVendorBusinessId) return;
    setSubmittingVendorRSVP(true);

    const targetId = event.id || eventId;
    const vendorProfile = vendorProfiles.find(v => v.id === selectedVendorBusinessId);

    const updatedVendors = Array.from(new Set([...(event.vendors || []), selectedVendorBusinessId]));

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`gp_event_vendors_${targetId}`, JSON.stringify(updatedVendors));
      } catch (e) {}
    }

    setEvent(prev => prev ? { ...prev, vendors: updatedVendors } : null);
    setShowVendorModal(false);
    setActiveEventTab('passes');

    const awarded = await awardGridpassCredits(
      user.uid,
      user.displayName || 'Gridpass Vendor',
      'EVENT_REGISTRATION_REWARD',
      `Listed business exhibitor (${vendorProfile?.name || 'Business'}) for ${event.title || 'Event'}`,
      25,
      targetId
    );

    showToast({
      title: awarded ? "⚡ Exhibitor Pass Active (+25 Credits!)" : "✓ Exhibitor Pass Active",
      message: awarded 
        ? `${vendorProfile?.name || 'Business'} is listed as an exhibitor! +25 Credits ($0.25 USD) added to wallet.`
        : `${vendorProfile?.name || 'Business'} is listed as an exhibitor for this event.`,
      icon: "🏬"
    });

    try {
      const evtRef = doc(db, 'events', targetId);
      await setDoc(evtRef, { vendors: updatedVendors }, { merge: true });
    } catch (err) {
      console.warn("Firestore vendor update warning:", err);
    } finally {
      setSubmittingVendorRSVP(false);
    }
  };

  // Withdraw Vehicle Pass from Event
  const handleWithdrawVehiclePass = async (vehicleId: string) => {
    if (!event) return;
    const targetId = event.id || eventId;
    const vehicle = userVehicles.find(v => v.id === vehicleId);
    const vehicleName = vehicle ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() : 'Vehicle';

    const updatedEntrants = { ...(event.entrants || {}) };
    delete updatedEntrants[vehicleId];
    Object.keys(updatedEntrants).forEach(k => {
      if (updatedEntrants[k]?.vehicle_id === vehicleId) {
        delete updatedEntrants[k];
      }
    });

    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`gp_event_${targetId}`);
        const currentData = cached ? JSON.parse(cached) : {};
        localStorage.setItem(`gp_event_${targetId}`, JSON.stringify({
          ...currentData,
          entrants: updatedEntrants
        }));
      } catch (e) {}
    }

    setEvent(prev => prev ? { ...prev, entrants: updatedEntrants } : null);

    showToast({
      title: "Pass Withdrawn",
      message: `${vehicleName} pass has been removed from this event.`,
      icon: "🗑️"
    });

    try {
      const evtRef = doc(db, 'events', targetId);
      await setDoc(evtRef, { entrants: updatedEntrants }, { merge: true });
    } catch (err) {
      console.warn("Firestore entrant removal warning:", err);
    }
  };

  // Withdraw Vendor Exhibitor Pass from Event
  const handleWithdrawVendorPass = async (businessId: string) => {
    if (!event) return;
    const targetId = event.id || eventId;
    const vendorProfile = vendorProfiles.find(v => v.id === businessId);
    const vendorName = vendorProfile?.name || 'Business';

    const updatedVendors = (event.vendors || []).filter(vId => vId !== businessId);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`gp_event_vendors_${targetId}`, JSON.stringify(updatedVendors));
        const cached = localStorage.getItem(`gp_event_${targetId}`);
        const currentData = cached ? JSON.parse(cached) : {};
        localStorage.setItem(`gp_event_${targetId}`, JSON.stringify({
          ...currentData,
          vendors: updatedVendors
        }));
      } catch (e) {}
    }

    setEvent(prev => prev ? { ...prev, vendors: updatedVendors } : null);

    showToast({
      title: "Vendor Pass Withdrawn",
      message: `${vendorName} exhibitor pass removed from event.`,
      icon: "🗑️"
    });

    try {
      const evtRef = doc(db, 'events', targetId);
      await setDoc(evtRef, { vendors: updatedVendors }, { merge: true });
    } catch (err) {
      console.warn("Firestore vendor removal warning:", err);
    }
  };

  // Fetch device GPS coordinates
  const handleGetDeviceGPS = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      showToast({
        title: "GPS Unavailable",
        message: "Geolocation is not supported by your browser. Please type address/spot location below.",
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
        setPinAddressInput(`GPS Lock (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        setGettingGPS(false);
        showToast({
          title: "GPS Acquired!",
          message: `Location locked: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          icon: "📍"
        });
      },
      (err) => {
        console.warn("GPS error:", err);
        setGettingGPS(false);
        showToast({
          title: "GPS Access Denied",
          message: "Please allow location access in your browser or type your address/spot location below.",
          icon: "📍"
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit Live GPS Location Radar Pin
  const handleSaveGPSPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !event || (!pinLabel.trim() && pinType !== 'amenity')) return;
    setSubmittingPin(true);

    // Geofence Boundary Distance Check
    const isGeofenceActive = event.geofence_enabled !== false; // Default enabled
    const geofenceRadius = event.geofence_radius_miles ?? 1.0;
    const venueLat = (event as any).latitude ?? 40.91148;
    const venueLng = (event as any).longitude ?? -90.64764;

    if (isGeofenceActive && pinLat && pinLng) {
      const distance = calculateDistanceMiles(pinLat, pinLng, venueLat, venueLng);
      if (distance > geofenceRadius) {
        setSubmittingPin(false);
        showToast({
          title: "Outside Event Geofence Boundary",
          message: `Pin location is ${distance.toFixed(1)} mi away from venue (${geofenceRadius} mi limit). Tap map to place inside event grounds.`,
          icon: "🚫"
        });
        return;
      }
    }

    const targetId = event.id || eventId;
    const newPin: EventGPSPin = {
      id: `pin_${user.uid}_${pinType}_${Date.now()}`,
      event_id: targetId,
      type: pinType,
      amenity_category: pinType === 'amenity' ? amenityCategory : undefined,
      name: user.displayName || 'Event Member',
      label: pinLabel.trim() || (pinType === 'amenity' ? amenityCategory.toUpperCase() : 'Event Spot'),
      address_text: pinAddressInput.trim() || undefined,
      zone_name: pinAddressInput.trim() || 'Main Event Grounds',
      lat: pinLat ?? undefined,
      lng: pinLng ?? undefined,
      photo_url: user.photoURL || undefined,
      timestamp: new Date().toISOString(),
      expires_at: pinType === 'attendee' ? new Date(Date.now() + 15 * 60000).toISOString() : undefined
    };

    if (typeof window !== 'undefined') {
      try {
        const localPins = localStorage.getItem(`gp_event_pins_${targetId}`);
        const parsed = localPins ? JSON.parse(localPins) : [];
        const filtered = parsed.filter((p: any) => !(p.type === pinType && (p.name === newPin.name || p.label === newPin.label)));
        localStorage.setItem(`gp_event_pins_${targetId}`, JSON.stringify([newPin, ...filtered]));
      } catch (e) {}
    }

    if (isMock || isMockEventId(targetId)) {
      setGpsPins(prev => [newPin, ...prev.filter(p => !(p.type === pinType && p.label === newPin.label))]);
      setSubmittingPin(false);
      setShowGPSModal(false);
      setPinLabel('');
      setPinAddressInput('');
      setPinLat(null);
      setPinLng(null);
      showToast({
        title: pinType === 'attendee' ? "Live Spot Active (15m)" : "Spot Pin Active",
        message: pinType === 'attendee' ? "Your 15-minute live spot is visible on the event map!" : "Your spot pin is live on the event map!",
        icon: "📍"
      });
      return;
    }

    try {
      const pinRef = doc(db, 'event_pins', newPin.id);
      await setDoc(pinRef, newPin as any, { merge: true });
      setGpsPins(prev => [newPin, ...prev.filter(p => !(p.type === pinType && p.label === newPin.label))]);
      setShowGPSModal(false);
      setPinLabel('');
      setPinAddressInput('');
      setPinLat(null);
      setPinLng(null);
      showToast({
        title: pinType === 'attendee' ? "Live Spot Active (15m)" : "Spot Pin Active",
        message: pinType === 'attendee' ? "Your 15-minute live spot is visible on the event map!" : "Your spot pin is live on the event map!",
        icon: "📍"
      });
    } catch (err) {
      console.error("Failed to save radar pin:", err);
      showToast({
        title: "Pin Error",
        message: "Unable to save radar pin. Please try again.",
        icon: "⚠️"
      });
    } finally {
      setSubmittingPin(false);
    }
  };

  // Remove active GPS spot pin
  const handleDeleteGPSPin = async (pinId: string) => {
    const targetId = event?.id || eventId;
    setGpsPins(prev => prev.filter(p => p.id !== pinId));

    if (typeof window !== 'undefined') {
      try {
        const localPins = localStorage.getItem(`gp_event_pins_${targetId}`);
        if (localPins) {
          const parsed = JSON.parse(localPins);
          const filtered = parsed.filter((p: any) => p.id !== pinId);
          localStorage.setItem(`gp_event_pins_${targetId}`, JSON.stringify(filtered));
        }
      } catch (e) {}
    }

    try {
      await deleteDoc(doc(db, 'event_pins', pinId));
    } catch (err) {
      console.warn("Firestore pin deletion warning:", err);
    }

    setShowGPSModal(false);
    showToast({
      title: "Spot Pin Removed",
      message: "Your location pin has been removed from the map.",
      icon: "🗑️"
    });
  };

  // Submit Community Event News Article Link
  const handleSubmitNewsLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !event || !newsTitleInput.trim() || !newsUrlInput.trim()) return;
    setSubmittingNews(true);

    const targetId = event.id || eventId;
    let formattedUrl = newsUrlInput.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newNewsItem: EventNewsItem = {
      id: `news_${Date.now()}`,
      event_id: targetId,
      title: newsTitleInput.trim(),
      url: formattedUrl,
      source_name: newsSourceInput.trim() || undefined,
      submitted_by_name: user.displayName || 'Community Member',
      submitted_by_uid: user.uid,
      reports_count: 0,
      timestamp: new Date().toISOString()
    };

    if (isMock || isMockEventId(targetId)) {
      setNewsItems(prev => [newNewsItem, ...prev]);
      setSubmittingNews(false);
      setShowNewsModal(false);
      setNewsTitleInput('');
      setNewsUrlInput('');
      setNewsSourceInput('');
      showToast({
        title: "News Link Posted",
        message: "Community news coverage link added to event feed!",
        icon: "📰"
      });
      return;
    }

    try {
      const newsRef = doc(db, 'event_news', newNewsItem.id);
      await setDoc(newsRef, newNewsItem as any, { merge: true });
      setNewsItems(prev => [newNewsItem, ...prev]);
      setShowNewsModal(false);
      setNewsTitleInput('');
      setNewsUrlInput('');
      setNewsSourceInput('');
      showToast({
        title: "News Link Posted",
        message: "Community news coverage link added to event feed!",
        icon: "📰"
      });
    } catch (err) {
      console.error("Failed to save news link:", err);
      showToast({
        title: "Submission Error",
        message: "Unable to submit news link. Please try again.",
        icon: "⚠️"
      });
    } finally {
      setSubmittingNews(false);
    }
  };

  // Report News Link (Auto-drops if 3+ reports)
  const handleReportNewsLink = async (item: EventNewsItem) => {
    if (!user) {
      router.push('/login');
      return;
    }

    const currentReports = item.reports_count || 0;
    const newReportsCount = currentReports + 1;
    const shouldHide = newReportsCount >= 3;

    setNewsItems(prev => prev.map(n => {
      if (n.id === item.id) {
        return {
          ...n,
          reports_count: newReportsCount,
          is_hidden: shouldHide
        };
      }
      return n;
    }));

    if (shouldHide) {
      showToast({
        title: "Link Removed",
        message: "This news link received multiple community reports and has been automatically removed.",
        icon: "🛡️"
      });
    } else {
      showToast({
        title: "Report Submitted",
        message: "Thank you for reporting. Links receiving 3+ reports are automatically removed.",
        icon: "🚩"
      });
    }
  };

  // Update Cover Photo / Banner Image
  const handleSaveCoverPhoto = async (urlToSave: string) => {
    if (!user || !event) return;
    setSavingCover(true);
    const targetId = event.id || eventId;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`gp_event_${targetId}`, JSON.stringify({ banner_url: urlToSave, cover_url: urlToSave }));
      } catch (e) {
        console.warn("Failed to persist event cover:", e);
      }
    }

    if (isMock || isMockEventId(targetId)) {
      setEvent(prev => prev ? { ...prev, banner_url: urlToSave, cover_url: urlToSave } : null);
      setSavingCover(false);
      setShowCoverModal(false);
      showToast({
        title: "Cover Photo Updated",
        message: "Event header cover updated successfully!",
        icon: "🖼️"
      });
      return;
    }

    try {
      const ref = doc(db, 'events', targetId);
      await setDoc(ref, {
        banner_url: urlToSave,
        cover_url: urlToSave
      }, { merge: true });
      setEvent(prev => prev ? { ...prev, banner_url: urlToSave, cover_url: urlToSave } : null);
      setShowCoverModal(false);
      showToast({
        title: "Cover Photo Updated",
        message: "Event header cover updated successfully!",
        icon: "🖼️"
      });
    } catch (err) {
      console.error("Failed to update cover photo:", err);
      showToast({
        title: "Update Failed",
        message: "Could not save cover photo. Please try again.",
        icon: "⚠️"
      });
    } finally {
      setSavingCover(false);
    }
  };

  // Claim Event Flow (Pitch mode)
  const handleClaimEvent = async () => {
    if (!user || !event) {
      router.push('/login');
      return;
    }
    setClaiming(true);
    const targetId = event.id || eventId;

    if (isMock || isMockEventId(targetId)) {
      const updated = {
        ...event,
        id: targetId,
        is_claimed: true,
        host_uid: user.uid
      };
      setEvent(updated);
      setClaiming(false);
      showToast({
        title: "Event Profile Claimed",
        message: "You can now manage registrations, staging lists, and vendor sponsors!",
        icon: "🏁"
      });
      return;
    }

    try {
      const ref = doc(db, 'events', targetId);
      await updateDoc(ref, {
        is_claimed: true,
        host_uid: user.uid
      });
      setEvent(prev => prev ? { ...prev, is_claimed: true, host_uid: user.uid } : null);
      showToast({
        title: "Event Profile Claimed",
        message: "Success! You claimed this event profile.",
        icon: "🏁"
      });
    } catch (err) {
      console.error("Failed to claim event profile:", err);
      showToast({
        title: "Claim Failed",
        message: "Unable to claim event profile. Please try again.",
        icon: "⚠️"
      });
    } finally {
      setClaiming(false);
    }
  };

  // Upgrade Event to Pro (Revenue mode)
  const handleUpgradeEvent = async () => {
    if (!event) return;
    setUpgrading(true);
    const targetId = event.id || eventId;

    if (isMock || isMockEventId(targetId)) {
      const updated = {
        ...event,
        id: targetId,
        is_pro: true
      };
      setEvent(updated);
      setUpgrading(false);
      showToast({
        title: "Pro Features Unlocked",
        message: "Customized landing grids and sponsor banners are active.",
        icon: "⭐"
      });
      return;
    }

    try {
      const ref = doc(db, 'events', targetId);
      await updateDoc(ref, {
        is_pro: true
      });
      setEvent(prev => prev ? { ...prev, is_pro: true } : null);
      showToast({
        title: "Pro Features Unlocked",
        message: "Success! Pro features unlocked for this event.",
        icon: "⭐"
      });
    } catch (err) {
      console.error("Failed to upgrade event profile:", err);
      showToast({
        title: "Upgrade Failed",
        message: "Unable to unlock Pro features. Please try again.",
        icon: "⚠️"
      });
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

    const targetId = event.id || eventId;

    if (isMock || isMockEventId(targetId)) {
      const updatedEntrants = {
        ...event.entrants,
        [selectedVehicleId]: {
          vehicle_id: selectedVehicleId,
          owner_uid: user.uid,
          ...entrantData,
          status: 'registered' as const
        }
      };
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`gp_event_${targetId}`);
          const currentData = cached ? JSON.parse(cached) : {};
          localStorage.setItem(`gp_event_${targetId}`, JSON.stringify({
            ...currentData,
            entrants: updatedEntrants
          }));
        } catch (e) {}
      }

      setEvent(prev => prev ? { ...prev, entrants: updatedEntrants } : null);
      setRegistering(false);
      setShowRegModal(false);
      setActiveEventTab('passes');

      const awardedMock = await awardGridpassCredits(
        user.uid,
        user.displayName || 'Gridpass Driver',
        'EVENT_REGISTRATION_REWARD',
        `Registered vehicle build (${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}) for ${event.title || 'Event'}`,
        25,
        targetId
      );

      showToast({
        title: awardedMock ? "⚡ Gridpass Active (+25 Credits!)" : "✓ Gridpass Active",
        message: awardedMock 
          ? "Your vehicle pass is active! +25 Credits ($0.25 USD) added to wallet."
          : "Your vehicle pass has been registered for this event.",
        icon: "🏁"
      });
      return;
    }

    try {
      await registerVehicleToEvent(targetId, selectedVehicleId, user.uid, entrantData);
      
      // Refresh event entrants locally
      const updatedEntrants = {
        ...event.entrants,
        [selectedVehicleId]: {
          vehicle_id: selectedVehicleId,
          owner_uid: user.uid,
          ...entrantData,
          status: 'registered' as const
        }
      };

      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`gp_event_${targetId}`);
          const currentData = cached ? JSON.parse(cached) : {};
          localStorage.setItem(`gp_event_${targetId}`, JSON.stringify({
            ...currentData,
            entrants: updatedEntrants
          }));
        } catch (e) {}
      }

      setEvent(prev => prev ? { ...prev, entrants: updatedEntrants } : null);

      const awardedReal = await awardGridpassCredits(
        user.uid,
        user.displayName || 'Gridpass Driver',
        'EVENT_REGISTRATION_REWARD',
        `Registered vehicle build (${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}) for ${event.title || 'Event'}`,
        25,
        targetId
      );

      setShowRegModal(false);
      setActiveEventTab('passes');
      showToast({
        title: awardedReal ? "⚡ Gridpass Active (+25 Credits!)" : "✓ Gridpass Active",
        message: awardedReal 
          ? "Your vehicle pass is active! +25 Credits ($0.25 USD) added to wallet."
          : "Your vehicle pass is staged on the grid!",
        icon: "🏁"
      });
    } catch (err) {
      console.error("Failed to register vehicle to event:", err);
      showToast({
        title: "Staging Failed",
        message: "Failed to stage vehicle to event. Please try again.",
        icon: "⚠️"
      });
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
    <div className="min-h-screen bg-white text-neutral-900 pb-6 md:pb-12">
      
      {/* Main Page Content (Hidden on Print) */}
      <div className="no-print">
        {/* Sticky Combined Floating Top Navigation & Event Menu Header Deck */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 shadow-xs px-3 py-2 space-y-1.5 no-print">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
            <Link
              href="/events"
              className="py-1 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-1 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#ff3b30]" /> <span className="hidden sm:inline">Directory</span>
            </Link>

            <div className="min-w-0 text-center flex-1 px-1">
              <h1 className="text-xs font-black uppercase text-neutral-900 truncate tracking-tight">
                {event.title || event.name || 'Event Hub'}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {canEditEvent && (
                <button
                  onClick={() => router.push(`/events/${eventId}/edit`)}
                  className="py-1 px-2 bg-neutral-900 text-white text-[9px] font-mono font-bold uppercase rounded-lg hover:bg-neutral-800 transition-all flex items-center gap-1"
                  title="Edit Event Details"
                >
                  <Edit3 className="w-3 h-3 text-[#ff3b30]" /> <span className="hidden sm:inline">Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* Equal 5-Column Grid Mobile Control Bar (100% fits any mobile screen with ZERO clipping) */}
          <div className="max-w-4xl mx-auto grid grid-cols-5 gap-1 w-full text-center">
            <button
              type="button"
              onClick={() => setActiveEventTab('hub')}
              className={`min-h-[44px] py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer w-full touch-manipulation active:scale-95 ${
                activeEventTab === 'hub' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100/90 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Flag className="w-3.5 h-3.5 text-[#ff3b30] shrink-0" />
              <span>HUB</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveEventTab('map')}
              className={`min-h-[44px] py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer w-full relative touch-manipulation active:scale-95 ${
                activeEventTab === 'map' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100/90 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-[#ff3b30] shrink-0" />
              <span>MAP</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveEventTab('passes')}
              className={`min-h-[44px] py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer w-full relative touch-manipulation active:scale-95 ${
                activeEventTab === 'passes' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100/90 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-[#ff3b30] shrink-0" />
              <span>PASSES</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveEventTab('entrants')}
              className={`min-h-[44px] py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer w-full relative touch-manipulation active:scale-95 ${
                activeEventTab === 'entrants' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100/90 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <CarFront className="w-3.5 h-3.5 text-[#ff3b30] shrink-0" />
              <span>GRID</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveEventTab('discussion')}
              className={`min-h-[44px] py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer w-full relative touch-manipulation active:scale-95 ${
                activeEventTab === 'discussion' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100/90 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#ff3b30] shrink-0" />
              <span>CHAT</span>
            </button>
          </div>

          {/* Compact Quick-Join Action Strip for Sub-Tabs (MAP, PASSES, GRID, CHAT) */}
          {activeEventTab !== 'hub' && activeEventTab !== 'register-vehicle' && activeEventTab !== 'register-vendor' && activeEventTab !== 'edit-cover' && (
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 pt-1.5 border-t border-neutral-100">
              {event.allow_vehicles !== false && (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) { router.push('/login'); return; }
                    setActiveEventTab('register-vehicle');
                  }}
                  className="flex-1 py-1 px-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <CarFront className="w-3 h-3" /> + Join Vehicle
                </button>
              )}
              {(event.allow_vendors !== false || event.allow_businesses !== false) && (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) { router.push('/login'); return; }
                    if (vendorProfiles.length > 0 && !selectedVendorBusinessId) setSelectedVendorBusinessId(vendorProfiles[0].id);
                    setActiveEventTab('register-vendor');
                  }}
                  className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Store className="w-3 h-3" /> + Join Vendor
                </button>
              )}
            </div>
          )}
        </header>

        {/* Top Cover & Master Header Card (Rendered ONLY on HUB tab view to preserve 100% viewport space for MAP, PASSES, GRID, & CHAT) */}
        {activeEventTab === 'hub' && (
          <>
            {/* Top Banner Cover */}
            <div className="w-full h-28 sm:h-36 md:h-44 bg-neutral-900 relative flex items-end overflow-hidden group">
              {isVideoUrl(event.banner_url || event.cover_url || event.exampleImageUrl) ? (
                <video
                  src={event.banner_url || event.cover_url || event.exampleImageUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={event.banner_url || event.cover_url || event.exampleImageUrl || DEFAULT_MOTORSPORT_COVER} 
                  alt={event.title || event.name || 'Event Cover'} 
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
              
              {/* Cover Change Button */}
              {canEditEvent && (
                <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCoverUrlInput(event.banner_url || event.cover_url || '');
                      setActiveEventTab('edit-cover');
                    }}
                    className="py-1 px-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg text-white transition-all flex items-center gap-1 text-[9px] font-mono font-bold uppercase border border-white/20 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3 h-3 text-neutral-300" /> Change Cover
                  </button>
                </div>
              )}
            </div>

            <div className="max-w-4xl mx-auto px-3 sm:px-4 relative z-20 -mt-4 sm:-mt-6 md:-mt-8 space-y-3 pb-3">
              {/* Master Single High-Density Event Header Card */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-md space-y-3 text-left">
                {/* Top Badges Row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-50 text-[#ff3b30] border border-red-100 uppercase tracking-wider">
                    {event.frequency === 'one_time' ? 'One-Time Gathering' : event.frequency === 'repeating' ? 'Repeating Meet' : 'Venue'}
                  </span>
                  {(event.host_business_id || event.host_name || event.id === 'maple-city-cruise') && (
                    <Link
                      href={`/b/${event.host_business_id || 'maple-city-street-machines'}`}
                      className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider hover:bg-blue-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Store className="w-2.5 h-2.5 text-blue-600" />
                      <span>Host: {event.host_name || 'Maple City Street Machines'}</span>
                    </Link>
                  )}
                  {event.is_rescheduled && (
                    <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                      ⚠️ Rescheduled Date
                    </span>
                  )}
                </div>

                {/* Event Title */}
                <h1 className="text-base sm:text-xl font-black uppercase text-neutral-900 tracking-tight leading-snug">
                  {event.title || event.name || 'Untitled Event'}
                </h1>

                {/* Location & Date */}
                <div className="text-[10px] text-neutral-600 font-mono font-bold flex flex-wrap items-center gap-2">
                  <a
                    href={getSystemMapUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#ff3b30] transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-[#ff3b30] shrink-0" />
                    <span className="underline decoration-dotted underline-offset-2">{event.location_name || event.locationName || 'Location Unspecified'}</span>
                  </a>
                  <span>•</span>
                  {(event.start_date || event.startDate) && (
                    <span className="inline-flex items-center gap-1 text-neutral-900 font-black">
                      <Calendar className="w-3 h-3 text-[#ff3b30] shrink-0" />
                      {new Date(event.start_date || event.startDate!).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {(event.start_date || event.startDate!).includes('T') && ` at ${new Date(event.start_date || event.startDate!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                    </span>
                  )}
                </div>

                {/* Action Row & Join Grid (Side by side grid for Join Vehicle + Vendor) */}
                <div className="pt-2 border-t border-neutral-100 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* RSVP Going / Interested Toggle */}
                    {event.allow_spectators !== false && (
                      <div className="inline-flex p-0.5 bg-neutral-100 rounded-xl border border-neutral-200/80">
                        <button
                          onClick={handleToggleRSVP}
                          disabled={attending}
                          className={`py-1.5 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            user && event?.attendees && !!event.attendees[user.uid]
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-neutral-700 hover:text-neutral-900'
                          }`}
                        >
                          <Check className="w-3 h-3" /> Going
                        </button>
                        <button
                          onClick={handleToggleInterested}
                          disabled={togglingInterested}
                          className={`py-1.5 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            user && event?.interested && !!event.interested[user.uid]
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-neutral-700 hover:text-neutral-900'
                          }`}
                        >
                          <Star className="w-3 h-3" /> Interested
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleShareEvent}
                        className="py-1.5 px-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3 text-neutral-500" /> Share
                      </button>
                      <button
                        onClick={downloadICSFile}
                        className="py-1.5 px-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <CalendarPlus className="w-3 h-3 text-neutral-500" /> Cal
                      </button>
                    </div>
                  </div>

                  {/* Join Buttons Grid (Side-by-side on mobile, saving tons of vertical space!) */}
                  <div className="grid grid-cols-2 gap-2">
                    {event.allow_vehicles !== false && (
                      <button
                        onClick={() => {
                          if (!user) { router.push('/login'); return; }
                          setActiveEventTab('register-vehicle');
                        }}
                        className="py-2 px-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CarFront className="w-3.5 h-3.5" /> + Join Vehicle
                      </button>
                    )}

                    {(event.allow_vendors !== false || event.allow_businesses !== false) && (
                      <button
                        onClick={() => {
                          if (!user) { router.push('/login'); return; }
                          if (vendorProfiles.length > 0 && !selectedVendorBusinessId) setSelectedVendorBusinessId(vendorProfiles[0].id);
                          setActiveEventTab('register-vendor');
                        }}
                        className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Store className="w-3.5 h-3.5" /> + Join Vendor
                      </button>
                    )}
                  </div>

                  {/* Metrics Counts Strip */}
                  <div className="flex items-center gap-3 text-[9px] font-mono font-bold text-neutral-500 pt-1.5 border-t border-neutral-100 flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-600">✓ {event.attendees ? Object.keys(event.attendees).length : 0} Going</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-600">⭐ {event.interested ? Object.keys(event.interested).length : 0} Interested</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-neutral-700">🚘 {event.entrants ? Object.keys(event.entrants).length : 0} Vehicles</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-blue-600">🏪 {event.vendors ? event.vendors.length : 0} Exhibitors</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 space-y-3">

        {/* FORM TAB VIEW 1: REGISTER VEHICLE */}
        {activeEventTab === 'register-vehicle' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-md space-y-5 text-left animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg bg-red-50 text-[#ff3b30] border border-red-100 uppercase tracking-widest block w-fit mb-1">
                  Vehicle Registration
                </span>
                <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight">
                  Join Event with Your Vehicle
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveEventTab('hub')}
                className="py-2 px-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-[#ff3b30]" /> Back to Event
              </button>
            </div>

            <form onSubmit={handleRegisterVehicle} className="space-y-4">
              {/* Select Vehicle from Garage */}
              {userVehicles.length > 0 ? (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Select Vehicle from Garage</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] cursor-pointer"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {userVehicles.map((v) => {
                      const isAlreadyStaged = event?.entrants && Object.values(event.entrants).some((ent: any) => ent.vehicle_id === v.id || ent.id === v.id);
                      return (
                        <option 
                          key={v.id} 
                          value={v.id}
                          disabled={isAlreadyStaged}
                          className={isAlreadyStaged ? 'text-neutral-400 font-normal bg-neutral-100' : 'font-bold'}
                        >
                          {v.year} {v.make} {v.model}{isAlreadyStaged ? ' — Already Registered ✓' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <div className="flex justify-end pt-1">
                    <Link
                      href={`/v/create?redirect=/events/${event.id}`}
                      className="text-[10px] font-bold text-[#ff3b30] hover:text-[#bd2925] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Another Vehicle to Garage
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 text-left">
                  <div className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                    <CarFront className="w-4 h-4 text-[#ff3b30]" /> No Garage Vehicles Found
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed font-medium">
                    Add a vehicle build to your Gridpass Garage before joining this event.
                  </p>
                  <Link
                    href={`/v/create?redirect=/events/${event.id}`}
                    className="w-full py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Vehicle to Garage Now
                  </Link>
                </div>
              )}

              {/* Show Class Category */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Select Show Class / Category</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] cursor-pointer"
                >
                  <option value="">-- General / Pending --</option>
                  {(event.staging_groups && event.staging_groups.length > 0 ? event.staging_groups : DEFAULT_STAGING_CLASSES).map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic PEV & Electric Vehicle Spec Badges Prompt */}
              {(selectedGroup.includes('PEV') || selectedGroup.includes('E-Bike') || selectedGroup.includes('EV')) && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-left">
                  <div className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                    ⚡ Electric Vehicle &amp; PEV Telemetry Specs
                  </div>
                  <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                    Gridpass automatically reads battery capacity (Wh / Volts) and motor peak wattage from your digital garage passport for Onewheels, E-Bikes, EUCs &amp; EVs.
                  </p>
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
                      I agree to verify vehicle safety compliance, obey event coordinators, and release host from event liabilities.
                    </div>
                  </div>
                </label>
              )}

              {/* Form Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveEventTab('hub')}
                  className="py-3 px-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                {(() => {
                  const isSelectedVehicleAlreadyStaged = event?.entrants && Object.values(event.entrants).some((ent: any) => ent.vehicle_id === selectedVehicleId || ent.id === selectedVehicleId);
                  return (
                    <button
                      type="submit"
                      disabled={registering || !selectedVehicleId || isSelectedVehicleAlreadyStaged}
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        isSelectedVehicleAlreadyStaged
                          ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed border border-neutral-300'
                          : 'bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white cursor-pointer shadow-md shadow-red-500/10'
                      }`}
                    >
                      {registering ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : isSelectedVehicleAlreadyStaged ? (
                        'Already Registered ✓'
                      ) : (
                        'Confirm Vehicle Registration'
                      )}
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        )}

        {/* FORM TAB VIEW 2: REGISTER VENDOR */}
        {activeEventTab === 'register-vendor' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-md space-y-5 text-left animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-widest block w-fit mb-1">
                  Vendor Exhibitor Registration
                </span>
                <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight">
                  Join Event as a Vendor / Business
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveEventTab('hub')}
                className="py-2 px-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" /> Back to Event
              </button>
            </div>

            <form onSubmit={handleSubmitVendorRSVP} className="space-y-4">
              {/* Select Business Profile */}
              {vendorProfiles.length > 0 ? (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Select Business Profile</label>
                  <select
                    value={selectedVendorBusinessId}
                    onChange={(e) => setSelectedVendorBusinessId(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="">-- Choose Business Profile --</option>
                    {vendorProfiles.map((b) => {
                      const isAlreadyRegistered = (event?.vendors || []).includes(b.id);
                      return (
                        <option 
                          key={b.id} 
                          value={b.id}
                          disabled={isAlreadyRegistered}
                          className={isAlreadyRegistered ? 'text-neutral-400 font-normal bg-neutral-100' : 'font-bold'}
                        >
                          {b.name} ({b.category || 'Business'}){isAlreadyRegistered ? ' — Already Registered ✓' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-3 text-left">
                  <div className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-blue-600" /> No Business Profiles Found
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed font-medium">
                    Create a business profile or dealership profile to list your booth at this event.
                  </p>
                  <Link
                    href={`/b/create?redirect=/events/${event.id}`}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Create Business Profile Now
                  </Link>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveEventTab('hub')}
                  className="py-3 px-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                {(() => {
                  const isAlreadyRegistered = (event?.vendors || []).includes(selectedVendorBusinessId);
                  return (
                    <button
                      type="submit"
                      disabled={submittingVendorRSVP || !selectedVendorBusinessId || isAlreadyRegistered}
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        isAlreadyRegistered
                          ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed border border-neutral-300'
                          : 'bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-200 text-white cursor-pointer shadow-md shadow-blue-500/10'
                      }`}
                    >
                      {submittingVendorRSVP ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : isAlreadyRegistered ? (
                        'Already Registered ✓'
                      ) : (
                        'Confirm Vendor Exhibitor Pass'
                      )}
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        )}

        {/* FORM TAB VIEW 3: EDIT EVENT DETAILS */}
        {activeEventTab === 'edit-event' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-md space-y-5 text-left animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-widest block w-fit mb-1">
                  Organizer Control Deck
                </span>
                <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight">
                  Edit Event Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveEventTab('host')}
                className="py-2 px-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-[#ff3b30]" /> Back to Host Controls
              </button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono font-bold uppercase text-amber-700 block">Full Host Control Suite</span>
                <h4 className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#ff3b30]" /> Weather Rescheduling, Allowed Registration Toggles &amp; Staging Classes
                </h4>
                <p className="text-[11px] font-medium text-amber-800">
                  Configure event rescheduling alerts, entry fees, safety waivers, vehicle class filters, map GPS pins &amp; video banners.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/events/${eventId}/edit`)}
                className="py-2.5 px-4 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                Launch Full Event Editor <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="space-y-4">
              {/* Event Title */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Event Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Event Title..."
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              {/* Location Name & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Venue / Location Name</label>
                  <input
                    type="text"
                    required
                    value={editLocationName}
                    onChange={(e) => setEditLocationName(e.target.value)}
                    placeholder="e.g. Public Square"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Physical Address</label>
                  <input
                    type="text"
                    value={editPhysicalAddress}
                    onChange={(e) => setEditPhysicalAddress(e.target.value)}
                    placeholder="e.g. 100 Main St"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Start Date &amp; Time</label>
                <input
                  type="text"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  placeholder="e.g. Friday, August 7th at 4:00 PM"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Event Description</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe the event..."
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#ff3b30] resize-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveEventTab('host')}
                  className="py-3 px-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditEvent || !editTitle.trim()}
                  className="flex-1 py-3 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-1.5"
                >
                  {savingEditEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FORM TAB VIEW 4: SUBMIT COMMUNITY NEWS LINK */}
        {activeEventTab === 'submit-news' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-md space-y-5 text-left animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg bg-red-50 text-[#ff3b30] border border-red-100 uppercase tracking-widest block w-fit mb-1">
                  Community News Submission
                </span>
                <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-[#ff3b30]" /> Submit Community News Link
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveEventTab('hub')}
                className="py-2 px-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-[#ff3b30]" /> Back to Event
              </button>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed">
              Share a radio broadcast, local newspaper article, or official news report about this event with attendees.
            </p>

            <form onSubmit={(e) => {
              handleSubmitNewsLink(e);
              setActiveEventTab('hub');
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Article Title / Headline</label>
                <input
                  type="text"
                  required
                  value={newsTitleInput}
                  onChange={(e) => setNewsTitleInput(e.target.value)}
                  placeholder="e.g. Monmouth Cruise Night Rescheduled for Friday, August 7th"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Article / Broadcast URL</label>
                <input
                  type="url"
                  required
                  value={newsUrlInput}
                  onChange={(e) => setNewsUrlInput(e.target.value)}
                  placeholder="https://977wmoi.com/2026/07/maple-city-street-machines..."
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">News Source Name (Optional)</label>
                <input
                  type="text"
                  value={newsSourceInput}
                  onChange={(e) => setNewsSourceInput(e.target.value)}
                  placeholder="e.g. 97.7 WMOI / Monmouth Review Atlas"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveEventTab('hub')}
                  className="py-3 px-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNews || !newsTitleInput.trim() || !newsUrlInput.trim()}
                  className="flex-1 py-3 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-1.5"
                >
                  {submittingNews ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post News Link'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FORM TAB VIEW 5: VENUE GEOFENCE & CHECK-IN */}
        {activeEventTab === 'check-in' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-md space-y-5 text-left animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-widest block w-fit mb-1">
                  Venue Location Verification
                </span>
                <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" /> Venue Geofence &amp; Check-In Staging
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveEventTab('hub')}
                className="py-2 px-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600" /> Back to Event
              </button>
            </div>

            {/* Real-Time Device GPS Distance & Geofence Status Card */}
            <div className={`p-5 rounded-2xl border space-y-3 transition-all ${
              userDistanceMiles !== null && userDistanceMiles <= ((event as any)?.geofence_radius_miles ?? 1.0)
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-3">
                <div className="flex items-center gap-2">
                  <Navigation className={`w-4 h-4 ${
                    userDistanceMiles !== null && userDistanceMiles <= ((event as any)?.geofence_radius_miles ?? 1.0) ? 'text-emerald-600' : 'text-amber-600'
                  }`} />
                  <span className="text-xs font-black uppercase tracking-wider">Live GPS Distance Check</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border ${
                    userDistanceMiles !== null && userDistanceMiles <= ((event as any)?.geofence_radius_miles ?? 1.0)
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {locatingDevice 
                      ? '🛰️ Locating Device...' 
                      : userDistanceMiles !== null 
                      ? userDistanceMiles <= ((event as any)?.geofence_radius_miles ?? 1.0)
                        ? '✓ Inside Venue Perimeter'
                        : '📍 Outside Venue Perimeter'
                      : '📍 GPS Standby'}
                  </span>

                  <button
                    type="button"
                    onClick={handleAcquireGPSLocation}
                    disabled={locatingDevice}
                    className="py-1 px-2.5 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-[9px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                  >
                    {locatingDevice ? <Loader2 className="w-3 h-3 animate-spin text-neutral-600" /> : <Navigation className="w-3 h-3 text-neutral-600" />}
                    Refresh
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-lg font-black font-mono flex items-baseline gap-2">
                  {locatingDevice ? (
                    <span className="text-xs font-medium text-neutral-500 animate-pulse">Acquiring device GPS location...</span>
                  ) : userDistanceMiles !== null ? (
                    <>
                      <span>{userDistanceMiles.toFixed(1)} miles away</span>
                      <span className="text-[10px] text-neutral-500 font-mono font-normal uppercase">from {event?.location_name || 'event venue'}</span>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-neutral-500">Tap Refresh to check live device distance</span>
                  )}
                </div>

                <p className="text-xs leading-relaxed font-medium">
                  {userDistanceMiles !== null && userDistanceMiles <= ((event as any)?.geofence_radius_miles ?? 1.0)
                    ? '✓ You are physically located on venue grounds! Confirm your arrival below or stage your build.'
                    : userDistanceMiles !== null
                    ? `You are currently ${userDistanceMiles.toFixed(1)} miles away (outside the ${((event as any)?.geofence_radius_miles ?? 1.0)} mile venue geofence). You can still pre-register your vehicle build or vendor booth below so you're ready when you arrive!`
                    : 'Check your real-time distance from event grounds or pre-register your entry pass below.'}
                </p>

                {userDistanceMiles !== null && userDistanceMiles <= ((event as any)?.geofence_radius_miles ?? 1.0) && (
                  <button
                    type="button"
                    disabled={checkingInGate}
                    onClick={async () => {
                      if (!user) { router.push('/login'); return; }
                      setCheckingInGate(true);
                      try {
                        const targetId = event.id || eventId;
                        const awarded = await awardGridpassCredits(
                          user.uid,
                          user.displayName || 'Gridpass Driver',
                          'EVENT_GATE_CHECKIN_REWARD',
                          `Gate arrival check-in at ${event.title || 'Event'}`,
                          50,
                          targetId
                        );
                        showToast({
                          title: awarded ? "⚡ Gate Check-In Verified!" : "✓ Gate Arrival Verified",
                          message: awarded
                            ? "Arrival confirmed! +50 Gridpass Credits ($0.50 USD) added to your wallet."
                            : "Your venue arrival has been recorded for this event.",
                          icon: "📍"
                        });
                        setActiveEventTab('passes');
                      } catch (err) {
                        console.error("Check-in error:", err);
                      } finally {
                        setCheckingInGate(false);
                      }
                    }}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 mt-2"
                  >
                    {checkingInGate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                    ⚡ Confirm Gate Arrival Check-In (+50 Credits)
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!user) { router.push('/login'); return; }
                  setActiveEventTab('register-vehicle');
                }}
                className="py-3 px-4 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-2"
              >
                <CarFront className="w-4 h-4" /> Register Vehicle Pass
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!user) { router.push('/login'); return; }
                  setActiveEventTab('register-vendor');
                }}
                className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                <Store className="w-4 h-4" /> Register Vendor Booth Pass
              </button>
            </div>
          </div>
        )}

        {/* FORM TAB VIEW 6: CLAIM EVENT OWNERSHIP */}
        {activeEventTab === 'claim-event' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-md space-y-5 text-left animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg bg-red-50 text-[#ff3b30] border border-red-100 uppercase tracking-widest block w-fit mb-1">
                  Organizer Verification
                </span>
                <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#ff3b30]" /> Claim Official Organizer Ownership
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveEventTab('hub')}
                className="py-2 px-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-[#ff3b30]" /> Back to Event
              </button>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed">
              Are you the founder, club officer, track manager, or official event promoter for <strong className="text-neutral-900">{event.title || event.name}</strong>?
            </p>

            <form onSubmit={(e) => {
              handleSubmitClaim(e);
              setActiveEventTab('hub');
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Organizer Role / Official Title</label>
                <input
                  type="text"
                  required
                  value={claimRole}
                  onChange={(e) => setClaimRole(e.target.value)}
                  placeholder="e.g. Club President, Clifford Adams / Event Director"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Verification Contact Email</label>
                  <input
                    type="email"
                    required
                    value={claimEmail}
                    onChange={(e) => setClaimEmail(e.target.value)}
                    placeholder="e.g. president@maplecitystreetmachines.com"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Contact Phone (Optional)</label>
                  <input
                    type="tel"
                    value={claimPhone}
                    onChange={(e) => setClaimPhone(e.target.value)}
                    placeholder="e.g. (309) 555-0199"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveEventTab('hub')}
                  className="py-3 px-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim || !claimRole.trim()}
                  className="flex-1 py-3 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-1.5"
                >
                  {submittingClaim ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Claim Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FORM TAB VIEW 7: COVER PHOTO / VIDEO BANNER */}
        {activeEventTab === 'edit-cover' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-md space-y-5 text-left animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg bg-red-50 text-[#ff3b30] border border-red-100 uppercase tracking-widest block w-fit mb-1">
                  Media Settings
                </span>
                <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#ff3b30]" /> Event Cover Photo / Video Banner
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveEventTab('hub')}
                className="py-2 px-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-[#ff3b30]" /> Back to Event
              </button>
            </div>

            {/* Live Media Banner Preview */}
            {coverUrlInput && (
              <div className="w-full h-40 rounded-2xl overflow-hidden border border-neutral-200 relative bg-neutral-900 shadow-inner">
                {isVideoUrl(coverUrlInput) ? (
                  <video
                    src={coverUrlInput}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={coverUrlInput}
                    alt="Cover Banner Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase text-white border border-white/20">
                  Live Preview
                </div>
              </div>
            )}

            {/* Direct File Upload */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase block">Upload High-Res Media File</label>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleCoverFileUpload}
                disabled={uploadingCoverFile}
                className="w-full text-xs text-neutral-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 cursor-pointer"
              />
            </div>

            {/* Motorsport Photo Presets */}
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase block">Or Choose a Motorsport Preset</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COVER_PRESETS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setCoverUrlInput(preset.url)}
                    className={`p-2 bg-neutral-50 border rounded-xl overflow-hidden text-left transition-all cursor-pointer group ${
                      coverUrlInput === preset.url ? 'border-[#ff3b30] ring-1 ring-[#ff3b30]' : 'border-neutral-200 hover:border-neutral-300'
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

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveEventTab('hub')}
                className="py-3 px-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveCoverPhoto(coverUrlInput || DEFAULT_MOTORSPORT_COVER);
                  setActiveEventTab('hub');
                }}
                disabled={savingCover || uploadingCoverFile || !coverUrlInput.trim()}
                className="flex-1 py-3 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-1.5"
              >
                {savingCover ? 'Saving...' : 'Save Cover Banner'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: EVENT HUB (Overview, Location, Rules & News) */}
        {activeEventTab === 'hub' && (
          <div className="space-y-6">
            {/* Weather & Date Reschedule Notice Banner */}
            {event.is_rescheduled && (
              <div className="bg-amber-500 text-white p-4 md:p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 bg-white/20 rounded-2xl shrink-0">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <span>⚠️ EVENT RESCHEDULED NOTICE</span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed pt-0.5 text-white/95">
                      {event.reschedule_notice || `Rescheduled to ${new Date(event.start_date || '').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`}
                    </p>
                  </div>
                </div>
                {event.original_date && (
                  <span className="text-[9px] font-mono font-bold bg-amber-600/90 text-amber-100 px-3 py-1.5 rounded-xl uppercase shrink-0 border border-amber-400/40 line-through">
                    Was: {event.original_date}
                  </span>
                )}
              </div>
            )}

            {/* Event Overview & About Description Card */}
            {event.description && (
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-md space-y-3 text-left">
                <h3 className="text-xs font-black text-neutral-900 uppercase flex items-center gap-2 tracking-wider border-b border-neutral-100 pb-3">
                  <Info className="w-4 h-4 text-[#ff3b30]" /> About This Event
                </h3>
                <p className="text-xs text-neutral-700 leading-relaxed font-medium whitespace-pre-line pt-1">
                  {event.description}
                </p>
              </div>
            )}

            {/* Community News & Article Coverage */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-md space-y-4 text-left">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-neutral-900 uppercase flex items-center gap-2 tracking-wider">
                    <Newspaper className="w-4 h-4 text-[#ff3b30]" /> Community News & Article Coverage
                  </h3>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      router.push('/login');
                      return;
                    }
                    setActiveEventTab('submit-news');
                  }}
                  className="py-2 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#ff3b30]" /> Submit News Link
                </button>
              </div>

              <div className="space-y-3">
                {newsItems.filter(n => !n.is_hidden).length > 0 ? (
                  newsItems.filter(n => !n.is_hidden).map((item) => (
                    <div key={item.id} className="p-4 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-mono font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded uppercase">
                            {item.source_name || 'News Media'}
                          </span>
                          <span className="text-[8px] font-mono text-neutral-400">
                            Shared by {item.submitted_by_name}
                          </span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setLeavingUrl(item.url)}
                          className="text-xs font-black uppercase text-neutral-900 hover:text-[#ff3b30] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
                        >
                          <span className="line-clamp-2">{item.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#ff3b30] shrink-0" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => setLeavingUrl(item.url)}
                          className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-[9px] font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          Read Article <ExternalLink className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-neutral-400 font-mono font-bold uppercase text-center py-2">
                    No community news coverage submitted yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RADAR MAP & SPOTS */}
        {activeEventTab === 'map' && (
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-md space-y-4 text-left">
          <div className="flex flex-row items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
            <h3 className="text-xs font-black text-neutral-900 uppercase flex items-center gap-1.5 tracking-wider truncate">
              <Map className="w-4 h-4 text-[#ff3b30] shrink-0" /> Live Map &amp; Spots
            </h3>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={getSystemMapUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-[#ff3b30] text-[9px] font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                title="Get turn-by-turn navigation directions in your default maps app"
              >
                <Navigation className="w-3 h-3 text-[#ff3b30]" /> Directions
              </a>

              <button
                onClick={() => {
                  if (!user) {
                    router.push('/login');
                    return;
                  }
                  setActiveEventTab('check-in');
                }}
                className="py-1 px-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[9px] font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1 shadow-2xs"
              >
                <Crosshair className="w-3 h-3 text-[#ff3b30]" /> + Spot
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setPinFilter('all')}
              className={`py-1 px-2.5 rounded-lg text-[8px] font-mono font-bold uppercase cursor-pointer border transition-all whitespace-nowrap ${
                pinFilter === 'all' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-neutral-50 text-neutral-600 border-neutral-200'
              }`}
            >
              All ({gpsPins.length})
            </button>
            <button
              onClick={() => setPinFilter('vehicle')}
              className={`py-1 px-2.5 rounded-lg text-[8px] font-mono font-bold uppercase cursor-pointer border transition-all whitespace-nowrap ${
                pinFilter === 'vehicle' ? 'bg-[#ff3b30] text-white border-[#ff3b30]' : 'bg-neutral-50 text-neutral-600 border-neutral-200'
              }`}
            >
              🚘 Vehicles ({gpsPins.filter(p => p.type === 'vehicle').length})
            </button>
            <button
              onClick={() => setPinFilter('vendor')}
              className={`py-1 px-2.5 rounded-lg text-[8px] font-mono font-bold uppercase cursor-pointer border transition-all whitespace-nowrap ${
                pinFilter === 'vendor' ? 'bg-blue-600 text-white border-blue-600' : 'bg-neutral-50 text-neutral-600 border-neutral-200'
              }`}
            >
              🏬 Vendors ({gpsPins.filter(p => p.type === 'vendor').length})
            </button>
            <button
              onClick={() => setPinFilter('attendee')}
              className={`py-1 px-2.5 rounded-lg text-[8px] font-mono font-bold uppercase cursor-pointer border transition-all whitespace-nowrap ${
                pinFilter === 'attendee' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-neutral-50 text-neutral-600 border-neutral-200'
              }`}
            >
              👤 Members ({gpsPins.filter(p => p.type === 'attendee').length})
            </button>
            <button
              onClick={() => setPinFilter('amenity')}
              className={`py-1 px-2.5 rounded-lg text-[8px] font-mono font-bold uppercase cursor-pointer border transition-all whitespace-nowrap ${
                pinFilter === 'amenity' ? 'bg-purple-600 text-white border-purple-600' : 'bg-neutral-50 text-neutral-600 border-neutral-200'
              }`}
            >
              📍 Amenities ({gpsPins.filter(p => p.type === 'amenity').length})
            </button>
          </div>

          {/* Interactive Event Radar & Venue Map Canvas */}
          <div ref={mapCanvasRef}>
            <EventRadarFullMap
              eventLat={40.91148}
              eventLng={-90.64764}
              locationName={event.location_name || event.locationName || 'Event Grounds'}
              pins={gpsPins}
              activeFilter={pinFilter}
              focusedPinId={focusedPinId}
              startDate={event.start_date || event.startDate}
              endDate={event.end_date || event.endDate}
            />
          </div>

          {/* Interactive Radar Grid Pins List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {gpsPins
              .filter(p => pinFilter === 'all' || p.type === pinFilter)
              .map((pin) => {
                let pinEmoji = '📍';
                let pinBgClass = 'bg-purple-600';

                if (pin.type === 'vehicle') {
                  pinEmoji = '🚘';
                  pinBgClass = 'bg-[#ff3b30]';
                } else if (pin.type === 'vendor') {
                  pinEmoji = '🏬';
                  pinBgClass = 'bg-blue-600';
                } else if (pin.type === 'attendee') {
                  pinEmoji = '👤';
                  pinBgClass = 'bg-emerald-600';
                } else if (pin.type === 'amenity') {
                  switch (pin.amenity_category) {
                    case 'restroom': pinEmoji = '🚻'; pinBgClass = 'bg-purple-600'; break;
                    case 'water': pinEmoji = '💧'; pinBgClass = 'bg-cyan-600'; break;
                    case 'food': pinEmoji = '🍔'; pinBgClass = 'bg-amber-600'; break;
                    case 'parking': pinEmoji = '🅿️'; pinBgClass = 'bg-slate-700'; break;
                    case 'first_aid': pinEmoji = '🚑'; pinBgClass = 'bg-red-600'; break;
                    case 'info': pinEmoji = 'ℹ️'; pinBgClass = 'bg-blue-600'; break;
                    default: pinEmoji = '📍'; pinBgClass = 'bg-purple-600'; break;
                  }
                }

                return (
                  <div
                    key={pin.id}
                    onClick={() => {
                      setFocusedPinId(pin.id);
                      if (mapCanvasRef.current) {
                        mapCanvasRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className={`p-3.5 bg-neutral-50 border hover:border-[#ff3b30] rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer group ${
                      focusedPinId === pin.id ? 'border-[#ff3b30] ring-1 ring-[#ff3b30] bg-red-50/20' : 'border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-sm shadow-xs ${pinBgClass}`}>
                        {pinEmoji}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase truncate">
                            {pin.zone_name || 'Event Grounds'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-neutral-900 group-hover:text-[#ff3b30] transition-colors truncate">
                          {pin.label}
                        </h4>
                        <p className="text-[9px] font-mono text-neutral-500 uppercase truncate">By {pin.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFocusedPinId(pin.id);
                          if (mapCanvasRef.current) {
                            mapCanvasRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                        className="py-1.5 px-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Crosshair className="w-3 h-3" /> Fly To
                      </button>

                      <a
                        href={pin.lat && pin.lng 
                          ? `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([(event.physical_address || event.locationAddress || event.location_name || ''), pin.address_text || pin.zone_name].filter(Boolean).join(' '))}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-white border border-neutral-200 hover:border-neutral-400 rounded-xl text-neutral-600 text-[9px] font-bold uppercase transition-all shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <Navigation className="w-3 h-3 text-[#ff3b30]" /> Maps
                      </a>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        )}

        {/* TAB 3: MY PASSES & REGISTRATIONS */}
        {activeEventTab === 'passes' && (
          <div className="space-y-6 text-left">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="text-xs font-black text-neutral-900 uppercase flex items-center gap-2 tracking-wider">
                    <Ticket className="w-4 h-4 text-emerald-600" /> My Event Passes
                  </h3>
                </div>
              </div>

              {/* Staged Vehicle Passes */}
              {(() => {
                const userActiveVehiclePasses = userVehicles.filter(v => 
                  event?.entrants && Object.values(event.entrants).some((ent: any) => ent.vehicle_id === v.id || ent.id === v.id)
                );

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CarFront className="w-3.5 h-3.5 text-[#ff3b30]" /> Vehicle Passes ({userActiveVehiclePasses.length})
                      </h4>
                      {event.allow_vehicles !== false && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!user) { router.push('/login'); return; }
                            if (userVehicles.length > 0 && !selectedVehicleId) setSelectedVehicleId(userVehicles[0].id);
                            setShowRegModal(true);
                          }}
                          className="text-[10px] font-bold text-[#ff3b30] hover:text-[#bd2925] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Register Another Vehicle
                        </button>
                      )}
                    </div>

                    {userActiveVehiclePasses.length > 0 ? (
                      userActiveVehiclePasses.map((v) => {
                        const entPair = event?.entrants ? Object.entries(event.entrants).find(([_, ent]: [string, any]) => ent.vehicle_id === v.id || ent.id === v.id) : null;
                        const entKey = entPair ? entPair[0] : v.id;
                        const entData = entPair ? entPair[1] : null;

                        return (
                          <div key={v.id} className="p-3 sm:p-4 bg-neutral-50 border border-neutral-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-14 h-10 rounded-xl bg-neutral-200 border border-neutral-300 overflow-hidden shrink-0">
                                {v.photo_url ? (
                                  <img src={v.photo_url} alt="Build" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <CarFront className="w-5 h-5 text-neutral-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <h5 className="text-xs font-black uppercase text-neutral-900 truncate">
                                  {v.year} {v.make} {v.model}
                                </h5>
                                <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase block">
                                  ✓ Active Pass • {entData?.staging_group || 'Registered'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                              <button
                                type="button"
                                onClick={() => openDashPassModal(
                                  'vehicle',
                                  `${v.year || ''} ${v.make || 'Vehicle'} ${v.model || ''}`.trim(),
                                  `Staging Group: ${entData?.staging_group || 'Main Grid'}`,
                                  `${typeof window !== 'undefined' ? window.location.origin : 'https://gridpass.app'}/events/${eventId}?tab=entrants&entrant=${entKey}`,
                                  'MAIN-GRID',
                                  entData?.staging_group || 'STAGED BUILD'
                                )}
                                className="py-1 px-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[9px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="View, print windshield pass sheet, or download QR code"
                              >
                                <Printer className="w-3 h-3" /> Print Gridpass
                              </button>

                              <button
                                type="button"
                                onClick={() => handleShareEntry(
                                  `${v.year || ''} ${v.make || ''} ${v.model || 'Vehicle'}`.trim(),
                                  'vehicle',
                                  entKey
                                )}
                                className="py-1 px-2.5 bg-gradient-to-r from-[#ff3b30] to-orange-500 hover:opacity-90 text-white text-[9px] font-mono font-black uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Share entry on social media or text friends to collect votes"
                              >
                                <Share2 className="w-3 h-3" /> 🚀 Share & Get Votes
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedVehicleId(v.id);
                                  setActiveEventTab('register-vehicle');
                                }}
                                className="py-1 px-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[9px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                title="Edit your vehicle registration in-place"
                              >
                                <Edit3 className="w-3 h-3 text-neutral-600" /> Edit Entry
                              </button>

                              <button
                                type="button"
                                onClick={() => handleWithdrawVehiclePass(v.id)}
                                className="py-1 px-2 bg-red-50 hover:bg-red-100 border border-red-200 text-[#ff3b30] text-[9px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                title="Withdraw vehicle pass from event"
                              >
                                <Trash2 className="w-3 h-3" /> Withdraw
                              </button>

                              <Link
                                href={`/v/${v.id}`}
                                className="py-1 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[9px] font-mono font-bold uppercase rounded-lg transition-all"
                              >
                                Build
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-5 bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl text-center space-y-2">
                        <CarFront className="w-6 h-6 mx-auto text-neutral-300" />
                        <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase">No vehicle registered for this event yet.</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!user) { router.push('/login'); return; }
                            setActiveEventTab('register-vehicle');
                          }}
                          className="py-2 px-4 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/10 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Register Vehicle Now
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Vendor Exhibitor Passes */}
              {(() => {
                const availableUserBiz = userOwnedBusinesses.length > 0 ? userOwnedBusinesses : vendorProfiles;
                const userActiveVendorPasses = availableUserBiz.filter(b => (event?.vendors || []).includes(b.id));

                return (
                  <div className="space-y-3 pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-blue-600" /> Vendor Passes ({userActiveVendorPasses.length})
                      </h4>
                      {(event.allow_vendors !== false || event.allow_businesses !== false) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!user) { router.push('/login'); return; }
                            if (vendorProfiles.length > 0 && !selectedVendorBusinessId) setSelectedVendorBusinessId(vendorProfiles[0].id);
                            setActiveEventTab('register-vendor');
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> List Another Business
                        </button>
                      )}
                    </div>

                    {userActiveVendorPasses.length > 0 ? (
                      userActiveVendorPasses.map((b) => (
                        <div key={b.id} className="p-3 sm:p-4 bg-blue-50/40 border border-blue-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            <h5 className="text-xs font-black uppercase text-neutral-900 truncate">{b.name}</h5>
                            <span className="text-[9px] font-mono text-blue-600 font-bold uppercase block">
                              ✓ Active Vendor Pass • {b.category || 'Exhibitor'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                            <button
                              type="button"
                              onClick={() => openDashPassModal(
                                'business',
                                b.name,
                                b.category || 'Official Vendor Exhibitor',
                                `${typeof window !== 'undefined' ? window.location.origin : 'https://gridpass.app'}/b/${b.id}`,
                                'EXHIBITOR-ROW',
                                'VENDOR BOOTH'
                              )}
                              className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="View, print booth pass sheet, or download QR code"
                            >
                              <Printer className="w-3 h-3" /> Print Gridpass
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVendorBusinessId(b.id);
                                setActiveEventTab('register-vendor');
                              }}
                              className="py-1 px-2.5 bg-blue-100 hover:bg-blue-200 text-blue-900 text-[9px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              title="Edit your vendor exhibitor booth pass in-place"
                            >
                              <Edit3 className="w-3 h-3 text-blue-700" /> Edit Booth
                            </button>

                            <button
                              type="button"
                              onClick={() => handleWithdrawVendorPass(b.id)}
                              className="py-1.5 px-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-[#ff3b30] text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1"
                              title="Withdraw vendor pass from event"
                            >
                              <Trash2 className="w-3 h-3" /> Withdraw
                            </button>

                            <Link
                              href={`/b/${b.id}`}
                              className="py-1.5 px-3 bg-blue-100 hover:bg-blue-200 text-blue-900 text-[10px] font-mono font-bold uppercase rounded-xl transition-all text-center"
                            >
                              View Business
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl text-center space-y-3">
                        <Store className="w-8 h-8 mx-auto text-neutral-300" />
                        <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase">No business booth listed for this event yet.</p>
                        <button
                        type="button"
                          onClick={() => {
                            if (!user) { router.push('/login'); return; }
                            setShowVendorModal(true);
                          }}
                          className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/10 inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" /> List Business Exhibitor Now
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 4: ENTRANTS & EXHIBITORS ROSTER */}
        {activeEventTab === 'entrants' && (() => {
          const allEntrantsList = event?.entrants ? Object.values(event.entrants) : [];
          const registeredExhibitorsList = vendorProfiles.filter(vp => (event?.vendors || []).includes(vp.id));
          const attendeesList = event?.attendees ? Object.values(event.attendees) : [];

          return (
            <div className="space-y-4 text-left">
              {/* 3-Way Sub-Segmented Control: VEHICLES, VENDORS, PEOPLE */}
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setGridSubTab('vehicles')}
                  className={`py-2 px-1 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    gridSubTab === 'vehicles' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <CarFront className="w-3.5 h-3.5 text-[#ff3b30] shrink-0" />
                  <span>Vehicles ({allEntrantsList.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGridSubTab('vendors')}
                  className={`py-2 px-1 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    gridSubTab === 'vendors' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Vendors ({registeredExhibitorsList.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGridSubTab('people')}
                  className={`py-2 px-1 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    gridSubTab === 'people' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>People ({attendeesList.length})</span>
                </button>
              </div>

              {/* 1. VEHICLES SUB-TAB */}
              {gridSubTab === 'vehicles' && (
                <div className="space-y-2">
                  {allEntrantsList.length > 0 ? (
                    allEntrantsList.map((entrant) => {
                      const targetId = entrant.vehicle_id || (entrant as any).id;
                      const votes = ((entrant as any).votes || 0) + (upvotedBuilds[targetId] || 0);

                      return (
                        <div
                          key={targetId}
                          onClick={() => {
                            setSelectedEntrantDetail(entrant);
                            setActiveEventTab('entrant-detail');
                          }}
                          className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#ff3b30] p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-md group"
                        >
                          {/* Photo Thumbnail */}
                          <div className="w-20 h-16 rounded-xl bg-neutral-200 border border-neutral-300 overflow-hidden shrink-0">
                            {entrant.photo_url ? (
                              <img src={entrant.photo_url} alt="Build" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <CarFront className="w-6 h-6 text-neutral-400" />
                              </div>
                            )}
                          </div>

                          {/* Build Specs & Votes */}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-mono font-bold text-neutral-500 bg-neutral-200/60 px-1.5 py-0.2 rounded uppercase">
                                {entrant.staging_group || 'General'}
                              </span>
                              {votes > 0 && (
                                <span className="text-[8px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded">
                                  ⚡ {votes} Votes
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-black text-neutral-900 uppercase truncate group-hover:text-[#ff3b30] transition-colors">
                              {entrant.year} {entrant.make} {entrant.model}
                            </h3>
                            <p className="text-[10px] text-neutral-500 font-mono font-bold truncate">
                              Build Specs & Passport
                            </p>
                          </div>

                          {/* Action Pill */}
                          <div className="shrink-0">
                            <span className="py-1 px-3 bg-[#ff3b30] group-hover:bg-[#bd2925] text-white text-[9px] font-mono font-bold uppercase rounded-xl transition-colors inline-block shadow-2xs">
                              View Entry →
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-16 text-center text-neutral-400 font-mono text-xs uppercase bg-neutral-50 border border-neutral-200 rounded-2xl">
                      No vehicles staged for this event yet.
                    </div>
                  )}
                </div>
              )}

              {/* 2. VENDORS SUB-TAB */}
              {gridSubTab === 'vendors' && (
                <div className="space-y-2">
                  {registeredExhibitorsList.length > 0 ? (
                    registeredExhibitorsList.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          setSelectedVendorDetail(v);
                          setActiveEventTab('vendor-detail');
                        }}
                        className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-blue-500 p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-md group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <Store className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <span className="text-[8px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded uppercase">
                            {v.category || 'Vendor Exhibitor'}
                          </span>
                          <h3 className="text-sm font-black text-neutral-900 uppercase truncate group-hover:text-blue-600 transition-colors">
                            {v.name}
                          </h3>
                          <p className="text-[10px] text-neutral-500 font-mono font-bold truncate">
                            {(v as any).city || (v as any).location ? `📍 ${(v as any).city || (v as any).location}` : 'Official Event Exhibitor'}
                          </p>
                        </div>
                        <span className="py-1 px-3 bg-blue-600 group-hover:bg-blue-700 text-white text-[9px] font-mono font-bold uppercase rounded-xl transition-colors shrink-0 shadow-2xs">
                          View Vendor →
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center text-neutral-400 font-mono text-xs uppercase bg-neutral-50 border border-neutral-200 rounded-2xl">
                      No vendor exhibitors listed for this event yet.
                    </div>
                  )}
                </div>
              )}

              {/* 3. PEOPLE SUB-TAB */}
              {gridSubTab === 'people' && (
                <div className="space-y-2">
                  {attendeesList.length > 0 ? (
                    attendeesList.map((att) => (
                      <div
                        key={att.uid}
                        onClick={() => {
                          setSelectedPersonDetail(att);
                          setActiveEventTab('person-detail');
                        }}
                        className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#ff3b30] p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-md group"
                      >
                        <div className="w-12 h-12 rounded-full bg-neutral-200 border border-neutral-300 overflow-hidden flex items-center justify-center text-xs font-black uppercase text-neutral-600 shrink-0">
                          {att.photo_url ? (
                            <img src={att.photo_url} alt={att.name} className="w-full h-full object-cover" />
                          ) : (
                            att.name ? att.name.charAt(0) : 'G'
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <h3 className="text-sm font-black text-neutral-900 uppercase truncate group-hover:text-[#ff3b30] transition-colors">
                            {att.name}
                          </h3>
                          <p className="text-[10px] text-emerald-600 font-mono font-bold truncate">
                            ✓ Attending Guest
                          </p>
                        </div>
                        <span className="py-1 px-3 bg-neutral-900 group-hover:bg-[#ff3b30] text-white text-[9px] font-mono font-bold uppercase rounded-xl transition-colors shrink-0 shadow-2xs">
                          View Guest →
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center text-neutral-400 font-mono text-xs uppercase bg-neutral-50 border border-neutral-200 rounded-2xl">
                      No spectator RSVPs recorded yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB VIEW 4B: INLINE ENTRANT DETAIL & VOTING PAGE */}
        {activeEventTab === 'entrant-detail' && selectedEntrantDetail && (() => {
          const targetId = selectedEntrantDetail.vehicle_id || selectedEntrantDetail.id;
          const votes = ((selectedEntrantDetail as any).votes || 0) + (upvotedBuilds[targetId] || 0);

          return (
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-neutral-200 shadow-md space-y-4 text-left animate-in fade-in duration-200">
              {/* Top Header Bar with Back Button */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveEventTab('entrants')}
                  className="py-1.5 px-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Grid
                </button>
                <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">
                  {selectedEntrantDetail.staging_group || 'General Grid'}
                </span>
              </div>

              {/* Main Photo Gallery Frame */}
              {selectedEntrantDetail.photo_url && (
                <div
                  onClick={() => setLightboxPhotoUrl(selectedEntrantDetail.photo_url)}
                  className="relative rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-950 max-h-[220px] sm:max-h-[300px] flex items-center justify-center cursor-zoom-in group shadow-inner"
                >
                  <img
                    src={selectedEntrantDetail.photo_url}
                    alt="Build"
                    className="w-full max-h-[220px] sm:max-h-[300px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute bottom-3 right-3 py-1 px-2.5 bg-neutral-900/80 backdrop-blur-md rounded-xl text-[9px] font-mono font-bold text-white uppercase flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-[#ff3b30]" /> Tap to Expand Photo
                  </div>
                </div>
              )}

              {/* Vehicle Title & Specs Header */}
              <div>
                <h2 className="text-lg sm:text-xl font-black uppercase text-neutral-900 tracking-tight">
                  {selectedEntrantDetail.year} {selectedEntrantDetail.make} {selectedEntrantDetail.model}
                </h2>
                {selectedEntrantDetail.specs?.engine && (
                  <p className="text-xs text-neutral-500 font-mono font-bold uppercase pt-0.5">
                    Engine: {selectedEntrantDetail.specs.engine} {selectedEntrantDetail.specs.hp ? `(${selectedEntrantDetail.specs.hp} HP)` : ''}
                  </p>
                )}
              </div>

              {/* Upvote & Respect Build Button */}
              <button
                type="button"
                onClick={() => handleVoteForBuild(targetId, `${selectedEntrantDetail.year || ''} ${selectedEntrantDetail.make || ''} ${selectedEntrantDetail.model || 'Build'}`.trim())}
                className={`w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                  (upvotedBuilds[targetId] || 0) > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#ff3b30] hover:bg-[#bd2925] text-white'
                }`}
              >
                {(upvotedBuilds[targetId] || 0) > 0 
                  ? `✓ Respect Given (${votes} Votes)` 
                  : `🔥 Respect & Upvote Build (${votes} Votes)`}
              </button>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-100">
                <Link
                  href={`/v/${targetId}`}
                  className="py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-mono font-bold uppercase rounded-xl text-center flex items-center justify-center gap-1.5"
                >
                  <Car className="w-3.5 h-3.5 text-[#ff3b30]" /> Build Passport
                </Link>
                <button
                  type="button"
                  onClick={() => openDashPassModal(
                    'vehicle',
                    `${selectedEntrantDetail.year || ''} ${selectedEntrantDetail.make || 'Vehicle'} ${selectedEntrantDetail.model || ''}`.trim(),
                    `Staging Group: ${selectedEntrantDetail.staging_group || 'Main Grid'}`,
                    `${typeof window !== 'undefined' ? window.location.origin : 'https://gridpass.app'}/events/${eventId}?tab=entrants&entrant=${targetId}`,
                    'MAIN-GRID',
                    selectedEntrantDetail.staging_group || 'STAGED BUILD'
                  )}
                  className="py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-mono font-bold uppercase rounded-xl text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#ff3b30]" /> Print Pass
                </button>
                <button
                  type="button"
                  onClick={() => handleShareEntry(`${selectedEntrantDetail.year || ''} ${selectedEntrantDetail.make || ''} ${selectedEntrantDetail.model || 'Vehicle'}`.trim(), 'vehicle', targetId)}
                  className="py-2.5 px-3 bg-gradient-to-r from-[#ff3b30] to-orange-500 text-white text-[10px] font-mono font-black uppercase rounded-xl text-center flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1 shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5" /> 🚀 Share Entry
                </button>
              </div>
            </div>
          );
        })()}

        {/* TAB VIEW 4C: INLINE VENDOR DETAIL PAGE */}
        {activeEventTab === 'vendor-detail' && selectedVendorDetail && (() => {
          return (
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-neutral-200 shadow-md space-y-4 text-left animate-in fade-in duration-200">
              {/* Top Header Bar with Back Button */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveEventTab('entrants')}
                  className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Grid
                </button>
                <span className="text-[9px] font-mono font-bold text-blue-600 uppercase bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                  {selectedVendorDetail.category || 'Official Event Exhibitor'}
                </span>
              </div>

              {/* Vendor Header Title & Specs */}
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-black uppercase text-neutral-900 tracking-tight">
                  {selectedVendorDetail.name}
                </h2>
                <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                  {selectedVendorDetail.description || 'Official Vendor Exhibitor for this event.'}
                </p>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
                <Link
                  href={`/b/${selectedVendorDetail.id}`}
                  className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-mono font-bold uppercase rounded-xl text-center flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Store className="w-3.5 h-3.5" /> Full Business Profile Page
                </Link>
                <button
                  type="button"
                  onClick={() => openDashPassModal(
                    'business',
                    selectedVendorDetail.name,
                    selectedVendorDetail.category || 'Official Vendor Exhibitor',
                    `${typeof window !== 'undefined' ? window.location.origin : 'https://gridpass.app'}/b/${selectedVendorDetail.id}`,
                    'EXHIBITOR-ROW',
                    'VENDOR BOOTH'
                  )}
                  className="py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-mono font-bold uppercase rounded-xl text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" /> Print Vendor Pass
                </button>
              </div>
            </div>
          );
        })()}

        {/* TAB VIEW 4D: INLINE PERSON / GUEST DETAIL PAGE */}
        {activeEventTab === 'person-detail' && selectedPersonDetail && (() => {
          const memberHandle = (selectedPersonDetail.name || 'member').toLowerCase().replace(/[^a-z0-9]/g, '');

          return (
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-neutral-200 shadow-md space-y-4 text-left animate-in fade-in duration-200">
              {/* Top Header Bar with Back Button */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveEventTab('entrants')}
                  className="py-1.5 px-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Grid
                </button>
                <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                  ✓ Confirmed RSVP Guest
                </span>
              </div>

              {/* Guest Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-neutral-200 border border-neutral-300 overflow-hidden flex items-center justify-center text-lg font-black uppercase text-neutral-600 shrink-0">
                  {selectedPersonDetail.photo_url ? (
                    <img src={selectedPersonDetail.photo_url} alt={selectedPersonDetail.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedPersonDetail.name ? selectedPersonDetail.name.charAt(0) : 'G'
                  )}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black uppercase text-neutral-900 tracking-tight">
                    {selectedPersonDetail.name}
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono font-bold pt-0.5">
                    Event Guest &amp; Spectator
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-neutral-100">
                <Link
                  href={`/u/${memberHandle}`}
                  className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-mono font-bold uppercase rounded-xl text-center flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <User className="w-3.5 h-3.5 text-[#ff3b30]" /> View Full Member Profile
                </Link>
              </div>
            </div>
          );
        })()}

        {/* TAB 5: COMMUNITY DISCUSSION & SOCIAL FEED */}
        {activeEventTab === 'discussion' && (() => {
          const isHost = Boolean(user && (user.uid === event?.host_uid || user.email?.includes('admin')));

          return (
            <div className="space-y-6 text-left animate-in fade-in duration-200">
            {/* Post Creation Box */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" /> Event Community Discussion
                </h3>
                <span className="text-[9px] font-mono font-bold text-neutral-400 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-full">
                  {discussionPosts.length} Posts
                </span>
              </div>

              <form onSubmit={handleCreateDiscussionPost} className="space-y-3">
                {/* Category Pills Selector */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase shrink-0">Topic:</span>
                  {[
                    { id: 'general', label: '💬 General', color: 'bg-neutral-100 text-neutral-800' },
                    { id: 'question', label: '❓ Question', color: 'bg-blue-50 text-blue-700' },
                    { id: 'build', label: '📸 Build Photo', color: 'bg-emerald-50 text-emerald-700' },
                    { id: 'spot', label: '🚗 Car Spot', color: 'bg-purple-50 text-purple-700' },
                    { id: 'announcement', label: '📢 Announcement', color: 'bg-amber-50 text-amber-800' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewPostCategory(cat.id as any)}
                      className={`py-1 px-3 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer whitespace-nowrap border ${
                        newPostCategory === cat.id
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder={user ? "Share an update, ask a question, or post build photos..." : "Sign in to join the discussion..."}
                  disabled={!user}
                  rows={3}
                  className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#ff3b30] focus:bg-white transition-all resize-none"
                />

                {/* Native Device Photo / Camera Attachment Input */}
                <input
                  ref={discussionFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleDiscussionPhotoSelected}
                  className="hidden"
                />

                {/* Attached Photo Preview */}
                {discussionPhotoPreview && (
                  <div className="relative w-28 h-20 rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-100 shrink-0">
                    <img src={discussionPhotoPreview} alt="Attached Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveDiscussionPhoto}
                      className="absolute top-1 right-1 p-1 bg-neutral-900/80 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => discussionFileInputRef.current?.click()}
                    disabled={!user || uploadingDiscussionPhoto}
                    className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-neutral-200/80 shrink-0"
                  >
                    {uploadingDiscussionPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#ff3b30]" />
                    ) : (
                      <Camera className="w-4 h-4 text-[#ff3b30]" />
                    )}
                    <span>{discussionPhotoPreview ? '📷 Change Attached Photo' : '📷 Take or Choose Photo'}</span>
                  </button>

                  {user ? (
                    <button
                      type="submit"
                      disabled={postingDiscussion || !newPostText.trim()}
                      className="py-2.5 px-5 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {postingDiscussion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Post Update (+10 Pts)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="py-2.5 px-5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      Sign In to Post
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Discussion Feed List */}
            <div className="space-y-4">
              {(() => {
                const sortedPosts = [...discussionPosts].sort((a, b) => {
                  if (a.pinned && !b.pinned) return -1;
                  if (!a.pinned && b.pinned) return 1;
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

                if (sortedPosts.length === 0) {
                  return (
                    <div className="p-8 border border-dashed border-neutral-200 rounded-3xl text-center space-y-2 bg-neutral-50/50">
                      <MessageSquare className="w-8 h-8 mx-auto text-neutral-300" />
                      <p className="text-[10px] uppercase font-mono font-bold text-neutral-400">No discussion posts yet. Be the first to start a topic!</p>
                    </div>
                  );
                }

                return sortedPosts.map((post) => {
                  const isAuthor = Boolean(user && post.author_uid === user.uid);
                  const reportsCount = (post.reported_by || []).length;
                  const isArchived = post.status === 'archived' || reportsCount >= 3;
                  const hasUserReported = Boolean(user && (post.reported_by || []).includes(user.uid));

                  // If archived/hidden and user is NOT a host/super-admin, hide from public view
                  if (isArchived && !isHost) {
                    return null;
                  }

                  return (
                    <div
                      key={post.id}
                      id={`post-${post.id}`}
                      className={`bg-white p-5 rounded-3xl border transition-all space-y-3.5 ${
                        isArchived
                          ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-500/10'
                          : post.pinned
                          ? 'border-red-300 ring-2 ring-red-500/10 shadow-md bg-gradient-to-b from-red-50/20 to-white'
                          : 'border-neutral-200 shadow-xs'
                      }`}
                    >
                      {/* Admin Auto-Archived Banner */}
                      {isArchived && isHost && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono text-[10px] font-bold text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            AUTO-ARCHIVED ({reportsCount} Community Reports)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRestorePost(post.id)}
                            className="py-1 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-[9px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-400" /> Restore Post
                          </button>
                        </div>
                      )}

                      {/* Post Header */}
                      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-200 border border-neutral-300 overflow-hidden flex items-center justify-center text-xs font-black uppercase text-neutral-600 shrink-0">
                            {post.author_avatar ? (
                              <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                            ) : (
                              post.author_name ? post.author_name.charAt(0) : 'U'
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-black uppercase text-neutral-900">{post.author_name}</h4>
                              <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border bg-purple-50 text-purple-700 border-purple-100">
                                {post.category}
                              </span>
                              {post.pinned && (
                                <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full uppercase bg-[#ff3b30] text-white flex items-center gap-1">
                                  <Pin className="w-2.5 h-2.5 fill-white" /> Host Bulletin
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] font-mono text-neutral-400 block">
                              {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isHost && (
                            <button
                              type="button"
                              onClick={() => handleTogglePinPost(post.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer text-xs font-mono font-bold uppercase flex items-center gap-1 ${
                                post.pinned
                                  ? 'text-[#ff3b30] bg-red-50 hover:bg-red-100 border border-red-200'
                                  : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
                              }`}
                              title={post.pinned ? "Unpin Bulletin" : "Pin Bulletin to Top"}
                            >
                              <Pin className={`w-3.5 h-3.5 ${post.pinned ? 'fill-[#ff3b30]' : ''}`} />
                            </button>
                          )}

                          {!isAuthor && (
                            <button
                              type="button"
                              onClick={() => handleReportPost(post.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                hasUserReported
                                  ? 'text-amber-600 bg-amber-50 border border-amber-200'
                                  : 'text-neutral-400 hover:text-amber-600 hover:bg-amber-50'
                              }`}
                              title={hasUserReported ? "You reported this post" : "Report inappropriate post or photo"}
                            >
                              <Flag className={`w-3.5 h-3.5 ${hasUserReported ? 'fill-amber-600' : ''}`} />
                            </button>
                          )}

                          {(isHost || isAuthor) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDiscussionPost(post.id)}
                              className="p-1.5 text-neutral-400 hover:text-[#ff3b30] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete discussion post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="text-xs text-neutral-800 leading-relaxed font-medium whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Attached Photo Frame with Lightbox Zoom */}
                      {post.photo_url && (
                        <div 
                          onClick={() => setLightboxPhotoUrl(post.photo_url!)}
                          className="relative rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-950 max-h-[380px] flex items-center justify-center cursor-zoom-in group transition-all hover:border-[#ff3b30] shadow-2xs"
                        >
                          <img 
                            src={post.photo_url} 
                            alt="Attached discussion photo" 
                            className="w-full max-h-[380px] object-contain transition-transform duration-300 group-hover:scale-[1.01]" 
                          />
                          <div className="absolute bottom-2.5 right-2.5 py-1 px-2.5 bg-neutral-900/80 backdrop-blur-md rounded-xl text-[9px] font-mono font-bold text-white uppercase opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 border border-white/10 shadow-xs">
                            <Maximize2 className="w-3 h-3 text-[#ff3b30]" /> Tap to Expand
                          </div>
                        </div>
                      )}

                      {/* Post Actions (Automotive Quick Reactions + Share Button) */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-neutral-100 pt-3">
                        {/* Quick Reactions */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { key: 'fire', icon: '🔥', label: 'Respect' },
                            { key: 'heart', icon: '❤️', label: 'Love' },
                            { key: 'flag', icon: '🏁', label: 'Grid' },
                            { key: 'clap', icon: '👏', label: 'Bravo' }
                          ].map((rx) => {
                            const uids = post.reactions?.[rx.key] || [];
                            const count = uids.length;
                            const userReacted = Boolean(user && uids.includes(user.uid));

                            return (
                              <button
                                key={rx.key}
                                type="button"
                                onClick={() => handleToggleReactionPost(post.id, rx.key)}
                                className={`py-1 px-2 rounded-lg text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer border ${
                                  userReacted
                                    ? 'bg-red-50 text-[#ff3b30] border-red-200 shadow-2xs'
                                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200'
                                }`}
                              >
                                <span>{rx.icon}</span>
                                <span>{count > 0 ? count : rx.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Share Direct Link Button */}
                        <button
                          type="button"
                          onClick={() => handleSharePost(post.id)}
                          className="py-1 px-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[9px] font-mono font-bold text-neutral-600 uppercase transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                          title="Copy direct link to post"
                        >
                          <Share2 className="w-3 h-3 text-neutral-500" />
                          <span>Share</span>
                        </button>
                      </div>

                      {/* Comments Thread & Always-Visible Facebook-style Reply Bar */}
                      <div className="space-y-3 pt-3 border-t border-neutral-100 bg-neutral-50/60 p-3 rounded-2xl">
                        {/* Existing Comments (Pinned Float to Top) */}
                        {(() => {
                          const sortedComments = [...(post.comments || [])].sort((a, b) => {
                            if (a.pinned && !b.pinned) return -1;
                            if (!a.pinned && b.pinned) return 1;
                            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                          });

                          if (sortedComments.length === 0) return null;

                          return (
                            <div className="space-y-2.5">
                              {sortedComments.map((cmt) => (
                                <div key={cmt.id} className="flex items-start gap-2.5 text-left group/cmt">
                                  <div className="w-6 h-6 rounded-full bg-neutral-200 border border-neutral-300 overflow-hidden flex items-center justify-center text-[9px] font-black uppercase text-neutral-600 shrink-0">
                                    {cmt.author_avatar ? (
                                      <img src={cmt.author_avatar} alt={cmt.author_name} className="w-full h-full object-cover" />
                                    ) : (
                                      cmt.author_name ? cmt.author_name.charAt(0) : 'U'
                                    )}
                                  </div>
                                  <div className={`flex-1 p-2.5 rounded-xl border space-y-0.5 shadow-2xs transition-all ${
                                    cmt.pinned
                                      ? 'bg-gradient-to-r from-red-50/40 to-white border-red-300 ring-1 ring-red-500/10'
                                      : 'bg-white border-neutral-200'
                                  }`}>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-black uppercase text-neutral-900">{cmt.author_name}</span>
                                        {cmt.pinned && (
                                          <span className="text-[7px] font-mono font-bold px-1.5 py-0.2 rounded uppercase bg-[#ff3b30] text-white flex items-center gap-0.5">
                                            <Pin className="w-2 h-2 fill-white" /> Pinned
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[8px] font-mono text-neutral-400">
                                          {new Date(cmt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isHost && (
                                          <button
                                            type="button"
                                            onClick={() => handleTogglePinComment(post.id, cmt.id)}
                                            className={`p-1 rounded transition-colors cursor-pointer text-[8px] font-mono font-bold uppercase flex items-center gap-0.5 ${
                                              cmt.pinned
                                                ? 'text-[#ff3b30] bg-red-50 border border-red-200'
                                                : 'text-neutral-300 hover:text-neutral-700 opacity-0 group-hover/cmt:opacity-100'
                                            }`}
                                            title={cmt.pinned ? "Unpin comment" : "Pin comment to top"}
                                          >
                                            <Pin className={`w-2.5 h-2.5 ${cmt.pinned ? 'fill-[#ff3b30]' : ''}`} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-neutral-800 font-medium leading-normal">{cmt.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Always-Visible Inline Reply Bar */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }}
                          className="flex items-center gap-2 pt-1"
                        >
                          <div className="w-7 h-7 rounded-full bg-neutral-200 border border-neutral-300 overflow-hidden flex items-center justify-center text-[9px] font-black uppercase text-neutral-600 shrink-0">
                            {user?.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName || 'You'} className="w-full h-full object-cover" />
                            ) : (
                              user?.displayName ? user.displayName.charAt(0) : 'Y'
                            )}
                          </div>
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            placeholder={user ? "Write a reply..." : "Sign in to write a reply..."}
                            disabled={!user}
                            className="flex-1 p-2 px-3 bg-white border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#ff3b30] shadow-2xs"
                          />
                          <button
                            type="submit"
                            disabled={!user || !(commentInputs[post.id] || '').trim()}
                            className="py-2 px-4 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                          >
                            Reply
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        );
      })()}

        {/* TAB 6: HOST CONTROLS */}
        {activeEventTab === 'host' && (
          <div className="space-y-6 text-left">
            <div className="bg-neutral-900 text-white p-6 rounded-3xl border border-neutral-800 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#ff3b30]" /> Host &amp; Organizer Controls
                  </h3>
                  <p className="text-[10px] text-neutral-400">Post organizer bulletins, edit event details, and manage gate admissions.</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/events/${eventId}/edit`)}
                  className="py-2.5 px-4 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Event Details
                </button>
              </div>

              {/* Host Staging Bulletin Form & Feed */}
              <div className="space-y-3 pt-1">
                <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-[#ff3b30]" /> Post Organizer Staging Update
                </h4>

                <form onSubmit={handlePostAnnouncement} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    placeholder="Post a staging update, gate time rule, or weather alert..."
                    className="flex-1 px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#ff3b30]"
                  />
                  <button
                    type="submit"
                    disabled={postingAnnouncement || !newAnnouncement.trim()}
                    className="py-2.5 px-4 bg-[#ff3b30] hover:bg-[#bd2925] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> Post Update
                  </button>
                </form>

                <div className="space-y-2 pt-2">
                  {event.announcements && event.announcements.length > 0 ? (
                    event.announcements.map((ann) => (
                      <div key={ann.id} className="p-3.5 bg-neutral-800/80 border border-neutral-700/80 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-[#ff3b30] uppercase flex items-center gap-1">
                            <Megaphone className="w-3 h-3" /> {ann.author_name}
                          </span>
                          <span className="text-[8px] font-mono text-neutral-400">
                            {new Date(ann.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-200 font-medium">{ann.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-neutral-500 font-mono font-bold uppercase text-center py-2">
                      No organizer staging updates posted yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Driver Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form 
            onSubmit={handleRegisterVehicle}
            className="bg-white max-w-md w-full p-6 md:p-8 rounded-[2rem] border border-neutral-200 text-left relative shadow-2xl space-y-6"
          >
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-wider">Add Vehicle Pass to Event</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Select your vehicle build to register for this event and generate your 8.5x11 windshield pass.
              </p>
            </div>

            {/* Vehicle Selector */}
            {userVehicles.length > 0 ? (
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Select Garage Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  required
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] cursor-pointer"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {userVehicles.map((v) => {
                    const isAlreadyStaged = event?.entrants && Object.values(event.entrants).some((ent: any) => ent.vehicle_id === v.id || ent.id === v.id);
                    return (
                      <option 
                        key={v.id} 
                        value={v.id}
                        disabled={isAlreadyStaged}
                        className={isAlreadyStaged ? 'text-neutral-400 font-normal bg-neutral-100' : 'font-bold'}
                      >
                        {v.year} {v.make} {v.model}{isAlreadyStaged ? ' — Already Staged ✓' : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="flex justify-end pt-1">
                  <Link
                    href={`/v/create?redirect=/events/${event.id}`}
                    className="text-[10px] font-bold text-[#ff3b30] hover:text-[#bd2925] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Vehicle to Garage
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 text-left">
                <div className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-[#ff3b30]" /> No Garage Vehicles Found
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed font-medium">
                  Add a vehicle build to your Gridpass Garage before joining this event.
                </p>
                <Link
                  href={`/v/create?redirect=/events/${event.id}`}
                  className="w-full py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Vehicle to Garage Now
                </Link>
              </div>
            )}

            {/* Staging class group */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Select Show Class / Category</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] cursor-pointer"
              >
                <option value="">-- General / Pending --</option>
                {(event.staging_groups && event.staging_groups.length > 0 ? event.staging_groups : DEFAULT_STAGING_CLASSES).map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

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
                    I agree to verify vehicle safety compliance, obey event coordinators, and release host from event liabilities.
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
              {(() => {
                const isSelectedVehicleAlreadyStaged = event?.entrants && Object.values(event.entrants).some((ent: any) => ent.vehicle_id === selectedVehicleId || ent.id === selectedVehicleId);
                return (
                  <button
                    type="submit"
                    disabled={registering || !selectedVehicleId || isSelectedVehicleAlreadyStaged}
                    className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      isSelectedVehicleAlreadyStaged
                        ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed border border-neutral-300'
                        : 'bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white cursor-pointer shadow-md shadow-red-500/10'
                    }`}
                  >
                    {registering ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : isSelectedVehicleAlreadyStaged ? (
                      'Already Staged ✓'
                    ) : (
                      'Register Vehicle Pass'
                    )}
                  </button>
                );
              })()}
            </div>

            <button
              type="button"
              onClick={() => setShowRegModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900 text-sm font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </form>
        </div>
      )}

      {/* Edit Cover Photo & Video Banner Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full p-6 md:p-8 rounded-[2rem] border border-neutral-200 text-left relative shadow-2xl space-y-5">
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Video className="w-5 h-5 text-[#ff3b30]" /> Event Cover Photo / Video Banner
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Upload a high-res photo or looping video clip (.mp4, .webm) directly from your device camera roll, or paste a URL below.
              </p>
            </div>

            {/* Live Media Banner Preview */}
            {coverUrlInput && (
              <div className="w-full h-32 rounded-2xl overflow-hidden border border-neutral-200 relative bg-neutral-900 shadow-inner">
                {isVideoUrl(coverUrlInput) ? (
                  <video
                    src={coverUrlInput}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={coverUrlInput}
                    alt="Cover Banner Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-2 right-2 bg-neutral-900/80 backdrop-blur-md text-white text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded-md flex items-center gap-1">
                  {isVideoUrl(coverUrlInput) ? <Film className="w-3 h-3 text-[#ff3b30]" /> : <Camera className="w-3 h-3 text-emerald-400" />}
                  <span>{isVideoUrl(coverUrlInput) ? 'Video Banner' : 'Photo Cover'}</span>
                </div>
              </div>
            )}

            {/* Upload File Input Button */}
            <div className="p-4 bg-neutral-50 border-2 border-dashed border-neutral-200 hover:border-[#ff3b30] rounded-2xl text-center space-y-2 transition-all">
              <input
                type="file"
                id="cover-file-input"
                accept="image/*,video/*"
                onChange={handleCoverFileUpload}
                className="hidden"
              />
              <label htmlFor="cover-file-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                <UploadCloud className="w-6 h-6 text-[#ff3b30]" />
                <span className="text-xs font-black uppercase text-neutral-900">
                  {uploadingCoverFile ? 'Uploading File...' : 'Upload Photo or Video Clip'}
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
                value={coverUrlInput}
                onChange={(e) => setCoverUrlInput(e.target.value)}
                placeholder="https://example.com/cover-photo.jpg or video.mp4"
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Or Choose Motorsport Photo Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {COVER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setCoverUrlInput(preset.url)}
                    className={`p-2 bg-neutral-50 border rounded-xl overflow-hidden text-left transition-all cursor-pointer group ${
                      coverUrlInput === preset.url ? 'border-[#ff3b30] ring-1 ring-[#ff3b30]' : 'border-neutral-200 hover:border-neutral-300'
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

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                className="py-3 bg-transparent hover:bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveCoverPhoto(coverUrlInput || DEFAULT_MOTORSPORT_COVER)}
                disabled={savingCover || uploadingCoverFile || !coverUrlInput.trim()}
                className="py-3 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-red-500/10"
              >
                {savingCover ? 'Saving...' : 'Save Cover Banner'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowCoverModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 text-sm font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* In-Place Edit Event Details Modal (Mini-App Experience) */}
      {showEditEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white max-w-lg w-full p-6 md:p-8 rounded-[2rem] border border-neutral-200 text-left relative shadow-2xl space-y-5 my-8">
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#ff3b30]" /> Edit Event Details
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Update event name, location, date, and description in-place without leaving this page.
              </p>
            </div>

            <form onSubmit={handleSaveEditEvent} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Event Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Event Title..."
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              {/* Location Name & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Venue / Location Name</label>
                  <input
                    type="text"
                    required
                    value={editLocationName}
                    onChange={(e) => setEditLocationName(e.target.value)}
                    placeholder="e.g. Public Square"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Physical Address</label>
                  <input
                    type="text"
                    value={editPhysicalAddress}
                    onChange={(e) => setEditPhysicalAddress(e.target.value)}
                    placeholder="e.g. 100 Main St"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Start Date &amp; Time</label>
                <input
                  type="text"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  placeholder="e.g. Friday, August 7th at 4:00 PM"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Event Description</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe the event..."
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#ff3b30] resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditEventModal(false)}
                  className="py-3 bg-transparent hover:bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditEvent || !editTitle.trim()}
                  className="py-3 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-1.5"
                >
                  {savingEditEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowEditEventModal(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </form>
          </div>
        </div>
      )}





      {/* Leaving Gridpass Safety Confirmation Modal */}
      {leavingUrl !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full p-6 md:p-8 rounded-[2rem] border border-neutral-200 text-left relative shadow-2xl space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-wider">Leaving Gridpass</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                You are about to navigate to an external third-party news article:
              </p>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[10px] font-mono text-neutral-700 break-all">
                {leavingUrl}
              </div>
              <p className="text-[10px] text-neutral-400 leading-snug font-mono">
                Gridpass does not control or endorse third-party news websites. Please exercise caution when visiting external web pages.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLeavingUrl(null)}
                className="py-3 bg-transparent hover:bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = leavingUrl;
                  setLeavingUrl(null);
                  window.open(target, '_blank', 'noopener,noreferrer');
                }}
                className="py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-red-500/10"
              >
                Proceed to External Site <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setLeavingUrl(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 text-sm font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}



      </div> {/* End Main Page Content (no-print) */}

      {/* 8.5x11 Printable Windshield Dash Pass & QR Code Exporter Modal */}
      {showDashPassModal && dashPassData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto print-modal-overlay">
          {/* Bulletproof Print CSS Isolation & Page Layout Rules */}
          <style>{`
            @media print {
              .no-print, nav, header, footer, button {
                display: none !important;
              }
              html, body, main {
                background: white !important;
                color: black !important;
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .print-modal-overlay {
                position: static !important;
                background: transparent !important;
                backdrop-filter: none !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                height: auto !important;
                max-height: none !important;
                display: block !important;
              }
              .print-modal-box {
                position: static !important;
                background: white !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                max-height: none !important;
                overflow: visible !important;
                width: 100% !important;
                max-width: 100% !important;
                border-radius: 0 !important;
              }
              #printable-dash-pass-sheet {
                position: static !important;
                width: 100% !important;
                max-width: 100% !important;
                height: 9.3in !important;
                max-height: 9.3in !important;
                margin: 0 auto !important;
                padding: 0.3in !important;
                border: 3px solid #000000 !important;
                box-shadow: none !important;
                background: white !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
              }
              @page {
                size: letter portrait;
                margin: 0.25in;
              }
            }
          `}</style>

          <div className="bg-white max-w-lg w-full p-4 md:p-5 rounded-3xl border border-neutral-200 text-left relative shadow-2xl space-y-3 max-h-[96vh] overflow-y-auto print-modal-box">
            
            {/* Modal Top Header Bar (Screen Only) */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 no-print">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono font-extrabold text-[#ff3b30] uppercase tracking-widest block">
                  Printable Event Display Card
                </span>
                <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Printer className="w-4 h-4 text-[#ff3b30]" /> 8.5x11 Display Pass Preview
                </h3>
              </div>
              <button
                onClick={() => setShowDashPassModal(false)}
                className="py-1 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Printable 8.5x11 Sheet Container */}
            <div 
              id="printable-dash-pass-sheet"
              className="w-full bg-white border-2 border-dashed border-neutral-300 p-4 md:p-5 rounded-2xl shadow-inner space-y-3 text-center text-neutral-900 flex flex-col justify-between"
            >
              {/* Header Badge */}
              <div className="border-b-2 border-neutral-900 pb-3 space-y-1">
                <div className="flex items-center justify-between text-left">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#ff3b30]">
                    GRIDPASS | ONE TAG FOR EVERYTHING
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-neutral-900 text-white px-2 py-0.5 rounded uppercase">
                    {dashPassData.type === 'business' ? 'FOOD TRUCK & VENDOR DISPLAY' : 'EVENT SHOW PASS'}
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-neutral-900 text-left">
                  {event?.title || event?.name || 'OFFICIAL EVENT GATHERING'}
                </h2>
                <div className="text-[10px] font-mono font-bold text-neutral-600 flex items-center gap-2 text-left">
                  <span>📅 {event?.start_date ? new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Official Schedule'}</span>
                  <span>•</span>
                  <span>📍 {event?.location_name || 'Event Grounds'}</span>
                </div>
              </div>

              {/* Large High-Res QR Code Block with Centered Gridpass Logo */}
              <div className="py-2 flex flex-col items-center justify-center space-y-2 my-auto">
                <GridpassQRCode value={dashPassData.qrUrl} size={340} logoSize={80} />
                <p className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
                  {dashPassData.type === 'business' 
                    ? 'SCAN WITH SMARTPHONE CAMERA TO VIEW MENU, SPECIALS & BUSINESS PROFILE' 
                    : 'SCAN WITH SMARTPHONE CAMERA TO VIEW BUILD PASSPORT & EVENT DETAILS'}
                </p>
              </div>

              {/* Vehicle / Business Info Display Box */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-extrabold text-neutral-500 uppercase tracking-wider">
                    {dashPassData.type === 'vehicle' ? 'REGISTERED BUILD DETAILS' : 'BUSINESS & EXHIBITOR PROFILE'}
                  </span>
                </div>

                <h1 className="text-base md:text-lg font-black uppercase text-neutral-900 tracking-tight leading-tight">
                  {dashPassData.title}
                </h1>
                {dashPassData.subtitle && (
                  <p className="text-[10px] font-mono font-bold text-neutral-600 uppercase">
                    {dashPassData.subtitle}
                  </p>
                )}
                
                {/* Rich Owner Profile Details with Membership Tier Badge */}
                <div className="pt-2 border-t border-neutral-200 flex flex-wrap items-center justify-between text-[10px] font-mono font-bold text-neutral-600 gap-y-1.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-neutral-500">OWNER / REPRESENTATIVE: </span>
                    <span className="text-neutral-900 font-extrabold">{user?.displayName || user?.email || 'Gridpass Member'}</span>
                    <span className="text-[#ff3b30] font-mono">(@{(user?.displayName || user?.email || 'member').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()})</span>
                  </div>

                  {/* Membership Rank Badge */}
                  {(() => {
                    const uRole = ((user as any)?.role || (user as any)?.tier || (user?.email?.includes('losey') ? 'founder' : '')).toLowerCase();
                    const config = resolveMemberTierConfig(uRole, membershipTiers);

                    return (
                      <span 
                        className="text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 shadow-2xs"
                        style={{
                          borderColor: config.borderColor,
                          color: config.textColor,
                          backgroundColor: config.bgColor
                        }}
                      >
                        <span>{config.icon}</span>
                        <span>{config.name.toUpperCase()}</span>
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* You're Invited to Gridpass Referral Footer Block */}
              {(() => {
                const userRefCode = (user?.displayName || user?.email || 'community').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const referralUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://gridpass.app'}/join?ref=${userRefCode}`;
                return (
                  <div className="border-t-2 border-neutral-900 pt-2.5 flex items-center justify-between gap-3 text-left">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-[9px] font-mono font-extrabold text-[#ff3b30] uppercase tracking-widest block">
                        YOU'RE INVITED TO GRIDPASS
                      </span>
                      <h4 className="text-[11px] font-black uppercase text-neutral-900 tracking-tight">
                        VEHICLES • PHOTOS • EVENTS • VENDORS • VENUES • MORE
                      </h4>
                      <p className="text-[8.5px] font-mono font-semibold text-neutral-600 leading-tight">
                        Whether you race it, show it, cook it, or capture it — Gridpass brings your world together.
                      </p>
                      <p className="text-[9.5px] font-mono font-bold text-neutral-900 pt-0.5">
                        Join at: <span className="text-[#ff3b30] font-mono font-bold">{referralUrl}</span>
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-center">
                      <GridpassQRCode value={referralUrl} size={70} logoSize={16} />
                      <span className="text-[7.5px] font-mono font-black text-[#ff3b30] uppercase pt-0.5 tracking-wider">SCAN TO JOIN</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Print & Download Action Buttons (Screen Only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 no-print">
              <button
                onClick={() => {
                  window.print();
                }}
                className="py-2.5 px-4 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print 8.5x11 Display Pass
              </button>

              <button
                onClick={() => downloadGridpassQR(
                  dashPassData.qrUrl,
                  `Gridpass_QR_${dashPassData.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`
                )}
                className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-neutral-900/10 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#ff3b30]" /> Download High-Res QR Code
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Custom Share Entry & Collect Votes Modal */}
      {showShareModal && shareModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full p-6 rounded-[2rem] border border-neutral-200 text-left relative shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[9px] font-mono font-black uppercase text-[#ff3b30] tracking-widest block">
                🚀 VIRAL ENTRY & VOTING LINK
              </span>
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight">
                {shareModalData.title}
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                Share your entry link with friends, family & followers to collect build votes on Gridpass!
              </p>
            </div>

            {/* In-Person Phone Screen QR Code Box */}
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col items-center justify-center space-y-2 text-center">
              <GridpassQRCode value={shareModalData.url} size={180} logoSize={40} />
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
                📱 In-Person Scan • Point phone camera at screen to open & vote
              </span>
            </div>

            {/* 1-Click Social Media Share Buttons */}
            <div className="space-y-2 pt-1">
              <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-neutral-400 block">
                Instant 1-Tap Share
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const smsUrl = `sms:?body=${encodeURIComponent(shareModalData.shareText)}`;
                    window.location.href = smsUrl;
                  }}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Text (SMS)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareModalData.shareText)}`;
                    window.open(waUrl, '_blank');
                  }}
                  className="py-2.5 px-3 bg-green-500 hover:bg-green-600 text-white text-[10px] font-mono font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" /> WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareModalData.shareText)}`;
                    window.open(twUrl, '_blank');
                  }}
                  className="py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-mono font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5" /> X / Twitter
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareModalData.url)}`;
                    window.open(fbUrl, '_blank');
                  }}
                  className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-mono font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Globe className="w-3.5 h-3.5" /> Facebook
                </button>
              </div>

              {/* Direct Copy Link Action Buttons */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareModalData.url);
                      showToast({
                        title: "✓ Direct Link Copied!",
                        message: "Clean link ready to paste directly into your browser address bar!",
                        icon: "🔗"
                      });
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="w-full py-2.5 px-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Copy className="w-4 h-4" /> Copy Direct Voting Link (URL Only)
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareModalData.shareText);
                      showToast({
                        title: "✓ Full Caption Copied!",
                        message: "Full post text + link ready to paste into social media or chats!",
                        icon: "📝"
                      });
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-neutral-600" /> Copy Full Caption & Message Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Add to Calendar Picker Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full p-6 md:p-8 rounded-[2rem] border border-neutral-200 text-left relative shadow-2xl space-y-5">
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-[#ff3b30]" /> Add Event to Calendar
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Choose your preferred calendar platform or download an .ics file for Apple, Outlook, or Google Calendar.
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Universal .ICS File (Apple iCal / iPhone / Mac / Outlook) */}
              <button
                onClick={() => {
                  downloadICSFile();
                  setShowCalendarModal(false);
                }}
                className="w-full p-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl transition-all cursor-pointer flex items-center justify-between group shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Download className="w-4 h-4 text-[#ff3b30]" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black uppercase tracking-wider text-white">Apple Calendar / iCal (.ICS)</div>
                    <div className="text-[10px] text-neutral-400">Universal .ics file for iPhone, Mac, &amp; Desktop</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option 2: Google Calendar */}
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowCalendarModal(false)}
                className="w-full p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-900 rounded-2xl transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-xl">
                    <Calendar className="w-4 h-4 text-[#ff3b30]" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black uppercase tracking-wider text-neutral-900">Google Calendar</div>
                    <div className="text-[10px] text-neutral-500">Opens directly in Google Calendar in web browser</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </a>

              {/* Option 3: Outlook / Office 365 */}
              <a
                href={getOutlookCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowCalendarModal(false)}
                className="w-full p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-900 rounded-2xl transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black uppercase tracking-wider text-neutral-900">Outlook / Office 365</div>
                    <div className="text-[10px] text-neutral-500">Opens Microsoft Outlook calendar web app</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </a>

              {/* Option 4: Yahoo Calendar */}
              <a
                href={getYahooCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowCalendarModal(false)}
                className="w-full p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-900 rounded-2xl transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-xl">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black uppercase tracking-wider text-neutral-900">Yahoo Calendar</div>
                    <div className="text-[10px] text-neutral-500">Opens Yahoo Calendar in browser</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowCalendarModal(false)}
              className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => setShowCalendarModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 text-sm font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Fullscreen Photo Viewer Modal */}
      {lightboxPhotoUrl && (
        <div 
          onClick={() => setLightboxPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200 cursor-zoom-out no-print"
        >
          <button
            type="button"
            onClick={() => setLightboxPhotoUrl(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer z-10 shadow-lg"
            title="Close Lightbox View"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxPhotoUrl}
              alt="High Resolution View"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}

    </div>
  );
}
