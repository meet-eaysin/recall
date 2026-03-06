import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['http://localhost:3000'],
  turbo: {
    resolveAlias: {
      '@tailwindcss/typography': require.resolve('@tailwindcss/typography'),
      'tailwindcss-radix': require.resolve('tailwindcss-radix'),
      'tailwind-scrollbar': require.resolve('tailwind-scrollbar'),
    },
  },
};

export default nextConfig;
