import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paddock Directory & Motorsport Hubs | Gridpass',
  description: 'Explore the complete directory of racing series, driver rosters, teams, tracks, and venues across NASCAR, IndyCar, IMSA, AMA Supercross, Flat Track, SCCA, and ROAR RC Racing.',
  openGraph: {
    title: 'Paddock Directory & Motorsport Hubs | Gridpass',
    description: 'Explore the complete directory of racing series, driver rosters, teams, tracks, and venues on Gridpass.',
    url: 'https://gridpass.app/news/directory',
    siteName: 'Gridpass',
    images: [
      {
        url: 'https://gridpass.app/api/og?title=Paddock%20Directory&desc=Complete%20Motorsport%20Registry%20%26%20Roster%20Hubs&badge=Motorsport%20Directory',
        width: 1200,
        height: 630,
        alt: 'Paddock Directory',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paddock Directory & Motorsport Hubs | Gridpass',
    description: 'Explore the complete directory of racing series, driver rosters, teams, tracks, and venues on Gridpass.',
    images: ['https://gridpass.app/api/og?title=Paddock%20Directory&desc=Complete%20Motorsport%20Registry%20%26%20Roster%20Hubs&badge=Motorsport%20Directory'],
  },
};

export default function PaddockDirectoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
