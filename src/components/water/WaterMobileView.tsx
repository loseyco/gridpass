'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Compass, Eye, EyeOff, Crosshair, Plus, X, ShieldCheck, 
  AlertTriangle, Check, Info, Building2, Edit3, Trash2, 
  Loader2, HelpCircle, Send, Battery, Wifi, User, Waves,
  Shield, Navigation2, Flame, MapPin, Settings, BarChart2, Share2, Layers, Search
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { SEEDED_VENUES, SEEDED_SPOTS, SEEDED_FRIENDS } from '@/lib/data/venues';
import { Venue, VenueSpot, FriendBeacon } from '@/lib/types/venue';
import { auth, db } from '@/lib/firebase/config';
import { signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, deleteDoc, collection, query, where, onSnapshot, getDoc } from 'firebase/firestore';

const VEHICLE_EMOJIS = {
  boat: '🛥️',
  pwc: '🚤',
  jeep: '🚙',
  bike: '🏍️',
  other: '🧭'
};

interface WaterMobileViewProps {
  venueId?: string;
}

export default function WaterMobileView({ venueId }: WaterMobileViewProps) {
  const { user } = useAuth();
  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;
  const [sessionUid] = useState(() => 'guest-' + Math.random().toString(36).substring(2, 11));

  // Venue matching state
  const [venue, setVenue] = useState<Venue>(() => {
    if (venueId) {
      return SEEDED_VENUES.find(v => v.id === venueId) || SEEDED_VENUES[0];
    }
    return SEEDED_VENUES[0];
  });

  const [activeMode, setActiveMode] = useState<Venue['type']>(() => {
    if (venueId) {
      const seeded = SEEDED_VENUES.find(v => v.id === venueId);
      return seeded ? seeded.type : 'waterway';
    }
    return 'waterway';
  });

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const friendMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const spotMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tempGoogleMarkerRef = useRef<L.Marker | null>(null);
  const pendingSpotMarkerRef = useRef<L.Marker | null>(null);
  const hasCenteredOnGpsRef = useRef<boolean>(false);

  // Drag-and-drop location override states
  const [pendingSpotCoords, setPendingSpotCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [editSpotCoords, setEditSpotCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Map Fine-Tuning states
  const [isFineTuning, setIsFineTuning] = useState<boolean>(false);
  const [fineTuneTarget, setFineTuneTarget] = useState<'add' | 'edit'>('add');
  const [fineTuneBackupCoords, setFineTuneBackupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapBackup, setMapBackup] = useState<{ center: L.LatLng; zoom: number } | null>(null);

  // Inline Auth Sheet states
  const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [showProfileSheet, setShowProfileSheet] = useState<boolean>(false);

  // Core application states
  const [nickname, setNickname] = useState<string>('Guest');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [visibility, setVisibility] = useState<'ghost' | 'friends' | 'public'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gridpass_water_visibility');
      if (saved === 'ghost' || saved === 'friends' || saved === 'public') {
        return saved;
      }
    }
    return 'ghost';
  });

  // Persist visibility state across page reloads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gridpass_water_visibility', visibility);
    }
  }, [visibility]);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  // Interactive panels
  const [showTelemetry, setShowTelemetry] = useState<boolean>(false);
  const [selectedSpot, setSelectedSpot] = useState<VenueSpot | null>(null);
  const [showAddSpot, setShowAddSpot] = useState<boolean>(false);
  const [showEditSpot, setShowEditSpot] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchSourceFilter, setSearchSourceFilter] = useState<'all' | 'gridpass' | 'google'>('gridpass');
  const [tempGoogleSpot, setTempGoogleSpot] = useState<any | null>(null);

  // SOS States
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [isSosActive, setIsSosActive] = useState<boolean>(false);
  const [checkInToastMsg, setCheckInToastMsg] = useState<string | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Follow GPS and Wake Lock states & refs
  const [followMe, setFollowMe] = useState<boolean>(true);
  const followMeRef = useRef<boolean>(true);
  const updateFollowMe = (val: boolean) => {
    setFollowMe(val);
    followMeRef.current = val;
  };

  const [activeVehicleId, setActiveVehicleId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gridpass_active_vehicle_id');
      if (saved) return saved;
    }
    return 'guest-boat';
  });

  const [userVehicles, setUserVehicles] = useState<any[]>([]);
  const [allTrails, setAllTrails] = useState<{[vehicleId: string]: { points: {lat: number; lng: number}[]; name: string; color: string }}>({});

  const GUEST_VEHICLES = [
    { id: 'guest-boat', make: 'Guest', model: 'Boat' },
    { id: 'guest-pwc', make: 'Guest', model: 'PWC' },
    { id: 'guest-jeep', make: 'Guest', model: 'Jeep' },
    { id: 'guest-bike', make: 'Guest', model: 'Bike' }
  ];

  const getVehicleDetails = (make: string = '', model: string = '') => {
    const fullStr = `${make} ${model}`.toLowerCase();
    if (fullStr.includes('jet') || fullStr.includes('pwc') || fullStr.includes('sea-doo') || fullStr.includes('wave') || fullStr.includes('superjet') || fullStr.includes('waverunner')) {
      return { type: 'pwc' as const, emoji: '🚤', color: '#38bdf8' };
    }
    if (fullStr.includes('boat') || fullStr.includes('pontoon') || fullStr.includes('yacht') || fullStr.includes('craft') || fullStr.includes('marine')) {
      return { type: 'boat' as const, emoji: '🛥️', color: '#60a5fa' };
    }
    if (fullStr.includes('jeep') || fullStr.includes('wrangler') || fullStr.includes('ford') || fullStr.includes('truck') || fullStr.includes('4x4') || fullStr.includes('toyota') || fullStr.includes('bronco')) {
      return { type: 'jeep' as const, emoji: '🚙', color: '#f59e0b' };
    }
    if (fullStr.includes('bike') || fullStr.includes('moto') || fullStr.includes('harley') || fullStr.includes('kawasaki') || fullStr.includes('yamaha') || fullStr.includes('honda') || fullStr.includes('ktm') || fullStr.includes('suzuki') || fullStr.includes('bicycle')) {
      return { type: 'bike' as const, emoji: '🏍️', color: '#10b981' };
    }
    return { type: 'other' as const, emoji: '🧭', color: '#ec4899' };
  };

  const getActiveVehicle = () => {
    const list = user ? userVehicles : GUEST_VEHICLES;
    return list.find(v => v.id === activeVehicleId) || list[0] || GUEST_VEHICLES[0];
  };

  const activeVehicle = getActiveVehicle();
  const activeVehicleDetails = getVehicleDetails(activeVehicle?.make, activeVehicle?.model);

  const updateActiveVehicleId = (id: string) => {
    setActiveVehicleId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gridpass_active_vehicle_id', id);
    }
  };

  // Review states
  const [showReviewSheet, setShowReviewSheet] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [reviewFreeSlips, setReviewFreeSlips] = useState<'yes' | 'no' | 'unknown'>('unknown');
  const [reviewLaunchCost, setReviewLaunchCost] = useState<string>('None');
  const [reviewFoodType, setReviewFoodType] = useState<string>('None');
  const [reviewPros, setReviewPros] = useState<string>('');
  const [reviewCons, setReviewCons] = useState<string>('');

  const handleReviewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setReviewPhotos(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpot) return;

    const newNote = {
      user: nickname || 'Rider',
      text: reviewText,
      rating: reviewRating,
      timestamp: new Date().toISOString(),
      photo_urls: reviewPhotos,
      tags: [
        reviewFreeSlips === 'yes' ? '🆓 Free Slips' : reviewFreeSlips === 'no' ? '🚫 No Free Slips' : null,
        reviewLaunchCost !== 'None' ? `💸 Launch: ${reviewLaunchCost}` : null,
        reviewFoodType !== 'None' ? `🍔 Food: ${reviewFoodType}` : null,
        reviewPros ? `👍 Pros: ${reviewPros}` : null,
        reviewCons ? `👎 Cons: ${reviewCons}` : null
      ].filter(Boolean) as string[]
    };

    const updatedNotes = [...(selectedSpot.notes || []), newNote];
    const updatedSpot = {
      ...selectedSpot,
      notes: updatedNotes
    };

    setSelectedSpot(updatedSpot);

    // Update local spots list
    setSpots(prev => prev.map(s => s.id === selectedSpot.id ? updatedSpot : s));

    // Update in Firestore
    if (!isMock) {
      const spotRef = doc(db, 'spots', selectedSpot.id);
      await setDoc(spotRef, { notes: updatedNotes }, { merge: true }).catch(console.error);
    }

    // Reset form
    setReviewText('');
    setReviewRating(5);
    setReviewPhotos([]);
    setReviewFreeSlips('unknown');
    setReviewLaunchCost('None');
    setReviewFoodType('None');
    setReviewPros('');
    setReviewCons('');
    setShowReviewSheet(false);
    setCheckInToastMsg("Review submitted successfully!");
    setTimeout(() => setCheckInToastMsg(null), 3000);
  };

  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const wakeLockSentinelRef = useRef<any>(null);

  // Path history (marching ants breadcrumb trail) states and refs
  const [pathHistory, setPathHistory] = useState<{ lat: number; lng: number }[]>([]);
  const pathHistoryRef = useRef<{ lat: number; lng: number }[]>([]);
  const pathPolylineRef = useRef<L.Polyline | null>(null);

  const requestWakeLock = async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (wakeLockSentinelRef.current) {
        await wakeLockSentinelRef.current.release().catch(() => {});
      }
      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinelRef.current = sentinel;
      setWakeLockActive(true);
      console.log('Screen Wake Lock acquired');
    } catch (err) {
      console.error("Failed to acquire wake lock:", err);
      setWakeLockActive(false);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockSentinelRef.current) {
      try {
        await wakeLockSentinelRef.current.release();
      } catch (err) {
        console.error("Failed to release wake lock:", err);
      }
      wakeLockSentinelRef.current = null;
    }
    setWakeLockActive(false);
    console.log('Screen Wake Lock released');
  };

  const toggleWakeLock = async () => {
    if (wakeLockActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  };

  // Handle wake lock re-acquisition when app becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLockActive && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [wakeLockActive]);

  // Clean up wake lock on unmount
  useEffect(() => {
    return () => {
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
      }
    };
  }, []);

  // Spot Checklist states
  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotType, setNewSpotType] = useState<string>('dock');
  const [newSpotNotes, setNewSpotNotes] = useState('');
  const [newSpotBusinessId, setNewSpotBusinessId] = useState('');
  const [newSpotPhotos, setNewSpotPhotos] = useState<string[]>([]);

  // Edit Spot suggestion states
  const [editNotes, setEditNotes] = useState('');
  const [editHours, setEditHours] = useState('');
  const [isSpotClosedReported, setIsSpotClosedReported] = useState(false);

  // Telemetry simulation states
  const [speed, setSpeed] = useState<number>(0);
  const [heading, setHeading] = useState<number>(45);
  const [batteryLevel, setBatteryLevel] = useState<number>(92);
  const [waterTemp, setWaterTemp] = useState<string>('74°F');
  const [satellites, setSatellites] = useState<number>(12);

  // Coordinates & spots lists
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 42.4412,
    lng: -88.1322
  });
  const [spots, setSpots] = useState<VenueSpot[]>([]);
  const [friends, setFriends] = useState<FriendBeacon[]>([]);

  // Available businesses for dropdown mapping
  const availableBusinesses = [
    { id: 'monmouth-marine-demo', name: 'Monmouth Marine Ford & Boats' },
    { id: 'west-shore-marina', name: 'West Shore Marina' },
    { id: 'blarney-shuttle-dock', name: 'Port of Blarney Boat Rentals' }
  ];

  // Mock Google Maps Places (Third-party data, less prominent)
  const MOCK_GOOGLE_PLACES = [
    { id: 'g-beach-park', name: 'Round Lake Beach Park', latitude: 42.4430, longitude: -88.1250, type: 'park', address: '2007 Civic Center Way, Round Lake Beach, IL 60073', waterRelated: true },
    { id: 'g-walmart', name: 'Walmart Supercenter', latitude: 42.4580, longitude: -88.1100, type: 'store', address: '2680 N IL Route 83, Round Lake Beach, IL 60073', waterRelated: false },
    { id: 'g-lakeshore-grill', name: 'Lakeshore Grillhouse & Bar', latitude: 42.4380, longitude: -88.1290, type: 'food', address: '120 W Lakeshore Dr, Round Lake, IL 60073', waterRelated: true },
    { id: 'g-speedway', name: 'Speedway Gas Station', latitude: 42.4510, longitude: -88.1220, type: 'fuel', address: '2010 N IL Route 83, Round Lake Beach, IL 60073', waterRelated: false },
    { id: 'g-nippersink-launch', name: 'Nippersink Canoe Launch', latitude: 42.4650, longitude: -88.1400, type: 'launch', address: 'Nippersink Road, Fox Lake, IL 60020', waterRelated: true },
    { id: 'g-hook-line', name: 'Hook Line & Sinker Bait Shop', latitude: 42.4360, longitude: -88.1350, type: 'bait', address: '302 W Nippersink Rd, Round Lake, IL 60073', waterRelated: true }
  ];

  // Dynamic venue config helpers
  const getVenueContext = useCallback(() => {
    switch (venue.type) {
      case 'racetrack':
        return {
          gpsLabel: 'Track GPS',
          tempLabel: 'Track Temp',
          tagLabel: 'Gridpass Track v4.1',
          onboardingTitle: 'Join Live Track Map',
          spotPlaceholder: 'e.g. Turn 4 Staging / Paddock Area',
          categories: [
            { value: 'gate', label: '🎫 Paddock Gate' },
            { value: 'pit_lane', label: '🏎️ Pit Lane / Paddock' },
            { value: 'fuel', label: '⛽ Race Fuel' },
            { value: 'food', label: '🍔 Food & Dining' },
            { value: 'stands', label: '🏟️ Grandstands / Spectator' },
            { value: 'hazard', label: '⚠️ Track Hazard / Sound Limit' }
          ]
        };
      case 'offroad_park':
        return {
          gpsLabel: 'Trail GPS',
          tempLabel: 'Ground Temp',
          tagLabel: 'Gridpass Offroad v4.1',
          onboardingTitle: 'Join Live Trail Map',
          spotPlaceholder: 'e.g. Red Clay Rut Slide / Campsite 4',
          categories: [
            { value: 'trailhead', label: '🥾 Trailhead' },
            { value: 'campsite', label: '⛺ Campsite' },
            { value: 'fuel', label: '⛽ Fuel Station' },
            { value: 'food', label: '🍔 Food & Dining' },
            { value: 'viewpoint', label: '⛰️ Viewpoint / Scenic' },
            { value: 'hazard', label: '⚠️ Danger Zone / Rollover Risk' }
          ]
        };
      case 'event_center':
        return {
          gpsLabel: 'Expo GPS',
          tempLabel: 'Air Temp',
          tagLabel: 'Gridpass Expo v4.1',
          onboardingTitle: 'Join Live Expo Map',
          spotPlaceholder: 'e.g. Sponsor Row / Exhibit Booth',
          categories: [
            { value: 'gate', label: '🎫 Event Gate' },
            { value: 'vendor', label: '🎪 Exhibition Vendor' },
            { value: 'parking', label: '🚗 Parking Lot' },
            { value: 'food', label: '🍔 Food Truck' },
            { value: 'exhibit', label: '🏆 Show Exhibit' },
            { value: 'hazard', label: '⚠️ Crowded / Obstruction' }
          ]
        };
      case 'waterway':
      default:
        return {
          gpsLabel: 'Waterway GPS',
          tempLabel: 'Water Temp',
          tagLabel: 'Gridpass Waterway v4.1',
          onboardingTitle: 'Join Live Waterway Map',
          spotPlaceholder: 'e.g. Grass Lake Fuel Dock / Sandbar',
          categories: [
            { value: 'dock', label: '⚓ Dock / Pier' },
            { value: 'launch', label: '🛶 Launch Ramp' },
            { value: 'fuel', label: '⛽ Marine Fuel' },
            { value: 'food', label: '🍔 Food & Dining' },
            { value: 'sandbar', label: '🏝️ Sandbar / Beach' },
            { value: 'hazard', label: '⚠️ Hazard / Danger Zone' }
          ]
        };
    }
  }, [venue.type]);

  const context = getVenueContext();

  const getThemeClass = () => {
    switch (venue.type) {
      case 'racetrack': return 'racetrack-theme';
      case 'offroad_park': return 'offroad-theme';
      case 'event_center': return 'event-theme';
      case 'waterway':
      default: return 'waterway-theme';
    }
  };

  const updateDynamicVenue = useCallback((mode: Venue['type']) => {
    let name = 'Local Waterway';
    let rules = [
      { title: 'Observe Safe Speeds', desc: 'Maintain slow, no-wake speeds near shorelines, swimmers, and docks.' },
      { title: 'Safety Equipment Mandatory', desc: 'USCG approved life jackets must be worn by PWC operators.' },
      { title: 'Respect Environment', desc: 'Watch for shallow areas, sandbars, and vegetation to protect your engine.' }
    ];

    if (mode === 'racetrack') {
      name = 'Local Racetrack';
      rules = [
        { title: 'Helmets Mandatory', desc: 'Approved motorsports helmets must be worn at all times while on track.' },
        { title: 'Observe Flag Signals', desc: 'Respect flag marshal commands. Red means stop, yellow means caution.' },
        { title: 'Pit Lane Speed Limit', desc: 'Maintain slow speeds in paddock and pit lanes (under 15 mph).' }
      ];
    } else if (mode === 'offroad_park') {
      name = 'Local Offroad Trail';
      rules = [
        { title: 'Registration Required', desc: 'Vehicles must display active DNR off-road registration tags.' },
        { title: 'Stay on Trails', desc: 'Do not wander off marked trails to prevent environmental damage.' },
        { title: 'Recovery Gear Ready', desc: 'Ensure winches, straps, and safety gear are functional before entering.' }
      ];
    } else if (mode === 'event_center') {
      name = 'Local Event Center';
      rules = [
        { title: 'Display QR Spec Sheet', desc: 'Show your Gridpass vehicle QR specs poster prominently.' },
        { title: 'Crowd Safety First', desc: 'Watch for pedestrians when driving/moving vehicles in show areas.' },
        { title: 'Noise Limits Enforced', desc: 'Avoid excessive engine revving in proximity to spectators.' }
      ];
    }

    setVenue({
      id: `dynamic-${mode}`,
      name,
      location: 'Detected GPS Location',
      type: mode,
      pois: [],
      hazards: [],
      rules,
      occupancy: { current: 1, max: 100 }
    });
  }, []);

  const handleModeChange = useCallback((mode: Venue['type']) => {
    setActiveMode(mode);
    if (!venueId) {
      updateDynamicVenue(mode);
    }
  }, [venueId, updateDynamicVenue]);

  // Set default category when venue changes
  useEffect(() => {
    const ctx = getVenueContext();
    if (ctx.categories.length > 0) {
      setNewSpotType(ctx.categories[0].value);
    }
  }, [venue, getVenueContext]);

  // Initialize data
  useEffect(() => {
    // Initial spots & friends
    setSpots(SEEDED_SPOTS.filter(s => s.venue_id === venue.id));
    
    // Check for query parameters first to load shared friend
    let sharedFriend: FriendBeacon | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedLat = params.get('lat');
      const sharedLng = params.get('lng');
      const sharedNickname = params.get('nickname');
      if (sharedLat && sharedLng && sharedNickname) {
        const lat = parseFloat(sharedLat);
        const lng = parseFloat(sharedLng);
        if (!isNaN(lat) && !isNaN(lng)) {
          const name = decodeURIComponent(sharedNickname);
          sharedFriend = {
            user_id: `shared-${name}`,
            display_name: name,
            latitude: lat,
            longitude: lng,
            status: 'active',
            updated_at: new Date().toISOString()
          };
          setUserCoords({ lat, lng });
          setCheckInToastMsg(`Found shared friend: ${name}!`);
          setTimeout(() => setCheckInToastMsg(null), 3000);
        }
      }
    }

    if (isMock) {
      setFriends(SEEDED_FRIENDS);
    } else if (sharedFriend) {
      setFriends([sharedFriend]);
    } else {
      setFriends([]);
    }
    
    // Set nickname if user is authenticated
    if (user) {
      setNickname(user.displayName || user.email?.split('@')[0] || 'Member');
      setShowOnboarding(false);
      setIsSpectator(false);
    }
  }, [user, venue, isMock]);

  // Write location updates to Firestore venue_radar
  useEffect(() => {
    if (isMock) return;
    if (showOnboarding) return;
    
    const userId = user ? user.uid : sessionUid;
    const docRef = doc(db, 'venue_radar', `${venue.id}-${userId}`);

    if (visibility === 'ghost') {
      // If we went ghost, immediately delete our document from Firestore
      deleteDoc(docRef).catch(console.error);
      return;
    }

    const writeLocation = async () => {
      try {
        await setDoc(docRef, {
          venue_id: venue.id,
          user_id: userId,
          display_name: nickname || 'Rider',
          latitude: userCoords.lat,
          longitude: userCoords.lng,
          speed: speed,
          heading: heading,
          updated_at: new Date().toISOString(),
          status: visibility,
          vehicle: activeVehicleDetails.type
        });
      } catch (err) {
        console.error("Failed to sync location to Firestore:", err);
      }
    };

    writeLocation();

    // Set up interval for updates every 8 seconds
    const interval = setInterval(writeLocation, 8000);

    return () => {
      clearInterval(interval);
      deleteDoc(docRef).catch(console.error);
    };
  }, [isMock, showOnboarding, visibility, venue.id, user, sessionUid, nickname, userCoords, speed, heading, activeVehicleDetails.type]);

  // Subscribe to venue radar buddies in real-time
  useEffect(() => {
    if (isMock) return;
    if (showOnboarding) return;

    const q = query(
      collection(db, 'venue_radar'),
      where('venue_id', '==', venue.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeBuddies: FriendBeacon[] = [];
      const now = Date.now();
      const currentUserId = user ? user.uid : sessionUid;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const isSelf = data.user_id === currentUserId;
        const updatedAtStr = data.updated_at;
        const updatedAt = updatedAtStr ? Date.parse(updatedAtStr) : 0;
        const isStale = now - updatedAt > 5 * 60 * 1000; // 5 minutes staleness limit

        if (!isSelf && !isStale) {
          activeBuddies.push({
            user_id: data.user_id,
            display_name: data.display_name,
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed || 0,
            heading: data.heading || 0,
            updated_at: data.updated_at,
            status: data.status || 'active',
            vehicle: data.vehicle
          });
        }
      });

      // Preserve query param friend if not in the snapshot yet
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const sharedLat = params.get('lat');
        const sharedLng = params.get('lng');
        const sharedNickname = params.get('nickname');
        if (sharedLat && sharedLng && sharedNickname) {
          const lat = parseFloat(sharedLat);
          const lng = parseFloat(sharedLng);
          const name = decodeURIComponent(sharedNickname);
          if (!isNaN(lat) && !isNaN(lng)) {
            const hasSharedFriend = activeBuddies.some(b => b.display_name === name);
            if (!hasSharedFriend) {
              activeBuddies.push({
                user_id: `shared-${name}`,
                display_name: name,
                latitude: lat,
                longitude: lng,
                status: 'active',
                updated_at: new Date().toISOString()
              });
            }
          }
        }
      }

      setFriends(activeBuddies);
    }, (err) => {
      console.error("Error subscribing to venue radar:", err);
    });

    return () => {
      unsubscribe();
    };
  }, [isMock, showOnboarding, venue.id, user, sessionUid]);

  // Subscribe to custom spots in Firestore
  useEffect(() => {
    if (isMock) return;
    if (showOnboarding) return;

    const q = query(
      collection(db, 'spots'),
      where('venue_id', '==', venue.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbSpotsList: VenueSpot[] = [];
      snapshot.forEach((doc) => {
        dbSpotsList.push(doc.data() as VenueSpot);
      });

      // Merge seeded spots and Firestore spots
      const seeded = SEEDED_SPOTS.filter(s => s.venue_id === venue.id);
      const mergedMap = new Map<string, VenueSpot>();
      
      seeded.forEach(s => mergedMap.set(s.id, s));
      dbSpotsList.forEach(s => {
        // Only keep if it is not reported closed or is still valid
        mergedMap.set(s.id, s);
      });
      
      setSpots(Array.from(mergedMap.values()));
    }, (err) => {
      console.error("Error subscribing to spots:", err);
    });

    return () => {
      unsubscribe();
    };
  }, [isMock, showOnboarding, venue.id]);

  // Auto-bind to nearest venue based on coordinates
  useEffect(() => {
    if (venueId) return; // Keep forced venue if specified in URL

    // Find closest venue
    let closestVenue = SEEDED_VENUES[0];
    let minDistance = Infinity;

    SEEDED_VENUES.forEach(v => {
      // Find a launch spot or hazard in the venue to use as coordinates proxy
      const firstSpot = SEEDED_SPOTS.find(s => s.venue_id === v.id);
      if (firstSpot) {
        const dLat = firstSpot.latitude - userCoords.lat;
        const dLng = firstSpot.longitude - userCoords.lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist < minDistance) {
          minDistance = dist;
          closestVenue = v;
        }
      }
    });

    // 0.2 degrees is roughly 12 miles
    if (minDistance < 0.2) {
      setVenue(closestVenue);
      setActiveMode(closestVenue.type);
    } else {
      updateDynamicVenue(activeMode);
    }
  }, [userCoords, venueId, activeMode, updateDynamicVenue]);

  // Telemetry updating & GPS simulation
  useEffect(() => {
    // Read device battery
    if (typeof window !== 'undefined' && (navigator as any).getBattery) {
      ((navigator as any).getBattery()).then((bat: any) => {
        setBatteryLevel(Math.round(bat.level * 100));
        bat.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(bat.level * 100));
        });
      });
    }

    // Geolocation watching
    let geoWatchId: number | null = null;
    if (typeof window !== 'undefined' && navigator.geolocation && !isSpectator) {
      geoWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserCoords({ lat, lng });

          // Track path history per vehicle: filter out successive duplicate coordinates or tiny jitter
          const userId = user ? user.uid : sessionUid;
          const currentVehId = activeVehicleIdRef.current;
          const activeVeh = activeVehicleRef.current;
          const activeVehName = activeVeh ? `${activeVeh.year || ''} ${activeVeh.make} ${activeVeh.model}`.trim() : 'Guest Boat';
          const activeVehDetails = activeVehicleDetailsRef.current;

          const currentActiveTrail = allTrailsRef.current[currentVehId]?.points || [];
          
          let newPoints = [...currentActiveTrail];
          if (newPoints.length === 0) {
            newPoints = [{ lat, lng }];
          } else {
            const lastPt = newPoints[newPoints.length - 1];
            const diffLat = Math.abs(lat - lastPt.lat);
            const diffLng = Math.abs(lng - lastPt.lng);
            // ~0.00005 degrees is roughly 5 meters. If it moved more than that, record it.
            if (diffLat > 0.00005 || diffLng > 0.00005) {
              newPoints.push({ lat, lng });
            } else {
              return; // No movement, don't update
            }
          }

          // Update local state immediately for snappy rendering
          setAllTrails(prev => ({
            ...prev,
            [currentVehId]: {
              points: newPoints,
              name: activeVehName,
              color: activeVehDetails.color
            }
          }));

          // Save to Firestore
          if (!isMock) {
            const docRef = doc(db, 'vehicle_trails', `${userId}-${currentVehId}-${venue.id}`);
            setDoc(docRef, {
              user_id: userId,
              vehicle_id: currentVehId,
              vehicle_name: activeVehName,
              venue_id: venue.id,
              points: newPoints,
              updated_at: new Date().toISOString()
            }).catch(console.error);
          }
          
          if (mapRef.current) {
            if (!hasCenteredOnGpsRef.current) {
              mapRef.current.setView([lat, lng], 15);
              hasCenteredOnGpsRef.current = true;
            } else if (followMeRef.current) {
              mapRef.current.panTo([lat, lng]);
            }
          }
          if (position.coords.speed !== null) {
            // Convert m/s to mph
            setSpeed(Math.round(position.coords.speed * 2.23694));
          } else if (isMock) {
            setSpeed(12 + Math.floor(Math.random() * 5));
          }
          if (position.coords.heading !== null) {
            setHeading(Math.round(position.coords.heading));
          }
        },
        (error) => {
          console.warn("Geolocation watch failed, running simulation coordinates.", error);
          if (isMock) {
            setSpeed(18);
          }
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    }

    return () => {
      if (geoWatchId !== null) {
        navigator.geolocation.clearWatch(geoWatchId);
      }
    };
  }, [isSpectator, isMock]);

  // Friend movement coordinates simulator to keep map dynamic (Mock mode only)
  useEffect(() => {
    if (!isMock) return;
    const interval = setInterval(() => {
      setFriends(prevFriends => 
        prevFriends.map(f => {
          if (f.status === 'ghost') return f;
          
          // Add a tiny random offset
          const deltaLat = (Math.random() - 0.5) * 0.0003;
          const deltaLng = (Math.random() - 0.5) * 0.0003;
          
          const newSpeed = f.speed && f.speed > 0
            ? Math.max(5, Math.min(45, f.speed + (Math.random() - 0.5) * 4))
            : f.speed;

          const newHeading = f.heading 
            ? (f.heading + Math.floor((Math.random() - 0.5) * 20) + 360) % 360
            : f.heading;

          return {
            ...f,
            latitude: f.latitude + deltaLat,
            longitude: f.longitude + deltaLng,
            speed: newSpeed,
            heading: newHeading,
            updated_at: new Date().toISOString()
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Map rendering and marker positioning
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Standard leaflet initialization targeting round lake coordinates
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      maxZoom: 22,
      minZoom: 10
    }).setView([userCoords.lat, userCoords.lng], 14);

    mapRef.current = map;

    map.on('dragstart', () => {
      updateFollowMe(false);
    });

    // Google Maps Roadmap tiles
    const tiles = L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
      maxZoom: 22,
      attribution: '© Google'
    }).addTo(map);

    tileLayerRef.current = tiles;

    // Initial load adjustment
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Dynamically toggle Google Maps tile layer types (Roadmap / Hybrid Satellite)
  useEffect(() => {
    if (tileLayerRef.current) {
      const url = mapType === 'satellite'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' // Google Hybrid (Sat + Roads/Labels)
        : 'https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}'; // Google Roadmap
      tileLayerRef.current.setUrl(url);
    }
  }, [mapType]);

  const activeVehicleIdRef = useRef(activeVehicleId);
  const activeVehicleRef = useRef(activeVehicle);
  const allTrailsRef = useRef(allTrails);
  const activeVehicleDetailsRef = useRef(activeVehicleDetails);

  useEffect(() => {
    activeVehicleIdRef.current = activeVehicleId;
    activeVehicleRef.current = activeVehicle;
    allTrailsRef.current = allTrails;
    activeVehicleDetailsRef.current = activeVehicleDetails;
  }, [activeVehicleId, activeVehicle, allTrails, activeVehicleDetails]);

  // Load user vehicles
  useEffect(() => {
    if (!user) {
      setUserVehicles([]);
      return;
    }

    if (isMock) {
      setUserVehicles([
        { id: 'v1', year: 2023, make: 'Chevrolet', model: 'Corvette Z06', specs: { engine: '5.5L V8', hp: 670 } },
        { id: 'v2', year: 2024, make: 'Yamaha', model: 'SuperJet PWC', specs: { engine: 'TR-1', hp: 100 } }
      ]);
      setActiveVehicleId(prev => (prev.startsWith('guest-') ? 'v2' : prev));
      return;
    }

    const vehiclesQuery = query(collection(db, 'vehicles'), where('owner_id', '==', user.uid));
    const unsubscribe = onSnapshot(vehiclesQuery, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUserVehicles(list);
      if (list.length > 0) {
        setActiveVehicleId(prev => {
          if (prev.startsWith('guest-')) {
            localStorage.setItem('gridpass_active_vehicle_id', list[0].id);
            return list[0].id;
          }
          return prev;
        });
      }
    }, (err) => {
      console.error("Error loading user vehicles:", err);
    });

    return () => unsubscribe();
  }, [user, isMock]);

  // Subscribe to all vehicle trails for the current user/guest in the current venue
  useEffect(() => {
    const userId = user ? user.uid : sessionUid;
    if (isMock) {
      setAllTrails({
        'guest-boat': {
          points: [
            { lat: 42.4412, lng: -88.1322 },
            { lat: 42.4420, lng: -88.1330 },
            { lat: 42.4430, lng: -88.1340 }
          ],
          name: 'Guest Boat',
          color: '#60a5fa'
        },
        'guest-pwc': {
          points: [
            { lat: 42.4412, lng: -88.1322 },
            { lat: 42.4400, lng: -88.1310 },
            { lat: 42.4390, lng: -88.1300 }
          ],
          name: 'Guest PWC',
          color: '#38bdf8'
        }
      });
      return;
    }

    const q = query(
      collection(db, 'vehicle_trails'),
      where('user_id', '==', userId),
      where('venue_id', '==', venue.id)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const trailsMap: {[vehicleId: string]: { points: {lat: number; lng: number}[]; name: string; color: string }} = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const vId = data.vehicle_id;
        if (vId) {
          const vDetails = getVehicleDetails(data.vehicle_name, '');
          trailsMap[vId] = {
            points: data.points || [],
            name: data.vehicle_name || 'Vehicle',
            color: vDetails.color
          };
        }
      });
      setAllTrails(trailsMap);
    }, (err) => {
      console.error("Error loading vehicle trails:", err);
    });

    return () => unsubscribe();
  }, [user, sessionUid, venue.id, isMock]);

  const trailPolylinesRef = useRef<{ [vehicleId: string]: L.Polyline }>({});

  // Render/Update breadcrumb trail polylines on map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove polylines that are no longer in allTrails
    Object.keys(trailPolylinesRef.current).forEach(vId => {
      if (!allTrails[vId] || allTrails[vId].points.length < 2) {
        map.removeLayer(trailPolylinesRef.current[vId]);
        delete trailPolylinesRef.current[vId];
      }
    });

    // Draw/update polylines for each vehicle in allTrails
    Object.keys(allTrails).forEach(vId => {
      const trail = allTrails[vId];
      if (trail.points.length < 2) return;

      const latlngs = trail.points.map(pt => [pt.lat, pt.lng] as L.LatLngExpression);
      const isActive = vId === activeVehicleId;
      const trailColor = trail.color || '#06b6d4';

      let polyline = trailPolylinesRef.current[vId];
      if (polyline) {
        polyline.setLatLngs(latlngs);
        polyline.setStyle({
          color: trailColor,
          weight: isActive ? 4 : 2,
          opacity: isActive ? 1.0 : 0.45,
          dashArray: isActive ? '8, 8' : '4, 4',
          className: isActive ? 'marching-ants-line' : ''
        } as any);
      } else {
        polyline = L.polyline(latlngs, {
          color: trailColor,
          weight: isActive ? 4 : 2,
          opacity: isActive ? 1.0 : 0.45,
          dashArray: isActive ? '8, 8' : '4, 4',
          className: isActive ? 'marching-ants-line' : ''
        } as any).addTo(map);
        trailPolylinesRef.current[vId] = polyline;
      }

      if (polyline.getElement) {
        const element = polyline.getElement();
        if (element) {
          if (isActive) {
            element.classList.add('marching-ants-line');
          } else {
            element.classList.remove('marching-ants-line');
          }
        }
      }
    });
  }, [allTrails, activeVehicleId]);

  const handleClearActiveTrail = async () => {
    const userId = user ? user.uid : sessionUid;
    setAllTrails(prev => {
      const next = { ...prev };
      delete next[activeVehicleId];
      return next;
    });

    if (trailPolylinesRef.current[activeVehicleId] && mapRef.current) {
      mapRef.current.removeLayer(trailPolylinesRef.current[activeVehicleId]);
      delete trailPolylinesRef.current[activeVehicleId];
    }

    if (!isMock) {
      const docRef = doc(db, 'vehicle_trails', `${userId}-${activeVehicleId}-${venue.id}`);
      await deleteDoc(docRef).catch(console.error);
    }
  };

  // Distance helper
  const calculateDistanceMiles = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    return Math.sqrt(dLat * dLat + dLng * dLng) * 69; // Euclidean approximation * 69 miles/deg
  }, []);

  // Search Results selector
  const getSearchResults = useCallback(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();

    const spotResults = searchSourceFilter === 'google' ? [] : spots
      .filter(spot => spot.status !== 'reported_closed' && spot.name.toLowerCase().includes(query))
      .map(spot => ({
        type: 'spot' as const,
        id: spot.id,
        name: spot.name,
        category: spot.features[0] || 'spot',
        distance: calculateDistanceMiles(userCoords.lat, userCoords.lng, spot.latitude, spot.longitude),
        latitude: spot.latitude,
        longitude: spot.longitude,
        item: spot
      }));

    const friendResults = searchSourceFilter === 'google' ? [] : friends
      .filter(friend => friend.status !== 'ghost' && friend.display_name.toLowerCase().includes(query))
      .map(friend => ({
        type: 'friend' as const,
        id: friend.user_id,
        name: friend.display_name,
        category: 'friend',
        distance: calculateDistanceMiles(userCoords.lat, userCoords.lng, friend.latitude, friend.longitude),
        latitude: friend.latitude,
        longitude: friend.longitude,
        item: friend
      }));

    const googleResults = searchSourceFilter === 'gridpass' ? [] : MOCK_GOOGLE_PLACES
      .filter(place => place.name.toLowerCase().includes(query) && place.waterRelated)
      .map(place => ({
        type: 'google' as const,
        id: place.id,
        name: place.name,
        category: place.type,
        distance: calculateDistanceMiles(userCoords.lat, userCoords.lng, place.latitude, place.longitude),
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address,
        item: place
      }));

    const sortedGridpass = [...spotResults, ...friendResults].sort((a, b) => a.distance - b.distance);
    const sortedGoogle = googleResults.sort((a, b) => a.distance - b.distance);

    // Keep first-party Gridpass results at the top for maximum prominence
    return [...sortedGridpass, ...sortedGoogle];
  }, [searchQuery, searchSourceFilter, spots, friends, userCoords, calculateDistanceMiles]);

  // Handle Search Result Click
  const handleSearchResultClick = useCallback((result: any) => {
    updateFollowMe(false);
    if (mapRef.current) {
      mapRef.current.setView([result.latitude, result.longitude], 17);
    }

    if (result.type === 'spot') {
      setSelectedSpot(result.item);
      setTempGoogleSpot(null);
      setShowAddSpot(false);
      setShowEditSpot(false);
    } else if (result.type === 'friend') {
      const marker = friendMarkersRef.current[result.id];
      if (marker) {
        marker.openPopup();
      }
      setSelectedSpot(null);
      setTempGoogleSpot(null);
    } else if (result.type === 'google') {
      setTempGoogleSpot(result.item);
      setSelectedSpot(null);
      setShowAddSpot(false);
      setShowEditSpot(false);
    }

    setShowSearch(false);
    setSearchQuery('');
  }, []);

  // Render/Update Temporary Google Maps marker
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear old temporary marker
    if (tempGoogleMarkerRef.current) {
      map.removeLayer(tempGoogleMarkerRef.current);
      tempGoogleMarkerRef.current = null;
    }

    if (!tempGoogleSpot) return;

    const latlng: L.LatLngExpression = [tempGoogleSpot.latitude, tempGoogleSpot.longitude];
    const markerHtml = `
      <div class="relative w-8 h-8 flex items-center justify-center cursor-pointer">
        <div class="absolute w-7 h-7 bg-neutral-950/90 border border-neutral-750 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-bounce" style="border-top: 3px solid #737373;">
          <span class="text-[12px]">📍</span>
        </div>
      </div>
    `;

    const marker = L.marker(latlng, {
      icon: L.divIcon({
        html: markerHtml,
        className: `temp-google-marker-${tempGoogleSpot.id}`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(map);

    marker.on('click', () => {
      setTempGoogleSpot(tempGoogleSpot);
      setSelectedSpot(null);
      setShowAddSpot(false);
      setShowEditSpot(false);
    });

    tempGoogleMarkerRef.current = marker;
  }, [tempGoogleSpot]);

  // Center Map View
  const handleRecenter = useCallback(() => {
    updateFollowMe(true);
    if (mapRef.current) {
      mapRef.current.setView([userCoords.lat, userCoords.lng], 15);
    }
  }, [userCoords]);

  // Render/Update User Marker
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const latlng: L.LatLngExpression = [userCoords.lat, userCoords.lng];

    if (isSpectator) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      return;
    }

    const isGhost = visibility === 'ghost';
    const vehicleEmoji = activeVehicleDetails.emoji || '🧭';
    const userSvg = isGhost ? `
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-slate-500/25 border-2 border-slate-400 rounded-full animate-pulse"></div>
        <div class="w-6 h-6 bg-slate-500 border border-white rounded-full flex items-center justify-center shadow-lg text-[11px] leading-none">
          ${vehicleEmoji}
        </div>
        <!-- Heading Indicator -->
        <div class="absolute -top-1.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-slate-400" style="transform: rotate(${heading}deg); transform-origin: 50% 16px;"></div>
      </div>
    ` : `
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-cyan-500/25 border-2 border-cyan-400 rounded-full animate-ping"></div>
        <div class="w-6 h-6 bg-cyan-400 border border-white rounded-full flex items-center justify-center shadow-lg text-[11px] leading-none">
          ${vehicleEmoji}
        </div>
        <!-- Heading Indicator -->
        <div class="absolute -top-1.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-400" style="transform: rotate(${heading}deg); transform-origin: 50% 16px;"></div>
      </div>
    `;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(latlng);
      userMarkerRef.current.setIcon(
        L.divIcon({
          html: userSvg,
          className: 'user-pos-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      );
    } else {
      userMarkerRef.current = L.marker(latlng, {
        icon: L.divIcon({
          html: userSvg,
          className: 'user-pos-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map);
    }
  }, [userCoords, heading, visibility, isSpectator, activeVehicleDetails.emoji]);

  // Render/Update Pending Draggable Spot Marker
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (!showAddSpot || !pendingSpotCoords || isFineTuning) {
      if (pendingSpotMarkerRef.current) {
        map.removeLayer(pendingSpotMarkerRef.current);
        pendingSpotMarkerRef.current = null;
      }
      return;
    }

    const latlng: L.LatLngExpression = [pendingSpotCoords.lat, pendingSpotCoords.lng];

    const pendingSvg = `
      <div class="relative w-8 h-8 flex items-center justify-center cursor-move">
        <div class="absolute w-8 h-8 bg-yellow-500/35 border-2 border-yellow-400 rounded-full animate-pulse"></div>
        <div class="w-5 h-5 bg-yellow-400 border border-white rounded-full flex items-center justify-center shadow-lg">
          <span class="text-[10px]">📍</span>
        </div>
        <div class="absolute -top-6 bg-black/85 text-yellow-450 border border-yellow-500/20 text-[7px] font-bold py-0.5 px-1.5 rounded uppercase tracking-wider whitespace-nowrap animate-bounce">Drag Me!</div>
      </div>
    `;

    if (pendingSpotMarkerRef.current) {
      pendingSpotMarkerRef.current.setLatLng(latlng);
    } else {
      const marker = L.marker(latlng, {
        draggable: true,
        icon: L.divIcon({
          html: pendingSvg,
          className: 'pending-spot-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map);

      marker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        setPendingSpotCoords({ lat: pos.lat, lng: pos.lng });
      });

      pendingSpotMarkerRef.current = marker;
      map.panTo(latlng);
    }
  }, [showAddSpot, pendingSpotCoords]);

  // Update Spot Markers on Map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear old spots markers no longer in active spots
    Object.keys(spotMarkersRef.current).forEach(id => {
      const active = spots.find(s => s.id === id && s.status !== 'reported_closed');
      if (!active) {
        map.removeLayer(spotMarkersRef.current[id]);
        delete spotMarkersRef.current[id];
      }
    });

    // Add/Update current spots
    spots.forEach(spot => {
      if (spot.status === 'reported_closed') return;

      const isBeingEdited = showEditSpot && selectedSpot && spot.id === selectedSpot.id;
      
      if (isBeingEdited && isFineTuning) {
        if (spotMarkersRef.current[spot.id]) {
          map.removeLayer(spotMarkersRef.current[spot.id]);
          delete spotMarkersRef.current[spot.id];
        }
        return;
      }

      const latlng: L.LatLngExpression = isBeingEdited && editSpotCoords
        ? [editSpotCoords.lat, editSpotCoords.lng]
        : [spot.latitude, spot.longitude];
      
      // Select marker color/badge by feature
      let markerColor = '#06b6d4'; // Cyan default
      let iconHtml = '⚓'; // Default launch

      if (spot.features.includes('hazard')) {
        markerColor = '#ef4444';
        iconHtml = '⚠️';
      } else if (spot.business_id) {
        markerColor = '#f59e0b';
        iconHtml = '🏢';
      } else if (spot.features.includes('food')) {
        markerColor = '#f97316';
        iconHtml = '🍔';
      } else if (spot.features.includes('fuel')) {
        markerColor = '#eab308';
        iconHtml = '⛽';
      } else if (spot.features.includes('sandbar')) {
        markerColor = '#10b981';
        iconHtml = '🏝️';
      }

      let borderStyle = `border-top: 3px solid ${markerColor};`;
      if (spot.status === 'unverified') {
        borderStyle = `border: 2px dashed #9ca3af; opacity: 0.85;`;
      }
      if (isBeingEdited) {
        borderStyle = `border: 2.5px dashed #facc15; box-shadow: 0 0 10px rgba(250, 204, 21, 0.4);`;
      }

      const spotHtml = `
        <div class="relative w-8 h-8 flex items-center justify-center cursor-pointer">
          <div class="absolute w-7 h-7 bg-neutral-900/90 border border-neutral-850 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-in fade-in duration-200" style="${borderStyle}">
            <span class="text-[12px]">${iconHtml}</span>
            ${spot.status === 'unverified' && !isBeingEdited ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-500 rounded-full border border-neutral-900 flex items-center justify-center text-[6px] font-black text-black">?</span>' : ''}
          </div>
          ${isBeingEdited ? '<div class="absolute -top-6 bg-black/85 text-yellow-450 border border-yellow-500/20 text-[7px] font-bold py-0.5 px-1.5 rounded uppercase tracking-wider whitespace-nowrap animate-bounce">Drag Me!</div>' : ''}
        </div>
      `;

      let marker = spotMarkersRef.current[spot.id];
      if (marker) {
        marker.setLatLng(latlng);
        marker.setIcon(
          L.divIcon({
            html: spotHtml,
            className: `spot-marker-${spot.id}`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        );
      } else {
        marker = L.marker(latlng, {
          icon: L.divIcon({
            html: spotHtml,
            className: `spot-marker-${spot.id}`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(map);

        marker.on('click', () => {
          setSelectedSpot(spot);
          setShowAddSpot(false);
          setShowEditSpot(false);
        });

        spotMarkersRef.current[spot.id] = marker;
      }

      // Handle draggable state dynamically
      if (marker.dragging) {
        if (isBeingEdited) {
          marker.dragging.enable();
          marker.off('dragend');
          marker.on('dragend', (e: any) => {
            const pos = e.target.getLatLng();
            setEditSpotCoords({ lat: pos.lat, lng: pos.lng });
          });
        } else {
          marker.dragging.disable();
          marker.off('dragend');
        }
      }
    });
  }, [spots, showEditSpot, editSpotCoords, selectedSpot]);

  // Listen to map moves for Fine-Tuning center updates
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleMoveEnd = () => {
      if (!isFineTuning) return;
      const center = map.getCenter();
      if (fineTuneTarget === 'add') {
        setPendingSpotCoords({ lat: center.lat, lng: center.lng });
      } else if (fineTuneTarget === 'edit') {
        setEditSpotCoords({ lat: center.lat, lng: center.lng });
      }
    };

    if (isFineTuning) {
      map.on('moveend', handleMoveEnd);
    }

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [isFineTuning, fineTuneTarget]);

  // Update Friend Beacons on Map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear ghost/inactive friends
    Object.keys(friendMarkersRef.current).forEach(id => {
      const active = friends.find(f => f.user_id === id && f.status !== 'ghost');
      if (!active) {
        map.removeLayer(friendMarkersRef.current[id]);
        delete friendMarkersRef.current[id];
      }
    });

    // Render active friends
    friends.forEach(friend => {
      if (friend.status === 'ghost') return;

      const latlng: L.LatLngExpression = [friend.latitude, friend.longitude];

      const initials = friend.display_name.slice(0, 2).toUpperCase();
      const vehicleEmoji = friend.vehicle ? (VEHICLE_EMOJIS[friend.vehicle] || '🧭') : null;
      const innerContent = vehicleEmoji ? vehicleEmoji : initials;
      const innerClass = vehicleEmoji ? 'text-[11px] leading-none' : 'text-[9px] font-black';

      const friendSvg = `
        <div class="relative w-9 h-9 flex items-center justify-center group cursor-pointer">
          <div class="absolute w-9 h-9 bg-emerald-950/40 border border-emerald-500 rounded-full animate-pulse"></div>
          <div class="w-6.5 h-6.5 rounded-full bg-emerald-600 border border-white text-white flex items-center justify-center ${innerClass} shadow-lg">
            ${innerContent}
          </div>
          <div class="absolute -top-1 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-emerald-400" style="transform: rotate(${friend.heading || 0}deg); transform-origin: 50% 14px;"></div>
        </div>
      `;

      const popupHtml = `
        <div class="p-2.5 text-left space-y-1 text-[11px] font-sans leading-normal">
          <div class="font-black text-white uppercase tracking-tight">${friend.display_name}</div>
          <div class="flex items-center justify-between text-[9px] text-neutral-450 font-mono">
            <span>Vehicle:</span>
            <span class="font-bold text-neutral-200 capitalize">${friend.vehicle || 'Unknown'}</span>
          </div>
          <div class="flex items-center justify-between text-[9px] text-neutral-450 font-mono">
            <span>Heading:</span>
            <span class="font-bold text-neutral-200">${Math.round(friend.heading || 0)}°</span>
          </div>
          <div class="flex items-center justify-between text-[9px] text-neutral-450 font-mono">
            <span>Current Speed:</span>
            <span class="font-black text-emerald-400">${Math.round(friend.speed || 0)} mph</span>
          </div>
        </div>
      `;

      if (friendMarkersRef.current[friend.user_id]) {
        const marker = friendMarkersRef.current[friend.user_id];
        marker.setLatLng(latlng);
        marker.setPopupContent(popupHtml);
      } else {
        const marker = L.marker(latlng, {
          icon: L.divIcon({
            html: friendSvg,
            className: `friend-marker-${friend.user_id}`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          })
        }).addTo(map);

        marker.bindPopup(popupHtml, {
          closeButton: false,
          className: 'custom-map-popup'
        });

        friendMarkersRef.current[friend.user_id] = marker;
      }
    });
  }, [friends, visibility]);

  // Handle Onboarding Completion
  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      setShowOnboarding(false);
      setIsSpectator(false);
      setVisibility('public');
      handleRecenter();
    }
  };

  const handleSpectatorMode = () => {
    setNickname('Spectator');
    setShowOnboarding(false);
    setIsSpectator(true);
    setVisibility('ghost');
    handleRecenter();
  };

  const handleSignOut = async () => {
    try {
      if (!isMock) {
        const userId = user ? user.uid : sessionUid;
        const docRef = doc(db, 'venue_radar', `${venue.id}-${userId}`);
        await deleteDoc(docRef).catch(console.error);
      }
      await signOut(auth);
      setNickname('');
      setShowProfileSheet(false);
      setShowOnboarding(true);
      setIsSpectator(false);
      setVisibility('public');
      setCheckInToastMsg("Logged out successfully.");
      setTimeout(() => setCheckInToastMsg(null), 3000);
    } catch (err) {
      console.error("Sign out error:", err);
      setCheckInToastMsg("Sign out failed.");
      setTimeout(() => setCheckInToastMsg(null), 3000);
    }
  };

  // SOS Toggle logic
  const handleSosPress = () => {
    if (!user) {
      setCheckInToastMsg("Log in to trigger SOS emergency broadcast!");
      setTimeout(() => setCheckInToastMsg(null), 3000);
      setAuthTab('login');
      setAuthError(null);
      setShowAuthSheet(true);
      return;
    }

    if (isSosActive) {
      setIsSosActive(false);
      return;
    }

    setSosCountdown(3);
    countdownTimerRef.current = setInterval(() => {
      setSosCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          setIsSosActive(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelSos = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setSosCountdown(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setNewSpotPhotos(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Helper to remove undefined properties before writing to Firestore
  const cleanUndefined = (obj: any) => {
    const cleaned = { ...obj };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      }
    });
    return cleaned;
  };

  // Drop Spot Submission
  const handleDropSpotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpotName.trim()) return;

    const newSpotLat = pendingSpotCoords ? pendingSpotCoords.lat : userCoords.lat;
    const newSpotLng = pendingSpotCoords ? pendingSpotCoords.lng : userCoords.lng;

    // Automatically detect business_id based on name keywords and proximity
    let autoBusinessId: string | undefined = undefined;
    const BUSINESS_COORDINATES = {
      'monmouth-marine-demo': { lat: 42.4449, lng: -88.1651 },
      'blarney-shuttle-dock': { lat: 42.4445, lng: -88.1683 },
      'west-shore-marina': { lat: 42.4385, lng: -88.1365 }
    };
    
    let closestId: string | undefined = undefined;
    let minDistance = 0.005;
    Object.entries(BUSINESS_COORDINATES).forEach(([id, coords]) => {
      const dist = Math.sqrt(Math.pow(newSpotLat - coords.lat, 2) + Math.pow(newSpotLng - coords.lng, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closestId = id;
      }
    });
    
    if (closestId) {
      autoBusinessId = closestId;
    }

    const newSpot: VenueSpot = {
      id: `spot-${Date.now()}`,
      venue_id: venue.id,
      name: newSpotName,
      latitude: newSpotLat,
      longitude: newSpotLng,
      features: [newSpotType],
      notes: newSpotNotes.trim() ? [{ user: nickname || 'Guest', text: newSpotNotes, timestamp: new Date().toISOString() }] : [],
      status: autoBusinessId ? 'verified' : 'active',
      business_id: autoBusinessId,
      photo_urls: newSpotPhotos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSpots(prev => [...prev, newSpot]);

    if (!isMock && user) {
      setDoc(doc(db, 'spots', newSpot.id), cleanUndefined(newSpot)).catch(console.error);
    }

    setShowAddSpot(false);
    setSelectedSpot(newSpot);

    // Reset fields
    setNewSpotName('');
    setNewSpotNotes('');
    setNewSpotPhotos([]);
    setPendingSpotCoords(null);

    // Center map
    if (mapRef.current) {
      mapRef.current.panTo([newSpotLat, newSpotLng]);
    }
  };

  // Edit / Suggestion Notes submission
  const handleSuggestEditsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpot) return;

    let updatedSpotObj: VenueSpot | null = null;
    const updatedSpots = spots.map(s => {
      if (s.id === selectedSpot.id) {
        const notes = [...s.notes];
        if (editNotes.trim()) {
          notes.push({
            user: nickname || 'Guest',
            text: editNotes,
            timestamp: new Date().toISOString()
          });
        }

        const latVal = editSpotCoords ? editSpotCoords.lat : s.latitude;
        const lngVal = editSpotCoords ? editSpotCoords.lng : s.longitude;

        let autoBusinessId = s.business_id;
        let autoStatus = s.status;

        if (editSpotCoords) {
          const BUSINESS_COORDINATES = {
            'monmouth-marine-demo': { lat: 42.4449, lng: -88.1651 },
            'blarney-shuttle-dock': { lat: 42.4445, lng: -88.1683 },
            'west-shore-marina': { lat: 42.4385, lng: -88.1365 }
          };
          
          let closestId: string | undefined = undefined;
          let minDistance = 0.005;
          Object.entries(BUSINESS_COORDINATES).forEach(([id, coords]) => {
            const dist = Math.sqrt(Math.pow(latVal - coords.lat, 2) + Math.pow(lngVal - coords.lng, 2));
            if (dist < minDistance) {
              minDistance = dist;
              closestId = id;
            }
          });
          
          if (closestId) {
            autoBusinessId = closestId;
            autoStatus = 'verified';
          } else {
            // Unlink B2B if dragged too far (>500m)
            if (autoBusinessId) {
              const originalCoords = BUSINESS_COORDINATES[autoBusinessId as keyof typeof BUSINESS_COORDINATES];
              if (originalCoords) {
                const dist = Math.sqrt(Math.pow(latVal - originalCoords.lat, 2) + Math.pow(lngVal - originalCoords.lng, 2));
                if (dist >= 0.005) {
                  autoBusinessId = undefined;
                  autoStatus = 'active';
                }
              }
            }
          }
        }

        updatedSpotObj = {
          ...s,
          latitude: latVal,
          longitude: lngVal,
          hours: editHours.trim() ? editHours : s.hours,
          notes,
          status: isSpotClosedReported ? 'reported_closed' : autoStatus,
          business_id: autoBusinessId,
          updated_at: new Date().toISOString()
        } as VenueSpot;
        return updatedSpotObj;
      }
      return s;
    });

    setSpots(updatedSpots);

    if (updatedSpotObj && !isMock && user) {
      setDoc(doc(db, 'spots', (updatedSpotObj as VenueSpot).id), cleanUndefined(updatedSpotObj)).catch(console.error);
    }
    setShowEditSpot(false);
    setEditNotes('');
    setEditHours('');
    setEditSpotCoords(null);

    const currentUpdated = updatedSpots.find(s => s.id === selectedSpot.id);
    if (currentUpdated && currentUpdated.status !== 'reported_closed') {
      setSelectedSpot(currentUpdated);
    } else {
      setSelectedSpot(null);
    }
  };

  // Start Fine Tuning
  const startFineTuning = (target: 'add' | 'edit') => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    setFineTuneTarget(target);
    const currentCoords = target === 'add' ? pendingSpotCoords : editSpotCoords;
    if (currentCoords) {
      setFineTuneBackupCoords(currentCoords);
      setMapBackup({
        center: map.getCenter(),
        zoom: map.getZoom()
      });
      setIsFineTuning(true);
      // Zoom and center
      map.setView([currentCoords.lat, currentCoords.lng], 19);
    }
  };

  // Confirm Fine Tuning
  const handleConfirmFineTune = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      if (fineTuneTarget === 'add') {
        setPendingSpotCoords({ lat: center.lat, lng: center.lng });
      } else {
        setEditSpotCoords({ lat: center.lat, lng: center.lng });
      }
    }
    setIsFineTuning(false);
    // Restore map backup
    if (mapBackup && mapRef.current) {
      mapRef.current.setView(mapBackup.center, mapBackup.zoom);
    }
  };

  // Cancel Fine Tuning
  const handleCancelFineTune = () => {
    if (fineTuneBackupCoords) {
      if (fineTuneTarget === 'add') {
        setPendingSpotCoords(fineTuneBackupCoords);
      } else {
        setEditSpotCoords(fineTuneBackupCoords);
      }
    }
    setIsFineTuning(false);
    // Restore map backup
    if (mapBackup && mapRef.current) {
      mapRef.current.setView(mapBackup.center, mapBackup.zoom);
    }
  };

  // Inline Auth handlers
  const handleInlineSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setCheckInToastMsg("Logged in successfully!");
      setTimeout(() => setCheckInToastMsg(null), 3000);
      setShowAuthSheet(false);
      // Reset fields
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Failed to sign in.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    if (!authDisplayName.trim()) {
      setAuthError("Display name is required.");
      return;
    }
    setAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      const registeredUser = userCredential.user;
      
      // Create Firestore user document
      const userDocRef = doc(db, 'users', registeredUser.uid);
      await setDoc(userDocRef, {
        display_name: authDisplayName.trim().toUpperCase(),
        email: authEmail,
        bio: 'Welcome to Gridpass! Add your bio here.',
        is_supporter: false,
        location: 'USA',
        spots_submitted: 0,
        created_at: new Date().toISOString()
      });

      setCheckInToastMsg("Account created and logged in!");
      setTimeout(() => setCheckInToastMsg(null), 3000);
      setShowAuthSheet(false);
      // Reset fields
      setAuthEmail('');
      setAuthPassword('');
      setAuthConfirmPassword('');
      setAuthDisplayName('');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Failed to register.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleInlineGoogleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;

      // Check and create profile if it doesn't exist
      const userDocRef = doc(db, 'users', loggedUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          display_name: (loggedUser.displayName || loggedUser.email?.split('@')[0] || 'DRIVER').toUpperCase(),
          email: loggedUser.email || '',
          bio: 'Welcome to Gridpass! Add your bio here.',
          is_supporter: false,
          location: 'USA',
          spots_submitted: 0,
          created_at: new Date().toISOString()
        });
      }

      setCheckInToastMsg("Logged in with Google!");
      setTimeout(() => setCheckInToastMsg(null), 3000);
      setShowAuthSheet(false);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Google Sign-In failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Simple Location Check-in with proximity check
  const handleCheckIn = () => {
    if (!selectedSpot) return;

    if (!user) {
      setCheckInToastMsg("Log in to check into spots!");
      setTimeout(() => setCheckInToastMsg(null), 3000);
      setAuthTab('login');
      setAuthError(null);
      setShowAuthSheet(true);
      return;
    }

    // Enforce proximity check (must be within ~500m / 0.005 degrees)
    const latDiff = userCoords.lat - selectedSpot.latitude;
    const lngDiff = userCoords.lng - selectedSpot.longitude;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    if (distance >= 0.005) {
      setCheckInToastMsg(`Too far away to check in! Must be within 500m of ${selectedSpot.name}.`);
      setTimeout(() => setCheckInToastMsg(null), 3000);
      return;
    }

    setCheckInToastMsg(`Checked into: ${selectedSpot.name}! Info shared.`);
    setTimeout(() => setCheckInToastMsg(null), 3000);
  };

  // Share Live Radar using native share or fallback to clipboard
  const handleShareRadar = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/water/${venue.id}?lat=${userCoords.lat.toFixed(5)}&lng=${userCoords.lng.toFixed(5)}&nickname=${encodeURIComponent(nickname || 'Rider')}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Gridpass Waterway Radar',
        text: `Check out my live position on the water at ${venue.name}!`,
        url: url
      }).then(() => {
        setCheckInToastMsg("Shared successfully!");
        setTimeout(() => setCheckInToastMsg(null), 3000);
      }).catch((err) => {
        // Fallback on share errors, except when the user cancelled/aborted
        if (err.name !== 'AbortError') {
          copyToClipboardFallback(url);
        }
      });
    } else {
      copyToClipboardFallback(url);
    }
  };

  const copyToClipboardFallback = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCheckInToastMsg("Live Radar Link Copied! Send to friends.");
      setTimeout(() => setCheckInToastMsg(null), 3000);
    }).catch(() => {
      setCheckInToastMsg("Link sharing not supported on this browser.");
      setTimeout(() => setCheckInToastMsg(null), 3000);
    });
  };

  // Quick zoom controls
  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();

  return (
    <div className={`h-[100dvh] w-full relative overflow-hidden bg-[#060608] text-[#f4f4f7] select-none font-sans ${getThemeClass()}`}>
      
      {/* Glassmorphic Toast Notifications */}
      {checkInToastMsg && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-950/90 backdrop-blur-md border border-cyan-500/30 text-cyan-400 px-5 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top duration-300 max-w-[90vw] text-center">
          <Check className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{checkInToastMsg}</span>
        </div>
      )}

      {/* Guest Mode Banner (Placed at the top below HUD) */}
      {!user && !showAddSpot && !showEditSpot && !selectedSpot && !tempGoogleSpot && !showSearch && !showTelemetry && !isFineTuning && (
        <div className="absolute top-[76px] left-4 right-4 z-20 bg-neutral-950/85 backdrop-blur-md border border-yellow-500/25 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-lg pointer-events-auto max-w-sm mx-auto animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xs shrink-0">🔒</span>
            <div className="text-left">
              <div className="text-[9px] font-black uppercase tracking-wider text-yellow-500">Guest Mode</div>
              <p className="text-[8.5px] text-neutral-300 leading-normal font-semibold">
                Log in to drop pins, check in, and see where friends are riding.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setAuthTab('login');
              setAuthError(null);
              setShowAuthSheet(true);
            }}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-[8px] px-2.5 py-1.5 rounded-lg active:scale-95 transition-all shrink-0 cursor-pointer min-h-[26px]"
          >
            Log In
          </button>
        </div>
      )}

      {/* Flashing border indicators for SOS emergency status */}
      {isSosActive && (
        <div className="absolute inset-0 border-[6px] border-red-600 animate-pulse pointer-events-none z-50"></div>
      )}

      {/* Main Map Mount point */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0"></div>

      {/* Static Center Pin Visual Overlay for Fine-Tuning */}
      {isFineTuning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-in fade-in duration-200">
          <div className="flex flex-col items-center -translate-y-6">
            <div className="absolute w-8 h-8 bg-cyan-500/25 border-2 border-cyan-400 rounded-full animate-ping"></div>
            <div className="w-7 h-7 bg-cyan-500 border border-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-[12px]">📍</span>
            </div>
            <div className="w-0.5 h-4 bg-cyan-400"></div>
            <div className="w-5 h-1.5 bg-cyan-500/30 rounded-full border border-cyan-400/50 -mt-0.5"></div>
          </div>
        </div>
      )}

      {/* Glass overlay HUD header */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex justify-between items-center">
        
        {/* Left HUD: Search trigger & Venue name */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button 
            id="search-toggle-btn"
            onClick={() => setShowSearch(!showSearch)}
            className={`w-12 h-12 bg-neutral-950/75 backdrop-blur-md border border-neutral-900/60 rounded-full flex items-center justify-center text-white active:scale-95 transition-all shadow-lg ${showSearch ? 'border-cyan-500' : ''}`}
            title="Search Spots & Friends"
          >
            <Search className="w-5 h-5 text-cyan-400" />
          </button>
          
          <button 
            id="telemetry-toggle-btn"
            onClick={() => setShowTelemetry(!showTelemetry)}
            className={`w-12 h-12 bg-neutral-950/75 backdrop-blur-md border border-neutral-900/60 rounded-full flex items-center justify-center text-white active:scale-95 transition-all shadow-lg ${showTelemetry ? 'border-cyan-500' : ''}`}
            title="Toggle Live Ride Stats"
          >
            <Compass className="w-5 h-5 text-cyan-400" />
          </button>
          
          <div className="px-4 py-2 bg-neutral-950/75 backdrop-blur-md border border-neutral-900/60 rounded-full shadow-lg text-left block">
            <div className="text-[7px] font-mono font-bold text-neutral-450 uppercase tracking-widest leading-none">{context.gpsLabel}</div>
            <div className="text-xs font-black uppercase text-white truncate max-w-[125px] pt-0.5 leading-none mb-0.5">{venue.name}</div>
            {!showOnboarding && !isSpectator && (
              <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-neutral-900/50 text-[8px] font-mono font-bold text-neutral-400">
                <div className="flex items-center gap-0.5">
                  <Navigation2 className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400 transition-transform duration-300" style={{ transform: `rotate(${heading}deg)` }} />
                  <span>
                    {heading}° {heading >= 337.5 || heading < 22.5 ? 'N' :
                     heading >= 22.5 && heading < 67.5 ? 'NE' :
                     heading >= 67.5 && heading < 112.5 ? 'E' :
                     heading >= 112.5 && heading < 157.5 ? 'SE' :
                     heading >= 157.5 && heading < 202.5 ? 'S' :
                     heading >= 202.5 && heading < 247.5 ? 'SW' :
                     heading >= 247.5 && heading < 292.5 ? 'W' : 'NW'}
                  </span>
                </div>
                <div className="w-0.5 h-2 bg-neutral-800"></div>
                <div className="flex items-center gap-0.5">
                  <Waves className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                  <span>{speed} MPH</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center HUD: Urgent SOS Emergency Broadcast Status */}
        {isSosActive && (
          <div className="px-5 py-2.5 bg-red-600/90 border border-red-500 rounded-full animate-bounce shadow-lg pointer-events-auto flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-ping"></span>
            <span className="text-[10px] font-black uppercase tracking-wider text-white">SOS EMERGENCY ACTIVE</span>
          </div>
        )}

        {/* Right HUD: Location Sharing Controls */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5 max-w-[48vw]">
          {/* Status bubble */}
          <div className="bg-neutral-950/90 border border-cyan-500/30 text-[8px] font-mono font-bold text-cyan-400 px-2 py-0.5 rounded-lg uppercase tracking-wider shadow-lg select-none whitespace-nowrap flex items-center gap-1">
            {visibility === 'ghost' ? (
              user ? (
                <>🔒 Location: Private</>
              ) : (
                <>🔒 Location: Off (Guest)</>
              )
            ) : visibility === 'friends' ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500"></span>
                </span>
                <span>📡 Sharing: Friends</span>
              </>
            ) : (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                </span>
                <span>🌐 Sharing: Public</span>
              </>
            )}
          </div>

          {/* Visibility Toggle Buttons */}
          <div className="bg-neutral-950/75 backdrop-blur-md border border-neutral-900/60 p-0.5 rounded-full shadow-lg flex items-center gap-0.5">
            <button 
              onClick={() => setVisibility('ghost')}
              className={`px-2.5 py-1 rounded-full text-[8.5px] font-mono font-bold uppercase transition-all ${visibility === 'ghost' ? 'bg-red-650 text-white font-black' : 'text-neutral-450 hover:text-white'}`}
            >
              Private
            </button>
            <button 
              onClick={() => {
                if (!user) {
                  setCheckInToastMsg("Log in to share location with Friends!");
                  setTimeout(() => setCheckInToastMsg(null), 3000);
                  setAuthTab('login');
                  setAuthError(null);
                  setShowAuthSheet(true);
                  return;
                }
                setVisibility('friends');
              }}
              className={`px-2.5 py-1 rounded-full text-[8.5px] font-mono font-bold uppercase transition-all ${visibility === 'friends' ? 'bg-yellow-500 text-black font-black' : 'text-neutral-450 hover:text-white'}`}
            >
              Friends
            </button>
            <button 
              onClick={() => {
                if (!user) {
                  setCheckInToastMsg("Log in to share location Publicly!");
                  setTimeout(() => setCheckInToastMsg(null), 3000);
                  setAuthTab('login');
                  setAuthError(null);
                  setShowAuthSheet(true);
                  return;
                }
                setVisibility('public');
              }}
              className={`px-2.5 py-1 rounded-full text-[8.5px] font-mono font-bold uppercase transition-all ${visibility === 'public' ? 'bg-cyan-500 text-black font-black' : 'text-neutral-450 hover:text-white'}`}
            >
              Public
            </button>
          </div>
        </div>

      </div>

      {/* Visibility & Auth Stack (Centered Bottom HUD between Plus and SOS) */}
      {!showOnboarding && !showAddSpot && !showEditSpot && !selectedSpot && !tempGoogleSpot && !showSearch && !showTelemetry && !isFineTuning && !showProfileSheet && !showAuthSheet && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center gap-2 max-w-[90vw]">

          {/* Centered Login/User Button */}
          {user ? (
            <button
              id="welcome-profile-btn"
              onClick={() => setShowProfileSheet(true)}
              className="px-4 py-2 bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-900/80 text-white rounded-full flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer min-h-[36px]"
              title={`Logged in as ${user.displayName || user.email}. Click to view Profile.`}
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[9px] font-mono font-black uppercase text-neutral-300">Welcome {(user.displayName || nickname || 'Rider').split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthTab('login');
                setAuthError(null);
                setShowAuthSheet(true);
              }}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500/20 rounded-full text-[9px] font-mono font-black uppercase shadow-lg active:scale-95 transition-all cursor-pointer min-h-[36px] flex items-center justify-center gap-1"
            >
              <User className="w-3.5 h-3.5" /> Login / Register
            </button>
          )}

        </div>
      )}

      {/* Sliding Search Overlay Panel */}
      {showSearch && (
        <div className="absolute top-20 left-4 right-4 bg-neutral-950/95 backdrop-blur-md border border-neutral-900 rounded-[2rem] z-30 p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
            <span className="text-[8.5px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Search Waterway</span>
            <button 
              id="close-search-btn"
              onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchSourceFilter('all'); }}
              className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-450 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search food, fuel, launches, sandbars, friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-2xl pl-10 pr-12 py-3 text-xs outline-none min-h-[46px]"
              autoFocus
            />
            <Search className="w-4.5 h-4.5 text-neutral-400 absolute left-3 top-3.5" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 text-neutral-400 hover:text-white text-xs font-bold font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* Source Filter Chips */}
          <div className="flex gap-2 pb-1">
            <button
              type="button"
              id="search-filter-all"
              onClick={() => setSearchSourceFilter('all')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all border ${
                searchSourceFilter === 'all' 
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 font-black' 
                  : 'bg-neutral-900 border-neutral-850 text-neutral-450 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              id="search-filter-gridpass"
              onClick={() => setSearchSourceFilter('gridpass')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all border ${
                searchSourceFilter === 'gridpass' 
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 font-black' 
                  : 'bg-neutral-900 border-neutral-850 text-neutral-450 hover:text-white'
              }`}
            >
              Gridpass Only
            </button>
            <button
              type="button"
              id="search-filter-google"
              onClick={() => setSearchSourceFilter('google')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all border ${
                searchSourceFilter === 'google' 
                  ? 'bg-neutral-950/20 border-neutral-600 text-neutral-400 font-black shadow-inner' 
                  : 'bg-neutral-900 border-neutral-850 text-neutral-450 hover:text-white'
              }`}
              style={searchSourceFilter === 'google' ? { borderColor: '#404040', backgroundColor: 'rgba(64, 64, 64, 0.15)', color: '#888888' } : {}}
            >
              Google Maps
            </button>
          </div>
          
          {searchQuery.trim() ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
              {getSearchResults().length > 0 ? (
                getSearchResults().map((result: any) => {
                  const isGoogle = result.type === 'google';
                  
                  let emoji = '⚓';
                  if (result.type === 'friend') emoji = '🟢';
                  else if (result.category === 'hazard') emoji = '⚠️';
                  else if (result.category === 'food') emoji = '🍔';
                  else if (result.category === 'fuel') emoji = '⛽';
                  else if (result.category === 'sandbar') emoji = '🏝️';
                  else if (result.category === 'vendor' || result.category === 'business') emoji = '🏢';
                  else if (isGoogle) {
                    if (result.category === 'food') emoji = '🍽️';
                    else if (result.category === 'fuel') emoji = '⛽';
                    else if (result.category === 'park') emoji = '🌳';
                    else emoji = '📍';
                  }

                  if (isGoogle) {
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full p-2.5 bg-neutral-900/30 border border-neutral-850 hover:border-neutral-700/50 rounded-xl flex items-center justify-between transition-all active:scale-98 text-left"
                      >
                        <div className="flex items-center gap-2 text-left">
                          <span className="text-xs text-neutral-500">{emoji}</span>
                          <div>
                            <div className="text-[11px] font-bold text-neutral-450 leading-tight">{result.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[7.5px] font-mono text-neutral-500 uppercase tracking-wide">{result.category}</span>
                              <span className="text-[7px] font-mono font-bold bg-neutral-950 px-1 py-0.2 rounded border border-neutral-900 text-neutral-500 uppercase">Google Maps</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-[8.5px] font-mono font-bold text-neutral-550">
                          {result.distance.toFixed(1)} mi
                        </div>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full p-3 bg-neutral-900/60 border border-neutral-850 hover:border-cyan-500/50 rounded-xl flex items-center justify-between transition-all active:scale-98"
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        <span className="text-sm">{emoji}</span>
                        <div>
                          <div className="text-xs font-bold text-white capitalize leading-tight">{result.name}</div>
                          <div className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider mt-0.5">{result.type}</div>
                        </div>
                      </div>
                      <div className="text-[9px] font-mono font-bold text-cyan-400">
                        {result.distance.toFixed(1)} mi
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-neutral-500 font-medium">No results found for "{searchQuery}"</div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Type to search items around you</div>
          )}
        </div>
      )}

      {/* Left Telemetry Sidebar Panel */}
      <div className={`absolute top-0 bottom-0 left-0 w-[280px] bg-neutral-950/95 backdrop-blur-lg border-r border-neutral-900 z-40 transition-transform duration-300 shadow-2xl flex flex-col justify-between ${showTelemetry ? 'translate-x-0' : '-translate-x-full invisible pointer-events-none'}`}>
        <div className="p-6 space-y-6 text-left overflow-y-auto no-scrollbar flex-1">
          <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <Compass className="w-4.5 h-4.5 text-cyan-400" /> Live Ride Stats
            </h3>
            <button 
              id="close-telemetry-btn"
              onClick={() => setShowTelemetry(false)}
              className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-850 flex items-center justify-center text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Telemetry Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-2xl">
              <span className="text-[7.5px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">Current Speed</span>
              <span className="text-2xl font-black text-white">{speed}</span>
              <span className="text-[9px] font-mono font-bold text-cyan-400 ml-1">MPH</span>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-2xl">
              <span className="text-[7.5px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">Direction</span>
              <span className="text-2xl font-black text-white">{heading}°</span>
              <span className="text-[9px] font-mono font-bold text-cyan-400 ml-1">
                {heading >= 337.5 || heading < 22.5 ? 'N' :
                 heading >= 22.5 && heading < 67.5 ? 'NE' :
                 heading >= 67.5 && heading < 112.5 ? 'E' :
                 heading >= 112.5 && heading < 157.5 ? 'SE' :
                 heading >= 157.5 && heading < 202.5 ? 'S' :
                 heading >= 202.5 && heading < 247.5 ? 'SW' :
                 heading >= 247.5 && heading < 292.5 ? 'W' : 'NW'}
              </span>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-2xl">
              <span className="text-[7.5px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">Device Battery</span>
              <span className="text-2xl font-black text-white">{batteryLevel}%</span>
              <span className="text-[9px] font-mono font-bold text-cyan-400 ml-1 flex items-center gap-0.5">
                <Battery className="w-3.5 h-3.5 inline" /> Status
              </span>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-2xl">
              <span className="text-[7.5px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">{context.tempLabel}</span>
              <span className="text-2xl font-black text-white">{waterTemp}</span>
              <span className="text-[9px] font-mono font-bold text-cyan-400 ml-1">Est. Average</span>
            </div>
          </div>

          {/* Active coordinates details */}
          <div className="bg-neutral-900/40 border border-neutral-850 p-4 rounded-3xl space-y-3">
            <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">GPS Signal Status</span>
            
            <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
              <span className="text-xs text-neutral-400 font-medium">Latitude</span>
              <span className="text-xs font-mono font-bold text-white">{userCoords.lat.toFixed(5)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400 font-medium">Longitude</span>
              <span className="text-xs font-mono font-bold text-white">{userCoords.lng.toFixed(5)}</span>
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-3xl space-y-4">
            <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Settings</span>
            
            {/* Follow GPS Location */}
            <div className="flex items-center justify-between">
              <div className="text-left pr-2">
                <span className="text-xs text-white font-bold block">Follow GPS Location</span>
                <span className="text-[9px] text-neutral-550 leading-normal block">Auto-pans map as you move</span>
              </div>
              <button
                type="button"
                id="follow-gps-toggle"
                onClick={() => updateFollowMe(!followMe)}
                className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 ${followMe ? 'bg-cyan-500' : 'bg-neutral-800 border border-neutral-755'}`}
              >
                <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all duration-300 ${followMe ? 'left-5.5' : 'left-0.5'}`}></div>
              </button>
            </div>

            {/* Keep Screen Awake */}
            <div className="flex items-center justify-between border-t border-neutral-900 pt-3">
              <div className="text-left pr-2">
                <span className="text-xs text-white font-bold block">Keep Screen Awake</span>
                <span className="text-[9px] text-neutral-550 leading-normal block">
                  {typeof window !== 'undefined' && 'wakeLock' in navigator 
                    ? 'Prevents screen dimming / sleeping' 
                    : 'Not supported on this browser'}
                </span>
              </div>
              <button
                type="button"
                id="wake-lock-toggle"
                disabled={!(typeof window !== 'undefined' && 'wakeLock' in navigator)}
                onClick={toggleWakeLock}
                className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 ${
                  !(typeof window !== 'undefined' && 'wakeLock' in navigator) 
                    ? 'bg-neutral-900 border border-neutral-950 opacity-40 cursor-not-allowed' 
                    : wakeLockActive 
                      ? 'bg-cyan-500' 
                      : 'bg-neutral-800 border border-neutral-755'
                }`}
              >
                <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all duration-300 ${wakeLockActive ? 'left-5.5' : 'left-0.5'}`}></div>
              </button>
            </div>

            {/* Clear Path History */}
            <div className="flex items-center justify-between border-t border-neutral-900 pt-3">
              <div className="text-left pr-2">
                <span className="text-xs text-white font-bold block">Clear Active Trail</span>
                <span className="text-[9px] text-neutral-550 leading-normal block">
                  Resets the trail for this vehicle
                </span>
              </div>
              <button
                type="button"
                id="clear-trail-btn"
                onClick={handleClearActiveTrail}
                className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/30 border border-red-900/50 hover:border-red-500 text-red-400 hover:text-white text-[9px] font-bold uppercase rounded-lg transition-all"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Active Vehicle Selector */}
          <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-3xl space-y-3">
            <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
              {user ? 'Your Garage (Gridpass)' : 'Guest Garage'}
            </span>
            <div className="flex flex-col gap-2">
              {(user ? userVehicles : GUEST_VEHICLES).map(v => {
                const details = getVehicleDetails(v.make, v.model);
                const isActive = activeVehicleId === v.id;
                const displayName = `${v.year || ''} ${v.make} ${v.model}`.trim();
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => updateActiveVehicleId(v.id)}
                    className={`w-full p-3 text-[10.5px] font-bold uppercase rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                      isActive 
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 font-black shadow-lg shadow-cyan-500/5' 
                        : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="text-sm shrink-0">{details.emoji}</span>
                    <div className="truncate flex-1">
                      <span className="block truncate">{displayName}</span>
                      {v.specs?.engine && (
                        <span className="block text-[7.5px] font-mono text-neutral-500 lowercase tracking-tight mt-0.5">
                          {v.specs.engine} {v.specs.hp ? `(${v.specs.hp} hp)` : ''}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {user && userVehicles.length === 0 && (
                <div className="py-2 text-center text-[9.5px] text-neutral-500 font-bold uppercase tracking-wider">
                  No vehicles in your garage.
                </div>
              )}
            </div>
          </div>

          {/* Active Mode Selector */}
          <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-3xl space-y-2">
            <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Dashboard Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleModeChange('waterway')}
                className={`py-2 text-[10px] font-bold uppercase rounded-xl border transition-all ${activeMode === 'waterway' ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 font-black' : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white'}`}
              >
                ⛵ Boat Mode
              </button>
              <button
                onClick={() => handleModeChange('racetrack')}
                className={`py-2 text-[10px] font-bold uppercase rounded-xl border transition-all ${activeMode === 'racetrack' ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 font-black' : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white'}`}
              >
                🏎️ Track Mode
              </button>
              <button
                onClick={() => handleModeChange('offroad_park')}
                className={`py-2 text-[10px] font-bold uppercase rounded-xl border transition-all ${activeMode === 'offroad_park' ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 font-black' : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white'}`}
              >
                🚜 Offroad
              </button>
              <button
                onClick={() => handleModeChange('event_center')}
                className={`py-2 text-[10px] font-bold uppercase rounded-xl border transition-all ${activeMode === 'event_center' ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 font-black' : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white'}`}
              >
                🏆 Show Mode
              </button>
            </div>
          </div>

          {/* Rules info summary */}
          <div className="p-4 bg-cyan-950/10 border border-cyan-900/25 rounded-3xl space-y-2">
            <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">{venue.name} Rules</h4>
            <ul className="text-[10px] text-neutral-400 space-y-1.5 leading-normal">
              {venue.rules && venue.rules.slice(0, 3).map((r, idx) => (
                <li key={idx}>• <strong>{r.title}</strong>: {r.desc}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-6 border-t border-neutral-900 text-left">
          <div className="text-[8.5px] font-mono text-neutral-500 font-bold uppercase">{context.tagLabel}</div>
          <div className="text-[10px] text-neutral-400 mt-1 font-bold">Rider ID: {nickname || 'Guest Spectator'}</div>
        </div>
      </div>

      {/* Floating Action HUD Controls (Bottom Right Map Layers / Controls) */}
      <div className="absolute right-4 bottom-4 z-20 pointer-events-none flex flex-col gap-3">
        
        {/* Share Live Radar deep link (copies to clipboard) */}
        <button 
          onClick={handleShareRadar}
          className="pointer-events-auto w-14 h-14 bg-neutral-950/75 backdrop-blur-md border border-neutral-900/60 rounded-full flex items-center justify-center text-white active:scale-95 transition-all shadow-lg"
          title="Share Live Radar Link"
        >
          <Share2 className="w-5.5 h-5.5 text-cyan-400" />
        </button>

        {/* Map Type Toggle (Roadmap / Satellite Hybrid) */}
        <button 
          onClick={() => setMapType(prev => prev === 'roadmap' ? 'satellite' : 'roadmap')}
          className="pointer-events-auto w-14 h-14 bg-neutral-950/75 backdrop-blur-md border border-neutral-900/60 rounded-full flex flex-col items-center justify-center text-white active:scale-95 transition-all shadow-lg"
          title="Toggle Map Satellite View"
        >
          <Layers className="w-5 h-5 text-cyan-400" />
          <span className="text-[7px] font-mono font-bold uppercase mt-1 leading-none text-neutral-300">
            {mapType === 'roadmap' ? 'Road' : 'Sat'}
          </span>
        </button>

        {/* Recenter Button (56px touch target area) */}
        <button 
          id="recenter-btn"
          onClick={handleRecenter}
          className={`pointer-events-auto w-14 h-14 backdrop-blur-md border rounded-full flex items-center justify-center active:scale-95 transition-all shadow-lg ${
            followMe 
              ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' 
              : 'bg-neutral-950/75 border-neutral-900/60 text-white'
          }`}
          title="Center and Follow Me"
        >
          <Crosshair className={`w-5.5 h-5.5 ${followMe ? 'text-cyan-400' : 'text-neutral-400'}`} />
        </button>

        {/* Zoom In / Out Buttons */}
        <div className="bg-neutral-950/75 backdrop-blur-md border border-neutral-900/60 rounded-full p-1 shadow-lg pointer-events-auto flex flex-col items-center">
          <button 
            onClick={zoomIn}
            className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-400 hover:text-white active:scale-90 transition-transform text-lg font-bold"
          >
            +
          </button>
          <div className="w-8 h-[1px] bg-neutral-900"></div>
          <button 
            onClick={zoomOut}
            className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-400 hover:text-white active:scale-90 transition-transform text-lg font-bold"
          >
            -
          </button>
        </div>

        {/* SOS pulsing emergency trigger */}
        <button 
          onClick={handleSosPress}
          className={`pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center text-white active:scale-95 transition-all shadow-2xl relative ${
            isSosActive ? 'bg-red-500 animate-pulse' : 'bg-red-700/85 hover:bg-red-600'
          }`}
          style={{ border: '2px solid rgba(255,255,255,0.2)' }}
        >
          {isSosActive ? (
            <span className="text-xs font-black uppercase tracking-wider">CANCEL</span>
          ) : (
            <span className="text-sm font-black uppercase tracking-widest text-white">SOS</span>
          )}
        </button>

      </div>

      {/* Floating Plus Button to Drop Spot (Bottom Left) */}
      <div className="absolute left-4 bottom-4 z-20 pointer-events-auto">
        <button 
          onClick={() => {
            if (!user) {
              setCheckInToastMsg("Log in to add hotspots!");
              setTimeout(() => setCheckInToastMsg(null), 3000);
              setAuthTab('login');
              setAuthError(null);
              setShowAuthSheet(true);
              return;
            }
            setSelectedSpot(null);
            setShowEditSpot(false);
            setShowAddSpot(true);
            setPendingSpotCoords({ lat: userCoords.lat, lng: userCoords.lng });
            if (mapRef.current) {
              mapRef.current.setView([userCoords.lat, userCoords.lng], 18);
            }
          }}
          className="w-14 h-14 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full flex items-center justify-center active:scale-95 transition-all shadow-xl shadow-cyan-600/15"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Countdown modal overlay for SOS activation */}
      {sosCountdown !== null && (
        <div className="absolute inset-0 bg-red-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="space-y-6 text-center px-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider animate-pulse">Sharing Emergency SOS</h2>
            <div className="text-7xl font-black text-white font-mono">{sosCountdown}</div>
            <p className="text-xs text-red-300 max-w-xs leading-relaxed font-semibold">
              Sharing your exact location with nearby riders, safety staff, and local docks.
            </p>
            <div className="text-[9.5px] uppercase tracking-wider text-red-400 font-black max-w-xs mx-auto border border-red-900/40 bg-red-950/40 p-2.5 rounded-xl leading-normal">
              ⚠️ Warning: P2P location alert only. NOT a substitute for 911 or emergency services.
            </div>
            <button 
              onClick={handleCancelSos}
              className="px-6 py-3 bg-white hover:bg-neutral-100 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Cancel SOS / I'm Okay
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet Modal: Spot Details Drawer Panel */}
      {selectedSpot && !showEditSpot && (
        <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950/95 backdrop-blur-md border-t border-neutral-900 rounded-t-[2rem] z-30 p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-300 text-left">
          <button 
            id="close-details-btn"
            onClick={() => setSelectedSpot(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1">
            <div className="flex gap-2 items-center">
              <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                selectedSpot.status === 'verified' ? 'bg-emerald-950/30 border border-emerald-900/30 text-emerald-400' : 'bg-blue-950/25 border border-blue-900/20 text-cyan-400'
              }`}>
                {selectedSpot.status} Spot
              </span>
              {selectedSpot.business_id && (
                <span className="text-[8.5px] font-mono font-bold bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded flex items-center gap-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" /> Verified Partner
                </span>
              )}
            </div>
            <h4 className="text-base font-black text-white uppercase pt-1 tracking-tight leading-tight">{selectedSpot.name}</h4>
            <p className="text-[8.5px] font-mono text-neutral-500 font-bold">Coordinates: {selectedSpot.latitude.toFixed(5)}, {selectedSpot.longitude.toFixed(5)}</p>
          </div>

          {/* Features */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {selectedSpot.features.map(f => (
                <span key={f} className="text-[9px] font-mono font-bold bg-neutral-900 border border-neutral-850 text-neutral-350 px-2.5 py-1 rounded-xl uppercase">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Hours */}
          {selectedSpot.hours && (
            <div className="space-y-1">
              <span className="text-[8.5px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Hours</span>
              <p className="text-xs text-neutral-300 font-semibold">{selectedSpot.hours}</p>
            </div>
          )}

          {/* Photos */}
          {selectedSpot.photo_urls && selectedSpot.photo_urls.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[8.5px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Photos</span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                {selectedSpot.photo_urls.map((url, idx) => (
                  <img 
                    key={idx} 
                    src={url} 
                    alt={`Sighting Spot ${idx + 1}`} 
                    className="w-20 h-20 rounded-xl object-cover border border-neutral-850"
                  />
                ))}
              </div>
            </div>
          )}{/* Observations notes list */}
          <div className="space-y-2">
            <span className="text-[8.5px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">User Logs</span>
            <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar pr-1">
              {selectedSpot.notes && selectedSpot.notes.length > 0 ? (
                selectedSpot.notes.map((n, i) => (
                  <div key={i} className="p-2.5 bg-neutral-900 border border-neutral-850 rounded-xl text-[10px] space-y-1.5 leading-normal">
                    <div className="flex justify-between items-center text-[8.5px] font-mono font-bold">
                      <span className="text-cyan-400 flex items-center gap-1">
                        {n.user}
                        {n.rating && (
                          <span className="text-yellow-500 font-sans ml-1 text-[9px]">
                            {'★'.repeat(n.rating)}{'☆'.repeat(5 - n.rating)}
                          </span>
                        )}
                      </span>
                      <span className="text-neutral-500">{new Date(n.timestamp).toLocaleDateString()}</span>
                    </div>
                    {n.text && <p className="text-neutral-300 font-medium">{n.text}</p>}
                    
                    {/* Review Tags */}
                    {n.tags && n.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {n.tags.map((tag, idx) => (
                          <span key={idx} className="text-[7.5px] font-mono font-bold bg-neutral-950 border border-neutral-850/50 text-neutral-400 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Review Photos */}
                    {n.photo_urls && n.photo_urls.length > 0 && (
                      <div className="flex gap-1 overflow-x-auto no-scrollbar mt-1.5">
                        {n.photo_urls.map((url, idx) => (
                          <img 
                            key={idx} 
                            src={url} 
                            alt="User review photo" 
                            className="w-10 h-10 rounded object-cover border border-neutral-800" 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-[9px] text-neutral-500 font-bold uppercase tracking-wider">No reviews yet. Be the first!</div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-neutral-900 flex gap-2">
            {(() => {
              const dist = Math.sqrt(
                Math.pow(userCoords.lat - selectedSpot.latitude, 2) + 
                Math.pow(userCoords.lng - selectedSpot.longitude, 2)
              );
              const canCheckIn = dist < 0.005;
              return (
                <button 
                  onClick={handleCheckIn}
                  className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-md min-h-[46px] transition-all cursor-pointer ${
                    canCheckIn 
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/10' 
                      : 'bg-neutral-900 border border-neutral-850 text-neutral-500 cursor-not-allowed hover:text-red-400'
                  }`}
                  title={canCheckIn ? "Check In at this Spot" : "Too far away to check in (Must be within 500m)"}
                >
                  <Check className={`w-3.5 h-3.5 ${canCheckIn ? 'text-white' : 'text-neutral-500'}`} /> 
                  {canCheckIn ? "Check In" : "Out of Range"}
                </button>
              );
            })()}
            <button 
              onClick={() => {
                if (!user) {
                  setCheckInToastMsg("Log in to leave reviews & photos!");
                  setTimeout(() => setCheckInToastMsg(null), 3000);
                  setAuthTab('login');
                  setAuthError(null);
                  setShowAuthSheet(true);
                  return;
                }
                setShowReviewSheet(true);
              }}
              className="px-3 py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer min-h-[46px]"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" /> Review
            </button>
            <button 
              onClick={() => {
                if (!user) {
                  setCheckInToastMsg("Log in to suggest edits!");
                  setTimeout(() => setCheckInToastMsg(null), 3000);
                  setAuthTab('login');
                  setAuthError(null);
                  setShowAuthSheet(true);
                  return;
                }
                setShowEditSpot(true);
                setEditSpotCoords({ lat: selectedSpot.latitude, lng: selectedSpot.longitude });
                if (mapRef.current) {
                  mapRef.current.setView([selectedSpot.latitude, selectedSpot.longitude], 18);
                }
              }}
              className="px-3 py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer min-h-[46px]"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> Edits
            </button>
            {selectedSpot.business_id && (
              <a 
                href={`/b/${selectedSpot.business_id}`}
                className="px-3 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer min-h-[46px]"
              >
                <Building2 className="w-3.5 h-3.5" /> Store
              </a>
            )}
          </div>
        </div>
      )}

      {/* Bottom Sheet Modal: Temporary Google Maps Spot Details Drawer Panel */}
      {tempGoogleSpot && (
        <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950/95 backdrop-blur-md border-t border-neutral-900 rounded-t-[2rem] z-30 p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-300 text-left">
          <button 
            id="close-google-details-btn"
            onClick={() => setTempGoogleSpot(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-450 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1">
            <div className="flex gap-2 items-center">
              <span className="text-[8.5px] font-mono font-bold bg-neutral-900 border border-neutral-800 text-neutral-500 px-2 py-0.5 rounded uppercase">
                Google Maps Place
              </span>
            </div>
            <h4 className="text-base font-black text-neutral-300 uppercase pt-1 tracking-tight leading-tight">{tempGoogleSpot.name}</h4>
            <p className="text-[8.5px] font-mono text-neutral-500 font-bold">Coordinates: {tempGoogleSpot.latitude.toFixed(5)}, {tempGoogleSpot.longitude.toFixed(5)}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[8.5px] font-mono font-bold text-neutral-550 uppercase tracking-widest block">Address</span>
            <p className="text-xs text-neutral-400 font-medium">{tempGoogleSpot.address}</p>
          </div>

          <div className="p-3 bg-neutral-900/40 border border-neutral-850 rounded-2xl flex items-start gap-2 text-[10px] text-neutral-450 leading-relaxed">
            <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <span>
              This location is imported from Google Maps search index. You can claim it to register it as an official Gridpass hotspot with water depths, observation logs, and safety tags.
            </span>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-neutral-900 flex gap-3">
            <button 
              id="claim-google-spot-btn"
              onClick={() => {
                setNewSpotName(tempGoogleSpot.name);
                setNewSpotNotes(`Imported from Google Maps at ${tempGoogleSpot.address}`);
                setNewSpotType(tempGoogleSpot.type === 'food' ? 'food' : tempGoogleSpot.type === 'fuel' ? 'fuel' : tempGoogleSpot.type === 'launch' ? 'launch' : 'dock');
                setUserCoords({ lat: tempGoogleSpot.latitude, lng: tempGoogleSpot.longitude });
                setShowAddSpot(true);
                setPendingSpotCoords({ lat: tempGoogleSpot.latitude, lng: tempGoogleSpot.longitude });
                setTempGoogleSpot(null);
              }}
              className="flex-1 py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer min-h-[46px]"
            >
              <Plus className="w-4 h-4 text-cyan-400" /> Claim Spot on Gridpass
            </button>
            <button 
              onClick={() => setTempGoogleSpot(null)}
              className="px-6 py-3.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-neutral-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 cursor-pointer min-h-[46px]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      {/* Bottom Sheet Modal: Drop/Add New Spot Form */}
      {showAddSpot && !isFineTuning && (
        <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950/95 backdrop-blur-md border-t border-neutral-900 rounded-t-[2rem] z-30 p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300 text-left overflow-y-auto max-h-[90dvh] no-scrollbar">
          <button 
            id="close-add-spot-btn"
            onClick={() => setShowAddSpot(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1.5 border-b border-neutral-900 pb-3">
            <span className="text-[8.5px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Add Hotspot / POI</span>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Drop New Pin At GPS</h3>
          </div>

          <div className="bg-neutral-900 border border-neutral-850 p-3 rounded-xl text-[10px] font-medium leading-normal flex items-center justify-between gap-3 select-none">
            <div className="flex items-start gap-2">
              <span className="text-xs">📍</span>
              <div className="flex flex-col">
                <span className="font-bold text-neutral-200">GPS: {pendingSpotCoords ? `${pendingSpotCoords.lat.toFixed(5)}, ${pendingSpotCoords.lng.toFixed(5)}` : 'Detecting...'}</span>
                <span className="text-[8px] text-neutral-450 uppercase tracking-wider mt-0.5">Location defaults to current GPS position</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startFineTuning('add')}
              className="bg-cyan-950/45 hover:bg-cyan-900/60 border border-cyan-800/40 text-cyan-450 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all shrink-0"
            >
              Adjust Pin
            </button>
          </div>

          <form onSubmit={handleDropSpotSubmit} className="space-y-4">
            <div>
              <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Location Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Grass Lake Fuel Dock / Sandbar"
                value={newSpotName}
                onChange={(e) => setNewSpotName(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-3 text-xs font-medium outline-none min-h-[50px]"
              />
            </div>

            <div>
              <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Spot Category</label>
              <select
                value={newSpotType}
                onChange={(e) => setNewSpotType(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-3 text-xs outline-none cursor-pointer min-h-[50px] font-bold uppercase"
              >
                {context.categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Rider Observation Notes</label>
              <textarea 
                placeholder="e.g. Muddy sand, shallow depth around 2 feet. Anchor out."
                value={newSpotNotes}
                onChange={(e) => setNewSpotNotes(e.target.value)}
                rows={2}
                className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-2.5 text-xs font-medium outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Add Photos of Signs / Costs / Features</label>
              <div className="flex gap-3 items-center">
                <label className="flex flex-col items-center justify-center w-16 h-16 bg-neutral-900 border border-dashed border-neutral-800 hover:border-cyan-500 rounded-xl cursor-pointer transition-all">
                  <div className="flex flex-col items-center justify-center pt-1">
                    <Plus className="w-5 h-5 text-neutral-400" />
                    <span className="text-[7.5px] font-bold text-neutral-500 uppercase mt-0.5">Add</span>
                  </div>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                  />
                </label>
                
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                  {newSpotPhotos.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16">
                      <img 
                        src={url} 
                        alt="Uploaded preview" 
                        className="w-16 h-16 rounded-xl object-cover border border-neutral-850" 
                      />
                      <button 
                        type="button"
                        onClick={() => setNewSpotPhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-xs tracking-wider py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 min-h-[56px] cursor-pointer"
            >
              <Send className="w-4 h-4" /> Drop Verified Pin
            </button>
          </form>
        </div>
      )}

      {/* Bottom Sheet Modal: Suggest Edits/Observation Note Form */}
      {showEditSpot && selectedSpot && !isFineTuning && (
        <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950/95 backdrop-blur-md border-t border-neutral-900 rounded-t-[2rem] z-30 p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300 text-left overflow-y-auto max-h-[90dvh] no-scrollbar">
          <button 
            id="close-edit-spot-btn"
            onClick={() => setShowEditSpot(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1.5 border-b border-neutral-900 pb-3">
            <span className="text-[8.5px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Suggest Spot Updates</span>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Edit: {selectedSpot.name}</h3>
          </div>

          <div className="bg-neutral-900 border border-neutral-850 p-3 rounded-xl text-[10px] font-medium leading-normal flex items-center justify-between gap-3 select-none">
            <div className="flex items-start gap-2">
              <span className="text-xs">📍</span>
              <div className="flex flex-col">
                <span className="font-bold text-neutral-200">Coords: {editSpotCoords ? `${editSpotCoords.lat.toFixed(5)}, ${editSpotCoords.lng.toFixed(5)}` : `${selectedSpot.latitude.toFixed(5)}, ${selectedSpot.longitude.toFixed(5)}`}</span>
                <span className="text-[8px] text-neutral-450 uppercase tracking-wider mt-0.5">Defaults to spot coordinates</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startFineTuning('edit')}
              className="bg-cyan-950/45 hover:bg-cyan-900/60 border border-cyan-800/40 text-cyan-450 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all shrink-0"
            >
              Adjust Pin
            </button>
          </div>

          <form onSubmit={handleSuggestEditsSubmit} className="space-y-4">
            <div>
              <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Confirm Operating Hours</label>
              <input 
                type="text" 
                placeholder={selectedSpot.hours || 'e.g. Sunrise - Sunset'}
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-3 text-xs outline-none min-h-[50px]"
              />
            </div>

            <div>
              <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Add Location Note</label>
              <textarea 
                placeholder="Log details like weed density, wave sizes, slip rates..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-2.5 text-xs font-medium outline-none resize-none"
              />
            </div>

            <div className="p-3 bg-red-950/5 border border-red-900/10 rounded-2xl flex items-center gap-2.5">
              <input 
                type="checkbox"
                id="report-closed-chk"
                checked={isSpotClosedReported}
                onChange={(e) => setIsSpotClosedReported(e.target.checked)}
                className="w-4.5 h-4.5 text-red-600 rounded bg-neutral-900 border-neutral-800"
              />
              <label htmlFor="report-closed-chk" className="text-[10px] text-red-400 font-bold uppercase cursor-pointer select-none">
                Report spot as closed / missing completely
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-xs tracking-wider py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 min-h-[56px] cursor-pointer"
            >
              Submit Recommendations
            </button>
          </form>
        </div>
      )}

      {/* Guest Mode Onboarding Fullscreen Modal */}
      {showOnboarding && (
        <div className="absolute inset-0 bg-[#060608]/95 backdrop-blur-lg flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="max-w-sm w-full bg-neutral-950/80 border border-neutral-900 p-6 md:p-8 rounded-[2.5rem] shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <Waves className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">{context.onboardingTitle}</h2>
              <p className="text-[11px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
                Enter a display name to show up on the live map and see where other riders are.
              </p>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4 text-left">
              <div>
                <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Your Rider Nickname</label>
                <input 
                   type="text"
                   required
                   placeholder="e.g. Captain PJ"
                   value={nickname}
                   onChange={(e) => setNickname(e.target.value)}
                   className="w-full bg-neutral-900 border border-neutral-850 focus:border-cyan-500 text-white rounded-xl px-4 py-3 text-xs outline-none text-center font-bold uppercase tracking-wider min-h-[50px]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-xs tracking-wider py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 min-h-[52px] cursor-pointer"
              >
                Join Live Map →
              </button>
            </form>

            <div className="border-t border-neutral-900 pt-4 flex flex-col gap-2.5">
              <button 
                onClick={() => {
                  setShowOnboarding(false);
                  setAuthTab('login');
                  setAuthError(null);
                  setShowAuthSheet(true);
                }}
                className="w-full bg-neutral-900 hover:bg-neutral-850 text-white font-bold uppercase text-[10px] tracking-wider py-3 rounded-xl border border-neutral-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Sign In with Gridpass
              </button>
              <button 
                onClick={handleSpectatorMode}
                className="text-[10px] text-neutral-400 hover:text-white uppercase font-bold font-mono tracking-wide cursor-pointer mt-1"
              >
                Or Browse Privately (Hide Your Location)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Minimized Fine-Tuning Floating Bottom Banner */}
      {isFineTuning && (
        <div className="absolute bottom-6 left-4 right-4 z-40 bg-neutral-950/95 backdrop-blur-md border border-neutral-900 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-w-sm mx-auto text-center animate-in slide-in-from-bottom duration-300">
          <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Adjust Location</div>
          <p className="text-[9px] text-neutral-400 leading-relaxed font-semibold">
            Swipe and pan the map to align the pin in the center of the screen with the exact spot.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmFineTune}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-[10px] py-2.5 rounded-xl active:scale-95 transition-all shadow-lg min-h-[38px] cursor-pointer"
            >
              Set Location
            </button>
            <button
              type="button"
              onClick={handleCancelFineTune}
              className="px-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-neutral-400 hover:text-white font-bold uppercase text-[10px] py-2.5 rounded-xl active:scale-95 transition-all min-h-[38px] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet Modal: Profile details sheet */}
      {showProfileSheet && user && (
        <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950/95 backdrop-blur-md border-t border-neutral-900 rounded-t-[2rem] z-30 p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300 text-left overflow-y-auto max-h-[90dvh] no-scrollbar pointer-events-auto">
          <button 
            id="close-profile-sheet-btn"
            onClick={() => setShowProfileSheet(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1.5 border-b border-neutral-900 pb-3">
            <span className="text-[8.5px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Passport Profile</span>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Rider Passport Details</h3>
          </div>

          <div className="space-y-3 font-mono text-[10px] bg-neutral-900/40 border border-neutral-900 p-4 rounded-2xl">
            <div className="flex justify-between items-center py-1 border-b border-neutral-850">
              <span className="text-neutral-450 uppercase">Rider Name</span>
              <span className="text-white font-bold">{user.displayName || nickname || 'Rider'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-neutral-850">
              <span className="text-neutral-450 uppercase">Email</span>
              <span className="text-white font-bold">{user.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-neutral-850">
              <span className="text-neutral-450 uppercase">Sharing Status</span>
              <span className={`font-bold ${visibility === 'ghost' ? 'text-red-400' : visibility === 'friends' ? 'text-yellow-400' : 'text-cyan-400'}`}>
                {visibility === 'ghost' ? 'Private' : visibility === 'friends' ? 'Friends Only' : 'Public'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-450 uppercase">User ID</span>
              <span className="text-neutral-400 font-bold select-all text-[8.5px]">{user.uid}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setShowProfileSheet(false);
              handleSignOut();
            }}
            id="profile-logout-btn"
            className="w-full bg-red-650 hover:bg-red-500 text-white font-black uppercase text-xs tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer"
          >
            Log Out
          </button>
        </div>
      )}

      {/* Bottom Sheet Modal: Inline Auth Sheet */}
      {showAuthSheet && (
        <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950/95 backdrop-blur-md border-t border-neutral-900 rounded-t-[2rem] z-30 p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300 text-left overflow-y-auto max-h-[90dvh] no-scrollbar pointer-events-auto">
          <button 
            id="close-auth-sheet-btn"
            onClick={() => { setShowAuthSheet(false); setAuthError(null); }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1.5 border-b border-neutral-900 pb-3">
            <span className="text-[8.5px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Passport Verification</span>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Access Gridpass Live Map</h3>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[10px] text-center font-medium">
              {authError}
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-neutral-900 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setAuthTab('login'); setAuthError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${authTab === 'login' ? 'bg-neutral-800 text-white font-black' : 'text-neutral-450 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('register'); setAuthError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${authTab === 'register' ? 'bg-neutral-800 text-white font-black' : 'text-neutral-450 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          {authTab === 'login' ? (
            <form onSubmit={handleInlineSignIn} className="space-y-4">
              <div>
                <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="driver@gridpass.app"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-3 text-xs outline-none min-h-[46px]"
                />
              </div>

              <div>
                <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-3 text-xs outline-none min-h-[46px]"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-xs tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleInlineRegister} className="space-y-4">
              <div>
                <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Display Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. MARCUS MUSTANG"
                  value={authDisplayName}
                  onChange={(e) => setAuthDisplayName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-3 text-xs outline-none min-h-[46px] font-bold uppercase"
                />
              </div>

              <div>
                <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="driver@gridpass.app"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-3 text-xs outline-none min-h-[46px]"
                />
              </div>

              <div>
                <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-3 text-xs outline-none min-h-[46px]"
                />
              </div>

              <div>
                <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Confirm Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-3 text-xs outline-none min-h-[46px]"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-xs tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
              </button>
            </form>
          )}

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-neutral-900"></div>
            <span className="flex-shrink mx-4 text-neutral-500 text-[9px] font-bold uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-neutral-900"></div>
          </div>

          <button
            type="button"
            onClick={handleInlineGoogleLogin}
            disabled={authLoading}
            className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-neutral-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer min-h-[46px]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      )}

      {/* Bottom Sheet Modal: Leave Review Sheet */}
      {showReviewSheet && selectedSpot && (
        <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-[#060608]/98 backdrop-blur-lg border-t border-neutral-900 rounded-t-[2.5rem] z-40 p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300 text-left overflow-y-auto max-h-[90dvh] no-scrollbar pointer-events-auto">
          <button 
            id="close-review-sheet-btn"
            onClick={() => setShowReviewSheet(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-450 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1 border-b border-neutral-900 pb-3">
            <span className="text-[8.5px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Feedback & Rating</span>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Review: {selectedSpot.name}</h3>
          </div>

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            {/* Rating Stars */}
            <div className="space-y-1.5">
              <label className="text-[8.5px] font-mono font-bold text-neutral-400 uppercase block">Overall Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setReviewRating(val)}
                    className="text-2xl transition-all hover:scale-110"
                  >
                    {val <= reviewRating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tags Section */}
            <div className="grid grid-cols-2 gap-3 bg-neutral-900/40 p-3 rounded-2xl border border-neutral-900">
              {/* Free Slips */}
              <div className="space-y-1">
                <label className="text-[8.5px] font-mono font-bold text-neutral-400 uppercase block">Free Slips?</label>
                <div className="flex gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-850">
                  {['yes', 'no', 'unknown'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setReviewFreeSlips(opt as any)}
                      className={`flex-1 py-1 text-[8px] font-bold uppercase rounded transition-all ${
                        reviewFreeSlips === opt 
                          ? 'bg-cyan-500/25 text-cyan-400 font-black' 
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Launch Cost */}
              <div className="space-y-1">
                <label className="text-[8.5px] font-mono font-bold text-neutral-400 uppercase block">Launch Cost</label>
                <select
                  value={reviewLaunchCost}
                  onChange={(e) => setReviewLaunchCost(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-850 text-white rounded-lg px-2 py-1 text-[9px] outline-none"
                >
                  <option value="None">Unknown / NA</option>
                  <option value="Free">Free</option>
                  <option value="$5">$5</option>
                  <option value="$10">$10</option>
                  <option value="$15">$15</option>
                  <option value="$20">$20</option>
                  <option value="$25+">$25+</option>
                </select>
              </div>

              {/* Food Type */}
              <div className="space-y-1 col-span-2">
                <label className="text-[8.5px] font-mono font-bold text-neutral-400 uppercase block">Food Types Available</label>
                <select
                  value={reviewFoodType}
                  onChange={(e) => setReviewFoodType(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-850 text-white rounded-lg px-2 py-1 text-[9px] outline-none"
                >
                  <option value="None">None / Unknown</option>
                  <option value="Burgers">🍔 Burgers & Grill</option>
                  <option value="Pizza">🍕 Pizza & Italian</option>
                  <option value="Seafood">🐟 Seafood & Fish</option>
                  <option value="Drinks">🍹 Drinks & Snacks only</option>
                  <option value="Other">🍽️ Full Restaurant Menu</option>
                </select>
              </div>
            </div>

            {/* Pros and Cons */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8.5px] font-mono font-bold text-emerald-400 uppercase block">Good Things (Pros)</label>
                <input
                  type="text"
                  placeholder="e.g. Clean ramp, calm water"
                  value={reviewPros}
                  onChange={(e) => setReviewPros(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-2 text-[10px] outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8.5px] font-mono font-bold text-red-400 uppercase block">Bad Things (Cons)</label>
                <input
                  type="text"
                  placeholder="e.g. Crowded, shallow spots"
                  value={reviewCons}
                  onChange={(e) => setReviewCons(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-2 text-[10px] outline-none focus:border-red-500/50"
                />
              </div>
            </div>

            {/* Review Text */}
            <div className="space-y-1">
              <label className="text-[8.5px] font-mono font-bold text-neutral-400 uppercase block">Your Feedback</label>
              <textarea
                rows={3}
                required
                placeholder="Share your experience at this location..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl p-3 text-[11px] outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-1.5">
              <label className="text-[8.5px] font-mono font-bold text-neutral-400 uppercase block">Upload Photos</label>
              <div className="flex items-center gap-3">
                <label className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all active:scale-95">
                  Select Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleReviewPhotoUpload}
                    className="hidden"
                  />
                </label>
                {reviewPhotos.length > 0 && (
                  <span className="text-[9px] font-mono font-bold text-cyan-400">{reviewPhotos.length} photo(s) selected</span>
                )}
              </div>
              
              {reviewPhotos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {reviewPhotos.map((url, idx) => (
                    <div key={idx} className="relative w-12 h-12 shrink-0">
                      <img src={url} alt="Upload preview" className="w-12 h-12 rounded-lg object-cover border border-neutral-800" />
                      <button
                        type="button"
                        onClick={() => setReviewPhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px] font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-xs tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 min-h-[46px] cursor-pointer"
            >
              Submit Review
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
