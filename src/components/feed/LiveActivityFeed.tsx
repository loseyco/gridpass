'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  Activity, 
  Car, 
  Calendar, 
  UserPlus, 
  QrCode, 
  Camera, 
  ChevronRight,
  Radio,
  Sparkles,
  GitCommit
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  targetId: string;
  type: 'event' | 'vehicle' | 'user' | 'scan' | 'sighting' | 'service' | 'changelog';
  title: string;
  description: string;
  timestamp: Date;
  href?: string;
  userDisplayName?: string;
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    // Temporary storage for raw items from all snapshot streams
    const rawEvents: ActivityItem[] = [];
    const rawVehicles: ActivityItem[] = [];
    const rawUsers: ActivityItem[] = [];
    const rawScans: ActivityItem[] = [];
    const rawSightings: ActivityItem[] = [];
    const rawChangelogs: ActivityItem[] = [];

    // Helper to merge, deduplicate, and sort all activity streams
    const processStreams = () => {
      const all = [
        ...rawEvents,
        ...rawVehicles,
        ...rawUsers,
        ...rawScans,
        ...rawSightings,
        ...rawChangelogs
      ];

      // DEDUPLICATION ENGINE:
      // Map keyed by `type_targetId` ensures that repeated edits to the exact same event,
      // vehicle, or user profile (e.g. editing an event 100 times in a row) only show
      // ONE single feed item reflecting the latest timestamp!
      const deduplicatedMap = new Map<string, ActivityItem>();

      for (const item of all) {
        const key = `${item.type}_${item.targetId}`;
        const existing = deduplicatedMap.get(key);
        if (!existing || item.timestamp.getTime() > existing.timestamp.getTime()) {
          deduplicatedMap.set(key, item);
        }
      }

      // Sort by newest timestamp first
      const sorted = Array.from(deduplicatedMap.values()).sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      setActivities(sorted.slice(0, 8));
      setLoading(false);
    };

    // 1. Real-time Events Listener
    const unsubEvents = onSnapshot(
      collection(db, 'events'),
      (snapshot) => {
        rawEvents.length = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const rawTime = data.updatedAt || data.createdAt;
          const ts = rawTime?.toDate ? rawTime.toDate() : rawTime ? new Date(rawTime) : new Date();

          const isEdit = !!data.updatedAt && data.updatedAt !== data.createdAt;

          rawEvents.push({
            id: `evt_${docSnap.id}`,
            targetId: docSnap.id,
            type: 'event',
            title: data.title || data.name || 'Untitled Event',
            description: isEdit 
              ? `Event updated • ${data.location || data.venue || 'Details modified'}`
              : `${data.location || data.venue || 'Gathering / Meet scheduled'}`,
            timestamp: ts,
            href: `/events/${docSnap.id}`
          });
        });
        processStreams();
      },
      (err) => console.warn('[LiveFeed] Events subscription warning:', err)
    );

    // 2. Real-time Vehicles Listener
    const unsubVehicles = onSnapshot(
      collection(db, 'vehicles'),
      (snapshot) => {
        rawVehicles.length = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const createdOrUpdated = data.updatedAt || data.createdAt;
          const ts = createdOrUpdated?.toDate ? createdOrUpdated.toDate() : new Date(createdOrUpdated || Date.now());

          const vehicleName = [data.year, data.make, data.model].filter(Boolean).join(' ') || data.name || 'Vehicle Passport';
          rawVehicles.push({
            id: `veh_${docSnap.id}`,
            targetId: docSnap.id,
            type: 'vehicle',
            title: vehicleName,
            description: data.trim || data.color ? `${data.color || ''} ${data.trim || ''}`.trim() : 'Digital Passport active',
            timestamp: ts,
            href: `/v/${docSnap.id}`
          });
        });
        processStreams();
      },
      (err) => console.warn('[LiveFeed] Vehicles subscription warning:', err)
    );

    // 3. Real-time New Drivers / Users Listener
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        rawUsers.length = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const createdOrUpdated = data.createdAt || data.joinedAt;
          const ts = createdOrUpdated?.toDate ? createdOrUpdated.toDate() : new Date(createdOrUpdated || Date.now());

          const name = data.displayName || data.name || data.handle || 'Driver';
          rawUsers.push({
            id: `usr_${docSnap.id}`,
            targetId: docSnap.id,
            type: 'user',
            title: `${name} joined Gridpass`,
            description: 'New verified member card',
            timestamp: ts,
            href: `/u/${docSnap.id}`
          });
        });
        processStreams();
      },
      (err) => console.warn('[LiveFeed] Users subscription warning:', err)
    );

    // 4. Real-time Tag Scans Listener
    const unsubScans = onSnapshot(
      collection(db, 'tag_scans'),
      (snapshot) => {
        rawScans.length = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const ts = data.scanned_at?.toDate ? data.scanned_at.toDate() : new Date(data.timestamp || Date.now());

          rawScans.push({
            id: `scn_${docSnap.id}`,
            targetId: docSnap.id,
            type: 'scan',
            title: 'Physical Tag Scanned',
            description: data.location || data.tagId ? `Tag ID: ${data.tagId || docSnap.id.slice(0, 6)}` : 'QR Pass verified',
            timestamp: ts
          });
        });
        processStreams();
      },
      (err) => console.warn('[LiveFeed] Scans subscription warning:', err)
    );

    // 5. Real-time Sightings / Spots Listener
    const unsubSightings = onSnapshot(
      collection(db, 'sightings'),
      (snapshot) => {
        rawSightings.length = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const ts = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.createdAt || Date.now());

          rawSightings.push({
            id: `sgt_${docSnap.id}`,
            targetId: docSnap.id,
            type: 'sighting',
            title: data.vehicleName || 'Wild Sighting Pinned',
            description: data.location || 'Spotted on Gridpass Map',
            timestamp: ts
          });
        });
        processStreams();
      },
      (err) => console.warn('[LiveFeed] Sightings subscription warning:', err)
    );

    // 6. Real-time System Release Changelogs Listener
    const unsubChangelogs = onSnapshot(
      collection(db, 'changelogs'),
      (snapshot) => {
        rawChangelogs.length = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const ts = data.timestamp ? new Date(data.timestamp) : new Date();

          rawChangelogs.push({
            id: `clg_${docSnap.id}`,
            targetId: docSnap.id,
            type: 'changelog',
            title: `${data.version || 'Update'}: ${data.title || 'Platform Release'}`,
            description: data.description || `Platform update released (${data.category || 'feature'})`,
            timestamp: ts,
            href: `/admin/changelog`
          });
        });
        processStreams();
      },
      (err) => console.warn('[LiveFeed] Changelogs subscription warning:', err)
    );

    return () => {
      unsubEvents();
      unsubVehicles();
      unsubUsers();
      unsubScans();
      unsubSightings();
      unsubChangelogs();
    };
  }, []);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-3.5 h-3.5 text-[#ff3b30]" />;
      case 'vehicle':
        return <Car className="w-3.5 h-3.5 text-neutral-800" />;
      case 'user':
        return <UserPlus className="w-3.5 h-3.5 text-emerald-600" />;
      case 'scan':
        return <QrCode className="w-3.5 h-3.5 text-blue-600" />;
      case 'sighting':
        return <Camera className="w-3.5 h-3.5 text-amber-600" />;
      case 'changelog':
        return <Sparkles className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-neutral-500" />;
    }
  };

  return (
    <div className="w-full bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header with Live Pulsing Dot */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3b30] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff3b30]"></span>
          </div>
          <h2 className="text-xs font-black text-neutral-900 uppercase tracking-wide flex items-center gap-1.5">
            Live Platform Activity
          </h2>
        </div>
        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
          Real-Time Sync
        </span>
      </div>

      {/* Activity Feed List */}
      {loading ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-4 h-4 border-2 border-[#ff3b30] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
            Connecting live feed...
          </p>
        </div>
      ) : activities.length === 0 ? (
        <div className="py-6 text-center text-neutral-400 space-y-1">
          <Radio className="w-5 h-5 mx-auto text-neutral-300 animate-pulse" />
          <p className="text-[11px] font-bold text-neutral-500 uppercase">Listening for live updates...</p>
          <p className="text-[9px] text-neutral-400">Activity will stream in real-time as users interact across Gridpass.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {activities.map((item) => {
            const cardContent = (
              <div className="flex items-center justify-between p-2.5 bg-neutral-50 hover:bg-neutral-100/90 border border-neutral-200/80 rounded-xl transition-all group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-white rounded-lg border border-neutral-200 shadow-xs flex-shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[11px] font-bold text-neutral-900 uppercase truncate leading-tight group-hover:text-[#ff3b30] transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate leading-tight">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
                  <span className="text-[9px] font-mono font-medium text-neutral-400 uppercase">
                    {formatTimeAgo(item.timestamp)}
                  </span>
                  {item.href && (
                    <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-neutral-600 transition-colors" />
                  )}
                </div>
              </div>
            );

            return item.href ? (
              <Link key={item.id} href={item.href} className="block">
                {cardContent}
              </Link>
            ) : (
              <div key={item.id}>
                {cardContent}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
