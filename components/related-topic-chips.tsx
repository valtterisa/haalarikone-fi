import { HubLink } from '@/components/hub-link';
import type { HubSource, HubType } from '@/lib/analytics-events';
import { entitySlug } from '@/lib/entity-slug';
import { getEntityTranslation, type Locale } from '@/lib/slug-translations';
import { routeHref, type RouteType } from '@/lib/use-translated-routes';
import { Children, type ReactNode } from 'react';

const chipClassName =
  'inline-flex min-h-11 items-center rounded-md bg-muted/70 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-green/10 hover:text-green';

const HUB_ROUTE = {
  area: 'areas',
  university: 'universities',
  field: 'fields',
  color: 'colors',
} as const satisfies Record<HubType, RouteType>;

function RelatedTopicsRoot({ title, children }: { title: string; children: ReactNode }) {
  const content = Children.toArray(children).filter(Boolean);
  if (content.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
      {content}
    </div>
  );
}

function RelatedTopicsChips({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean);
  if (items.length === 0) {
    return null;
  }

  return <div className="flex flex-wrap gap-2">{items}</div>;
}

function RelatedTopicsChip({
  item,
  locale,
  source,
  type,
}: {
  item: string;
  locale: Locale;
  source: HubSource;
  type: HubType;
}) {
  const slug = entitySlug(item, locale, type);
  return (
    <HubLink
      href={routeHref(HUB_ROUTE[type], slug)}
      source={source}
      type={type}
      slug={slug}
      className={chipClassName}
    >
      {getEntityTranslation(item, locale, type)}
    </HubLink>
  );
}

export const RelatedTopics = Object.assign(RelatedTopicsRoot, {
  Chips: RelatedTopicsChips,
  Chip: RelatedTopicsChip,
});

export default RelatedTopics;
