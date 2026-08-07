import { Metadata } from 'next';
import JoinClient from './JoinClient';

export const metadata: Metadata = {
  title: 'Claim Your QR Decal | Gridpass',
  description: "Scan or enter your tag code to claim your vehicle's physical QR decal and link it to your digital passport.",
  keywords: ['scan qr code', 'claim tag', 'vehicle registration', 'gridpass tag', 'motorsports gate pass', 'waiver check-in'],
  openGraph: {
    title: 'Claim Your QR Decal | Gridpass',
    description: "Scan or enter your tag code to claim your vehicle's physical QR decal and link it to your digital passport.",
    type: 'website',
    images: [
      {
        url: '/api/og?title=Claim%20Your%20Tag&desc=Link%20your%20physical%20holographic%20decal%20to%20your%20digital%20vehicle%20garage%20profile.',
        width: 1200,
        height: 630,
        alt: 'Claim Your QR Decal | Gridpass',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claim Your QR Decal | Gridpass',
    description: "Scan or enter your tag code to claim your vehicle's physical QR decal and link it to your digital passport.",
    images: ['/api/og?title=Claim%20Your%20Tag&desc=Link%20your%20physical%20holographic%20decal%20to%20your%20digital%20vehicle%20garage%20profile.'],
  }
};

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    }>
      <JoinClient />
    </Suspense>
  );
}
