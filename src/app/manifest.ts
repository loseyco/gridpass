import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'GridPass: Industry OS',
        short_name: 'GridPass',
        description: 'The Business Operating System for Racing.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#6366f1',
        icons: [
            {
                src: '/logo-square.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/logo-square.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
