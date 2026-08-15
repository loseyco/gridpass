import { Metadata } from 'next';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug || '';
  const decodedSlug = decodeURIComponent(rawSlug).toLowerCase().trim();

  let articleTitle = 'Motorsport Wire Report';
  let articleDesc = 'Breaking race reports, paddock updates, and championship intelligence on Gridpass.';
  let coverUrl = '';
  let category = 'Motorsport';

  try {
    // 1. Query by slug
    const q = query(collection(db, 'news_articles'), where('slug', '==', rawSlug));
    const snap = await getDocs(q);

    let docData: any = null;
    if (!snap.empty) {
      docData = snap.docs[0].data();
    } else {
      // 2. Query direct doc ID
      const directDoc = await getDoc(doc(db, 'news_articles', rawSlug));
      if (directDoc.exists()) {
        docData = directDoc.data();
      }
    }

    if (docData) {
      if (docData.title) articleTitle = docData.title;
      if (docData.summary) articleDesc = docData.summary;
      if (docData.cover_image || docData.cover_image_url || docData.image_url) {
        coverUrl = docData.cover_image || docData.cover_image_url || docData.image_url;
      }
      if (docData.category) {
        category = docData.category.replace(/_/g, ' ').toUpperCase();
      }
    }
  } catch (err) {
    console.warn('Error generating article metadata:', err);
  }

  const cleanTitle = `${articleTitle} | Gridpass News`;
  const cleanDesc = articleDesc.slice(0, 160);
  const pageUrl = `https://gridpass.app/news/${rawSlug}`;

  const ogImageUrl = coverUrl && coverUrl.startsWith('http')
    ? coverUrl
    : `https://gridpass.app/api/og?title=${encodeURIComponent(articleTitle)}&desc=${encodeURIComponent(cleanDesc)}&badge=${encodeURIComponent(`${category} Wire`)}`;

  return {
    title: cleanTitle,
    description: cleanDesc,
    openGraph: {
      title: cleanTitle,
      description: cleanDesc,
      url: pageUrl,
      siteName: 'Gridpass News',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: articleTitle,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description: cleanDesc,
      images: [ogImageUrl],
    },
  };
}

export default function ArticleReaderLayout({ children }: Props) {
  return <>{children}</>;
}
