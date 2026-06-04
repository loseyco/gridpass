import React from 'react';

// Define static metadata for optimal SEO & social sharing
export const metadata = {
  title: 'PJ Losey | GridPass Enthusiast Profile',
  description: 'Motorsports Telemetry Engineer, ECU Calibrator & Automotive Operations Specialist. View verified digital garage profiles and vehicle passports for PJ Losey.',
  openGraph: {
    title: 'PJ Losey | GridPass Enthusiast Profile',
    description: 'Enthusiast garage and digital vehicle passport registry for PJ Losey.',
    type: 'profile',
    url: 'https://gridpass.app/u/pjlosey',
    siteName: 'GridPass',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PJ Losey | GridPass Enthusiast Profile',
    description: 'Enthusiast garage and digital vehicle passport registry for PJ Losey.',
  }
};

export default function PjLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
