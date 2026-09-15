import { understandQueryWithAI } from '@/lib/query-understanding';
import { loadColorData } from '@/lib/load-color-data';
import { loadUniversities } from '@/lib/load-universities';
import {
  buildDeterministicQueryUnderstanding,
  buildSearchResponse,
} from '@/lib/build-search-response';
import { insertSearchLog } from '@/lib/insert-search-log';
import { filterUniversities } from '@/lib/university-filters';
import { NextResponse } from 'next/server';

const ALLOWED_LOCALES = new Set(['fi', 'en', 'sv']);
const MAX_QUERY_LENGTH = 200;

type SearchBody = {
  query?: string;
  locale?: 'fi' | 'en' | 'sv';
  source?: 'modal' | 'listing';
  color?: string | null;
  area?: string | null;
  field?: string | null;
  school?: string | null;
};

function hasAdvancedFilters(body: SearchBody) {
  return Boolean(body.color || body.area || body.field || body.school);
}

export async function POST(req: Request) {
  let parsed: SearchBody = {};

  try {
    parsed = (await req.json()) as SearchBody;
  } catch {
    // If body is missing or invalid JSON, fall back to empty query.
  }

  const query = (parsed.query ?? '').trim();
  const rawLocale = parsed.locale ?? 'fi';
  const locale = ALLOWED_LOCALES.has(rawLocale) ? rawLocale : 'fi';
  const source = parsed.source === 'modal' ? 'modal' : 'listing';
  const filters = {
    color: parsed.color || undefined,
    area: parsed.area || undefined,
    field: parsed.field || undefined,
    school: parsed.school || undefined,
  };
  const withFilters = hasAdvancedFilters(parsed);

  if ((!query || query.length < 3) && !withFilters) {
    return NextResponse.json({ results: [], totalCount: 0 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ success: false, error: 'Query too long' }, { status: 400 });
  }

  try {
    const [universities, colorData] = await Promise.all([
      loadUniversities(locale),
      loadColorData(),
    ]);

    if (query.length < 3) {
      const filtered = filterUniversities(universities, filters, colorData);
      try {
        await insertSearchLog({
          query: '',
          locale,
          resultCount: filtered.length,
          source,
          color: parsed.color,
          area: parsed.area,
          field: parsed.field,
          school: parsed.school,
        });
      } catch (error) {
        console.error('search log insert failed:', error);
      }

      return NextResponse.json({ results: filtered, totalCount: filtered.length });
    }

    const deterministicQu = buildDeterministicQueryUnderstanding(query, universities, colorData);
    let body = buildSearchResponse(query, deterministicQu, universities, colorData);

    if (body.totalCount === 0) {
      try {
        const aiQueryUnderstanding = await understandQueryWithAI(query, locale);
        const aiBody = buildSearchResponse(query, aiQueryUnderstanding, universities, colorData);
        if (aiBody.totalCount > 0) {
          body = aiBody;
        }
      } catch (error) {
        console.error('AI fallback error:', error);
      }
    }

    const resultCount = withFilters
      ? filterUniversities(body.results, filters, colorData).length
      : body.totalCount;

    try {
      await insertSearchLog({
        query,
        locale,
        resultCount,
        source,
        color: parsed.color,
        area: parsed.area,
        field: parsed.field,
        school: parsed.school,
      });
    } catch (error) {
      console.error('search log insert failed:', error);
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
