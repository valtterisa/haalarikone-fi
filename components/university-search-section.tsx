'use client';

import SearchContainer from '@/components/search-container';
import type { University } from '@/types/university';
import type { ColorData } from '@/lib/load-color-data';
import { useTranslations } from 'next-intl';

interface UniversitySearchSectionProps {
  universities: University[];
  colorData: ColorData;
}

export default function UniversitySearchSection({
  universities,
  colorData,
}: UniversitySearchSectionProps) {
  const t = useTranslations('search');
  const tSection = useTranslations('universities');

  return (
    <>
      <SearchContainer
        initialUniversities={universities}
        colorData={colorData}
        initialInlineResultsCount={5}
      />
      <div className="relative my-8 max-w-3xl w-full mx-auto px-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('orSelect')} {tSection('title')}
          </span>
        </div>
      </div>
    </>
  );
}
