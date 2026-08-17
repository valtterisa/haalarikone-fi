import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Link } from '@/i18n/routing';
import { Page } from '@/components/page';
import type { ReactNode } from 'react';

export type LegalFact = {
  label: string;
  value: string;
};

export type LegalItem = {
  name: string;
  detail: string;
};

export type LegalSection = {
  title: string;
  paragraphs: string[];
  items?: LegalItem[];
};

type LegalDocumentProps = {
  homeLabel: string;
  title: string;
  updatedLabel: string;
  updatedDate: string;
  intro: string;
  facts: LegalFact[];
  sections: LegalSection[];
};

function linkify(text: string): ReactNode[] {
  const pattern = /(https?:\/\/[^\s<]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const raw = match[0];
    const trailing = raw.match(/[),.;!?]+$/)?.[0] ?? '';
    const token = trailing ? raw.slice(0, -trailing.length) : raw;
    const href = token.includes('@') && !token.startsWith('http') ? `mailto:${token}` : token;
    const external = href.startsWith('http');

    nodes.push(
      <a
        key={`link-${key}`}
        href={href}
        className="text-green underline-offset-2 hover:underline"
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {token}
      </a>,
    );
    key += 1;

    if (trailing) {
      nodes.push(trailing);
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function parseLegalFacts(value: unknown): LegalFact[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is LegalFact =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as LegalFact).label === 'string' &&
      typeof (item as LegalFact).value === 'string',
  );
}

function isLegalItem(value: unknown): value is LegalItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'detail' in value &&
    typeof value.name === 'string' &&
    typeof value.detail === 'string'
  );
}

function isLegalSection(value: unknown): value is LegalSection {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  if (!('title' in value) || typeof value.title !== 'string') {
    return false;
  }
  if (!('paragraphs' in value) || !Array.isArray(value.paragraphs)) {
    return false;
  }
  if (!value.paragraphs.every((paragraph) => typeof paragraph === 'string')) {
    return false;
  }
  if (!('items' in value) || value.items === undefined) {
    return true;
  }
  return Array.isArray(value.items) && value.items.every(isLegalItem);
}

export function parseLegalSections(value: unknown): LegalSection[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isLegalSection);
}

export function LegalDocument({
  homeLabel,
  title,
  updatedLabel,
  updatedDate,
  intro,
  facts,
  sections,
}: LegalDocumentProps) {
  return (
    <Page>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">{homeLabel}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <article>
        <header className="mb-10 border-b border-border/60 pb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {updatedLabel} {updatedDate}
          </p>
          <p className="mt-6 max-w-[65ch] text-base leading-relaxed">{intro}</p>
        </header>

        {facts.length > 0 ? (
          <dl className="mb-10 grid gap-3 rounded-lg border border-border/60 bg-card p-5 sm:grid-cols-[12rem_1fr] sm:gap-x-6 sm:gap-y-3">
            {facts.map((fact) => (
              <div key={fact.label} className="contents">
                <dt className="text-sm font-semibold text-foreground">{fact.label}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{linkify(fact.value)}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="space-y-10">
          {sections.map((section, index) => (
            <section key={section.title} aria-labelledby={`legal-section-${index}`}>
              <h2
                id={`legal-section-${index}`}
                className="mb-3 font-display text-xl font-semibold tracking-tight"
              >
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={`${index}-${paragraphIndex}`} className="max-w-[65ch] text-base leading-relaxed">
                    {linkify(paragraph)}
                  </p>
                ))}
              </div>
              {section.items && section.items.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <li key={item.name} className="max-w-[65ch] text-base leading-relaxed">
                      <span className="font-semibold">{item.name}.</span>{' '}
                      {linkify(item.detail)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </Page>
  );
}
