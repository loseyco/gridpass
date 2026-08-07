import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dash/', '/api/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Bingbot'],
        allow: '/',
        disallow: ['/admin/', '/dash/'],
      },
    ],
    sitemap: 'https://gridpass.app/sitemap.xml',
  };
}
