import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/garage',
        destination: '/collections',
        permanent: false,
      },
      {
        source: '/dashboard/vehicles',
        destination: '/collections',
        permanent: false,
      },
      {
        source: '/dashboard/tools',
        destination: '/collections',
        permanent: false,
      },
      {
        source: '/v2/register',
        destination: '/v2/join',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
