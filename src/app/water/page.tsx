import { Metadata } from 'next';
import WaterPortalClient from './WaterPortalClient';

export const metadata: Metadata = {
  title: 'Live Waterway Radar & Safety | Gridpass',
  description: 'Live navigation safety, user check-ins, water hazards, rules, and telemetry. Share your location with friends or view active watercraft on the Gridpass Waterway Portal.',
  keywords: ['gridpass', 'waterway radar', 'boat launch', 'lake safety', 'personal watercraft', 'pwc tracking', 'marine hazards'],
  openGraph: {
    title: 'Live Waterway Radar & Safety | Gridpass',
    description: 'Live navigation safety, user check-ins, water hazards, rules, and telemetry. Share your location with friends or view active watercraft on the Gridpass Waterway Portal.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Waterway%20Radar%20%26%20Safety&desc=Live%20navigation%20hazards%2C%20check-ins%2C%20rules%2C%2520and%2520active%252520watercraft%2520tracking.',
        width: 1200,
        height: 630,
        alt: 'Live Waterway Radar & Safety | Gridpass',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Waterway Radar & Safety | Gridpass',
    description: 'Live navigation safety, user check-ins, water hazards, rules, and telemetry. Share your location with friends or view active watercraft on the Gridpass Waterway Portal.',
    images: ['/api/og?title=Waterway%20Radar%20%26%20Safety&desc=Live%20navigation%20hazards%2C%20check-ins%2C%20rules%2C%2520and%2520active%252520watercraft%2520tracking.'],
  }
};

export default function WaterRootPage() {
  return <WaterPortalClient />;
}
