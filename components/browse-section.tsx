'use client';

import { Link } from '@/i18n/routing';
import { getSlugForEntity, type Locale } from '@/lib/slug-translations';
import type { University } from '@/types/university';
import {
  getUniqueUniversities,
  getUniqueFields,
  getUniqueColors,
  getUniqueAreas,
} from '@/lib/get-unique-values';
import { useTranslatedRoutes, type InternalHref } from '@/lib/use-translated-routes';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';

export function BrowseSectionRoot({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-6xl px-4 py-12">
      <h2 className="mb-8 text-center text-3xl font-bold">{title}</h2>
      <p className="mx-auto mb-12 max-w-2xl text-center text-gray-700">{description}</p>
      <div className="grid gap-8 md:grid-cols-2">{children}</div>
    </div>
  );
}

export function BrowseSectionGroup({
  title,
  items,
  remaining,
  remainingLabel,
}: {
  title: string;
  items: { href: InternalHref; label: string }[];
  remaining?: number;
  remainingLabel?: string;
}) {
  return (
    <div>
      <h3 className="mb-4 text-xl font-bold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded bg-green/10 px-4 py-2 text-sm text-green transition hover:bg-green/20"
          >
            {item.label}
          </Link>
        ))}
      </div>
      {remaining !== undefined && remaining > 0 && remainingLabel && (
        <p className="mt-4 text-sm text-gray-600">
          + {remaining} {remainingLabel}
        </p>
      )}
    </div>
  );
}

export function BrowseSectionFromUniversities({ universities }: { universities: University[] }) {
  const routes = useTranslatedRoutes();
  const locale = useLocale() as Locale;
  const uniqueUniversities = getUniqueUniversities(universities);
  const uniqueFields = getUniqueFields(universities);
  const uniqueColors = getUniqueColors(universities);
  const uniqueAreas = getUniqueAreas(universities);

  const popularUniversities = uniqueUniversities.slice(0, 8);
  const popularFields = uniqueFields.slice(0, 8);
  const popularColors = uniqueColors.slice(0, 6);
  const popularAreas = uniqueAreas.slice(0, 6);

  return (
    <BrowseSection
      title="Selaa haalarivärejä"
      description="Tutustu haalariväreihin selaamalla yliopistoa, alaa, väriä tai aluetta. Voit myös käyttää hakua löytääksesi tarkemmat tiedot."
    >
      <BrowseSection.Group
        title="Yliopistot ja AMK:t"
        items={popularUniversities.map((uni) => ({
          label: uni,
          href: routes.universities(getSlugForEntity(uni, locale, 'university')),
        }))}
        remaining={uniqueUniversities.length - popularUniversities.length}
        remainingLabel="muuta oppilaitosta"
      />
      <BrowseSection.Group
        title="Alat"
        items={popularFields.map((field) => ({
          label: field,
          href: routes.fields(getSlugForEntity(field, locale, 'field')),
        }))}
        remaining={uniqueFields.length - popularFields.length}
        remainingLabel="muuta alaa"
      />
      <BrowseSection.Group
        title="Värit"
        items={popularColors.map((color) => ({
          label: color,
          href: routes.colors(getSlugForEntity(color, locale, 'color')),
        }))}
        remaining={uniqueColors.length - popularColors.length}
        remainingLabel="muuta väriä"
      />
      <BrowseSection.Group
        title="Alueet"
        items={popularAreas.map((area) => ({
          label: area,
          href: routes.areas(getSlugForEntity(area, locale, 'area')),
        }))}
        remaining={uniqueAreas.length - popularAreas.length}
        remainingLabel="muuta aluetta"
      />
    </BrowseSection>
  );
}

export const BrowseSection = Object.assign(BrowseSectionRoot, {
  Group: BrowseSectionGroup,
  FromUniversities: BrowseSectionFromUniversities,
});

export default BrowseSectionFromUniversities;
