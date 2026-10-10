import { splitProseParagraphs } from '@/lib/enrichment-prose';
import { ArrowUpRight, Globe, UsersThree } from '@phosphor-icons/react/dist/ssr';

function websiteHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

type EnrichmentProseProps = {
  text: string;
  className?: string;
};

export function EnrichmentProse({ text, className = '' }: EnrichmentProseProps) {
  const paragraphs = splitProseParagraphs(text);
  if (paragraphs.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-[15px] leading-relaxed text-foreground/80">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

type EnrichmentWebsiteLinkProps = {
  href: string;
  label: string;
};

export function EnrichmentWebsiteLink({ href, label }: EnrichmentWebsiteLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm font-semibold text-foreground transition hover:border-green/40 hover:bg-green/5 hover:text-green active:scale-[0.98]"
    >
      <Globe className="h-4 w-4 text-green" weight="regular" aria-hidden />
      <span>{websiteHost(href)}</span>
      <span className="sr-only">{label}</span>
      <ArrowUpRight
        className="h-3.5 w-3.5 text-foreground/40 transition group-hover:text-green"
        weight="bold"
        aria-hidden
      />
    </a>
  );
}

type EnrichmentAboutProps = {
  title: string;
  description: string;
  website?: string | null;
  websiteLabel: string;
  className?: string;
};

export function EnrichmentAbout({
  title,
  description,
  website,
  websiteLabel,
  className = 'mt-6 overflow-hidden rounded-xl border border-border bg-card',
}: EnrichmentAboutProps) {
  return (
    <section className={className}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      </div>
      <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
        <EnrichmentProse text={description} />
        {website ? <EnrichmentWebsiteLink href={website} label={websiteLabel} /> : null}
      </div>
    </section>
  );
}

type EnrichmentStudentUnionProps = {
  title: string;
  name: string;
  description?: string | null;
  website?: string | null;
  websiteLabel: string;
};

export function EnrichmentStudentUnion({
  title,
  name,
  description,
  website,
  websiteLabel,
}: EnrichmentStudentUnionProps) {
  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground/55">
            <UsersThree className="h-4 w-4 text-green" weight="regular" aria-hidden />
            {title}
          </div>
          <p className="mt-1.5 text-base font-semibold tracking-tight text-foreground">{name}</p>
          {description ? (
            <EnrichmentProse
              text={description}
              className="mt-2 [&_p]:text-sm [&_p]:text-foreground/75"
            />
          ) : null}
        </div>
        {website ? (
          <div className="shrink-0">
            <EnrichmentWebsiteLink href={website} label={websiteLabel} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
