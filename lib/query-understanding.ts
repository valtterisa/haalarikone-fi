import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { Redis } from '@upstash/redis';
import { loadColorData } from './load-color-data';
import { loadUniversities } from './load-universities';
import { getUniqueAreas, getUniqueFields, getUniqueUniversities } from './get-unique-values';
import { reconcileFieldOrganizationFilters } from './reconcile-field-organization';
import { parseSimpleQueryWithColorData } from './parse-simple-query';
import { z } from 'zod';

function trimmedFilterString(desc: string) {
  return z
    .string()
    .nullish()
    .transform((val) => {
      if (val == null) return undefined;
      const t = val.trim();
      return t === '' ? undefined : t;
    })
    .describe(desc);
}

const QueryUnderstandingSchema = z.object({
  isGibberish: z.boolean().default(false).describe('True if query is meaningless or spam'),
  filters: z.object({
    color: trimmedFilterString(
      'Color: valkoinen/musta/punainen/sininen/vihreä/keltainen/oranssi/violetti/pinkki/harmaa/ruskea/turkoosi',
    ),
    area: trimmedFilterString(
      'City/region: normalize case endings (Tampereella->Tampere, Kuopion->Kuopio)',
    ),
    field: trimmedFilterString(
      'Broad study discipline only (insinööri, lääketiede, fysiikka). Never guild/ainejärjestö brand names (Skripti, Indecs, *kilta) — those go in organization',
    ),
    school: trimmedFilterString('School/university name'),
    organization: trimmedFilterString(
      'Student subject organization / guild (ainejärjestö, kilta): e.g. Fyysikkokilta, Indecs; not the university name',
    ),
  }),
  semanticQuery: z.string().default('').describe('Remaining text after extraction'),
});

export type QueryUnderstanding = z.infer<typeof QueryUnderstandingSchema>;

const redis = Redis.fromEnv();
const CACHE_TTL = 3600;
const DETERMINISTIC_CACHE_VERSION = 'v2';
const AI_CACHE_VERSION = 'v1';
const IS_DEV = process.env.NODE_ENV === 'development';

function normalizeValue(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function pickBestContainedMatch(
  normalizedQuery: string,
  candidates: string[],
  blockedNormalizedValues: Set<string>,
): string | undefined {
  let best: string | undefined;
  let bestLength = 0;
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeValue(candidate);
    if (!normalizedCandidate || blockedNormalizedValues.has(normalizedCandidate)) continue;
    if (!normalizedQuery.includes(normalizedCandidate)) continue;
    if (normalizedCandidate.length > bestLength) {
      best = candidate;
      bestLength = normalizedCandidate.length;
    }
  }
  return best;
}

function buildDeterministicUnderstanding(
  query: string,
  localeUniversities: Awaited<ReturnType<typeof loadUniversities>>,
): QueryUnderstanding {
  const normalizedQuery = normalizeValue(query);
  const blocked = new Set<string>();
  const areas = getUniqueAreas(localeUniversities);
  const schools = getUniqueUniversities(localeUniversities);
  const fields = getUniqueFields(localeUniversities);

  const area = pickBestContainedMatch(normalizedQuery, areas, blocked);
  if (area) blocked.add(normalizeValue(area));

  const school = pickBestContainedMatch(normalizedQuery, schools, blocked);
  if (school) blocked.add(normalizeValue(school));

  const field = pickBestContainedMatch(normalizedQuery, fields, blocked);
  if (field) blocked.add(normalizeValue(field));

  return {
    isGibberish: false,
    filters: {
      color: undefined,
      area,
      field,
      school,
      organization: undefined,
    },
    semanticQuery: query.trim(),
  };
}

export async function understandQuery(
  query: string,
  locale: 'fi' | 'en' | 'sv' = 'fi',
): Promise<QueryUnderstanding> {
  const normalizedQuery = query.toLowerCase().trim();
  const cacheKey = `query:${DETERMINISTIC_CACHE_VERSION}:${locale}:${normalizedQuery}`;

  if (!IS_DEV) {
    try {
      const cached = await redis.get<QueryUnderstanding>(cacheKey);
      if (cached) {
        if (process.env.NODE_ENV !== 'test') {
          console.debug('[query-understanding][cache-hit]', {
            query: query.trim(),
            locale,
            isGibberish: cached.isGibberish,
            filters: cached.filters,
            semanticQuery: cached.semanticQuery,
          });
        }
        return cached;
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
  }

  const colorDataForSimple = await loadColorData();
  const simple = parseSimpleQueryWithColorData(query, colorDataForSimple);
  if (simple) {
    if (!IS_DEV) {
      try {
        if (process.env.NODE_ENV !== 'test') {
          console.debug('[query-understanding][simple-parse]', {
            query: query.trim(),
            locale,
            isGibberish: simple.isGibberish,
            filters: simple.filters,
            semanticQuery: simple.semanticQuery,
          });
        }
        await redis.setex(cacheKey, CACHE_TTL, simple);
      } catch (error) {
        console.error('Cache write error:', error);
      }
    }
    return simple;
  }

  const universities = await loadUniversities(locale);
  const deterministic = buildDeterministicUnderstanding(query, universities);
  if (!IS_DEV) {
    try {
      await redis.setex(cacheKey, CACHE_TTL, deterministic);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  return deterministic;
}

export async function understandQueryWithAI(
  query: string,
  locale: 'fi' | 'en' | 'sv' = 'fi',
): Promise<QueryUnderstanding> {
  const normalizedQuery = query.toLowerCase().trim();
  const cacheKey = `query-ai:${AI_CACHE_VERSION}:${locale}:${normalizedQuery}`;

  if (!IS_DEV) {
    try {
      const cached = await redis.get<QueryUnderstanding>(cacheKey);
      if (cached) {
        if (process.env.NODE_ENV !== 'test') {
          console.debug('[query-understanding-ai][cache-hit]', {
            query: query.trim(),
            locale,
            isGibberish: cached.isGibberish,
            filters: cached.filters,
            semanticQuery: cached.semanticQuery,
          });
        }
        return cached;
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
  }

  const systemPrompt = `Extract filters from student overall (haalari) queries (Finnish/English/Swedish):
- color: valkoinen/musta/punainen/sininen/vihreä/keltainen/oranssi/violetti/pinkki/harmaa/ruskea/turkoosi (normalize: valkoiset->valkoinen, white->valkoinen)
- area: cities (normalize: Tampereella->Tampere, Kuopion->Kuopio)
- field: ONLY generic academic disciplines (insinööri, lääketiede, oikeustiede, fysiikka, tietotekniikka). Normalize plural (insinöörit->insinööri). NEVER put subject-guild names, abbreviations, or coined org names here (e.g. Skripti, Indecs, PoRa, *kilta names).
- school: universities (oppilaitos)
- organization: student subject guild / ainejärjestö (e.g. Fyysikkokilta, Skripti, Indecs). If the user names something that is a guild rather than a broad discipline, use organization and leave field empty. Never set field to a short fragment of the query or of the guild name (e.g. query "skri" + org Skripti → field must stay empty).

Return JSON: {isGibberish: boolean, filters: {color?, area?, field?, school?, organization?}, semanticQuery: string}`;

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      output: Output.object({
        schema: QueryUnderstandingSchema,
      }),
      system: systemPrompt,
      prompt: query,
    });

    if (!result.output) {
      throw new Error('No output received from API');
    }

    const parsed = QueryUnderstandingSchema.parse(result.output);
    const universities = await loadUniversities(locale);
    const reconciled = reconcileFieldOrganizationFilters(parsed, universities);

    if (process.env.NODE_ENV !== 'test') {
      console.debug('[query-understanding-ai]', {
        query: query.trim(),
        locale,
        isGibberish: reconciled.isGibberish,
        filters: reconciled.filters,
        semanticQuery: reconciled.semanticQuery,
      });
    }

    if (!IS_DEV) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, reconciled);
      } catch (error) {
        console.error('Cache write error:', error);
      }
    }

    return reconciled;
  } catch (error) {
    console.error('Query understanding error:', error);
    throw error;
  }
}
