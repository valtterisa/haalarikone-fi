import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    unoptimized: process.env.DEPLOYMENT_PLACE === 'cloudflare' ? true : false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react', 'framer-motion'],
  },
};

export default withNextIntl(nextConfig);

if (process.env.DEPLOYMENT_PLACE === 'cloudflare') {
  import('@opennextjs/cloudflare').then((m) => m.initOpenNextCloudflareForDev());
}
