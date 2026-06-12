'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import WaterMobileView to bypass server side Leaflet window errors
const WaterMobileView = dynamic(() => import('@/components/water/WaterMobileView'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
    </div>
  )
});

interface WaterPortalClientProps {
  venueId: string;
}

export default function WaterPortalClient({ venueId }: WaterPortalClientProps) {
  return <WaterMobileView venueId={venueId} />;
}
