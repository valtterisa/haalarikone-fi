'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@/lib/slug-translations';
import { resolveLocaleSwitchHref } from '@/lib/locale-switch-navigation';

const languages: { code: Locale; name: string; flag: string }[] = [
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
];

export function LanguageSwitcher() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isTranslating, setIsTranslating] = useState(false);

  const localeFromParams = params?.locale as string | undefined;
  const localeFromHook = useLocale();
  const locale: Locale = (localeFromParams || localeFromHook || 'fi') as Locale;

  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  const switchLocale = (newLocale: Locale) => {
    if (isTranslating) return;

    setIsTranslating(true);
    try {
      if (pathname === '/') {
        router.replace('/', { locale: newLocale });
      } else {
        const nextParams = params as Record<string, string | string[] | undefined>;
        const translated = resolveLocaleSwitchHref(pathname, nextParams, locale, newLocale);
        if (translated) {
          router.replace(translated as never, { locale: newLocale });
        } else {
          router.replace({ pathname, params } as never, { locale: newLocale });
        }
      }
    } catch (error) {
      console.error('Error switching locale:', error);
      router.replace('/', { locale: newLocale });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 h-9 px-3 border border-border/60 focus-visible:ring-0 focus-visible:ring-offset-0 group"
        >
          <span className="text-lg">{currentLanguage.flag}</span>
          <span className="hidden sm:inline">{currentLanguage.code.toUpperCase()}</span>
          <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLocale(lang.code)}
            className="cursor-pointer"
            disabled={isTranslating}
          >
            <span className="text-lg mr-2">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {locale === lang.code && !isTranslating && <Check className="h-4 w-4 text-green" />}
            {isTranslating && locale !== lang.code && (
              <div className="h-4 w-4 border-2 border-green border-t-transparent rounded-full animate-spin" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
