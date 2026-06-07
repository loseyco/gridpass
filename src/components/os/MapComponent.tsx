'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  heading: number;
  preset: 'marine' | 'trail' | 'moto';
  trail: { lat: number; lng: number }[];
  launchLat: number | null;
  launchLng: number | null;
  mode: 'dark' | 'light';
}

export default function MapComponent({
  latitude,
  longitude,
  heading,
  preset,
  trail,
  launchLat,
  launchLng,
  mode
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const trailLineRef = useRef<L.Polyline | null>(null);
  const rthLineRef = useRef<L.Polyline | null>(null);
  const homeMarkerRef = useRef<L.Marker | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);

  // Get accent color based on preset
  const getAccentColor = () => {
    if (preset === 'marine') return mode === 'light' ? '#000000' : '#00e5ff';
    if (preset === 'trail') return mode === 'light' ? '#000000' : '#ff3d00';
    return mode === 'light' ? '#000000' : '#ff9100'; // moto
  };

  // Get tile layer URL based on preset and mode
  const getTileLayerUrl = () => {
    if (preset === 'trail') {
      // Topographic Map
      return 'https://{s}.tile.opentopomap.org/{z}/{y}/{x}.png';
    }
    
    // Standard Dark or Light vector maps
    return mode === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{y}/{x}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{y}/{x}{r}.png';
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([latitude, longitude], 15);

    mapRef.current = map;

    // Add initial base tile layer
    const baseLayer = L.tileLayer(getTileLayerUrl(), {
      maxZoom: 19
    }).addTo(map);
    baseLayerRef.current = baseLayer;

    // Create Vehicle Icon SVG
    const accentColor = getAccentColor();
    const getVehiclePath = () => {
      if (preset === 'marine') return 'M50 15 L78 75 L50 58 L22 75 Z'; // Boat arrow
      if (preset === 'trail') return 'M30 40 H70 V60 H30 Z M20 48 H80 M35 60 V70 M65 60 V70'; // Simple box Jeep layout representation
      return 'M50 10 L75 50 L50 90 L25 50 Z'; // Diamond Moto arrow
    };

    const markerSvg = `
      <svg id="os-vehicle-marker" viewBox="0 0 100 100" style="width: 32px; height: 32px; transform: rotate(${heading}deg); transform-origin: 50% 50%; transition: transform 0.15s ease-out;">
        <circle cx="50" cy="50" r="40" fill="none" stroke="${accentColor}" stroke-width="6" />
        <path d="${getVehiclePath()}" fill="${accentColor}" />
      </svg>
    `;

    const customIcon = L.divIcon({
      html: markerSvg,
      className: 'os-custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    markerRef.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);

    // Initialize Trail Polyline
    trailLineRef.current = L.polyline([], {
      color: accentColor,
      weight: 4,
      opacity: 0.85
    }).addTo(map);

    // Initialize RTH Polyline
    rthLineRef.current = L.polyline([], {
      color: '#FF3D00',
      dashArray: '6, 12',
      weight: 3,
      opacity: 0.75
    }).addTo(map);

    // Invalidate size once after mounting to ensure proper display inside containers
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map layer on mode/preset changes
  useEffect(() => {
    if (!mapRef.current || !baseLayerRef.current) return;

    mapRef.current.removeLayer(baseLayerRef.current);
    const newLayer = L.tileLayer(getTileLayerUrl(), {
      maxZoom: 19
    }).addTo(mapRef.current);
    baseLayerRef.current = newLayer;
  }, [preset, mode]);

  // Update dynamic telemetry
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const latlng: L.LatLngExpression = [latitude, longitude];
    markerRef.current.setLatLng(latlng);

    // Rotate marker
    const accentColor = getAccentColor();
    const getVehiclePath = () => {
      if (preset === 'marine') return 'M50 15 L78 75 L50 58 L22 75 Z';
      if (preset === 'trail') return 'M30 40 H70 V60 H30 Z M20 48 H80';
      return 'M50 10 L75 50 L50 90 L25 50 Z';
    };

    const markerSvg = `
      <svg id="os-vehicle-marker" viewBox="0 0 100 100" style="width: 32px; height: 32px; transform: rotate(${heading}deg); transform-origin: 50% 50%; transition: transform 0.15s ease-out;">
        <circle cx="50" cy="50" r="40" fill="none" stroke="${accentColor}" stroke-width="6" />
        <path d="${getVehiclePath()}" fill="${accentColor}" />
      </svg>
    `;
    
    markerRef.current.setIcon(
      L.divIcon({
        html: markerSvg,
        className: 'os-custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    );

    // Pan map to follow vehicle
    mapRef.current.panTo(latlng);
  }, [latitude, longitude, heading, preset, mode]);

  // Update Trail
  useEffect(() => {
    if (!trailLineRef.current) return;
    const path = trail.map(pt => [pt.lat, pt.lng] as L.LatLngExpression);
    trailLineRef.current.setLatLngs(path);
    trailLineRef.current.setStyle({ color: getAccentColor() });
  }, [trail, preset, mode]);

  // Update Launch/Basecamp Home Location
  useEffect(() => {
    if (!mapRef.current) return;

    if (launchLat === null || launchLng === null) {
      if (homeMarkerRef.current) {
        mapRef.current.removeLayer(homeMarkerRef.current);
        homeMarkerRef.current = null;
      }
      if (rthLineRef.current) {
        rthLineRef.current.setLatLngs([]);
      }
      return;
    }

    const latlng: L.LatLngExpression = [launchLat, launchLng];

    // Select emoji pin icon based on preset
    const getHomeEmoji = () => {
      if (preset === 'trail') return '⛺';
      if (preset === 'moto') return '🏍️';
      return '⚓';
    };

    if (homeMarkerRef.current) {
      homeMarkerRef.current.setLatLng(latlng);
      homeMarkerRef.current.setIcon(
        L.divIcon({
          html: `<div style="font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${getHomeEmoji()}</div>`,
          className: 'home-custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      );
    } else {
      const homeIcon = L.divIcon({
        html: `<div style="font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${getHomeEmoji()}</div>`,
        className: 'home-custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      homeMarkerRef.current = L.marker(latlng, { icon: homeIcon }).addTo(mapRef.current);
    }

    // Update RTH Vector Line
    if (rthLineRef.current) {
      rthLineRef.current.setLatLngs([
        [latitude, longitude],
        [launchLat, launchLng]
      ]);
    }
  }, [launchLat, launchLng, latitude, longitude, preset]);

  return (
    <div className="w-full h-full relative" style={{ minHeight: '240px' }}>
      <div ref={mapContainerRef} className="w-full h-full rounded-xl overflow-hidden bg-zinc-950 border border-neutral-900" style={{ height: '100%' }} />
    </div>
  );
}
