"use client";

import { Link } from "@/i18n/routing";
import { getSlugForEntity } from "@/lib/slug-translations";
import type { University } from "@/types/university";
import {
  getUniqueUniversities,
  getUniqueFields,
  getUniqueColors,
  getUniqueAreas,
} from "@/lib/get-unique-values";
import { useTranslatedRoutes } from "@/lib/use-translated-routes";
import { useLocale } from "next-intl";

interface BrowseSectionProps {
  universities: University[];
}

export default function BrowseSection({ universities }: BrowseSectionProps) {
  const routes = useTranslatedRoutes();
  const locale = useLocale() as 'fi' | 'en' | 'sv';
  const uniqueUniversities = getUniqueUniversities(universities);
  const uniqueFields = getUniqueFields(universities);
  const uniqueColors = getUniqueColors(universities);
  const uniqueAreas = getUniqueAreas(universities);

  const popularUniversities = uniqueUniversities.slice(0, 8);
  const popularFields = uniqueFields.slice(0, 8);
  const popularColors = uniqueColors.slice(0, 6);
  const popularAreas = uniqueAreas.slice(0, 6);

  return (
    <div className="w-full max-w-6xl px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-8">
        Selaa haalarivärejä
      </h2>
      <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
        Tutustu haalariväreihin selaamalla yliopistoa, alaa, väriä tai aluetta.
        Voit myös käyttää hakua löytääksesi tarkemmat tiedot.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Yliopistot ja AMK:t</h3>
          <div className="flex flex-wrap gap-2">
            {popularUniversities.map((uni) => (
              <Link
                key={uni}
                href={routes.universities(getSlugForEntity(uni, locale, 'university'))}
                className="px-4 py-2 bg-green/10 text-green rounded hover:bg-green/20 transition text-sm"
              >
                {uni}
              </Link>
            ))}
          </div>
          {uniqueUniversities.length > popularUniversities.length && (
            <p className="text-sm text-gray-600 mt-4">
              + {uniqueUniversities.length - popularUniversities.length} muuta
              oppilaitosta
            </p>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Alat</h3>
          <div className="flex flex-wrap gap-2">
            {popularFields.map((field) => (
              <Link
                key={field}
                href={routes.fields(getSlugForEntity(field, locale, 'field'))}
                className="px-4 py-2 bg-green/10 text-green rounded hover:bg-green/20 transition text-sm"
              >
                {field}
              </Link>
            ))}
          </div>
          {uniqueFields.length > popularFields.length && (
            <p className="text-sm text-gray-600 mt-4">
              + {uniqueFields.length - popularFields.length} muuta alaa
            </p>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Värit</h3>
          <div className="flex flex-wrap gap-2">
            {popularColors.map((color) => (
              <Link
                key={color}
                href={routes.colors(getSlugForEntity(color, locale, 'color'))}
                className="px-4 py-2 bg-green/10 text-green rounded hover:bg-green/20 transition text-sm"
              >
                {color}
              </Link>
            ))}
          </div>
          {uniqueColors.length > popularColors.length && (
            <p className="text-sm text-gray-600 mt-4">
              + {uniqueColors.length - popularColors.length} muuta väriä
            </p>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Alueet</h3>
          <div className="flex flex-wrap gap-2">
            {popularAreas.map((area) => (
              <Link
                key={area}
                href={routes.areas(getSlugForEntity(area, locale, 'area'))}
                className="px-4 py-2 bg-green/10 text-green rounded hover:bg-green/20 transition text-sm"
              >
                {area}
              </Link>
            ))}
          </div>
          {uniqueAreas.length > popularAreas.length && (
            <p className="text-sm text-gray-600 mt-4">
              + {uniqueAreas.length - popularAreas.length} muuta aluetta
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
