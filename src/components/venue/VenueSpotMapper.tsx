'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, Compass, EyeOff, Eye, Navigation, Plus, Building2, 
  Clock, Edit3, Trash2, Camera, User, Crosshair, Info, X, 
  Check, AlertTriangle, HelpCircle, Utensils, Fuel, ShieldCheck
} from 'lucide-react';
import { Venue, VenueSpot, FriendBeacon } from '@/lib/types/venue';
import { SEEDED_SPOTS, SEEDED_FRIENDS } from '@/lib/data/venues';

interface VenueSpotMapperProps {
  venue: Venue;
}

export default function VenueSpotMapper({ venue }: VenueSpotMapperProps) {
  // Map configuration state
  const [spots, setSpots] = useState<VenueSpot[]>([]);
  const [friends, setFriends] = useState<FriendBeacon[]>([]);
  const [isGhost, setIsGhost] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Active UI overlay states
  const [selectedSpot, setSelectedSpot] = useState<VenueSpot | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Form Fields
  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotLat, setNewSpotLat] = useState(42.4412);
  const [newSpotLng, setNewSpotLng] = useState(-88.1322);
  const [newSpotFeatures, setNewSpotFeatures] = useState<string[]>([]);
  const [newCustomFeature, setNewCustomFeature] = useState('');
  const [newSpotNotes, setNewSpotNotes] = useState('');
  const [newSpotHours, setNewSpotHours] = useState('');

  // Editing Fields
  const [editNotes, setEditNotes] = useState('');
  const [editHours, setEditHours] = useState('');
  const [flaggedOutFeatures, setFlaggedOutFeatures] = useState<string[]>([]);

  // Hardcoded viewport center for the mock map relative coordinates
  const mapCenter = { lat: 42.4412, lng: -88.1322 };
  const coordinateScale = 800; // factor to scale lat/long changes onto pixel display

  // Mock profile businesses for binding
  const availableBusinesses = [
    { id: 'monmouth-marine-demo', name: 'Monmouth Marine Ford & Boats' },
    { id: 'performance-tuning-demo', name: 'Performance Tuning Shop' },
    { id: 'badlands-offroad-demo', name: 'Badlands Offroad Park' }
  ];

  // Load Seeded data matching active venue
  useEffect(() => {
    const venueSpots = SEEDED_SPOTS.filter(s => s.venue_id === venue.id);
    setSpots(venueSpots);
    
    // Only display friends if venue is waterway or racetrack, for safety/social mapping
    if (venue.type === 'waterway' || venue.type === 'racetrack') {
      setFriends(SEEDED_FRIENDS);
    } else {
      setFriends([]);
    }

    // Set default user location slightly offset from center
    setUserCoords({ lat: 42.4402, lng: -88.1282 });
  }, [venue]);

  // Capture GPS Location
  const handleCaptureLocation = () => {
    setGettingLocation(true);
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserCoords(coords);
          setNewSpotLat(Number(coords.lat.toFixed(5)));
          setNewSpotLng(Number(coords.lng.toFixed(5)));
          setGettingLocation(false);
        },
        (error) => {
          console.warn('Geolocation failed or permission denied, using simulated coordinates.', error);
          // Fallback to slight offset simulation
          const offsetLat = mapCenter.lat + (Math.random() - 0.5) * 0.01;
          const offsetLng = mapCenter.lng + (Math.random() - 0.5) * 0.01;
          setUserCoords({ lat: offsetLat, lng: offsetLng });
          setNewSpotLat(Number(offsetLat.toFixed(5)));
          setNewSpotLng(Number(offsetLng.toFixed(5)));
          setGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGettingLocation(false);
    }
  };

  // Convert Coordinates to SVG X/Y
  const getXY = (lat: number, lng: number) => {
    const deltaLat = lat - mapCenter.lat;
    const deltaLng = lng - mapCenter.lng;
    
    // SVG viewbox is 400x300, center is 200, 150
    const x = 200 + deltaLng * coordinateScale * 1.5;
    const y = 150 - deltaLat * coordinateScale; // SVG coordinates are inverted vertically
    
    return { x, y };
  };

  // Toggle Features Checklist
  const handleFeatureToggle = (feat: string) => {
    if (newSpotFeatures.includes(feat)) {
      setNewSpotFeatures(prev => prev.filter(f => f !== feat));
    } else {
      setNewSpotFeatures(prev => [...prev, feat]);
    }
  };

  // Add Custom Feature Tag
  const handleAddCustomFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomFeature.trim() && !newSpotFeatures.includes(newCustomFeature.trim().toLowerCase())) {
      setNewSpotFeatures(prev => [...prev, newCustomFeature.trim().toLowerCase()]);
      setNewCustomFeature('');
    }
  };

  // Submit Spot creation
  const handleCreateSpot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpotName.trim()) {
      alert('Please enter a spot name.');
      return;
    }

    // Automatically detect business_id based on name keywords and proximity
    let autoBusinessId: string | undefined = undefined;
    const BUSINESS_COORDINATES = {
      'monmouth-marine-demo': { lat: 42.4449, lng: -88.1651 },
      'performance-tuning-demo': { lat: 40.2934, lng: -87.2488 },
      'badlands-offroad-demo': { lat: 40.2910, lng: -87.2500 }
    };
    
    // 1. Proximity check first (within ~500m)
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
    } else {
      // 2. Keyword check
      const lowerName = newSpotName.toLowerCase();
      if (lowerName.includes('monmouth') || lowerName.includes('marine')) {
        autoBusinessId = 'monmouth-marine-demo';
      } else if (lowerName.includes('tuning') || lowerName.includes('performance')) {
        autoBusinessId = 'performance-tuning-demo';
      } else if (lowerName.includes('badlands') || lowerName.includes('offroad') || lowerName.includes('off-road')) {
        autoBusinessId = 'badlands-offroad-demo';
      }
    }

    const newSpot: VenueSpot = {
      id: `spot-${Date.now()}`,
      venue_id: venue.id,
      name: newSpotName,
      latitude: newSpotLat,
      longitude: newSpotLng,
      features: newSpotFeatures.length > 0 ? newSpotFeatures : ['general'],
      notes: newSpotNotes.trim() ? [{ user: 'You', text: newSpotNotes, timestamp: new Date().toISOString() }] : [],
      hours: newSpotHours.trim() || undefined,
      status: autoBusinessId ? 'verified' : 'active',
      business_id: autoBusinessId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSpots(prev => [...prev, newSpot]);
    setSelectedSpot(newSpot);
    setShowAddForm(false);
    
    // Reset inputs
    setNewSpotName('');
    setNewSpotFeatures([]);
    setNewSpotNotes('');
    setNewSpotHours('');
  };

  // Submit Spot updates / edits
  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpot) return;

    const updatedSpots = spots.map(s => {
      if (s.id === selectedSpot.id) {
        const revisedFeatures = s.features.filter(f => !flaggedOutFeatures.includes(f));
        const updatedNotes = [...s.notes];
        if (editNotes.trim()) {
          updatedNotes.push({
            user: 'You',
            text: editNotes,
            timestamp: new Date().toISOString()
          });
        }
        
        return {
          ...s,
          features: revisedFeatures.length > 0 ? revisedFeatures : ['general'],
          hours: editHours.trim() ? editHours : s.hours,
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        } as VenueSpot;
      }
      return s;
    });

    setSpots(updatedSpots);
    const updatedSelected = updatedSpots.find(s => s.id === selectedSpot.id) || null;
    setSelectedSpot(updatedSelected);
    setShowEditForm(false);
    setEditNotes('');
    setEditHours('');
    setFlaggedOutFeatures([]);
  };

  // Flag whole spot as closed
  const handleReportClosed = () => {
    if (!selectedSpot) return;
    if (confirm(`Are you sure you want to flag "${selectedSpot.name}" as closed or missing?`)) {
      const updatedSpots = spots.map(s => {
        if (s.id === selectedSpot.id) {
          return {
            ...s,
            status: 'reported_closed' as const,
            updated_at: new Date().toISOString()
          };
        }
        return s;
      });
      setSpots(updatedSpots);
      setSelectedSpot(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Dynamic Map Radar (Left 7 Columns) */}
      <div className="lg:col-span-8 space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4.5 h-4.5 text-cyan-400 animate-spin-slow" /> 
              {venue.type === 'waterway' ? 'Float-illa Friend Radar' : 'Venue Live Map'}
            </h3>
            <p className="text-[10px] text-neutral-400 font-medium">Real-time GPS coordination and crowdsourced POIs</p>
          </div>

          {/* Privacy Switch (56px Outer Box for Touch Area) */}
          <div className="flex items-center gap-2.5 bg-neutral-900/60 border border-neutral-850 p-2.5 rounded-2xl">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
              {isGhost ? 'Ghost Mode Active' : 'Sharing Location'}
            </span>
            <button
              onClick={() => setIsGhost(!isGhost)}
              id="privacy-toggle"
              className={`w-14 h-8 rounded-full transition-all relative outline-none flex items-center ${
                isGhost ? 'bg-red-950/80 border border-red-900/60' : 'bg-cyan-950/80 border border-cyan-800/60'
              }`}
            >
              <div className={`w-6 h-6 rounded-full absolute transition-all flex items-center justify-center ${
                isGhost 
                  ? 'right-1 bg-red-500 text-white' 
                  : 'left-1 bg-cyan-400 text-black'
              }`}>
                {isGhost ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </div>
            </button>
          </div>
        </div>

        {/* The Map Container */}
        <div className="relative glass-card aspect-[4/3] rounded-[2.5rem] border-neutral-900 bg-[#060608]/80 overflow-hidden shadow-2xl">
          
          {/* Radar background sweeps */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0,transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[80%] h-[80%] border border-neutral-800/30 rounded-full" />
            <div className="absolute w-[55%] h-[55%] border border-neutral-800/20 rounded-full" />
            <div className="absolute w-[30%] h-[30%] border border-neutral-800/10 rounded-full" />
          </div>

          {/* SVG Map Layout */}
          <svg className="w-full h-full" viewBox="0 0 400 300">
            {/* Waterway Lake Outlines */}
            {venue.type === 'waterway' && (
              <>
                {/* Grass Lake */}
                <path d="M 50 80 Q 80 40 120 70 Q 150 90 120 120 Q 90 140 60 110 Z" fill="rgba(6, 182, 212, 0.08)" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" strokeDasharray="3" />
                {/* Round Lake Body */}
                <path d="M 150 130 Q 220 90 290 140 Q 320 190 260 220 Q 190 255 140 210 Q 110 170 150 130 Z" fill="rgba(6, 182, 212, 0.12)" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="1.5" />
                {/* Channels */}
                <path d="M 125 90 Q 140 100 160 115" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="4" fill="none" />
              </>
            )}

            {/* Racetrack Outlines */}
            {venue.type === 'racetrack' && (
              <path d="M 80 150 C 80 80, 320 80, 320 150 C 320 220, 250 240, 200 200 C 150 160, 80 220, 80 150 Z" fill="none" stroke="rgba(239, 68, 68, 0.25)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Offroad Trail Outlines */}
            {venue.type === 'offroad_park' && (
              <>
                <path d="M 60 80 L 140 100 L 220 60 L 320 120 L 260 220 L 120 200 L 60 80" fill="none" stroke="rgba(245, 158, 11, 0.15)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 140 100 L 180 160 L 120 200" fill="none" stroke="rgba(245, 158, 11, 0.12)" strokeWidth="6" strokeLinecap="round" />
              </>
            )}

            {/* Render Crowdsourced Spots Pins */}
            {spots.map(s => {
              if (s.status === 'reported_closed') return null;
              const { x, y } = getXY(s.latitude, s.longitude);
              const isSelected = selectedSpot?.id === s.id;
              
              // Skip if outside reasonable coordinates range on mock map
              if (x < 10 || x > 390 || y < 10 || y > 290) return null;

              return (
                <g 
                  key={s.id} 
                  className="cursor-pointer group"
                  onClick={() => setSelectedSpot(s)}
                >
                  {/* Glowing ring if selected */}
                  {isSelected && (
                    <circle cx={x} cy={y} r="12" fill="none" stroke={venue.type === 'racetrack' ? '#ef4444' : '#22d3ee'} strokeWidth="1.5" className="animate-pulse" />
                  )}
                  {/* Pin Circle */}
                  <circle 
                    cx={x} 
                    cy={y} 
                    r={isSelected ? '6' : '4.5'} 
                    fill={
                      s.business_id 
                        ? '#ffe066' // Gold for businesses
                        : s.features.includes('hazard') 
                        ? '#f43f5e' // Red for hazards
                        : venue.type === 'racetrack' 
                        ? '#ef4444' 
                        : '#06b6d4'
                    }
                    stroke="#ffffff" 
                    strokeWidth="1" 
                  />
                  {/* Mini Hover Label */}
                  <text 
                    x={x} 
                    y={y - 10} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    fontSize="7" 
                    fontWeight="bold"
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950 px-1 py-0.5 rounded pointer-events-none uppercase font-mono"
                  >
                    {s.name}
                  </text>
                </g>
              );
            })}

            {/* Render Active Friends Beacons */}
            {!isGhost && friends.map(f => {
              const { x, y } = getXY(f.latitude, f.longitude);
              
              // Skip if off screen (we render edge radars separately)
              if (x < 10 || x > 390 || y < 10 || y > 290) return null;

              return (
                <g key={f.user_id} className="cursor-pointer group" onClick={() => alert(`${f.display_name} is riding at ${f.speed} mph`)}>
                  {/* Direction Heading indicator */}
                  {f.speed && f.speed > 0 && f.heading && (
                    <line 
                      x1={x} 
                      y1={y} 
                      x2={x + Math.sin((f.heading * Math.PI) / 180) * 12} 
                      y2={y - Math.cos((f.heading * Math.PI) / 180) * 12} 
                      stroke="#10b981" 
                      strokeWidth="1.5" 
                      strokeLinecap="round"
                    />
                  )}
                  {/* Friend Outer Indicator ring */}
                  <circle cx={x} cy={y} r="8" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="1" />
                  
                  {/* Avatar dot */}
                  <circle cx={x} cy={y} r="4.5" fill="#10b981" />
                  
                  {/* Mini label */}
                  <text x={x} y={y - 12} textAnchor="middle" fill="#10b981" fontSize="7" fontWeight="black" className="uppercase font-mono">
                    {f.display_name.split(' ')[0]}
                  </text>
                </g>
              );
            })}

            {/* Render Self Location Pulse */}
            {!isGhost && userCoords && (() => {
              const { x, y } = getXY(userCoords.lat, userCoords.lng);
              if (x < 0 || x > 400 || y < 0 || y > 300) return null;
              return (
                <g>
                  <circle cx={x} cy={y} r="14" fill="none" stroke="#22d3ee" strokeWidth="1" className="animate-ping" style={{ transformOrigin: `${x}px ${y}px` }} />
                  <circle cx={x} cy={y} r="7" fill="rgba(34, 211, 238, 0.3)" stroke="#22d3ee" strokeWidth="1.5" />
                  <circle cx={x} cy={y} r="3" fill="#ffffff" />
                </g>
              );
            })()}
          </svg>

          {/* Off-Screen Radar Indicators (Floating HTML Overlays on Edge of Map) */}
          {!isGhost && userCoords && friends.map(f => {
            const { x, y } = getXY(f.latitude, f.longitude);
            
            // Check if friend is off-screen (outside viewbox 400x300 scaled limits)
            const padding = 15;
            const isOffScreen = x < padding || x > 400 - padding || y < padding || y > 300 - padding;
            
            if (!isOffScreen) return null;

            // Calculate edge clamping coordinates
            let clampX = Math.max(padding, Math.min(400 - padding, x));
            let clampY = Math.max(padding, Math.min(300 - padding, y));

            // Calculate straight-line distance (using simple coordinate delta as proxy for miles)
            const latDelta = f.latitude - userCoords.lat;
            const lngDelta = f.longitude - userCoords.lng;
            const distanceMiles = Number((Math.sqrt(latDelta*latDelta + lngDelta*lngDelta) * 60).toFixed(1)); // 1 degree lat is ~60 miles
            
            // Calculate time-away based on speed (baseline 25 mph)
            const speedMph = f.speed && f.speed > 0 ? f.speed : 25;
            const minutesAway = Math.max(1, Math.round((distanceMiles / speedMph) * 60));

            // Convert SVG clamp to percentages for absolute placement
            const percentX = (clampX / 400) * 100;
            const percentY = (clampY / 300) * 100;

            return (
              <div 
                key={f.user_id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 p-1 bg-neutral-950/90 border border-emerald-500/40 rounded-full shadow-lg z-20 transition-all hover:scale-105"
                style={{ left: `${percentX}%`, top: `${percentY}%` }}
              >
                {/* Tiny Avatar */}
                <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-500 bg-neutral-900 shrink-0">
                  {f.avatar_url ? (
                    <img src={f.avatar_url} alt={f.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-neutral-400 mx-auto mt-1" />
                  )}
                </div>

                <div className="pr-2 text-left">
                  <div className="text-[7px] font-black uppercase text-white truncate max-w-[50px] leading-none">
                    {f.display_name.split(' ')[0]}
                  </div>
                  <div className="text-[6px] font-mono text-emerald-400 font-bold leading-none mt-0.5">
                    {distanceMiles} mi • {minutesAway}m
                  </div>
                </div>
              </div>
            );
          })}

          {/* Map Controls Floating Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none">
            {/* GPS Capture Button (56px High target area) */}
            <button
              onClick={handleCaptureLocation}
              disabled={gettingLocation}
              className="pointer-events-auto w-14 h-14 bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-850 rounded-2xl flex items-center justify-center text-white transition-all shadow-lg active:scale-95 cursor-pointer"
              title="Pin My Location"
            >
              <Crosshair className={`w-5 h-5 text-cyan-400 ${gettingLocation ? 'animate-spin' : ''}`} />
            </button>

            {/* Drop Spot Action Button (56px High target area) */}
            <button
              onClick={() => {
                if (!userCoords) {
                  alert('Acquiring GPS coordinates first...');
                  handleCaptureLocation();
                }
                setShowAddForm(true);
              }}
              className="pointer-events-auto h-14 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-600/10 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" /> Drop Spot
            </button>
          </div>

        </div>

      </div>

      {/* Spots Registry & Interactive Forms (Right 4 Columns) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Dynamic Add Spot Form Overlay */}
        {showAddForm && (
          <div className="glass-card p-6 rounded-[2rem] border-cyan-950 bg-cyan-950/5 space-y-4 relative">
            <button 
              onClick={() => setShowAddForm(false)} 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 border-b border-cyan-900/30 pb-3">
              <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Crowdsourcing Pin</span>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Drop New Spot</h3>
            </div>

            <form onSubmit={handleCreateSpot} className="space-y-4 text-left">
              <div>
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-1">Spot Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Grass Lake Marina / Sandbar"
                  value={newSpotName}
                  onChange={(e) => setNewSpotName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-3 text-xs font-medium outline-none min-h-[50px]"
                />
              </div>

              {/* Coordinates Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-mono font-bold text-neutral-450 uppercase block mb-1">Latitude</label>
                  <input 
                    type="number" 
                    step="0.00001"
                    required
                    value={newSpotLat}
                    onChange={(e) => setNewSpotLat(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-850 text-neutral-300 rounded-xl px-3 py-2.5 text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold text-neutral-450 uppercase block mb-1">Longitude</label>
                  <input 
                    type="number" 
                    step="0.00001"
                    required
                    value={newSpotLng}
                    onChange={(e) => setNewSpotLng(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-850 text-neutral-300 rounded-xl px-3 py-2.5 text-xs font-mono outline-none"
                  />
                </div>
              </div>



              {/* Features checklists (Large 56px click box targets) */}
              <div>
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase block mb-1.5">Select Features</label>
                <div className="grid grid-cols-2 gap-2">
                  {['dock', 'launch', 'fuel', 'food', 'sandbar', 'hazard'].map((feat) => {
                    const isChecked = newSpotFeatures.includes(feat);
                    return (
                      <button
                        key={feat}
                        type="button"
                        onClick={() => handleFeatureToggle(feat)}
                        className={`p-3 rounded-xl border text-[10px] font-mono font-bold uppercase flex items-center justify-between transition-all min-h-[46px] cursor-pointer ${
                          isChecked 
                            ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400 font-black' 
                            : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {feat}
                        {isChecked ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-40" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Feature Add Input */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Custom tag (e.g. ramp)"
                  value={newCustomFeature}
                  onChange={(e) => setNewCustomFeature(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-2 text-[10px] outline-none"
                />
                <button 
                  type="button" 
                  onClick={handleAddCustomFeature}
                  className="px-3 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Notes field */}
              <div>
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase block mb-1">Rider Notes</label>
                <textarea 
                  placeholder="e.g. Water is very shallow here on holiday weekends, lots of weeds..."
                  value={newSpotNotes}
                  onChange={(e) => setNewSpotNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-2.5 text-xs font-medium outline-none resize-none"
                />
              </div>

              {/* Hours */}
              <div>
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase block mb-1">Operating Hours (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dawn - Dusk / 9am - 8pm"
                  value={newSpotHours}
                  onChange={(e) => setNewSpotHours(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-2.5 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-xs tracking-wider py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 min-h-[56px] cursor-pointer"
              >
                Verify & Drop Pin →
              </button>
            </form>
          </div>
        )}

        {/* Dynamic Edit Spot Form Overlay */}
        {showEditForm && selectedSpot && (
          <div className="glass-card p-6 rounded-[2rem] border-cyan-950 bg-cyan-950/5 space-y-4 relative">
            <button 
              onClick={() => setShowEditForm(false)} 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 border-b border-cyan-900/30 pb-3">
              <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Crowdsourcing Suggestion</span>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Suggest Edits: {selectedSpot.name}</h3>
            </div>

            <form onSubmit={handleSaveEdits} className="space-y-4 text-left">
              {/* Hours suggestion */}
              <div>
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase block mb-1">Confirm/Update Hours</label>
                <input 
                  type="text" 
                  placeholder={selectedSpot.hours || 'e.g. 8:00 AM - 9:00 PM'}
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-3 text-xs outline-none min-h-[50px]"
                />
              </div>

              {/* Flag features as out of service */}
              <div>
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase block mb-1.5">Flag features no longer existing</label>
                <div className="flex flex-wrap gap-2">
                  {selectedSpot.features.map(f => {
                    const isFlagged = flaggedOutFeatures.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          if (isFlagged) {
                            setFlaggedOutFeatures(prev => prev.filter(x => x !== f));
                          } else {
                            setFlaggedOutFeatures(prev => [...prev, f]);
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase border transition-all flex items-center gap-1.5 min-h-[38px] cursor-pointer ${
                          isFlagged 
                            ? 'bg-red-950/40 border-red-500 text-red-400 font-black' 
                            : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {f} {isFlagged && <X className="w-3 h-3 text-red-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Note */}
              <div>
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase block mb-1">Add New Observation Note</label>
                <textarea 
                  placeholder="Leave suggestions or reports about depth, slips, or rules..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-xl px-3 py-2.5 text-xs font-medium outline-none resize-none"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-xs tracking-wider py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 min-h-[56px] cursor-pointer"
                >
                  Submit Recommendations →
                </button>

                <button
                  type="button"
                  onClick={handleReportClosed}
                  className="w-full bg-red-950/30 hover:bg-red-950/50 border border-red-900/30 text-red-400 font-black uppercase text-xs tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Report Closed or Missing
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Selected Spot Details Panel */}
        {selectedSpot && !showEditForm && !showAddForm && (
          <div className="glass-card p-6 rounded-[2rem] border-neutral-900 bg-neutral-950/40 space-y-5 relative text-left">
            <button 
              onClick={() => setSelectedSpot(null)} 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              {/* Status & Business badge */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                  selectedSpot.status === 'verified' ? 'bg-emerald-950/30 border border-emerald-900/30 text-emerald-400' : 'bg-blue-950/20 border border-blue-900/20 text-cyan-400'
                }`}>
                  {selectedSpot.status} Spot
                </span>
                
                {selectedSpot.business_id && (
                  <span className="text-[8px] font-mono font-bold bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 text-yellow-400" /> Verified Business Partner
                  </span>
                )}
              </div>

              <h4 className="text-base font-black text-white uppercase pt-1 tracking-tight leading-tight">{selectedSpot.name}</h4>
              <p className="text-[9px] font-mono text-neutral-500 font-bold">Coords: {selectedSpot.latitude}, {selectedSpot.longitude}</p>
            </div>

            {/* Features tags */}
            <div className="space-y-1.5">
              <h5 className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Active Features</h5>
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
                <h5 className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Confirmed Hours
                </h5>
                <p className="text-xs text-neutral-300 font-semibold">{selectedSpot.hours}</p>
              </div>
            )}

            {/* Historical User Notes */}
            <div className="space-y-3">
              <h5 className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-cyan-400" /> Observations Feed
              </h5>
              
              <div className="space-y-2.5 max-h-[140px] overflow-y-auto no-scrollbar pr-1">
                {selectedSpot.notes.length > 0 ? (
                  selectedSpot.notes.map((n, idx) => (
                    <div key={idx} className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-2xl text-[11px] space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                        <span className="text-cyan-400">{n.user}</span>
                        <span className="text-neutral-500">{new Date(n.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-neutral-300 font-medium leading-relaxed">{n.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-neutral-600 font-mono italic">No notes reported yet. Be the first to add details!</p>
                )}
              </div>
            </div>

            {/* Action edit tools */}
            <div className="pt-2 border-t border-neutral-900 flex gap-3">
              <button 
                onClick={() => setShowEditForm(true)}
                className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> Suggest Edits / Note
              </button>
              
              {selectedSpot.business_id && (
                <a 
                  href={`/b/${selectedSpot.business_id}`}
                  className="px-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
                >
                  <Building2 className="w-4 h-4" /> Storefront
                </a>
              )}
            </div>

          </div>
        )}

        {/* Default Spots list catalog */}
        {!selectedSpot && !showAddForm && !showEditForm && (
          <div className="glass-card p-6 rounded-[2rem] border-neutral-900 bg-neutral-950/20 space-y-4 text-left">
            <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1">
              <MapPin className="w-4 h-4 text-cyan-400" /> Crowd Spots Registry
            </h4>

            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
              {spots.length > 0 ? (
                spots.map(s => {
                  if (s.status === 'reported_closed') return null;
                  return (
                    <div 
                      key={s.id}
                      onClick={() => setSelectedSpot(s)}
                      className="p-3 bg-neutral-900/40 hover:bg-neutral-900/80 border border-neutral-850 hover:border-neutral-800 rounded-2xl flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="space-y-0.5 pr-2 truncate">
                        <div className="text-xs font-bold text-white uppercase truncate flex items-center gap-1.5">
                          {s.name}
                          {s.business_id && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                        </div>
                        <div className="flex gap-1.5">
                          {s.features.slice(0, 3).map(f => (
                            <span key={f} className="text-[7.5px] font-mono font-bold text-neutral-500 uppercase">{f}</span>
                          ))}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase bg-cyan-950/20 border border-cyan-900/20 px-2 py-0.5 rounded">
                          {s.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-neutral-600 font-mono text-[10px]">No spots mapping this venue yet.</div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
