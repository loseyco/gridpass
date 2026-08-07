import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Second Life Sim & Club Management Engine | Gridpass | One Tag for Everything',
  description: 'Connect your Second Life region, dance club, or virtual venue to Gridpass. Features in-world prim touch SSO authentication, 256m x 256m real-time avatar radar heatmaps, live sim performance metrics (FPS & Time Dilation), visitor dwell activity rosters, and digital avatar passports.',
  keywords: [
    'Second Life',
    'Second Life Sim Management',
    'SL Club Management',
    'Second Life Telemetry',
    'LSL Prim Script',
    'Second Life Radar Heatmap',
    'Skinny Dip Inn',
    'SL Avatar Passport',
    'Gridpass Second Life',
    'Virtual World Telemetry',
    'Firestorm LSL Script'
  ],
  authors: [{ name: 'Gridpass Platform Team' }],
  openGraph: {
    title: 'Second Life Sim & Club Management Engine | Gridpass',
    description: 'Real-time Second Life region telemetry, 256m x 256m avatar density radar heatmaps, in-world prim touch SSO, and staff shift timeclocks for virtual clubs & resorts.',
    url: 'https://gridpass.app/secondlife',
    siteName: 'Gridpass | One Tag for Everything',
    images: [
      {
        url: 'https://gridpass.app/api/og?title=Second%20Life%20Sim%20%26%20Club%20Management&subtitle=One%20Tag%20for%20Everything',
        width: 1200,
        height: 630,
        alt: 'Gridpass Second Life Sim & Club Management SaaS',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Second Life Sim & Club Management Engine | Gridpass',
    description: 'Real-time Second Life region telemetry, 3D avatar density radar heatmaps, and in-world prim SSO for SL clubs & resorts.',
    images: ['https://gridpass.app/api/og?title=Second%20Life%20Sim%20%26%20Club%20Management&subtitle=One%20Tag%20for%20Everything'],
  },
  alternates: {
    canonical: 'https://gridpass.app/secondlife',
  },
}

export default function SecondLifeLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Gridpass Second Life Destination & Telemetry Engine',
    'url': 'https://gridpass.app/secondlife',
    'description': 'Universal Second Life region telemetry, in-world prim SSO, avatar density heatmaps, and club management engine for Second Life residents and venue owners.',
    'applicationCategory': 'EntertainmentApplication',
    'operatingSystem': 'Web, iOS, Android, Second Life Viewer, Firestorm',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
    'provider': {
      '@type': 'Organization',
      'name': 'Gridpass',
      'url': 'https://gridpass.app',
      'logo': 'https://gridpass.app/gridpass_logo.png'
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
