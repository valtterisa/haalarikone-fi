import { loadUniversities } from '@/lib/load-universities';
import { getEnrichedOrganization } from '@/lib/load-enrichment';
import { getOrganizationProfile, mergeOverallForPublic } from '@/lib/org-profile';
import { parseStyles } from '@/lib/utils';
import { SITE_ORIGIN } from '@/lib/site-url';
import { SealCheck } from '@phosphor-icons/react/ssr';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Haalarikone embed — ${slug}`,
    robots: { index: false, follow: false },
  };
}

export default async function EmbedOverallCard({ params }: Props) {
  const { slug } = await params;
  const universities = await loadUniversities('fi');
  const base = universities.find((u) => u.slug === slug);

  if (!base) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-4 text-sm text-foreground/60">
        Ei löytynyt
      </div>
    );
  }

  const enrichment = getEnrichedOrganization(slug, 'fi');
  const profile = await getOrganizationProfile(slug);
  const { overall, verified } = mergeOverallForPublic(base, enrichment, profile, 'fi');
  const href = `${SITE_ORIGIN}/haalari/${slug}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="block h-[160px] w-full max-w-[360px] no-underline"
    >
      <article className="flex h-full overflow-hidden rounded-xl border border-border bg-card">
        <div className="w-14 shrink-0 sm:w-16" style={parseStyles(overall.hex)} aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-base font-bold tracking-tight text-foreground">
              {overall.ainejarjesto ?? overall.oppilaitos}
            </h1>
            {verified ? (
              <SealCheck
                className="h-4 w-4 shrink-0 text-green"
                weight="fill"
                aria-label="Verified"
              />
            ) : null}
          </div>
          <p className="truncate text-sm text-foreground/70">{overall.vari}</p>
          <p className="truncate text-xs text-foreground/45">{overall.oppilaitos}</p>
          <p className="mt-1.5 text-[10px] font-semibold tracking-[0.14em] text-foreground/35">
            HAALARIKONE
          </p>
        </div>
      </article>
    </a>
  );
}
