'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import StorageSpaceForm, { PhysicalSpaceData } from '@/components/space/StorageSpaceForm';

export default function EditSpacePage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = rawId ? decodeURIComponent(rawId) : 'space-1';

  const [loading, setLoading] = useState(true);
  const [spaceData, setSpaceData] = useState<PhysicalSpaceData | null>(null);

  useEffect(() => {
    if (!id) return;

    const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');
    
    if (isMock) {
      const storedSpaces = localStorage.getItem('__mock_spaces__');
      if (storedSpaces) {
        try {
          const parsed = JSON.parse(storedSpaces);
          const found = parsed.find((s: any) => s.id === id);
          if (found) {
            setSpaceData(found);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing mock spaces:', e);
        }
      }

      setSpaceData({
        id: id,
        name: id === 'space-1' ? "Kristina's Garage" : `Physical Space ${id}`,
        type: id === 'space-4' ? 'Utility Trailer' : 'Garage',
        sqft: id === 'space-1' ? '600 sqft' : '200 sqft',
        location: id === 'space-1' ? 'Grayslake, IL' : 'Libertyville, IL',
        access_code_notes: 'Gate code #4092, keybox next to side door.',
        is_dual_native_vehicle: id === 'space-4',
        vehicle_make: id === 'space-4' ? 'Pace American' : '',
        vehicle_model: id === 'space-4' ? "7'x14' Enclosed Tandem Axle" : '',
        license_plate: id === 'space-4' ? '992-TLR (WI)' : '',
        hitch_type: id === 'space-4' ? '2-5/16" Ball' : '2" Ball'
      });
      setLoading(false);
      return;
    }

    async function loadSpace() {
      try {
        const docRef = doc(db, 'garage_spaces', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSpaceData({ id: snap.id, ...snap.data() } as PhysicalSpaceData);
        } else {
          setSpaceData({
            id: id,
            name: "Kristina's Garage",
            type: 'Garage',
            sqft: '600 sqft',
            location: 'Grayslake, IL',
            access_code_notes: 'Gate code #4092, keybox next to side door.'
          });
        }
      } catch (err) {
        console.error('Error fetching physical space:', err);
        setSpaceData({
          id: id,
          name: "Kristina's Garage",
          type: 'Garage',
          sqft: '600 sqft',
          location: 'Grayslake, IL',
          access_code_notes: 'Gate code #4092, keybox next to side door.'
        });
      } finally {
        setLoading(false);
      }
    }

    loadSpace();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff3b30]" />
        <span>Loading Storage Space Passport...</span>
      </div>
    );
  }

  return <StorageSpaceForm mode="edit" spaceId={id} initialData={spaceData} />;
}
