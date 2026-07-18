import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/tests/**',
          '**/test-results/**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
