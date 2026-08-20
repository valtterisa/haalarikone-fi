'use client';

import HubSearchSection from '@/components/hub-search-section';
import type { University } from '@/types/university';
import type { ColorData } from '@/lib/load-color-data';
import { useTranslations } from 'next-intl';

interface VariSearchSectionProps {
  universities: University[];
  colorData: ColorData;
}

export default function VariSearchSection({ universities, colorData }: VariSearchSectionProps) {
  const t = useTranslations('search');
  const tSection = useTranslations('colors');

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
