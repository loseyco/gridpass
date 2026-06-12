import WaterPortalClient from './WaterPortalClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WaterPage({ params }: PageProps) {
  const { id } = await params;
  return <WaterPortalClient venueId={id} />;
}
