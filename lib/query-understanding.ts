import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { Redis } from '@upstash/redis';
import { loadColorData } from './load-color-data';
import { z } from 'zod';

const QueryUnderstandingSchema = z.object({
    isGibberish: z.boolean().default(false).describe('True if query is meaningless or spam'),
    filters: z.object({
        color: z.string().nullish().transform(val => val ?? undefined).describe('Color: valkoinen/musta/punainen/sininen/vihreä/keltainen/oranssi/violetti/pinkki'),
        area: z.string().nullish().transform(val => val ?? undefined).describe('City/region: normalize case endings (Tampereella->Tampere, Kuopion->Kuopio)'),
        field: z.string().nullish().transform(val => val ?? undefined).describe('Field: normalize plural (insinöörit->insinööri)'),
        school: z.string().nullish().transform(val => val ?? undefined).describe('School/university name'),
    }),
    semanticQuery: z.string().default('').describe('Remaining text after extraction'),
});

export type QueryUnderstanding = z.infer<typeof QueryUnderstandingSchema>;

const redis = Redis.fromEnv();
const CACHE_TTL = 3600;

async function parseSimpleQuery(query: string): Promise<QueryUnderstanding | null> {
    const lower = query.toLowerCase().trim();
    const words = lower.split(/\s+/).filter(w => w.length > 1);

    if (words.length === 0 || words.length > 2) return null;

    const colorData = await loadColorData();
    let detectedColor: string | null = null;

    for (const word of words) {
        for (const colorInfo of Object.values(colorData.colors)) {
            const allVariants = [...colorInfo.main, ...colorInfo.shades];
            if (allVariants.some(c => c.toLowerCase() === word)) {
                detectedColor = word;
                break;
            }
        }
        if (detectedColor) break;
    }

    if (detectedColor && words.length <= 2) {
        return {
            isGibberish: false,
            filters: {
                color: detectedColor,
                area: undefined,
                field: undefined,
                school: undefined,
            },
            semanticQuery: words.length === 2 ? words.find(w => w !== detectedColor) || '' : '',
        };
    }

    return null;
}

export async function understandQuery(
    query: string,
    locale: 'fi' | 'en' | 'sv' = 'fi'
): Promise<QueryUnderstanding> {
    const normalizedQuery = query.toLowerCase().trim();
    const cacheKey = `query:${locale}:${normalizedQuery}`;

    try {
        const cached = await redis.get<QueryUnderstanding>(cacheKey);
        if (cached) {
            return cached;
        }
    } catch (error) {
        console.error('Cache read error:', error);
    }

    const simple = await parseSimpleQuery(query);
    if (simple) {
        try {
            await redis.setex(cacheKey, CACHE_TTL, simple);
        } catch (error) {
            console.error('Cache write error:', error);
        }
        return simple;
    }

    const systemPrompt = `Extract filters from Finnish student overall queries:
- color: valkoinen/musta/punainen/sininen/vihreä/keltainen/oranssi/violetti/pinkki (normalize: valkoiset->valkoinen, white->valkoinen)
- area: cities (normalize: Tampereella->Tampere, Kuopion->Kuopio)
- field: study fields (normalize: insinöörit->insinööri)
- school: universities

Return JSON: {isGibberish: boolean, filters: {color?, area?, field?, school?}, semanticQuery: string}`;

    try {
        const result = await generateText({
            model: anthropic("claude-3-haiku-20240307"),
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

        try {
            await redis.setex(cacheKey, CACHE_TTL, parsed);
        } catch (error) {
            console.error('Cache write error:', error);
        }

        return parsed;
    } catch (error) {
        console.error('Query understanding error:', error);
        throw error;
    }
}
