'use client';

import { SearchModal } from './search-modal';
import { SearchDivider } from './search-filter-parts';
import { useTranslations } from 'next-intl';
import type { ClientSearchContext } from '@/lib/search-utils';

interface SearchWithDividerProps {
  section: 'fields' | 'colors' | 'universities';
  dividerText?: string;
  clientSearchContext?: ClientSearchContext;
}

export function SearchWithDivider({
  section,
  dividerText,
  clientSearchContext,
}: SearchWithDividerProps) {
  const t = useTranslations('search');
  const tSection = useTranslations(section);

  const displayDividerText = dividerText ?? `${t('orSelect')} ${tSection('title')}`;

  return (
    <>
      <div className="mb-8 flex justify-center">
        <SearchModal
          placeholder={t('searchPlaceholder')}
          modalTitle={t('title')}
          clientSearchContext={clientSearchContext}
        >
          <SearchModal.Trigger>{t('title')}</SearchModal.Trigger>
          <SearchModal.Content />
        </SearchModal>
      </div>
      <SearchDivider>{displayDividerText}</SearchDivider>
    </>
  );
}
