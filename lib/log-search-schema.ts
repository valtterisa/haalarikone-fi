import { z } from 'zod';

export const logSearchBodySchema = z
  .object({
    query: z.string().trim().max(200),
    locale: z.enum(['fi', 'en', 'sv']),
    resultCount: z.number().int().nonnegative(),
    source: z.enum(['modal', 'listing']),
    color: z.string().trim().max(100).nullish(),
    area: z.string().trim().max(200).nullish(),
    field: z.string().trim().max(200).nullish(),
    school: z.string().trim().max(200).nullish(),
  })
  .refine(
    (data) =>
      data.query.length >= 3 ||
      Boolean(data.color || data.area || data.field || data.school),
  );

export type LogSearchBody = z.infer<typeof logSearchBodySchema>;

export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
