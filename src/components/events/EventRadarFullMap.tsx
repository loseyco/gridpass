'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EventGPSPin } from '@/lib/types/events';

interface EventRadarFullMapProps {
  eventLat: number;
  eventLng: number;
  locationName?: string;
  pins: EventGPSPin[];
  activeFilter: 'all' | 'vehicle' | 'vendor' | 'attendee' | 'amenity';
  focusedPinId?: string | null;
  startDate?: string;
  endDate?: string;
}

export default function EventRadarFullMap({
  eventLat,
  eventLng,
  locationName,
  pins,
  activeFilter,
  focusedPinId,
  startDate,
  endDate
}: EventRadarFullMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Record<string, L.Marker>>({});

  // Compute dynamic racing flag state (Green -> White -> Checkered based on start/end time)
  const getFlagState = () => {
    const now = new Date().getTime();
    const startTime = startDate ? new Date(startDate).getTime() : 0;
    const endTime = endDate ? new Date(endDate).getTime() : startTime ? startTime + (4 * 3600 * 1000) : 0;

    if (!startTime) {
      return { flag: '🟩', label: 'GREEN FLAG (UPCOMING)', bg: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', shadow: '0 4px 16px rgba(34,197,94,0.6)' };
    }

    if (now < startTime) {
      // Pre-event: Green flag
      return { flag: '🟩', label: 'GREEN FLAG (UPCOMING)', bg: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', shadow: '0 4px 16px rgba(34,197,94,0.6)' };
    } else if (now >= startTime && now <= endTime) {
      // Active event: White flag if last 45 mins, else Green flag
      if (endTime - now <= (45 * 60 * 1000)) {
        return { flag: '🏳️', label: 'WHITE FLAG (FINAL HOUR)', bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', shadow: '0 4px 16px rgba(245,158,11,0.6)' };
      }
      return { flag: '🟩', label: 'GREEN FLAG (LIVE NOW)', bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', shadow: '0 4px 16px rgba(16,185,129,0.7)' };
    } else {
      // Past event: Checkered flag
      return { flag: '🏁', label: 'CHECKERED FLAG (FINISHED)', bg: 'linear-gradient(135deg, #ff3b30 0%, #1c1c1e 100%)', shadow: '0 4px 16px rgba(255,59,48,0.5)' };
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Fix Leaflet marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
    });

    const map = L.map(mapContainerRef.current, {
      center: [eventLat, eventLng],
      zoom: 15,
      zoomControl: true
    });

    // Google Maps Tile Layer
    const googleRoadmap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }).addTo(map);

    // Trigger size invalidation after render so tiles load cleanly
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 150);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [eventLat, eventLng]);

  // Update markers whenever pins, activeFilter, or date changes
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    const flagState = getFlagState();

    // 1. Always render Official Event Central Pin at center with dynamic flag
    const centerHtmlIcon = L.divIcon({
      className: 'event-center-pin',
      html: `<div style="
        background: ${flagState.bg};
        width: 42px;
        height: 42px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: white;
        border: 3.5px solid white;
        box-shadow: ${flagState.shadow};
        cursor: pointer;
      ">${flagState.flag}</div>`,
      iconSize: [42, 42],
      iconAnchor: [21, 21]
    });

    const centerMarker = L.marker([eventLat, eventLng], { icon: centerHtmlIcon, zIndexOffset: 1000 });
    const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);
    const centerNavUrl = isIOS 
      ? `https://maps.apple.com/?q=${encodeURIComponent(locationName || `${eventLat},${eventLng}`)}`
      : `https://maps.google.com/?q=${encodeURIComponent(locationName || `${eventLat},${eventLng}`)}`;
    
    centerMarker.bindPopup(`
      <div style="font-family: sans-serif; text-align: left; padding: 4px; max-width: 220px;">
        <div style="font-size: 9px; font-weight: bold; color: #ff3b30; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
          ${flagState.flag} ${flagState.label}
        </div>
        <div style="font-size: 13px; font-weight: 900; color: #111827; text-transform: uppercase; margin-bottom: 4px; line-height: 1.2;">
          ${locationName || 'Event Grounds & Main Street'}
        </div>
        <a href="${centerNavUrl}" target="_blank" rel="noopener noreferrer" style="
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background-color: #ff3b30;
          color: white;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 8px;
        ">
          🗺️ Get Directions
        </a>
      </div>
    `);
    markersGroupRef.current.addLayer(centerMarker);

    const filteredPins = pins.filter(p => activeFilter === 'all' || p.type === activeFilter);
    const nearbyMarkers: L.Marker[] = [centerMarker];

    filteredPins.forEach((pin, index) => {
      // Use exact pin lat/lng if provided, or stagger around event center
      const lat = pin.lat ?? (eventLat + (Math.sin(index * 1.5) * 0.0015));
      const lng = pin.lng ?? (eventLng + (Math.cos(index * 1.5) * 0.0015));

      // Calculate live signal age and opacity for attendee pins (fades out after 30 mins)
      const pinAgeMinutes = Math.floor((Date.now() - new Date(pin.timestamp).getTime()) / 60000);
      const isAttendee = pin.type === 'attendee';
      const opacity = isAttendee ? Math.max(0.35, 1 - (pinAgeMinutes / 30)) : 1;
      const ageText = isAttendee ? (pinAgeMinutes < 1 ? 'Just dropped' : `${pinAgeMinutes}m ago`) : null;

      let pinEmoji = '📍';
      let pinBg = '#8b5cf6';
      let pinCategoryLabel = 'Spot';

      if (pin.type === 'vehicle') {
        pinEmoji = '🚘';
        pinBg = '#ff3b30';
        pinCategoryLabel = 'Staged Vehicle';
      } else if (pin.type === 'vendor') {
        pinEmoji = '🏬';
        pinBg = '#2563eb';
        pinCategoryLabel = 'Vendor Booth';
      } else if (pin.type === 'attendee') {
        pinEmoji = '👤';
        pinBg = '#059669';
        pinCategoryLabel = 'Live Member Spot';
      } else if (pin.type === 'amenity') {
        switch (pin.amenity_category) {
          case 'restroom': pinEmoji = '🚻'; pinBg = '#8b5cf6'; pinCategoryLabel = 'Restrooms'; break;
          case 'water': pinEmoji = '💧'; pinBg = '#06b6d4'; pinCategoryLabel = 'Water Station'; break;
          case 'food': pinEmoji = '🍔'; pinBg = '#f59e0b'; pinCategoryLabel = 'Food & Drinks'; break;
          case 'parking': pinEmoji = '🅿️'; pinBg = '#64748b'; pinCategoryLabel = 'Parking / Entrance'; break;
          case 'first_aid': pinEmoji = '🚑'; pinBg = '#ef4444'; pinCategoryLabel = 'First Aid'; break;
          case 'info': pinEmoji = 'ℹ️'; pinBg = '#3b82f6'; pinCategoryLabel = 'Info & Merch'; break;
          default: pinEmoji = '📍'; pinBg = '#8b5cf6'; pinCategoryLabel = 'Venue Amenity'; break;
        }
      }

      const customHtmlIcon = L.divIcon({
        className: 'custom-radar-pin',
        html: `<div style="
          background-color: ${pinBg};
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: white;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          opacity: ${opacity};
          cursor: pointer;
          transition: opacity 0.3s ease;
        ">${pinEmoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([lat, lng], { icon: customHtmlIcon });

      const mapsDirectionsUrl = pin.lat && pin.lng
        ? `https://maps.apple.com/?q=${pin.lat},${pin.lng}`
        : `https://maps.apple.com/?q=${encodeURIComponent([(locationName || ''), pin.address_text || pin.zone_name].filter(Boolean).join(' '))}`;

      const popupContent = `
        <div style="font-family: sans-serif; text-align: left; padding: 4px; max-width: 220px;">
          <div style="font-size: 9px; font-weight: bold; color: ${pinBg}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
            ${pinEmoji} ${pinCategoryLabel} ${ageText ? `• ${ageText}` : ''}
          </div>
          <div style="font-size: 13px; font-weight: 900; color: #111827; text-transform: uppercase; margin-bottom: 2px; line-height: 1.2;">
            ${pin.label}
          </div>
          <div style="font-size: 10px; font-weight: 600; color: #6b7280; margin-bottom: 6px;">
            By ${pin.name} ${pin.address_text || pin.zone_name ? `• ${pin.address_text || pin.zone_name}` : ''}
          </div>
          <a href="${mapsDirectionsUrl}" target="_blank" rel="noopener noreferrer" style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            background-color: #111827;
            color: white;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            text-decoration: none;
            border-radius: 8px;
          ">
            📍 Navigate Here
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersGroupRef.current?.addLayer(marker);
      markersMapRef.current[pin.id] = marker;

      // Only include markers within ~1.5 miles (0.025 lat/lng delta) for fitBounds calculation so distant pins don't pull map zoom out
      if (Math.abs(lat - eventLat) < 0.025 && Math.abs(lng - eventLng) < 0.025) {
        nearbyMarkers.push(marker);
      }
    });

    // Auto fit bounds clamped to event grounds vicinity unless focusedPinId is active
    if (!focusedPinId) {
      if (nearbyMarkers.length > 1) {
        const group = L.featureGroup(nearbyMarkers);
        mapRef.current.fitBounds(group.getBounds().pad(0.2), {
          maxZoom: 16
        });
      } else {
        mapRef.current.setView([eventLat, eventLng], 15);
      }
    }
  }, [pins, activeFilter, eventLat, eventLng, locationName]);

  // Cinematic Fly-Over Zoom when focusedPinId is clicked
  useEffect(() => {
    if (!mapRef.current || !focusedPinId) return;

    const targetPin = pins.find(p => p.id === focusedPinId);
    const targetLat = targetPin?.lat ?? eventLat;
    const targetLng = targetPin?.lng ?? eventLng;

    // Cinematic Leaflet flyTo zoom-in to level 19!
    mapRef.current.flyTo([targetLat, targetLng], 19, {
      duration: 1.8,
      easeLinearity: 0.25
    });

    const marker = markersMapRef.current[focusedPinId];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 1400);
    }
  }, [focusedPinId, pins, eventLat, eventLng]);

  return (
    <div className="relative w-full h-80 rounded-3xl overflow-hidden border border-neutral-200 shadow-md">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {pins.length === 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-neutral-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 pointer-events-none">
          <span>📍 Event Grounds Map • 0 Spots Active</span>
        </div>
      )}
    </div>
  );
}
