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

function isLocale(value: string | null): value is Locale {
  return value !== null && (LOCALES as string[]).includes(value);
}

function fallbackImage(message: string) {
  return new ImageResponse(
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
      {message}
    </div>,
    { ...OG_SIZE },
  );
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
    return fallbackImage('Missing kind or slug');
  }

  if (!isLocale(localeParam)) {
    return fallbackImage('Invalid locale');
  }

  const payload =
    kind === 'organization'
      ? await resolveOrganizationOgPayload(slug, localeParam)
      : kind === 'university'
        ? await resolveUniversityOgPayload(slug, localeParam)
        : null;

  if (!payload) {
    return fallbackImage('Not found');
  }

  const image = await renderOgImage(payload);
  image.headers.set('Content-Type', OG_CONTENT_TYPE);
  image.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  return image;
}
