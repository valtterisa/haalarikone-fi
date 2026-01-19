import { understandQuery } from '@/lib/query-understanding';
import { filterUniversities } from '@/lib/deterministic-filter';
import { rankSemantically } from '@/lib/semantic-ranking';
import { semanticSearch } from '@/lib/semantic-search';
import { loadColorData } from '@/lib/load-color-data';
import { NextResponse } from 'next/server';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { University } from '@/types/university';
import type { QueryUnderstanding } from '@/lib/query-understanding';

export async function POST(req: Request) {
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(15, "10 s"),
  });

  const identifier = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    return NextResponse.json(
      { success: false, error: "Unable to process at this time" },
      { status: 429 }
    );
  }

  const body = await req.json() as {
    query: string;
    locale?: 'fi' | 'en' | 'sv';
  };

  const { query, locale = 'fi' } = body;

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

    let finalResults: University[] = filteredResults;
    let totalCount = exactCount;

    if (exactCount === 0) {
      const semanticResults = await semanticSearch(query.trim(), locale, 100);

      if (semanticResults.length > 0) {
        const colorData = await loadColorData();
        const filteredSemantic = semanticResults.filter((uni) => {
          if (qu.filters.color) {
            const colorLower = qu.filters.color.toLowerCase();
            let colorMatched = false;

            for (const colorInfo of Object.values(colorData.colors)) {
              const allVariants = [...colorInfo.main, ...colorInfo.shades];
              if (allVariants.some(c => c.toLowerCase() === colorLower)) {
                if (allVariants.some(c => uni.vari.toLowerCase().includes(c.toLowerCase()))) {
                  colorMatched = true;
                  break;
                }
              }
            }

            if (!colorMatched) return false;
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
          finalResults = filteredSemantic;
          totalCount = filteredSemantic.length;
        } else {
          finalResults = [];
          totalCount = 0;
        }

        if (qu.semanticQuery && finalResults.length > 0) {
          finalResults = await rankSemantically(finalResults, qu.semanticQuery);
        }
      }
    } else {
      if (qu.semanticQuery && filteredResults.length > 0) {
        finalResults = await rankSemantically(filteredResults, qu.semanticQuery);
      } else {
        finalResults.sort((a, b) => {
          if (a.oppilaitos !== b.oppilaitos) {
            return a.oppilaitos.localeCompare(b.oppilaitos);
          }
          return (a.ala || '').localeCompare(b.ala || '');
        });
      }
    }

    return NextResponse.json({
      results: finalResults,
      totalCount,
      filters: qu.filters,
      semanticQuery: qu.semanticQuery,
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
