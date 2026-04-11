import { understandQuery } from '@/lib/query-understanding';
import { loadColorData } from '@/lib/load-color-data';
import { loadUniversities } from '@/lib/load-universities';
import {
  buildSearchResponse,
  SEARCH_RESPONSE_CACHE_TTL_SECONDS,
  type SearchApiSuccessBody,
} from '@/lib/build-search-response';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ALLOWED_LOCALES = new Set(['fi', 'en', 'sv']);
const MAX_QUERY_LENGTH = 200;

const redis = Redis.fromEnv();

function parseClientIp(value: string | null): string | null {
  if (!value) return null;
  const candidate = value.split(',')[0]?.trim();
  if (!candidate) return null;
  const sanitized = candidate.replace(/[^a-zA-Z0-9:.\-]/g, '');
  return sanitized || null;
}

function getClientIdentifier(req: Request): string {
  const headers = req.headers;
  const trustedIp =
    parseClientIp(headers.get('cf-connecting-ip')) ||
    parseClientIp(headers.get('x-real-ip')) ||
    parseClientIp(headers.get('x-vercel-forwarded-for')) ||
    parseClientIp(headers.get('x-forwarded-for'));
  return trustedIp ?? 'anonymous';
}

export async function POST(req: Request) {
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(15, '10 s'),
  });

  const identifier = getClientIdentifier(req);
  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    return NextResponse.json(
      { success: false, error: 'Unable to process at this time' },
      { status: 429 },
    );
  }

  let parsed: { query?: string; locale?: 'fi' | 'en' | 'sv' } = {};

  try {
    parsed = (await req.json()) as typeof parsed;
  } catch {
    // If body is missing or invalid JSON, fall back to empty query.
  }

  const query = (parsed.query ?? '').trim();
  const rawLocale = parsed.locale ?? 'fi';
  const locale = ALLOWED_LOCALES.has(rawLocale) ? rawLocale : 'fi';

  if (!query || query.length < 3) {
    return NextResponse.json({ results: [], totalCount: 0 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ success: false, error: 'Query too long' }, { status: 400 });
  }

  const normalizedQuery = query.toLowerCase().trim();
  const searchCacheKey = `search:${locale}:${normalizedQuery}`;

  try {
    const cached = await redis.get<SearchApiSuccessBody>(searchCacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
  } catch (error) {
    console.error('Search cache read error:', error);
  }

  try {
    const qu = await understandQuery(query, locale);
    const [universities, colorData] = await Promise.all([
      loadUniversities(locale),
      loadColorData(),
    ]);
    const body = buildSearchResponse(query, qu, universities, colorData);

    try {
      await redis.setex(searchCacheKey, SEARCH_RESPONSE_CACHE_TTL_SECONDS, body);
    } catch (error) {
      console.error('Search cache write error:', error);
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
