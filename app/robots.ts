import { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const disallow = ['/protected/', '/auth/', '/api/'];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      { userAgent: 'Googlebot', allow: '/', disallow },
      { userAgent: 'GPTBot', allow: '/', disallow },
      { userAgent: 'ChatGPT-User', allow: '/', disallow },
      { userAgent: 'CCBot', allow: '/', disallow },
      { userAgent: 'anthropic-ai', allow: '/', disallow },
      { userAgent: 'Claude-Web', allow: '/', disallow },
      { userAgent: 'ClaudeBot', allow: '/', disallow },
      { userAgent: 'PerplexityBot', allow: '/', disallow },
      { userAgent: 'Applebot-Extended', allow: '/', disallow },
    ],
    sitemap: [`${SITE_ORIGIN}/sitemap.xml`],
    host: SITE_ORIGIN,
  };
}
