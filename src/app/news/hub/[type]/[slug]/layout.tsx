import { Metadata } from 'next';
import { CURATED_PADDOCK_ENTITIES } from '@/lib/types/news';

interface Props {
  params: Promise<{ type: string; slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ type: string; slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const rawType = resolvedParams?.type || 'series';
  const rawSlug = resolvedParams?.slug || '';
  const slug = decodeURIComponent(rawSlug).toLowerCase().trim();

  // Find curated entity or generate clean title
  const curated = CURATED_PADDOCK_ENTITIES.find(
    (e) => e.slug.toLowerCase() === slug || e.name.toLowerCase() === slug.replace(/-/g, ' ')
  );

  const formattedName = curated?.name || slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const typeLabel = rawType.charAt(0).toUpperCase() + rawType.slice(1);

  const title = `${formattedName} (${typeLabel}) | Gridpass Motorsport Hub`;
  const description = curated?.bio || `Live racing intelligence wire, driver rosters, telemetry logs, and verified trackside attendance for ${formattedName} on Gridpass.`;
  const pageUrl = `https://gridpass.app/news/hub/${rawType}/${rawSlug}`;

  // Use dynamic OG image endpoint
  const ogImageUrl = `https://gridpass.app/api/og?title=${encodeURIComponent(formattedName)}&desc=${encodeURIComponent(description.slice(0, 140))}&badge=${encodeURIComponent(`Official ${typeLabel} Hub`)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Gridpass',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: formattedName,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function PaddockHubLayout({ children }: Props) {
  return <>{children}</>;
}
