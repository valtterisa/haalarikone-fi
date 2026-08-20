'use client';

import HubSearchSection from '@/components/hub-search-section';
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
    <HubSearchSection
      universities={universities}
      colorData={colorData}
      divider={
        <>
          {t('orSelect')} {tSection('title')}
        </>
      }
    />
  );
}
