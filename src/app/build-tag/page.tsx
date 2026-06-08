import { Metadata } from 'next';
import { Suspense } from 'react';
import BuildTagClient from './BuildTagClient';

export const metadata: Metadata = {
  title: 'Build Your Custom QR Tag | Gridpass',
  description: 'Design your custom holographic QR decal, keytag, or windshield poster. Link it to your digital garage passport and manage specs, mods, safety waivers, and gate scans.',
  keywords: ['create qr code tag', 'custom decal builder', 'vehicle passport setup', 'indycar telemetry', 'avery templates', 'print at home stickers'],
  openGraph: {
    title: 'Build Your Custom QR Tag | Gridpass',
    description: 'Design your custom holographic QR decal, keytag, or windshield poster. Link it to your digital garage passport.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Build%20Your%2520Tag&desc=Design%20your%20custom%20holographic%20QR%20decal%20or%20windshield%20poster%20and%20link%20your%20rig.',
        width: 1200,
        height: 630,
        alt: 'Build Your Custom QR Tag | Gridpass',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Build Your Custom QR Tag | Gridpass',
    description: 'Design your custom holographic QR decal, keytag, or windshield poster. Link it to your digital garage passport.',
    images: ['/api/og?title=Build%20Your%2520Tag&desc=Design%20your%20custom%20holographic%20QR%20decal%20or%20windshield%20poster%20and%20link%20your%20rig.'],
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
