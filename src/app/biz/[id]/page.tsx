import { redirect } from 'next/navigation';

export default async function BizRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  redirect(`/b/${resolvedParams.id}`);
}
