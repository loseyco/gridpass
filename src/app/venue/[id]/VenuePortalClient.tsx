'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Loader2, AlertTriangle } from 'lucide-react';
import { SEEDED_VENUES } from '@/lib/data/venues';
import { Venue } from '@/lib/types/venue';
import VenuePortalView from '@/components/venue/VenuePortalView';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

interface VenuePortalClientProps {
  venueId: string;
}

export default function VenuePortalClient({ venueId }: VenuePortalClientProps) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

  useEffect(() => {
    let isMounted = true;

    async function loadVenue() {
      if (!venueId) {
        setLoading(false);
        return;
      }

      // Check seeded list first (for mock/tests/local fallbacks)
      const seeded = SEEDED_VENUES.find(v => v.id === venueId);
      if (seeded) {
        if (isMounted) {
          setVenue(seeded);
          setLoading(false);
        }
        return;
      }

      if (isMock) {
        // Fallback for demo in mock environment
        const demoVenue = SEEDED_VENUES.find(v => v.id === 'round-lake-beach') || SEEDED_VENUES[0];
        if (isMounted) {
          setVenue({ ...demoVenue, id: venueId, name: venueId.replace(/-/g, ' ').toUpperCase() });
          setLoading(false);
        }
        return;
      }

      try {
        const vDoc = await getDoc(doc(db, 'venues', venueId));
        if (vDoc.exists()) {
          const data = vDoc.data();
          if (isMounted) {
            setVenue({
              id: vDoc.id,
              name: data.name || 'Anonymous Venue',
              location: data.location || 'Unknown Location',
              type: data.type || 'racetrack',
              pois: data.pois || [],
              hazards: data.hazards || [],
              rules: data.rules || [],
              occupancy: data.occupancy || { current: 0, max: 100 },
              pit_status: data.pit_status,
              gate_status: data.gate_status,
              active_sessions: data.active_sessions
            } as Venue);
          }
        } else {
          // Generate fallback venue based on ID format
          const type: Venue['type'] = venueId.includes('lake') || venueId.includes('water') ? 'waterway' : 'racetrack';
          const defaultVenue: Venue = {
            id: venueId,
            name: venueId.replace(/-/g, ' ').toUpperCase(),
            location: 'Local Region',
            type,
            pois: [],
            hazards: [],
            rules: [
              { title: 'Observe Safety Rules', desc: 'Maintain safe speeds and follow local guidelines.' }
            ],
            occupancy: { current: 0, max: 100 }
          };
          if (isMounted) setVenue(defaultVenue);
        }
      } catch (err) {
        console.error("Failed to load venue from Firestore:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVenue();
    return () => { isMounted = false; };
  }, [venueId, isMock]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!venue) {
    return (
      <main className="min-h-screen bg-[#060608] text-[#f4f4f7] flex flex-col items-center justify-center space-y-4">
        <Navbar />
        <AlertTriangle className="w-16 h-16 text-yellow-500" />
        <h2 className="text-xl font-bold uppercase tracking-wider">Venue Not Found</h2>
        <a href="/explore" className="text-xs font-mono text-cyan-400 hover:underline">Explore Active Registry</a>
        <Footer />
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <VenuePortalView venue={venue} />
      <Footer />
    </>
  );
}
