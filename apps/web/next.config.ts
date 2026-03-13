import type { NextConfig } from 'next';
import { createRequire } from 'module';
import { env } from './lib/env';

const require = createRequire(import.meta.url);

const nextConfig: NextConfig = {
  allowedDevOrigins: ['http://localhost:3000'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.efferd.com',
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      '@tailwindcss/typography': require.resolve('@tailwindcss/typography'),
      'tailwindcss-radix': require.resolve('tailwindcss-radix'),
      'tailwind-scrollbar': require.resolve('tailwind-scrollbar'),
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${env.apiRewriteDestination}/:path*`,
      },
    ];
  },
};

export default nextConfig;
