'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const WaterMobileView = dynamic(() => import('@/components/water/WaterMobileView'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
    </div>
  )
});

export default function WaterPortalClient() {
  return <WaterMobileView />;
}
