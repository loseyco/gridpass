import { Metadata } from 'next';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import BusinessProfileClient from './BusinessProfileClient';

async function getBusinessData(id: string) {
  if (!id) return null;
  try {
    const snap = await getDoc(doc(db, 'businesses', id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as any;
    }
  } catch (e) {
    console.error('Error fetching business server data:', e);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const business = await getBusinessData(resolvedParams.id);
  const canonicalUrl = `https://gridpass.app/b/${resolvedParams.id}`;

  if (!business) {
    return {
      title: "Business Profile Not Found | Gridpass",
      description: "This Gridpass business profile page does not exist or has been moved.",
      alternates: { canonical: canonicalUrl },
    };
  }

  const title = `${business.name.toUpperCase()} | Stamp Pass & Passport | Gridpass`;
  const description = `${business.name} on Gridpass. Category: ${(business.type || business.category || 'Automotive Business').replace('_', ' ')}. Check in with universal QR tags, view inventory, and collect stamp passes.`;
  const fallbackOgImage = `https://gridpass.app/api/og?title=${encodeURIComponent(business.name)}&desc=${encodeURIComponent('Business Stamp Pass on Gridpass')}&badge=Business%20Pass`;
  const ogImageUrl = business.logo_url || fallbackOgImage;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Gridpass",
      type: "website",
      images: [{ url: ogImageUrl, alt: business.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const business = await getBusinessData(resolvedParams.id);

  const jsonLd = business ? {
    '@context': 'https://schema.org',
    '@type': 'AutomotiveBusiness',
    '@id': `https://gridpass.app/b/${resolvedParams.id}#business`,
    name: business.name,
    description: `${business.name} Gridpass Business Stamp Pass & QR Passport Hub.`,
    image: business.logo_url || undefined,
    address: business.address ? { '@type': 'PostalAddress', streetAddress: business.address } : undefined,
    email: business.contact_email || undefined,
    url: business.website || `https://gridpass.app/b/${resolvedParams.id}`,
    identifier: business.tag_id || business.id,
    parentOrganization: { '@type': 'Organization', name: 'Gridpass', url: 'https://gridpass.app' }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BusinessProfileClient businessId={resolvedParams.id} initialBusiness={business} />
    </>
  );
}
