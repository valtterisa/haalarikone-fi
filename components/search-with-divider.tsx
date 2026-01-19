"use client";

import { SearchModal } from "./search-modal";
import { useTranslations } from 'next-intl';

interface SearchWithDividerProps {
    section: 'fields' | 'colors' | 'universities';
    dividerText?: string;
}

export function SearchWithDivider({ section, dividerText }: SearchWithDividerProps) {
    const t = useTranslations('search');
    const tSection = useTranslations(section);
    
    const displayDividerText = dividerText ?? (t('orSelect') + ' ' + tSection('title').toUpperCase());

    return (
        <>
            <div className="mb-8 flex justify-center">
                <SearchModal
                    triggerLabel={t('title')}
                    placeholder={t('searchPlaceholder')}
                    modalTitle={t('title')}
                />
            </div>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">{displayDividerText}</span>
                </div>
            </div>
        </>
    );
}

