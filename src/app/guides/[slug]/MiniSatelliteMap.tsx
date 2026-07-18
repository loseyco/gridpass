'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MiniSatelliteMapProps {
  lat: number;
  lng: number;
  name: string;
}

export default function MiniSatelliteMap({ lat, lng, name }: MiniSatelliteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map in read-only/non-interactive mode
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 16, // High zoom level for detailed aerial satellite view
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      touchZoom: false
    });

    // Google Hybrid Satellite tile layer
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 22,
    }).addTo(map);

    // Custom marker SVG with a crimson pulse
    const markerSvg = `
      <div class="relative w-6 h-6 flex items-center justify-center">
        <div class="absolute w-5 h-5 bg-[#bd2925]/30 border border-[#bd2925] rounded-full animate-ping"></div>
        <div class="w-2.5 h-2.5 bg-[#bd2925] border border-white rounded-full"></div>
      </div>
    `;

    L.marker([lat, lng], {
      icon: L.divIcon({
        html: markerSvg,
        className: 'mini-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).addTo(map);

    mapRef.current = map;

    // Adjust leaflet size to fit container correctly after rendering
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <div className="w-full h-32 sm:h-36 rounded-2xl border border-neutral-900 overflow-hidden relative z-0 group hover:border-rose-500/25 transition-all shadow-md select-none pointer-events-none">
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Subtle overlay label */}
      <div className="absolute bottom-2 left-2 bg-neutral-950/80 border border-neutral-900 rounded-lg px-2 py-0.5 text-[8px] font-mono text-neutral-400 font-bold uppercase tracking-wider backdrop-blur-sm z-[1000]">
        🛰️ Aerial View: {name.split(' (')[0]}
      </div>
    </div>
  );
}
