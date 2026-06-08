import { Metadata } from 'next';
import FeaturesClient from './FeaturesClient';

export const metadata: Metadata = {
  title: 'Platform Features & Modules | Gridpass',
  description: 'Explore the Gridpass Motorsports OS modules: physical holographic QR decals, digital garages, automated check-in systems, Stripe connected payouts, and autonomous telemetry managers.',
  keywords: ['vehicle tracking', 'digital garage spec sheet', 'gate scanner', 'stripe payments', 'saas telemetry', 'automated check-in', 'qr code tag'],
  openGraph: {
    title: 'Platform Features & Modules | Gridpass',
    description: 'Explore the Gridpass Motorsports OS modules: physical holographic QR decals, digital garages, automated check-in systems, and Stripe connected payouts.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Gridpass%20Features&desc=Holographic%20QR%20decals%2C%20digital%2520garages%2C%20automated%20check-ins%2C%20and%20Stripe%20payouts.',
        width: 1200,
        height: 630,
        alt: 'Platform Features & Modules | Gridpass',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Platform Features & Modules | Gridpass',
    description: 'Explore the Gridpass Motorsports OS modules: physical holographic QR decals, digital garages, automated check-in systems, and Stripe connected payouts.',
    images: ['/api/og?title=Gridpass%20Features&desc=Holographic%20QR%20decals%2C%20digital%2520garages%2C%20automated%20check-ins%2C%20and%20Stripe%20payouts.'],
  }
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}
