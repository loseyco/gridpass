import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Motorsport Intelligence Wire & Live Paddock News | Gridpass',
  description: 'Continuous breaking race reports, paddock telemetry, trackside attendance check-ins, and driver discussions across 14 motorsport disciplines.',
  openGraph: {
    title: 'Motorsport Intelligence Wire & Live Paddock News | Gridpass',
    description: 'Continuous breaking race reports, paddock telemetry, trackside attendance check-ins, and driver discussions.',
    url: 'https://gridpass.app/news',
    siteName: 'Gridpass News',
    images: [
      {
        url: 'https://gridpass.app/api/og?title=Motorsport%20News%20Wire&desc=Live%20Paddock%20Intelligence%20%26%20Race%20Dispatches&badge=Gridpass%20News',
        width: 1200,
        height: 630,
        alt: 'Gridpass News Wire',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Motorsport Intelligence Wire & Live Paddock News | Gridpass',
    description: 'Continuous breaking race reports, paddock telemetry, trackside attendance check-ins, and driver discussions.',
    images: ['https://gridpass.app/api/og?title=Motorsport%20News%20Wire&desc=Live%20Paddock%20Intelligence%20%26%20Race%20Dispatches&badge=Gridpass%20News'],
  },
};

export default function NewsPortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
