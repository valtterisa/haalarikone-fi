import { MetadataRoute } from 'next';

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
    sitemap: ['https://haalarikone.fi/sitemap.xml'],
    host: 'https://haalarikone.fi',
  };
}
