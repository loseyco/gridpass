import { Metadata } from 'next'
import React from 'react'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const venueTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const url = `https://gridpass.app/secondlife/${slug}`

  const title = `${venueTitle} | Second Life Venue Portal & Traffic Radar | Gridpass`
  const description = `Official Gridpass portal for ${venueTitle} in Second Life. View real-time 256m x 256m avatar density radar heatmaps, sim performance metrics (FPS & Time Dilation), visitor dwell activity roster, and live audio stream.`

  return {
    title,
    description,
    keywords: [
      venueTitle,
      `${venueTitle} Second Life`,
      `${venueTitle} Portal`,
      'Second Life Traffic Radar',
      'Second Life Sim Telemetry',
      'Second Life Club Passport',
      'Gridpass'
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: 'Gridpass | One Tag for Everything',
      images: [
        {
          url: `https://gridpass.app/api/og?title=${encodeURIComponent(venueTitle)}&subtitle=Second%20Life%20Venue%20Portal`,
          width: 1200,
          height: 630,
          alt: `${venueTitle} Gridpass Portal`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`https://gridpass.app/api/og?title=${encodeURIComponent(venueTitle)}&subtitle=Second%20Life%20Venue%20Portal`],
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function VenueSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const venueTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    'name': `${venueTitle} (Second Life Region)`,
    'url': `https://gridpass.app/secondlife/${slug}`,
    'description': `Official Second Life venue and sim portal for ${venueTitle}. Features live avatar density telemetry, audio streaming, and visitor dwell logs.`,
    'address': {
      '@type': 'PostalAddress',
      'addressCountry': 'Second Life Grid',
      'addressLocality': venueTitle,
    },
    'containedInPlace': {
      '@type': 'Place',
      'name': 'Second Life Virtual Grid'
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
