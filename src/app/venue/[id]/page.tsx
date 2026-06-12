import VenuePortalClient from './VenuePortalClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VenuePage({ params }: PageProps) {
  const { id } = await params;
  return <VenuePortalClient venueId={id} />;
}
