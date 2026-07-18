'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Crosshair, Compass, AlertTriangle, ShieldCheck, MapPin, 
  Anchor, Fuel, Star, Navigation2, Users, Layers, Shield
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { VenueSpot, FriendBeacon } from '@/lib/types/venue';
import { SEEDED_SPOTS } from '@/lib/data/venues';

interface FoxRiverLeafletMapProps {
  activeCheckpointId: string | null;
  onSelectCheckpoint: (id: string) => void;
}

// Fixed checkpoints for the Fox River Jet Ski Guide with real coords
const GUIDE_POIS = [
  { id: 'wilmot-dam', name: 'Wilmot Dam (WI Limit)', lat: 42.5050, lng: -88.1850, type: 'hazard', desc: 'Low-head hazard. Do not cross.', estTime: '1h 10m', wakeRule: 'No Wake' },
  { id: 'state-line', name: 'IL / WI State Line', lat: 42.4950, lng: -88.1840, type: 'checkpoint', desc: 'Transition to Wisconsin laws.', estTime: '55 min', wakeRule: 'Varies' },
  { id: 'state-park-launch', name: "State Park Launch", lat: 42.4700, lng: -88.1750, type: 'launch', desc: 'Grass Lake inlet ramps.', estTime: '42 min', wakeRule: 'No Wake' },
  { id: 'chain-marina', name: "Chain O' Lakes Marina", lat: 42.4620, lng: -88.1680, type: 'fuel', desc: 'Marine gas & ship store.', estTime: '45 min', wakeRule: 'No Wake (Docks)' },
  { id: 'sandbar', name: 'Grass Lake Sandbar', lat: 42.4500, lng: -88.1650, type: 'food', desc: 'Shallow silt social wading.', estTime: '35 min', wakeRule: 'No Wake' },
  { id: 'blarney-island', name: 'Blarney Island', lat: 42.4445, lng: -88.1683, type: 'food', desc: 'Martini tiki bar in Grass Lake.', estTime: '40 min', wakeRule: 'No Wake (Docks)' },
  { id: 'port-blarney', name: 'Port of Blarney Launch', lat: 42.4449, lng: -88.1651, type: 'launch', desc: 'Concrete ramp & grill.', estTime: '38 min', wakeRule: 'No Wake (Canal)' },
  { id: 'petite-sandbar', name: 'Petite Lake Sandbar', lat: 42.4308, lng: -88.1290, type: 'food', desc: 'Lively sandy bottom hangout.', estTime: '38 min', wakeRule: 'Local Limits' },
  { id: 'marie-sandbar', name: 'Lake Marie Sandbar', lat: 42.4667, lng: -88.1333, type: 'food', desc: 'Sandy gravel shallow wade.', estTime: '45 min', wakeRule: 'Local Limits' },
  { id: 'catherine-beach', name: 'Catherine Beach Docks', lat: 42.4820, lng: -88.1360, type: 'launch', desc: 'Sandy public beach with PWC docks.', estTime: '52 min', wakeRule: 'No Wake' },
  { id: 'mineola-beach', name: 'Mineola Beach Docks', lat: 42.4250, lng: -88.1880, type: 'launch', desc: 'Historic beach and transient slips.', estTime: '18 min', wakeRule: 'No Wake' },
  { id: 'oak-park-marina', name: 'Oak Park Marina', lat: 42.4180, lng: -88.1780, type: 'fuel', desc: 'Floating fuel dock.', estTime: '16 min', wakeRule: 'No Wake' },
  { id: 'watts-marina', name: 'Ben Watts Marina', lat: 42.4150, lng: -88.1650, type: 'fuel', desc: 'Ethanol-free US-12 fuel.', estTime: '15 min', wakeRule: 'No Wake' },
  { id: 'freddies', name: "Famous Freddie's", lat: 42.4080, lng: -88.2100, type: 'food', desc: 'Tiki slips on Pistakee Lake.', estTime: '18 min', wakeRule: 'No Wake (Docks)' },
  { id: 'pistakee-marina', name: 'Pistakee Marina', lat: 42.3950, lng: -88.2150, type: 'fuel', desc: 'Fuel & full service docks.', estTime: '20 min', wakeRule: 'No Wake' },
  { id: 'mchenry-launch', name: 'McHenry River Park', lat: 42.3650, lng: -88.2580, type: 'launch', desc: 'Stratton Lock approach ramps.', estTime: '0 min (Start)', wakeRule: 'No Wake (Lagoon)' },
  { id: 'stratton-lock', name: 'Stratton Lock & Dam', lat: 42.3435, lng: -88.2625, type: 'hazard', desc: 'Lock transit chambers.', estTime: '15 min', wakeRule: 'No Wake' },
  { id: 'broken-oar', name: 'Broken Oar Marina', lat: 42.2700, lng: -88.2400, type: 'food', desc: 'Waterfront grill & music deck.', estTime: '40 min', wakeRule: 'No Wake (Docks)' },
];

// Helper: Haversine distance in miles
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function FoxRiverLeafletMap({ 
  activeCheckpointId, 
  onSelectCheckpoint 
}: FoxRiverLeafletMapProps) {
  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  
  // App data states
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [closestCheckpoint, setClosestCheckpoint] = useState<{ name: string; distance: number; type: string; id: string } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [followUser, setFollowUser] = useState<boolean>(false);
  
  // Firestore sync states
  const [customSpots, setCustomSpots] = useState<VenueSpot[]>([]);
  const [activeRiders, setActiveRiders] = useState<FriendBeacon[]>([]);
  const [showRiders, setShowRiders] = useState<boolean>(true);
  const [showUserSpots, setShowUserSpots] = useState<boolean>(true);

  useEffect(() => {
    (window as any).selectFoxRiverPoi = (id: string) => {
      onSelectCheckpoint(id);
    };
    return () => {
      delete (window as any).selectFoxRiverPoi;
    };
  }, [onSelectCheckpoint]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create Map with stable center and zoom 10
    const map = L.map(mapContainerRef.current, {
      center: [42.3900, -88.1900],
      zoom: 10,
      zoomControl: false,
      attributionControl: false
    });

    // Dark-mode themed tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add Attribution on bottom-right cleanly
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; CartoDB &copy; OpenStreetMap')
      .addTo(map);

    // Layer groups
    const markerGroup = L.layerGroup().addTo(map);
    markerGroupRef.current = markerGroup;
    mapRef.current = map;

    // Redraw markers
    drawCheckpoints();

    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // Sync Checkpoint Selection from Props
  useEffect(() => {
    if (!mapRef.current || !activeCheckpointId || isMock) return;
    const poi = GUIDE_POIS.find(p => p.id === activeCheckpointId);
    if (poi) {
      mapRef.current.flyTo([poi.lat, poi.lng], 13, { duration: 1.5 });
    }
  }, [activeCheckpointId, isMock]);

  // watchPosition Geolocation
  useEffect(() => {
    if (!isLocating) {
      if (userMarkerRef.current && mapRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      setUserCoords(null);
      setClosestCheckpoint(null);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);

        if (mapRef.current) {
          const map = mapRef.current;
          
          // Draw or move user marker
          const userSvg = `
            <div class="relative w-8 h-8 flex items-center justify-center">
              <div class="absolute w-8 h-8 bg-cyan-500/25 border-2 border-cyan-400 rounded-full animate-ping"></div>
              <div class="w-4 h-4 bg-cyan-400 border border-white rounded-full flex items-center justify-center shadow-lg">
                <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
          `;

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([coords.lat, coords.lng]);
          } else {
            userMarkerRef.current = L.marker([coords.lat, coords.lng], {
              icon: L.divIcon({
                html: userSvg,
                className: 'user-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })
            }).addTo(map);
          }

          if (followUser) {
            map.panTo([coords.lat, coords.lng]);
          }
        }
      },
      (err) => {
        console.error("Geolocation failed:", err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isLocating, followUser]);

  // Proximity Calculation to nearest Checkpoint
  useEffect(() => {
    if (!userCoords) {
      setClosestCheckpoint(null);
      return;
    }

    let minDistance = Infinity;
    let closestPoi = null;

    GUIDE_POIS.forEach(poi => {
      const dist = getHaversineDistance(userCoords.lat, userCoords.lng, poi.lat, poi.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoi = poi;
      }
    });

    if (closestPoi) {
      setClosestCheckpoint({
        id: (closestPoi as any).id,
        name: (closestPoi as any).name,
        type: (closestPoi as any).type,
        distance: minDistance
      });
    }
  }, [userCoords]);

  // Firestore Sync: /water Spots and Active Radar Buddies
  useEffect(() => {
    if (isMock) {
      // In E2E Playwright mock mode, load mock data for testing
      setCustomSpots(SEEDED_SPOTS.filter(s => s.venue_id === 'fox-river'));
      setActiveRiders([
        { user_id: 'buddy-1', display_name: 'Sarah (Rider)', latitude: 42.4200, longitude: -88.1690, speed: 22, heading: 90, updated_at: new Date().toISOString(), status: 'active' },
        { user_id: 'buddy-2', display_name: 'Marcus (GTX)', latitude: 42.3550, longitude: -88.2550, speed: 0, heading: 180, updated_at: new Date().toISOString(), status: 'active' }
      ]);
      return;
    }

    // Subscribe to Firestore Custom Spots
    const spotsQuery = query(
      collection(db, 'spots'),
      where('venue_id', '==', 'fox-river')
    );

    const unsubscribeSpots = onSnapshot(spotsQuery, (snapshot) => {
      const dbSpots: VenueSpot[] = [];
      snapshot.forEach((doc) => {
        dbSpots.push(doc.data() as VenueSpot);
      });
      setCustomSpots(dbSpots);
    });

    // Subscribe to Firestore Active Geolocation Radar (buddies on water)
    const radarQuery = query(
      collection(db, 'venue_radar'),
      where('venue_id', '==', 'fox-river')
    );

    const unsubscribeRadar = onSnapshot(radarQuery, (snapshot) => {
      const dbRiders: FriendBeacon[] = [];
      const now = Date.now();
      snapshot.forEach((doc) => {
        const data = doc.data();
        const updatedAt = data.updated_at ? Date.parse(data.updated_at) : 0;
        const isStale = now - updatedAt > 10 * 60 * 1000; // 10 minutes staleness
        if (!isStale) {
          dbRiders.push(data as FriendBeacon);
        }
      });
      setActiveRiders(dbRiders);
    });

    return () => {
      unsubscribeSpots();
      unsubscribeRadar();
    };
  }, [isMock]);

  // Re-draw POIs, Firestore Spots, and active riders
  const drawCheckpoints = useCallback(() => {
    if (!mapRef.current || !markerGroupRef.current) return;
    const markerGroup = markerGroupRef.current;
    markerGroup.clearLayers();

    // 1. Draw Guided Checkpoints (SEEDED_POIS)
    GUIDE_POIS.forEach((poi) => {
      // Glow and colors matching category
      let glowColor = 'bg-[#eab308] border-[#eab308]/60'; // dining
      if (poi.type === 'hazard') glowColor = 'bg-[#f43f5e] border-[#f43f5e]/60 animate-pulse';
      if (poi.type === 'launch') glowColor = 'bg-[#10b981] border-[#10b981]/60';
      if (poi.type === 'fuel') glowColor = 'bg-[#06b6d4] border-[#06b6d4]/60';
      if (poi.type === 'checkpoint') glowColor = 'bg-[#f97316] border-[#f97316]/60';

      const iconHtml = `
        <div class="relative w-7 h-7 flex items-center justify-center cursor-pointer" onclick="if(window.selectFoxRiverPoi) window.selectFoxRiverPoi('${poi.id}')">
          <div class="absolute w-7 h-7 ${glowColor} opacity-20 rounded-full scale-125"></div>
          <div class="w-4.5 h-4.5 ${glowColor.split(' ')[0]} border border-white/60 rounded-full flex items-center justify-center shadow-lg">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `;

      const marker = L.marker([poi.lat, poi.lng], {
        icon: L.divIcon({
          html: iconHtml,
          className: `checkpoint-marker checkpoint-${poi.id}`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      });

      marker.bindTooltip(`
        <div class="bg-[#0b0b0f] border border-neutral-800 p-2.5 rounded-xl font-mono text-[10px] text-white">
          <strong class="uppercase text-rose-405">${poi.name}</strong>
          <div class="text-[9px] text-neutral-450 mt-1">${poi.desc}</div>
          <div class="text-[8px] text-cyan-400 mt-1 border-t border-neutral-900 pt-1">🕒 Est: ${(poi as any).estTime} | 🚤 Wake: ${(poi as any).wakeRule}</div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95
      });

      marker.on('click', () => {
        onSelectCheckpoint(poi.id);
        if (!isMock) {
          mapRef.current?.panTo([poi.lat, poi.lng]);
        }
      });

      marker.on('add', () => {
        const el = marker.getElement();
        if (el) {
          el.onclick = () => {
            onSelectCheckpoint(poi.id);
          };
        }
      });

      markerGroup.addLayer(marker);
    });

    // 2. Draw Firestore User Spots
    if (showUserSpots) {
      customSpots.forEach((spot) => {
        // Red warning glow for hazard spots, orange for custom waypoints
        const isHazard = spot.features.includes('danger_zone') || spot.features.includes('hazard') || spot.id.includes('sfcg');
        const glowColor = isHazard 
          ? 'bg-rose-500 border-rose-400 animate-pulse'
          : 'bg-amber-500 border-amber-400';
          
        const iconHtml = `
          <div class="relative w-6 h-6 flex items-center justify-center">
            <div class="absolute w-6 h-6 ${glowColor} opacity-25 rounded-full scale-110"></div>
            <div class="w-3.5 h-3.5 ${glowColor.split(' ')[0]} border border-white rounded-sm flex items-center justify-center shadow-md rotate-45">
              <div class="w-1 h-1 bg-white rounded-sm"></div>
            </div>
          </div>
        `;

        const marker = L.marker([spot.latitude, spot.longitude], {
          icon: L.divIcon({
            html: iconHtml,
            className: `custom-spot-marker spot-${spot.id}`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        });

        const featuresStr = spot.features.map(f => `#${f}`).join(' ');

        marker.bindTooltip(`
          <div class="bg-[#0c0c12] border border-amber-500/20 p-2.5 rounded-xl font-mono text-[9px] text-neutral-300">
            <div class="font-bold text-white uppercase text-[10px] flex items-center gap-1">
              <span>👤</span> ${spot.name}
            </div>
            <div class="text-[8px] text-amber-400 mt-0.5">${featuresStr}</div>
            ${spot.notes && spot.notes.length > 0 ? `<div class="text-neutral-400 italic mt-1 border-t border-neutral-900 pt-1">"${spot.notes[0].text}"</div>` : ''}
          </div>
        `, {
          direction: 'top',
          offset: [0, -8],
          opacity: 0.95
        });

        markerGroup.addLayer(marker);
      });
    }

    // 3. Draw Active Radar Riders (/water live telemetry)
    if (showRiders) {
      activeRiders.forEach((rider) => {
        const iconHtml = `
          <div class="relative w-7 h-7 flex items-center justify-center">
            <div class="absolute w-7 h-7 bg-cyan-500/30 border border-cyan-400 rounded-full animate-ping"></div>
            <div class="w-4 h-4 bg-cyan-500 border border-white rounded-full flex items-center justify-center shadow-lg">
              <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        `;

        const marker = L.marker([rider.latitude, rider.longitude], {
          icon: L.divIcon({
            html: iconHtml,
            className: `rider-marker rider-${rider.user_id}`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        });

        marker.bindTooltip(`
          <div class="bg-[#0b0c10]/95 border border-cyan-500/25 p-2 rounded-xl font-mono text-[9px] text-white">
            <div class="font-bold flex items-center gap-1.5 uppercase text-cyan-400">
              <span class="relative flex h-1.5 w-1.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
              </span>
              ${rider.display_name}
            </div>
            <div class="text-neutral-400 mt-1">
              Speed: <span class="text-white font-bold">${Math.round(rider.speed || 0)} MPH</span>
            </div>
          </div>
        `, {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95
        });

        markerGroup.addLayer(marker);
      });
    }

  }, [customSpots, activeRiders, showRiders, showUserSpots, onSelectCheckpoint]);

  // Redraw when arrays update
  useEffect(() => {
    drawCheckpoints();
  }, [customSpots, activeRiders, showRiders, showUserSpots, drawCheckpoints]);

  // Toggle Geolocation
  const handleLocateMe = () => {
    if (!isLocating) {
      setIsLocating(true);
      setFollowUser(true);
    } else {
      setIsLocating(false);
      setFollowUser(false);
    }
  };

  return (
    <div className="relative w-full h-[520px] rounded-3xl border border-neutral-900/60 overflow-hidden bg-[#060608]/40 shadow-inner">
      {/* Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating GPS and Tracking Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-md ${
            isLocating 
              ? 'bg-cyan-500/10 border-cyan-500/35 text-cyan-400' 
              : 'bg-[#0b0b0f]/80 border-neutral-800/80 text-neutral-400 hover:text-white'
          }`}
          title={isLocating ? "Stop GPS Tracking" : "Start GPS Tracking"}
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
        </button>

        {isLocating && (
          <button
            onClick={() => setFollowUser(prev => !prev)}
            className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-md ${
              followUser 
                ? 'bg-cyan-500/10 border-cyan-500/35 text-cyan-400' 
                : 'bg-[#0b0b0f]/80 border-neutral-800/80 text-neutral-500'
            }`}
            title="Lock Camera to Location"
          >
            <Navigation2 className="w-4 h-4 rotate-45" />
          </button>
        )}
      </div>

      {/* Floating Filter controls */}
      <div className="absolute bottom-4 left-4 z-[1000] flex gap-2">
        {/* Toggle Live Riders */}
        <button
          onClick={() => setShowRiders(prev => !prev)}
          className={`px-3 py-1.5 rounded-xl border font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-md transition-all ${
            showRiders
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              : 'bg-[#0b0b0f]/60 border-neutral-900/60 text-neutral-500 hover:text-neutral-400'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Active Riders ({activeRiders.length})</span>
        </button>

        {/* Toggle Custom User Spots */}
        <button
          onClick={() => setShowUserSpots(prev => !prev)}
          className={`px-3 py-1.5 rounded-xl border font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-md transition-all ${
            showUserSpots
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-[#0b0b0f]/60 border-neutral-900/60 text-neutral-500 hover:text-neutral-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>User Spots ({customSpots.length})</span>
        </button>
      </div>

      {/* Geolocation Proximity HUD Card */}
      {closestCheckpoint && (
        <div className="absolute top-4 left-4 z-[1000] max-w-[240px] glass-card p-3 rounded-2xl border border-cyan-500/25 bg-neutral-950/85 shadow-lg animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-start gap-2.5 text-left">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Compass className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <div className="space-y-0.5">
              <div className="text-[8px] font-mono font-bold uppercase tracking-wider text-cyan-455 font-bold">
                Live Proximity Alert
              </div>
              <div className="text-[10px] font-bold text-white leading-snug">
                {closestCheckpoint.name}
              </div>
              <div className="text-[10px] font-mono font-semibold text-neutral-400 mt-1">
                Distance: <span className="text-white font-bold">{closestCheckpoint.distance.toFixed(2)} mi</span>
              </div>
              <button 
                onClick={() => onSelectCheckpoint(closestCheckpoint.id)}
                className="text-[8px] font-mono font-bold text-rose-500 hover:underline uppercase block mt-1.5 cursor-pointer"
              >
                Inspect Stop Details &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
