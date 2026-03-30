import { understandQuery } from '@/lib/query-understanding';
import { filterUniversities } from '@/lib/deterministic-filter';
import { semanticSearch } from '@/lib/semantic-search';
import { loadColorData } from '@/lib/load-color-data';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { University } from '@/types/university';

export async function POST(req: Request) {
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(15, '10 s'),
  });

  const identifier =
    req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
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

  const query = parsed.query?.trim() ?? '';
  const locale = parsed.locale ?? 'fi';

  if (!query || query.trim().length < 3) {
    return NextResponse.json({ results: [], totalCount: 0 });
  }

  try {
    const qu = await understandQuery(query.trim(), locale);

    if (qu.isGibberish) {
      return NextResponse.json({
        results: [],
        totalCount: 0,
        filters: qu.filters,
        semanticQuery: qu.semanticQuery,
      });
    }

    const filteredResults = await filterUniversities(qu, locale);
    const exactCount = filteredResults.length;

    let candidates: University[] = filteredResults;
    let totalCount = exactCount;

    if (exactCount === 0) {
      const semanticResults = await semanticSearch(query.trim(), locale, Number.POSITIVE_INFINITY);

      if (semanticResults.length > 0) {
        const colorData = await loadColorData();
        const filteredSemantic = semanticResults.filter((uni) => {
          if (qu.filters.color) {
            const colorLower = qu.filters.color.toLowerCase();
            let matchedBaseColor: string | null = null;

            for (const [baseKey, colorInfo] of Object.entries(colorData.colors)) {
              const allVariants = [...colorInfo.main, ...colorInfo.shades];
              if (allVariants.some((c) => c.toLowerCase() === colorLower)) {
                matchedBaseColor = baseKey;
                break;
              }
            }

            if (matchedBaseColor) {
              if (!uni.variBase?.includes(matchedBaseColor)) return false;
            } else {
              if (!uni.vari.toLowerCase().includes(colorLower)) return false;
            }
          }
          if (qu.filters.area) {
            if (!uni.alue.toLowerCase().includes(qu.filters.area.toLowerCase())) {
              return false;
            }
          }
          if (qu.filters.field) {
            if (!uni.ala?.toLowerCase().includes(qu.filters.field.toLowerCase())) {
              return false;
            }
          }
          if (qu.filters.school) {
            if (!uni.oppilaitos.toLowerCase().includes(qu.filters.school.toLowerCase())) {
              return false;
            }
          }
          return true;
        });

        if (filteredSemantic.length > 0) {
          candidates = filteredSemantic;
          totalCount = filteredSemantic.length;
        } else {
          candidates = [];
          totalCount = 0;
        }
      }
    }

    let finalResults: University[] = candidates;
    if (finalResults.length > 0 && exactCount > 0) {
      finalResults.sort((a, b) => {
        if (a.oppilaitos !== b.oppilaitos) {
          return a.oppilaitos.localeCompare(b.oppilaitos);
        }
        return (a.ala || '').localeCompare(b.ala || '');
      });
    }

    return NextResponse.json({
      results: finalResults,
      totalCount,
      filters: qu.filters,
      semanticQuery: qu.semanticQuery,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
