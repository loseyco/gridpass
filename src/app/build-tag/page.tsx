import { Metadata } from 'next';
import { Suspense } from 'react';
import BuildTagClient from './BuildTagClient';

export const metadata: Metadata = {
  title: 'Design Your Custom QR Tag | Gridpass',
  description: 'Create and print custom QR decals or window sheets for your vehicle. Link them to your free digital passport for meets, shows, and track days.',
  keywords: ['create qr code tag', 'custom decal builder', 'vehicle passport setup', 'indycar telemetry', 'avery templates', 'print at home stickers'],
  openGraph: {
    title: 'Design Your Custom QR Tag | Gridpass',
    description: 'Create and print custom QR decals or window sheets for your vehicle. Link them to your free digital passport for meets, shows, and track days.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Build%20Your%20Tag&desc=Design%20your%20custom%20holographic%20QR%20decal%20or%20windshield%20poster%20and%20link%20your%20rig.',
        width: 1200,
        height: 630,
        alt: 'Design Your Custom QR Tag | Gridpass',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Design Your Custom QR Tag | Gridpass',
    description: 'Create and print custom QR decals or window sheets for your vehicle. Link them to your free digital passport for meets, shows, and track days.',
    images: ['/api/og?title=Build%20Your%20Tag&desc=Design%20your%20custom%20holographic%20QR%20decal%20or%20windshield%20poster%20and%20link%20your%20rig.'],
  }
};

export default function BuildTagPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center font-sans">
        <div className="text-xs uppercase font-mono tracking-widest text-neutral-500 animate-pulse">Loading Tag Studio...</div>
      </div>
    }>
      <BuildTagClient />
    </Suspense>
  );
}
