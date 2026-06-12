import VenueMarshalClient from './VenueMarshalClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VenueMarshalPage({ params }: PageProps) {
  const { id } = await params;
  return <VenueMarshalClient venueId={id} />;
}
