'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Compass, Eye, EyeOff, Crosshair, Plus, X, ShieldCheck, 
  AlertTriangle, Check, Info, Building2, Edit3, Trash2, 
  Loader2, HelpCircle, Send, Battery, Wifi, User, Waves,
  Shield, Navigation2, Flame, MapPin, Settings, BarChart2, Share2
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { SEEDED_VENUES, SEEDED_SPOTS, SEEDED_FRIENDS } from '@/lib/data/venues';
import { Venue, VenueSpot, FriendBeacon } from '@/lib/types/venue';

interface WaterMobileViewProps {
  venueId?: string;
}

export default function WaterMobileView({ venueId }: WaterMobileViewProps) {
  const { user } = useAuth();
  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

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

  // Core application states
  const [nickname, setNickname] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [visibility, setVisibility] = useState<'ghost' | 'friends' | 'public'>('public');

  // Interactive panels
  const [showTelemetry, setShowTelemetry] = useState<boolean>(false);
  const [selectedSpot, setSelectedSpot] = useState<VenueSpot | null>(null);
  const [showAddSpot, setShowAddSpot] = useState<boolean>(false);
  const [showEditSpot, setShowEditSpot] = useState<boolean>(false);

  // SOS States
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [isSosActive, setIsSosActive] = useState<boolean>(false);
  const [checkInToastMsg, setCheckInToastMsg] = useState<string | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    setFriends(SEEDED_FRIENDS);
    
    // Set nickname if user is authenticated
    if (user) {
      setNickname(user.displayName || user.email?.split('@')[0] || 'Member');
      setShowOnboarding(false);
      setIsSpectator(false);
    }
  }, [user, venue]);

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
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          if (position.coords.speed !== null) {
            // Convert m/s to mph
            setSpeed(Math.round(position.coords.speed * 2.23694));
          } else if (isMock) {
            setSpeed(12 + Math.floor(Math.random() * 5));
          }
          if (position.coords.heading !== null) {
            setHeading(position.coords.heading);
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

  // Friend movement coordinates simulator to keep map dynamic
  useEffect(() => {
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
      maxZoom: 18,
      minZoom: 10
    }).setView([userCoords.lat, userCoords.lng], 14);

    mapRef.current = map;

    // Dark styled map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{y}/{x}{r}.png', {
      maxZoom: 19
    }).addTo(map);

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
      }
    };
  }, []);

  // Center Map View
  const handleRecenter = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.setView([userCoords.lat, userCoords.lng], 15);
    }
  }, [userCoords]);

  // Render/Update User Marker
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const latlng: L.LatLngExpression = [userCoords.lat, userCoords.lng];

    if (visibility === 'ghost' || isSpectator) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      return;
    }

    const userSvg = `
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-cyan-500/25 border-2 border-cyan-400 rounded-full animate-ping"></div>
        <div class="w-4 h-4 bg-cyan-400 border border-white rounded-full flex items-center justify-center shadow-lg">
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
        <!-- Heading Indicator -->
        <div class="absolute -top-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-400" style="transform: rotate(${heading}deg); transform-origin: 50% 16px;"></div>
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
  }, [userCoords, heading, visibility, isSpectator]);

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

      const latlng: L.LatLngExpression = [spot.latitude, spot.longitude];
      
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

      const spotHtml = `
        <div class="relative w-8 h-8 flex items-center justify-center cursor-pointer">
          <div class="absolute w-7 h-7 bg-neutral-900/90 border border-neutral-850 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform" style="border-top: 3px solid ${markerColor};">
            <span class="text-[12px]">${iconHtml}</span>
          </div>
        </div>
      `;

      if (spotMarkersRef.current[spot.id]) {
        spotMarkersRef.current[spot.id].setLatLng(latlng);
      } else {
        const marker = L.marker(latlng, {
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
    });
  }, [spots]);

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
      const friendSvg = `
        <div class="relative w-9 h-9 flex items-center justify-center group cursor-pointer">
          <div class="absolute w-9 h-9 bg-emerald-950/40 border border-emerald-500 rounded-full animate-pulse"></div>
          <div class="w-6.5 h-6.5 rounded-full bg-emerald-600 border border-white text-white flex items-center justify-center text-[9px] font-black shadow-lg">
            ${initials}
          </div>
          <div class="absolute -top-1 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-emerald-400" style="transform: rotate(${friend.heading || 0}deg); transform-origin: 50% 14px;"></div>
        </div>
      `;

      const popupHtml = `
        <div class="p-2.5 text-left space-y-1 text-[11px] font-sans leading-normal">
          <div class="font-black text-white uppercase tracking-tight">${friend.display_name}</div>
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

  // SOS Toggle logic
  const handleSosPress = () => {
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

  // Drop Spot Submission
  const handleDropSpotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpotName.trim()) return;

    const newSpot: VenueSpot = {
      id: `spot-${Date.now()}`,
      venue_id: venue.id,
      name: newSpotName,
      latitude: userCoords.lat,
      longitude: userCoords.lng,
      features: [newSpotType],
      notes: newSpotNotes.trim() ? [{ user: nickname || 'Guest', text: newSpotNotes, timestamp: new Date().toISOString() }] : [],
      status: newSpotBusinessId ? 'verified' : 'active',
      business_id: newSpotBusinessId || undefined,
      photo_urls: newSpotPhotos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSpots(prev => [...prev, newSpot]);
    setShowAddSpot(false);
    setSelectedSpot(newSpot);

    // Reset fields
    setNewSpotName('');
    setNewSpotNotes('');
    setNewSpotBusinessId('');
    setNewSpotPhotos([]);

    // Center map
    if (mapRef.current) {
      mapRef.current.panTo([userCoords.lat, userCoords.lng]);
    }
  };

  // Edit / Suggestion Notes submission
  const handleSuggestEditsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpot) return;

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
        return {
          ...s,
          hours: editHours.trim() ? editHours : s.hours,
          notes,
          status: isSpotClosedReported ? 'reported_closed' : s.status,
          updated_at: new Date().toISOString()
        } as VenueSpot;
      }
      return s;
    });

    setSpots(updatedSpots);
    setShowEditSpot(false);
    setEditNotes('');
    setEditHours('');

    const currentUpdated = updatedSpots.find(s => s.id === selectedSpot.id);
    if (currentUpdated && currentUpdated.status !== 'reported_closed') {
      setSelectedSpot(currentUpdated);
    } else {
      setSelectedSpot(null);
    }
  };

  // Simple Location Check-in
  const handleCheckIn = () => {
    if (!selectedSpot) return;
    setCheckInToastMsg(`Checked into: ${selectedSpot.name}! Info shared.`);
    setTimeout(() => setCheckInToastMsg(null), 3000);
  };

  // Share Live Radar clipboard deep link
  const handleShareRadar = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/water/${venue.id}?lat=${userCoords.lat.toFixed(5)}&lng=${userCoords.lng.toFixed(5)}&nickname=${encodeURIComponent(nickname || 'Rider')}`;
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

      {/* Flashing border indicators for SOS emergency status */}
      {isSosActive && (
        <div className="absolute inset-0 border-[6px] border-red-600 animate-pulse pointer-events-none z-50"></div>
      )}

      {/* Main Map Mount point */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0"></div>

      {/* Glass overlay HUD header */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex justify-between items-center">
        
        {/* Left HUD: Telemetry slide-out trigger & Venue name */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button 
            onClick={() => setShowTelemetry(!showTelemetry)}
            className="w-12 h-12 bg-neutral-950/75 backdrop-blur-md border border-neutral-900/60 rounded-full flex items-center justify-center text-white active:scale-95 transition-all shadow-lg"
          >
            <Compass className={`w-5 h-5 text-cyan-400 ${showTelemetry ? 'rotate-90' : ''} transition-transform`} />
          </button>
          
          <div className="px-4 py-2 bg-neutral-950/75 backdrop-blur-md border border-neutral-900/60 rounded-full shadow-lg text-left block">
            <div className="text-[7px] font-mono font-bold text-neutral-400 uppercase tracking-widest leading-none">{context.gpsLabel}</div>
            <div className="text-xs font-black uppercase text-white truncate max-w-[120px] pt-0.5 leading-none">{venue.name}</div>
          </div>
        </div>

        {/* Center HUD: Urgent SOS Emergency Broadcast Status */}
        {isSosActive && (
          <div className="px-5 py-2.5 bg-red-600/90 border border-red-500 rounded-full animate-bounce shadow-lg pointer-events-auto flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-ping"></span>
            <span className="text-[10px] font-black uppercase tracking-wider text-white">SOS EMERGENCY ACTIVE</span>
          </div>
        )}

        {/* Right HUD: Visibility Control Banner */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="bg-neutral-950/75 backdrop-blur-md border border-neutral-900/60 p-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <button 
              onClick={() => { setVisibility('ghost'); if (userMarkerRef.current && mapRef.current) mapRef.current.removeLayer(userMarkerRef.current); }}
              className={`px-3 py-1.5 rounded-full text-[9px] font-mono font-bold uppercase transition-all ${visibility === 'ghost' ? 'bg-red-600 text-white font-black' : 'text-neutral-400 hover:text-white'}`}
            >
              Private
            </button>
            <button 
              onClick={() => setVisibility('friends')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-mono font-bold uppercase transition-all ${visibility === 'friends' ? 'bg-yellow-500 text-black font-black' : 'text-neutral-400 hover:text-white'}`}
            >
              Friends
            </button>
            <button 
              onClick={() => setVisibility('public')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-mono font-bold uppercase transition-all ${visibility === 'public' ? 'bg-cyan-500 text-black font-black' : 'text-neutral-400 hover:text-white'}`}
            >
              Public
            </button>
          </div>
        </div>

      </div>

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

        {/* Recenter Button (56px touch target area) */}
        <button 
          onClick={handleRecenter}
          className="pointer-events-auto w-14 h-14 bg-neutral-950/75 backdrop-blur-md border border-neutral-900/60 rounded-full flex items-center justify-center text-white active:scale-95 transition-all shadow-lg"
          title="Center on Me"
        >
          <Crosshair className="w-5.5 h-5.5 text-cyan-400" />
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
            setSelectedSpot(null);
            setShowEditSpot(false);
            setShowAddSpot(true);
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
          )}

          {/* Observations notes list */}
          <div className="space-y-2">
            <span className="text-[8.5px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">User Logs</span>
            <div className="space-y-2 max-h-[100px] overflow-y-auto no-scrollbar pr-1">
              {selectedSpot.notes.map((n, i) => (
                <div key={i} className="p-2.5 bg-neutral-900 border border-neutral-850 rounded-xl text-[10px] space-y-1 leading-normal">
                  <div className="flex justify-between items-center text-[8.5px] font-mono font-bold">
                    <span className="text-cyan-400">{n.user}</span>
                    <span className="text-neutral-500">{new Date(n.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-neutral-300 font-medium">{n.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-neutral-900 flex gap-3">
            <button 
              onClick={handleCheckIn}
              className="flex-1 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/10 cursor-pointer min-h-[46px]"
            >
              <Check className="w-4 h-4" /> Check In
            </button>
            <button 
              onClick={() => setShowEditSpot(true)}
              className="px-4 py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer min-h-[46px]"
            >
              <Edit3 className="w-4 h-4 text-cyan-400" /> Suggest Edits
            </button>
            {selectedSpot.business_id && (
              <a 
                href={`/b/${selectedSpot.business_id}`}
                className="px-4 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer min-h-[46px]"
              >
                <Building2 className="w-4 h-4" /> Store
              </a>
            )}
          </div>
        </div>
      )}

      {/* Bottom Sheet Modal: Drop/Add New Spot Form */}
      {showAddSpot && (
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
              <label className="text-[8.5px] font-mono font-bold text-neutral-450 uppercase block mb-1">Link Verified Business (Optional)</label>
              <select
                value={newSpotBusinessId}
                onChange={(e) => setNewSpotBusinessId(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-3 text-xs outline-none cursor-pointer min-h-[50px]"
              >
                <option value="">-- Public Water / Unclaimed --</option>
                {availableBusinesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
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
      {showEditSpot && selectedSpot && (
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

            <div className="border-t border-neutral-900 pt-4 flex flex-col gap-2">
              <button 
                onClick={handleSpectatorMode}
                className="text-[10px] text-neutral-400 hover:text-white uppercase font-bold font-mono tracking-wide cursor-pointer"
              >
                Or Browse Privately (Hide Your Location)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
