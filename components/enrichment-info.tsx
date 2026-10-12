import { splitProseParagraphs } from '@/lib/enrichment-prose';
import { cn } from '@/lib/utils';
import { ArrowUpRight, Globe, UsersThree } from '@phosphor-icons/react/ssr';
import { getLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

export function websiteHost(url: string): string {
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

export async function EnrichmentProse({ text, className = '' }: EnrichmentProseProps) {
  const locale = await getLocale();
  const paragraphs = splitProseParagraphs(text, locale);
  if (paragraphs.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph}`} className="text-[15px] leading-relaxed text-foreground/80">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

type EnrichmentWebsiteLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export function EnrichmentWebsiteLink({ href, label, className }: EnrichmentWebsiteLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm font-semibold text-foreground transition hover:border-green/40 hover:bg-green/5 hover:text-green active:scale-[0.98]',
        className,
      )}
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
  title?: string;
  description: string;
  children?: ReactNode;
};

/** Title + prose (+ optional action). Shell comes from the parent. */
export function EnrichmentAbout({ title, description, children }: EnrichmentAboutProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        {title ? <h2 className="mb-3 text-sm font-medium text-foreground/55">{title}</h2> : null}
        <EnrichmentProse text={description} />
      </div>
      {children}
    </div>
  );
}

type EnrichmentStudentUnionProps = {
  title: string;
  name: string;
  description?: string | null;
  children?: ReactNode;
};

/** Student-union block content. Shell comes from the parent. */
export function EnrichmentStudentUnion({
  title,
  name,
  description,
  children,
}: EnrichmentStudentUnionProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground/55">
          <UsersThree className="h-4 w-4 text-green" weight="regular" aria-hidden />
          {title}
        </p>
        <p className="mt-1 text-base font-semibold tracking-tight text-foreground">{name}</p>
        {description ? (
          <EnrichmentProse
            text={description}
            className="mt-2 [&_p]:text-sm [&_p]:text-foreground/70"
          />
        ) : null}
      </div>
      {children}
    </div>
  );
}
