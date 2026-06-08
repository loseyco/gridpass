import { Metadata } from 'next';
import GuidesIndexClient from './GuidesIndexClient';

export const metadata: Metadata = {
  title: 'Local Action Guides & Handbooks | Gridpass',
  description: 'Your ultimate resource for local boating, off-roading, and trail regulations, launches, and recommended gear. Stay legal and safe on the water or trails.',
  keywords: ['boating guides', 'pwc rules', 'off-road trails', 'vehicle regulations', 'lake registration', 'local boat launches'],
  openGraph: {
    title: 'Local Action Guides & Handbooks | Gridpass',
    description: 'Your ultimate resource for local boating, off-roading, and trail regulations, launches, and recommended gear.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Local%20Action%20Guides&desc=Ultimate%20resource%20for%20boating%2C%20off-roading%2C%20and%20trail%20regulations%20and%20launches.',
        width: 1200,
        height: 630,
        alt: 'Local Action Guides & Handbooks | Gridpass',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Local Action Guides & Handbooks | Gridpass',
    description: 'Your ultimate resource for local boating, off-roading, and trail regulations, launches, and recommended gear.',
    images: ['/api/og?title=Local%20Action%20Guides&desc=Ultimate%20resource%20for%20boating%2C%20off-roading%2C%20and%20trail%20regulations%20and%20launches.'],
  }
};

export default function GuidesPage() {
  return <GuidesIndexClient />;
}
