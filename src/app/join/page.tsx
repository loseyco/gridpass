import { Metadata } from 'next';
import JoinClient from './JoinClient';

export const metadata: Metadata = {
  title: 'Scan & Claim QR Tag | Gridpass',
  description: 'Scan or claim a physical holographic windshield sticker to link it to your dynamic digital vehicle garage profile. Register track gate passes and safety waivers.',
  keywords: ['scan qr code', 'claim tag', 'vehicle registration', 'gridpass tag', 'motorsports gate pass', 'waiver check-in'],
  openGraph: {
    title: 'Scan & Claim QR Tag | Gridpass',
    description: 'Scan or claim a physical holographic windshield sticker to link it to your dynamic digital vehicle garage profile.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Claim%20Your%2520Tag&desc=Link%20your%20physical%20holographic%20decal%20to%20your%20digital%20vehicle%20garage%20profile.',
        width: 1200,
        height: 630,
        alt: 'Scan & Claim QR Tag | Gridpass',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scan & Claim QR Tag | Gridpass',
    description: 'Scan or claim a physical holographic windshield sticker to link it to your dynamic digital vehicle garage profile.',
    images: ['/api/og?title=Claim%20Your%2520Tag&desc=Link%20your%20physical%20holographic%20decal%20to%20your%20digital%20vehicle%20garage%20profile.'],
  }
};

export default function JoinPage() {
  return <JoinClient />;
}
