'use client';

import HubSearchSection from '@/components/hub-search-section';
import type { University } from '@/types/university';
import type { ColorData } from '@/lib/load-color-data';
import { useTranslations } from 'next-intl';

interface FieldSearchSectionProps {
  universities: University[];
  colorData: ColorData;
}

export default function FieldSearchSection({ universities, colorData }: FieldSearchSectionProps) {
  const t = useTranslations('search');
  const tSection = useTranslations('fields');

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
