import { Metadata } from 'next';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const eventId = resolvedParams.id;

  let eventTitle = '26TH ANNUAL MONMOUTH CRUISE NIGHT (MAPLE CITY STREET MACHINES)';
  let eventDesc = "Over 30,000 spectators and 3,500 cars fill the streets for Monmouth's legendary Cruise Night! Showcases classics, hot rods, muscle cars, off-road trucks, and imports.";
  let coverUrl = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1600';
  let locationName = 'Monmouth Public Square, Monmouth, IL';

  try {
    const snap = await getDoc(doc(db, 'events', eventId));
    if (snap.exists()) {
      const data = snap.data();
      if (data.title || data.name) eventTitle = data.title || data.name;
      if (data.description) eventDesc = data.description;
      if (data.cover_url || data.banner_url || data.photo_url) {
        coverUrl = data.cover_url || data.banner_url || data.photo_url;
      }
      if (data.location_name || data.physical_address) {
        locationName = data.location_name || data.physical_address;
      }
    }
  } catch (e) {
    console.error('Error loading event metadata for layout:', e);
  }

  const cleanTitle = `${eventTitle} | Gridpass`;
  const cleanDesc = `${eventDesc.substring(0, 160)}... 📍 ${locationName}`;

  return {
    title: cleanTitle,
    description: cleanDesc,
    openGraph: {
      title: cleanTitle,
      description: cleanDesc,
      url: `https://gridpass.app/events/${eventId}`,
      siteName: 'Gridpass',
      images: [
        {
          url: coverUrl,
          width: 1200,
          height: 630,
          alt: eventTitle,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description: cleanDesc,
      images: [coverUrl],
    },
  };
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
