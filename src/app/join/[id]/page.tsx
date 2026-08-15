import { redirect } from 'next/navigation';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const cleanId = decodeURIComponent(rawId)
    .replace(/^(id=|tag=|tag_|v=|b=)/i, '')
    .trim();

  const title = `Claim Tag #${cleanId} | Gridpass Invitation`;
  const description = `Link physical tag #${cleanId} to your vehicle passport or business profile on Gridpass.`;
  const canonicalUrl = `https://gridpass.app/join?id=${encodeURIComponent(cleanId)}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Gridpass',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function DynamicJoinIdPage({ params }: Props) {
  const { id: rawId } = await params;

  // Extract clean ID from raw path segment (e.g., 'id=720' -> '720', 'tag=720' -> '720', '720' -> '720')
  const cleanId = decodeURIComponent(rawId)
    .replace(/^(id=|tag=|tag_|v=|b=)/i, '')
    .trim();

  // Permanently redirect cleanly to /join?id=720
  redirect(`/join?id=${encodeURIComponent(cleanId)}`);
}
