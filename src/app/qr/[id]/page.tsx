import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QRRedirectPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  redirect(`/join?id=${encodeURIComponent(id)}`);
}
