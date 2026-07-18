import { Metadata } from 'next';
import { SEEDED_VENUES } from '@/lib/data/venues';
import WaterPortalClient from './WaterPortalClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const venue = SEEDED_VENUES.find(v => v.id === id);
  const title = venue 
    ? `${venue.name} | Live Waterway Radar & Safety | Gridpass`
    : 'Live Waterway Radar & Safety | Gridpass';
  const description = venue
    ? `Live navigation safety, user check-ins, water hazards, rules, and telemetry for ${venue.name}. Share your location with friends or view active watercraft.`
    : 'Live waterway radar, active watercraft tracking, navigation hazards, boat launch information, and user check-ins on Gridpass.';
  
  const ogTitle = encodeURIComponent(venue?.name || 'Waterway Radar');
  const ogDesc = encodeURIComponent(venue?.location || 'Gridpass Water Portal');
  const ogImageUrl = `/api/og?title=${ogTitle}&desc=${ogDesc}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl]
    }
  };
}

export default async function WaterPage({ params }: PageProps) {
  const { id } = await params;
  return <WaterPortalClient venueId={id} />;
}
