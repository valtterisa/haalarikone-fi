'use client';

import { SearchModal } from './search-modal';
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
          triggerLabel={t('title')}
          placeholder={t('searchPlaceholder')}
          modalTitle={t('title')}
          clientSearchContext={clientSearchContext}
        />
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">{displayDividerText}</span>
        </div>
      </div>
    </>
  );
}
