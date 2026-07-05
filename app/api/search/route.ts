import { understandQueryWithAI } from '@/lib/query-understanding';
import { loadColorData } from '@/lib/load-color-data';
import { loadUniversities } from '@/lib/load-universities';
import {
  buildDeterministicQueryUnderstanding,
  buildSearchResponse,
} from '@/lib/build-search-response';
import { NextResponse } from 'next/server';

const ALLOWED_LOCALES = new Set(['fi', 'en', 'sv']);
const MAX_QUERY_LENGTH = 200;

export async function POST(req: Request) {
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

  try {
    const [universities, colorData] = await Promise.all([
      loadUniversities(locale),
      loadColorData(),
    ]);

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

    return NextResponse.json(body);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
