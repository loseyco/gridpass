import { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import JoinClient from './JoinClient';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const tagId = (typeof params.tag === 'string' ? params.tag : undefined) ||
                (typeof params.id === 'string' ? params.id : undefined) ||
                (typeof params.b === 'string' ? params.b : undefined) ||
                (typeof params.v === 'string' ? params.v : undefined);

  let title = 'Claim Your Tag & Passport | Gridpass';
  let description = 'Scan or click to claim your physical QR decal and link it to your official Gridpass passport.';
  let imageUrl = '/api/og?title=Claim%20Your%20Tag&desc=Link%20your%20physical%20holographic%20decal%20to%20your%20digital%20vehicle%20garage%20profile.';

  if (tagId) {
    try {
      const strippedId = tagId.replace(/^0+/, '');
      // 1. Check physical_tags/tag_[tagId] and tag_[strippedId]
      let tagSnap = await getDoc(doc(db, 'physical_tags', `tag_${tagId}`)).catch(() => null);
      if (!tagSnap || !tagSnap.exists()) {
        tagSnap = await getDoc(doc(db, 'physical_tags', `tag_${strippedId}`)).catch(() => null);
      }
      if (!tagSnap || !tagSnap.exists()) {
        tagSnap = await getDoc(doc(db, 'physical_tags', tagId)).catch(() => null);
      }
      if (!tagSnap || !tagSnap.exists()) {
        tagSnap = await getDoc(doc(db, 'physical_tags', strippedId)).catch(() => null);
      }

      if (tagSnap && tagSnap.exists()) {
        const tData = tagSnap.data();
        if (tData.custom_spotted_title || tData.title) {
          title = `${tData.custom_spotted_title || tData.title.replace('🏢 ', '')} | Gridpass Invitation`;
        }
        if (tData.custom_spotted_note) {
          description = `"${tData.custom_spotted_note}"`;
        }
        if (tData.custom_spotted_photo_url) {
          imageUrl = tData.custom_spotted_photo_url;
        }
      }

      // 2. Check businesses/[tagId]
      const bizSnap = await getDoc(doc(db, 'businesses', tagId)).catch(() => null);
      if (bizSnap && bizSnap.exists()) {
        const bData = bizSnap.data();
        if (bData.name) {
          title = `${bData.name} | Gridpass Business Passport`;
        }
        if (bData.description || bData.location_name) {
          description = bData.description || `Official business partner passport for ${bData.name} in ${bData.location_name || 'Gridpass Network'}.`;
        }
        if (bData.photo_url || bData.logo_url) {
          imageUrl = bData.photo_url || bData.logo_url;
        }
      }
    } catch (e) {
      console.error('Dynamic metadata generation error:', e);
    }
  }

  // Base64 data URIs (data:image/...) are rejected by Facebook/Twitter scrapers for og:image.
  // Fall back to dynamic OG card generator (/api/og) if image is a base64 string or missing.
  if (!imageUrl || imageUrl.startsWith('data:')) {
    imageUrl = `/api/og?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}`;
  }

  // Ensure absolute URL for social scrapers (Facebook, Twitter, iMessage)
  const absoluteImageUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `https://gridpass.app${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

  const canonicalUrl = `https://gridpass.app/join${tagId ? `?tag=${tagId}` : ''}`;

  return {
    title,
    description,
    keywords: ['scan qr code', 'claim tag', 'vehicle registration', 'gridpass tag', 'business passport', 'motorsports gate pass'],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Gridpass',
      type: 'website',
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteImageUrl],
    }
  };
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    }>
      <JoinClient />
    </Suspense>
  );
}
