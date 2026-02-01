import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
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

    // TODO: Fetch dynamic routes for Classifieds & Jobs
    // const { data: classifieds } = await supabase.from('classifieds').select('id');
    // const classifiedRoutes = ...

    return [...routes];
}
