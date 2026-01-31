import { createClient } from '@/utils/supabase/server';
import { Metadata } from 'next';

export async function getDynamicMetadata(path: string, defaultMeta: Metadata): Promise<Metadata> {
    const supabase = await createClient();

    const { data } = await supabase
        .from('page_seo')
        .select('*')
        .eq('path', path)
        .single();

    if (!data) return defaultMeta;

    return {
        ...defaultMeta,
        title: data.title || defaultMeta.title,
        description: data.description || defaultMeta.description,
        keywords: data.keywords || defaultMeta.keywords,
        openGraph: {
            ...defaultMeta.openGraph,
            title: data.title || defaultMeta.openGraph?.title,
            description: data.description || defaultMeta.openGraph?.description,
            images: data.image_url ? [{ url: data.image_url }] : defaultMeta.openGraph?.images,
        },
        twitter: {
            ...defaultMeta.twitter,
            title: data.title || defaultMeta.twitter?.title,
            description: data.description || defaultMeta.twitter?.description,
            images: data.image_url ? [data.image_url] : defaultMeta.twitter?.images,
        }
    };
}
