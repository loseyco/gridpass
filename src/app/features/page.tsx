import { Metadata } from 'next';
import FeaturesClient from './FeaturesClient';

export const metadata: Metadata = {
  title: 'Features & Modules | Gridpass',
  description: 'Explore Gridpass features: smart QR window decals, digital vehicle passports, instant track check-ins, and automated service history logging.',
  keywords: ['vehicle tracking', 'digital garage spec sheet', 'gate scanner', 'stripe payments', 'saas telemetry', 'automated check-in', 'qr code tag'],
  openGraph: {
    title: 'Features & Modules | Gridpass',
    description: 'Explore Gridpass features: smart QR window decals, digital vehicle passports, instant track check-ins, and automated service history logging.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Gridpass%20Features&desc=Holographic%20QR%20decals%2C%20digital%20garages%2C%20automated%20check-ins%2C%20and%20Stripe%20payouts.',
        width: 1200,
        height: 630,
        alt: 'Features & Modules | Gridpass',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Features & Modules | Gridpass',
    description: 'Explore Gridpass features: smart QR window decals, digital vehicle passports, instant track check-ins, and automated service history logging.',
    images: ['/api/og?title=Gridpass%20Features&desc=Holographic%20QR%20decals%2C%20digital%20garages%2C%20automated%20check-ins%2C%20and%20Stripe%20payouts.'],
  }
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}
