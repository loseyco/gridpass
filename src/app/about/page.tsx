import { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About Gridpass | The Motorsports OS',
  description: 'Learn about the pedigree behind Gridpass. Forged in professional racing, IndyCar telemetry, and custom MECP service bay operations.',
  keywords: ['gridpass', 'motorsports', 'indycar', 'telemetry', 'harness design', 'patrick losey', 'service operations'],
  openGraph: {
    title: 'About Gridpass | The Motorsports OS',
    description: 'Learn about the pedigree behind Gridpass. Forged in professional racing, IndyCar telemetry, and custom MECP service bay operations.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=About%20Gridpass&desc=Forged%20in%20professional%20racing%2C%20IndyCar%20telemetry%2C%20and%20custom%20service%20bay%20operations.',
        width: 1200,
        height: 630,
        alt: 'About Gridpass | The Motorsports OS',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Gridpass | The Motorsports OS',
    description: 'Learn about the pedigree behind Gridpass. Forged in professional racing, IndyCar telemetry, and custom MECP service bay operations.',
    images: ['/api/og?title=About%20Gridpass&desc=Forged%20in%20professional%20racing%2C%20IndyCar%20telemetry%2C%20and%20custom%20service%20bay%20operations.'],
  }
};

export default function AboutPage() {
  return <AboutClient />;
}
