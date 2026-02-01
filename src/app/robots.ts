import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gridpass.app';

    return {
        rules: {
            userAgent: '*',
            allow: [
                '/',
                '/founder',
                '/features',
                '/classifieds/*',
                '/jobs/*'
            ],
            disallow: [
                '/admin',
                '/dashboard/settings',
                '/shop/payroll',
                '/api/*',
                '/private/*'
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
