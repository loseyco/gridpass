import { Metadata } from 'next';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { DriverProfileClient } from './DriverProfileClient';

interface DriverProfile {
  uid: string;
  email: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  is_supporter?: boolean;
  socials?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
  };
  tagId?: string;
  badges?: string[];
  home_town?: string;
  birth_town?: string;
  birthday?: string;
  social_facebook?: string;
  social_twitter?: string;
}

async function getProfileData(userId: string): Promise<DriverProfile | null> {
  if (!userId) return null;
  
  try {
    // 1. Search by custom username slug first (preferred canonical representation)
    const qUsername = query(collection(db, 'users'), where('username', '==', userId.toLowerCase()));
    const snapUsername = await getDocs(qUsername);
    if (!snapUsername.empty) {
      const docSnap = snapUsername.docs[0];
      const uData = docSnap.data();
      return {
        uid: docSnap.id,
        email: uData.email || '',
        display_name: uData.display_name || uData.name || 'Anonymous Member',
        bio: uData.bio || '',
        avatar_url: uData.avatar_url || '',
        is_supporter: uData.is_supporter === true,
        home_town: uData.home_town || '',
        birth_town: uData.birth_town || '',
        birthday: uData.birthday || '',
        social_facebook: uData.social_facebook || '',
        social_twitter: uData.social_twitter || '',
        socials: {
          instagram: uData.social_instagram || uData.socials?.instagram || '',
          youtube: uData.social_youtube || uData.socials?.youtube || '',
          tiktok: uData.social_tiktok || uData.socials?.tiktok || '',
          facebook: uData.social_facebook || uData.socials?.facebook || '',
          twitter: uData.social_twitter || uData.socials?.twitter || ''
        }
      };
    }

    // 2. Fallback: Search by direct UID
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      const uData = docSnap.data();
      return {
        uid: docSnap.id,
        email: uData.email || '',
        display_name: uData.display_name || uData.name || 'Anonymous Member',
        bio: uData.bio || '',
        avatar_url: uData.avatar_url || '',
        is_supporter: uData.is_supporter === true,
        home_town: uData.home_town || '',
        birth_town: uData.birth_town || '',
        birthday: uData.birthday || '',
        social_facebook: uData.social_facebook || '',
        social_twitter: uData.social_twitter || '',
        socials: {
          instagram: uData.social_instagram || uData.socials?.instagram || '',
          youtube: uData.social_youtube || uData.socials?.youtube || '',
          tiktok: uData.social_tiktok || uData.socials?.tiktok || '',
          facebook: uData.social_facebook || uData.socials?.facebook || '',
          twitter: uData.social_twitter || uData.socials?.twitter || ''
        }
      };
    }

    // 3. Fallback: Search by display name slug
    const qDisplayName = query(collection(db, 'users'), where('display_name', '==', userId.toUpperCase()));
    const snapDisplayName = await getDocs(qDisplayName);
    if (!snapDisplayName.empty) {
      const docSnap = snapDisplayName.docs[0];
      const uData = docSnap.data();
      return {
        uid: docSnap.id,
        email: uData.email || '',
        display_name: uData.display_name || uData.name || 'Anonymous Member',
        bio: uData.bio || '',
        avatar_url: uData.avatar_url || '',
        is_supporter: uData.is_supporter === true,
        home_town: uData.home_town || '',
        birth_town: uData.birth_town || '',
        birthday: uData.birthday || '',
        social_facebook: uData.social_facebook || '',
        social_twitter: uData.social_twitter || '',
        socials: {
          instagram: uData.social_instagram || uData.socials?.instagram || '',
          youtube: uData.social_youtube || uData.socials?.youtube || '',
          tiktok: uData.social_tiktok || uData.socials?.tiktok || '',
          facebook: uData.social_facebook || uData.socials?.facebook || '',
          twitter: uData.social_twitter || uData.socials?.twitter || ''
        }
      };
    }

  } catch (err) {
    console.error("Error retrieving server-side profile data:", err);
  }

  return null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const profile = await getProfileData(resolvedParams.id);
  
  if (!profile) {
    return {
      title: "Member Profile Not Found | Gridpass",
      description: "This Gridpass member profile does not exist or has been moved."
    };
  }

  const title = `${profile.display_name.toUpperCase()} | Member Profile | Gridpass`;
  const description = profile.bio 
    ? `${profile.display_name}'s official Member Profile on Gridpass: "${profile.bio}"`
    : `Check out ${profile.display_name}'s official Gridpass Member Profile. Connected vehicle, social links, and profile details.`;

  const ogImages = profile.avatar_url ? [{ url: profile.avatar_url }] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://gridpass.app/u/${resolvedParams.id}`,
      siteName: "Gridpass",
      type: "profile",
      images: ogImages
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : []
    }
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const profile = await getProfileData(resolvedParams.id);

  const jsonLd = profile ? {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profile.display_name,
      description: profile.bio || undefined,
      image: profile.avatar_url || undefined,
      homeLocation: profile.home_town ? { '@type': 'Place', name: profile.home_town } : undefined,
      sameAs: [
        profile.socials?.instagram ? `https://instagram.com/${profile.socials.instagram}` : null,
        profile.socials?.youtube ? `https://youtube.com/@${profile.socials.youtube}` : null,
        profile.socials?.tiktok ? `https://tiktok.com/@${profile.socials.tiktok}` : null,
        profile.socials?.facebook ? (profile.socials.facebook.startsWith('http') ? profile.socials.facebook : `https://facebook.com/${profile.socials.facebook}`) : null,
        profile.socials?.twitter ? `https://twitter.com/${profile.socials.twitter}` : null,
      ].filter(Boolean)
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <DriverProfileClient initialProfile={profile} userId={resolvedParams.id} />
    </>
  );
}

