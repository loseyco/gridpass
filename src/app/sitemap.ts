import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gridpass.app';

    // Static Routes
    const routes = [
        '',
        '/login',
        '/register',
        '/founder',
        '/features',
        '/changelog',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic Routes: Classifieds
    const supabase = await createClient();
    const { data: classifieds } = await supabase
        .from('classifieds')
        .select('id, updated_at')
        .eq('status', 'active');

    const classifiedRoutes = (classifieds || []).map((item) => ({
        url: `${baseUrl}/classifieds/${item.id}`,
        lastModified: new Date(item.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }));

    // Dynamic Routes: Jobs
    // const { data: jobs } = await supabase.from('jobs').select('id, updated_at').eq('status', 'open');
    // const jobRoutes = ...

    return [...routes, ...classifiedRoutes];
}
