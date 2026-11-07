import { renderOgImage } from '@/lib/og/render-og-image';
import {
  resolveOrganizationOgPayload,
  resolveUniversityOgPayload,
} from '@/lib/og/resolve-og-payload';
import { OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og/types';
import type { Locale } from '@/lib/slug-translations';
import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const revalidate = 86400;

const LOCALES: Locale[] = ['fi', 'en', 'sv'];
const KINDS = new Set(['organization', 'university']);
const MAX_SLUG_LENGTH = 160;
const SUCCESS_CACHE = 'public, s-maxage=86400, stale-while-revalidate=604800';
const FALLBACK_CACHE = 'public, s-maxage=3600, stale-while-revalidate=86400';

type FallbackKey = 'missing' | 'invalid' | 'not-found';

const FALLBACK_MESSAGES: Record<FallbackKey, string> = {
  missing: 'Missing kind or slug',
  invalid: 'Invalid request',
  'not-found': 'Not found',
};

const fallbackCache = new Map<FallbackKey, Promise<ArrayBuffer>>();

function isLocale(value: string | null): value is Locale {
  return value !== null && (LOCALES as string[]).includes(value);
}

function isKind(value: string | null): value is 'organization' | 'university' {
  return value !== null && KINDS.has(value);
}

function withHeaders(image: ImageResponse, cacheControl: string, status = 200) {
  const headers = new Headers(image.headers);
  headers.set('Content-Type', OG_CONTENT_TYPE);
  headers.set('Cache-Control', cacheControl);
  return new Response(image.body, { status, headers });
}

async function fallbackResponse(key: FallbackKey, status: number) {
  let bufferPromise = fallbackCache.get(key);
  if (!bufferPromise) {
    bufferPromise = new ImageResponse(
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFEF6',
          color: '#1A1814',
          fontSize: 48,
          fontWeight: 700,
          padding: 48,
          textAlign: 'center',
        }}
      >
        {FALLBACK_MESSAGES[key]}
      </div>,
      { ...OG_SIZE },
    )
      .arrayBuffer()
      .then((buffer) => buffer);
    fallbackCache.set(key, bufferPromise);
  }

  const body = await bufferPromise;
  return new Response(body, {
    status,
    headers: {
      'Content-Type': OG_CONTENT_TYPE,
      'Cache-Control': FALLBACK_CACHE,
    },
  });
}

/**
 * Manual / automated preview endpoint for dynamic OG cards.
 * Examples:
 *   /api/og?kind=organization&slug=lok-ry&locale=fi
 *   /api/og?kind=university&slug=hameen-amk&locale=fi
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get('kind');
  const slug = searchParams.get('slug');
  const localeParam = searchParams.get('locale') ?? 'fi';

  if (!slug || !kind) {
    return fallbackResponse('missing', 400);
  }

  if (!isKind(kind) || !isLocale(localeParam) || slug.length > MAX_SLUG_LENGTH) {
    return fallbackResponse('invalid', 400);
  }

  const payload =
    kind === 'organization'
      ? await resolveOrganizationOgPayload(slug, localeParam)
      : await resolveUniversityOgPayload(slug, localeParam);

  if (!payload) {
    return fallbackResponse('not-found', 404);
  }

  const image = await renderOgImage(payload);
  return withHeaders(image, SUCCESS_CACHE);
}
