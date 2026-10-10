import { EnrichmentWebsiteLink } from '@/components/enrichment-info';
import type { EnrichedSchool } from '@/lib/load-enrichment';
import { ArrowUpRight, Globe, MapPin, UsersThree } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';

type UniversityProfileProps = {
  name: string;
  logoName: string;
  description: string;
  overallCount: number;
  overallCountLabel: string;
  areas: string[];
  enrichment: EnrichedSchool | null;
  websiteLabel: string;
  studentUnionLabel: string;
};

function websiteHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function UniversityProfile({
  name,
  logoName,
  description,
  overallCount,
  overallCountLabel,
  areas,
  enrichment,
  websiteLabel,
  studentUnionLabel,
}: UniversityProfileProps) {
  const studentUnion = enrichment?.studentUnion ?? null;

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
            <Image
              className="object-contain p-2"
              src={`/logos/${logoName}.jpg`}
              fill
              sizes="56px"
              alt={`${name} logo`}
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {name}
            </h1>
            <p className="mt-1 text-sm text-foreground/65">
              <span className="font-semibold tabular-nums text-foreground">{overallCount}</span>{' '}
              {overallCountLabel}
              {areas.length > 0 ? (
                <>
                  <span className="mx-1.5 text-foreground/30" aria-hidden>
                    /
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-green" weight="regular" aria-hidden />
                    {areas.join(', ')}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        {enrichment?.website ? (
          <a
            href={enrichment.website}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm font-semibold text-foreground transition hover:border-green/40 hover:bg-green/5 hover:text-green active:scale-[0.98] sm:ml-auto"
          >
            <Globe className="h-4 w-4 text-green" weight="regular" aria-hidden />
            <span>{websiteHost(enrichment.website)}</span>
            <span className="sr-only">{websiteLabel}</span>
            <ArrowUpRight
              className="h-3.5 w-3.5 text-foreground/40 transition group-hover:text-green"
              weight="bold"
              aria-hidden
            />
          </a>
        ) : null}
      </div>

      <div className="px-5 py-5 sm:px-6">
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-foreground/80">{description}</p>
      </div>

      {studentUnion ? (
        <div className="border-t border-border bg-muted/25 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground/55">
                <UsersThree className="h-4 w-4 text-green" weight="regular" aria-hidden />
                {studentUnionLabel}
              </p>
              <p className="mt-1 text-base font-semibold tracking-tight text-foreground">
                {studentUnion.name}
              </p>
              {studentUnion.description ? (
                <p className="mt-1.5 max-w-[55ch] text-sm leading-relaxed text-foreground/70">
                  {studentUnion.description}
                </p>
              ) : null}
            </div>
            {studentUnion.website ? (
              <EnrichmentWebsiteLink href={studentUnion.website} label={websiteLabel} />
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
