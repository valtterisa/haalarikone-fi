import { EnrichmentProse, EnrichmentWebsiteLink } from '@/components/enrichment-info';
import type { EnrichedSchool } from '@/lib/load-enrichment';
import { MapPin, UsersThree } from '@phosphor-icons/react/ssr';
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
          <EnrichmentWebsiteLink
            href={enrichment.website}
            label={websiteLabel}
            className="sm:ml-auto"
          />
        ) : null}
      </div>

      <div className="px-5 py-5 sm:px-6">
        <EnrichmentProse text={description} />
      </div>

      {studentUnion ? (
        <div className="border-t border-border bg-muted/25 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground/55">
                <UsersThree className="h-4 w-4 text-green" weight="regular" aria-hidden />
                {studentUnionLabel}
              </p>
              <p className="mt-1 text-base font-semibold tracking-tight text-foreground">
                {studentUnion.name}
              </p>
              {studentUnion.description ? (
                <EnrichmentProse
                  text={studentUnion.description}
                  className="mt-2 [&_p]:text-sm [&_p]:text-foreground/70"
                />
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
