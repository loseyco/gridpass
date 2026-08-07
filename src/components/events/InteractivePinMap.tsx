'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Loader2 } from 'lucide-react';

interface InteractivePinMapProps {
  initialLat: number;
  initialLng: number;
  pinType: 'vehicle' | 'vendor' | 'attendee' | 'amenity';
  amenityCategory?: string;
  onPinChange: (lat: number, lng: number) => void;
}

export default function InteractivePinMap({
  initialLat,
  initialLng,
  pinType,
  amenityCategory,
  onPinChange
}: InteractivePinMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [gettingGPS, setGettingGPS] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Fix default Leaflet icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
    });

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: true
    });

    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }).addTo(map);

    // Invalidate size so tiles load cleanly inside modals
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 150);

    // Create custom pin icon based on type
    let pinEmoji = '📍';
    let pinBg = '#8b5cf6';

    if (pinType === 'vehicle') {
      pinEmoji = '🚘';
      pinBg = '#ff3b30';
    } else if (pinType === 'vendor') {
      pinEmoji = '🏬';
      pinBg = '#2563eb';
    } else if (pinType === 'attendee') {
      pinEmoji = '👤';
      pinBg = '#059669';
    } else if (pinType === 'amenity') {
      switch (amenityCategory) {
        case 'restroom': pinEmoji = '🚻'; pinBg = '#8b5cf6'; break;
        case 'water': pinEmoji = '💧'; pinBg = '#06b6d4'; break;
        case 'food': pinEmoji = '🍔'; pinBg = '#f59e0b'; break;
        case 'parking': pinEmoji = '🅿️'; pinBg = '#64748b'; break;
        case 'first_aid': pinEmoji = '🚑'; pinBg = '#ef4444'; break;
        case 'info': pinEmoji = 'ℹ️'; pinBg = '#3b82f6'; break;
        default: pinEmoji = '📍'; pinBg = '#8b5cf6'; break;
      }
    }

    const customHtmlIcon = L.divIcon({
      className: 'custom-pin-marker',
      html: `<div style="
        background-color: ${pinBg};
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: white;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: grab;
      ">${pinEmoji}</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    // Create Draggable Marker
    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customHtmlIcon
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onPinChange(pos.lat, pos.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onPinChange(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update map center and marker when initialLat / initialLng change from parent
  useEffect(() => {
    if (mapRef.current && markerRef.current && initialLat && initialLng) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - initialLat) > 0.00005 || Math.abs(currentPos.lng - initialLng) > 0.00005) {
        mapRef.current.setView([initialLat, initialLng], 17);
        markerRef.current.setLatLng([initialLat, initialLng]);
      }
    }
  }, [initialLat, initialLng]);

  // Update marker icon when pinType or amenityCategory changes dynamically
  useEffect(() => {
    if (!markerRef.current) return;

    let pinEmoji = '📍';
    let pinBg = '#8b5cf6';

    if (pinType === 'vehicle') {
      pinEmoji = '🚘';
      pinBg = '#ff3b30';
    } else if (pinType === 'vendor') {
      pinEmoji = '🏬';
      pinBg = '#2563eb';
    } else if (pinType === 'attendee') {
      pinEmoji = '👤';
      pinBg = '#059669';
    } else if (pinType === 'amenity') {
      switch (amenityCategory) {
        case 'restroom': pinEmoji = '🚻'; pinBg = '#8b5cf6'; break;
        case 'water': pinEmoji = '💧'; pinBg = '#06b6d4'; break;
        case 'food': pinEmoji = '🍔'; pinBg = '#f59e0b'; break;
        case 'parking': pinEmoji = '🅿️'; pinBg = '#64748b'; break;
        case 'first_aid': pinEmoji = '🚑'; pinBg = '#ef4444'; break;
        case 'info': pinEmoji = 'ℹ️'; pinBg = '#3b82f6'; break;
        default: pinEmoji = '📍'; pinBg = '#8b5cf6'; break;
      }
    }

    const updatedIcon = L.divIcon({
      className: 'custom-pin-marker',
      html: `<div style="
        background-color: ${pinBg};
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: white;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: grab;
      ">${pinEmoji}</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    markerRef.current.setIcon(updatedIcon);
  }, [pinType, amenityCategory]);

  // Handle live device location request
  const handleLocateUser = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setGettingGPS(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lng], 17);
          markerRef.current.setLatLng([lat, lng]);
        }
        onPinChange(lat, lng);
        setGettingGPS(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        setGettingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-neutral-200 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Overlay Locate Me Action */}
      <button
        type="button"
        onClick={handleLocateUser}
        disabled={gettingGPS}
        className="absolute top-3 right-3 z-[400] py-2 px-3 bg-white/95 backdrop-blur-md border border-neutral-200 hover:border-neutral-400 text-neutral-900 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
      >
        {gettingGPS ? (
          <Loader2 className="w-3.5 h-3.5 text-[#ff3b30] animate-spin" />
        ) : (
          <Crosshair className="w-3.5 h-3.5 text-[#ff3b30]" />
        )}
        <span>{gettingGPS ? 'Acquiring...' : '📍 Use Current GPS'}</span>
      </button>

      {/* Helper Footer Banner */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[400] bg-neutral-900/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider shadow-md pointer-events-none">
        Click map or drag pin to position spot
      </div>
    </div>
  );
}
