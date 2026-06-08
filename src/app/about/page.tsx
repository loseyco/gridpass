import { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About Us | Gridpass',
  description: 'Discover the story behind Gridpass. Built with professional racing precision to streamline vehicle logs, track entry, and service history.',
  keywords: ['gridpass', 'motorsports', 'indycar', 'telemetry', 'harness design', 'patrick losey', 'service operations'],
  openGraph: {
    title: 'About Us | Gridpass',
    description: 'Discover the story behind Gridpass. Built with professional racing precision to streamline vehicle logs, track entry, and service history.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=About%20Gridpass&desc=Forged%20in%20professional%20racing%2C%20IndyCar%20telemetry%2C%20and%20custom%20service%20bay%20operations.',
        width: 1200,
        height: 630,
        alt: 'About Us | Gridpass',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | Gridpass',
    description: 'Discover the story behind Gridpass. Built with professional racing precision to streamline vehicle logs, track entry, and service history.',
    images: ['/api/og?title=About%20Gridpass&desc=Forged%20in%20professional%20racing%2C%20IndyCar%20telemetry%2C%20and%20custom%20service%20bay%20operations.'],
  }
};

export default function AboutPage() {
  return <AboutClient />;
}
