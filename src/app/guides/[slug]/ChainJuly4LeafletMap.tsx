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

interface ChainJuly4LeafletMapProps {
  activeCheckpointId: string | null;
  onSelectCheckpoint: (id: string) => void;
}

// Fixed July 4th checkpoints for the Chain O' Lakes
const GUIDE_POIS = [
  { id: 'celebrate-fox-lake', name: 'Celebrate Fox Lake Fireworks', lat: 42.3980, lng: -88.1900, type: 'fireworks', desc: 'Fireworks over Nippersink Lake on June 27.', estTime: 'Dusk', wakeRule: 'Strict No Wake' },
  { id: 'pistakee-bay-fireworks', name: 'Pistakee Bay Fireworks', lat: 42.3830, lng: -88.2210, type: 'fireworks', desc: 'Massive boat-in fireworks on July 11.', estTime: 'Dusk', wakeRule: 'Strict No Wake' },
  { id: 'antioch-fireworks', name: 'Antioch Fireworks', lat: 42.4770, lng: -88.0920, type: 'fireworks', desc: 'Antioch fireworks on July 4.', estTime: 'Dusk', wakeRule: 'Varies' },
  { id: 'grass-lake-sandbar', name: 'Grass Lake Sandbar', lat: 42.4500, lng: -88.1650, type: 'sandbar', desc: 'Lively holiday PWC social sandbar.', estTime: 'Daytime', wakeRule: 'No Wake' },
  { id: 'petite-lake-sandbar', name: 'Petite Lake Sandbar', lat: 42.4308, lng: -88.1290, type: 'sandbar', desc: 'Popular crowded sandy bottom sandbar.', estTime: 'Daytime', wakeRule: 'Local Limits' },
  { id: 'marie-sandbar', name: 'Lake Marie Sandbar', lat: 42.4667, lng: -88.1333, type: 'sandbar', desc: 'Popular sandy gravel wade & swim spot.', estTime: 'Daytime', wakeRule: 'Local Limits' },
  { id: 'watts-marina', name: 'Ben Watts Marina (US-12)', lat: 42.4150, lng: -88.1650, type: 'fuel', desc: 'Fuel, ship store & ramp.', estTime: 'Daytime', wakeRule: 'No Wake' },
  { id: 'oak-park-marina', name: 'Oak Park Marina', lat: 42.4180, lng: -88.1780, type: 'fuel', desc: 'Convenient channel fuel stop.', estTime: 'Daytime', wakeRule: 'No Wake' },
  { id: 'stratton-lock', name: 'Stratton Lock & Dam', lat: 42.3435, lng: -88.2625, type: 'hazard', desc: 'Holiday lock queues can exceed 2 hours.', estTime: 'Daytime', wakeRule: 'No Wake' }
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

export default function ChainJuly4LeafletMap({ 
  activeCheckpointId, 
  onSelectCheckpoint 
}: ChainJuly4LeafletMapProps) {
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
    (window as any).selectJuly4Poi = (id: string) => {
      onSelectCheckpoint(id);
    };
    return () => {
      delete (window as any).selectJuly4Poi;
    };
  }, [onSelectCheckpoint]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create Map with stable center and zoom 10
    const map = L.map(mapContainerRef.current, {
      center: [42.4150, -88.1650],
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

    // Subscribe to Firestore Active Geolocation Radar
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
        const isStale = now - updatedAt > 10 * 60 * 1000;
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

    // 1. Draw Guided Checkpoints
    GUIDE_POIS.forEach((poi) => {
      let glowColor = 'bg-[#eab308] border-[#eab308]/60'; // sandbar/hotspot
      if (poi.type === 'fireworks') glowColor = 'bg-[#f43f5e] border-[#f43f5e]/60 animate-pulse';
      if (poi.type === 'hazard') glowColor = 'bg-[#f97316] border-[#f97316]/60 animate-pulse';
      if (poi.type === 'fuel') glowColor = 'bg-[#06b6d4] border-[#06b6d4]/60';

      const iconHtml = `
        <div class="relative w-7 h-7 flex items-center justify-center cursor-pointer" onclick="if(window.selectJuly4Poi) window.selectJuly4Poi('${poi.id}')">
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
          <div class="text-[8px] text-cyan-400 mt-1 border-t border-neutral-900 pt-1">🕒 Time: ${poi.estTime} | 🚤 Wake: ${poi.wakeRule}</div>
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

        const featuresStr = spot.features.map(f => `#f`).join(' ');

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

    // 3. Draw Active Radar Riders
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
            className: `rider-marker rider-${rider.user_id} rider-buddy-${rider.user_id === 'buddy-1' ? '1' : '2'}`,
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
              <div className="text-[8px] font-mono font-bold uppercase tracking-wider text-cyan-400">
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
