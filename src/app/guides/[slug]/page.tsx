import { Metadata } from 'next';
import { Suspense } from 'react';
import fs from 'fs';
import path from 'path';
import { GUIDES } from '@/lib/data/guides';
import GuideArticleClient from './GuideArticleClient';

type Props = {
  params: Promise<{ slug: string }>;
};

// Helper to resolve the correct sharing image url
function getSharingImage(slug: string, title: string, description: string): string {
  const imageRelativePath = `/guides/${slug}.png`;
  const imageAbsolutePath = path.join(process.cwd(), 'public', 'guides', `${slug}.png`);
  
  if (fs.existsSync(imageAbsolutePath)) {
    return imageRelativePath;
  }
  
  // Dynamic OG image generation fallback
  const cleanTitle = title.split(':')[0];
  return `/api/og?title=${encodeURIComponent(cleanTitle)}&desc=${encodeURIComponent(description)}`;
}

// Dynamically generate SEO metadata for each guide
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  
  if (!guide) {
    return {
      title: 'Guide Not Found | Gridpass',
      description: 'The requested local action guide could not be found.',
    };
  }

  const imageUrl = getSharingImage(slug, guide.title, guide.description);

  return {
    title: `${guide.title.split(':')[0]} | Gridpass Guides`,
    description: guide.description,
    keywords: [...guide.tags, 'gridpass', 'local guide', 'rules', guide.category],
    openGraph: {
      title: `${guide.title.split(':')[0]} | Gridpass Guides`,
      description: guide.description,
      type: 'article',
      url: `https://gridpass.app/guides/${guide.slug}`,
      publishedTime: new Date(guide.publishDate.split(' (')[0]).toISOString(),
      authors: guide.contributors,
      tags: guide.tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: guide.title,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${guide.title.split(':')[0]} | Gridpass Guides`,
      description: guide.description,
      images: [imageUrl],
    }
  };
}

// Statically generate parameters for Next.js build-time pre-rendering
export async function generateStaticParams() {
  return GUIDES.map((guide) => ({
    slug: guide.slug,
  }));
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);

  if (!guide) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#060608] text-neutral-500 flex items-center justify-center font-mono">Loading...</div>}>
        <GuideArticleClient slug={slug} />
      </Suspense>
    );
  }

  const sharingImage = getSharingImage(slug, guide.title, guide.description);
  const absoluteImageUrl = sharingImage.startsWith('http') 
    ? sharingImage 
    : `https://gridpass.app${sharingImage}`;

  // Define JSON-LD tech/rules article schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'headline': guide.title,
    'description': guide.description,
    'datePublished': new Date(guide.publishDate.split(' (')[0]).toISOString(),
    'inLanguage': 'en-US',
    'image': absoluteImageUrl,
    'author': guide.contributors 
      ? guide.contributors.map(name => ({ '@type': 'Person', 'name': name }))
      : [{ '@type': 'Person', 'name': 'Gridpass Team' }],
    'publisher': {
      '@type': 'Organization',
      'name': 'Gridpass',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://gridpass.app/favicon.ico'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://gridpass.app/guides/${guide.slug}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={
        <main className="min-h-screen bg-[#060608] text-[#f4f4f7] flex flex-col justify-between items-center py-24 font-mono text-xs">
          <div className="animate-pulse">Loading Guide Handbook...</div>
        </main>
      }>
        <GuideArticleClient slug={slug} />
      </Suspense>
    </>
  );
}
