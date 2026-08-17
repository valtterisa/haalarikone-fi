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
import { Check, CaretDown } from '@phosphor-icons/react';
import { useState } from 'react';
import type { Locale } from '@/lib/slug-translations';
import { resolveLocaleSwitchHref } from '@/lib/locale-switch-navigation';

const languages: { code: Locale; name: string; flag: string }[] = [
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
];

type LanguageSwitcherProps = {
  instanceId: string;
};

export function LanguageSwitcher({ instanceId }: LanguageSwitcherProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isTranslating, setIsTranslating] = useState(false);

  const localeFromParams = params?.locale as string | undefined;
  const localeFromHook = useLocale();
  const locale: Locale = (localeFromParams || localeFromHook || 'fi') as Locale;

  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];
  const triggerId = `language-switcher-trigger-${instanceId}`;
  const contentId = `language-switcher-content-${instanceId}`;

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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          id={triggerId}
          variant="ghost"
          size="sm"
          className="h-11 min-h-11 gap-1.5 px-2 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground group data-[state=open]:bg-transparent data-[state=open]:text-foreground sm:gap-2 sm:px-2.5"
        >
          <span className="text-base leading-none">{currentLanguage.flag}</span>
          <span className="hidden text-xs font-semibold tracking-wide sm:inline">
            {currentLanguage.code.toUpperCase()}
          </span>
          <CaretDown className="h-3.5 w-3.5 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" weight="regular" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        id={contentId}
        align="end"
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-48 rounded-xl border-border/60 p-1.5 shadow-overlay"
      >
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              disabled={isTranslating}
              className={`cursor-pointer rounded-lg px-2.5 py-2.5 transition-colors focus:bg-green/10 ${
                isActive
                  ? 'bg-green/10 text-foreground'
                  : 'text-muted-foreground hover:bg-green/10 hover:text-foreground'
              }`}
            >
              <span className="mr-2.5 text-lg leading-none">{lang.flag}</span>
              <span className="flex-1 text-sm font-semibold">{lang.name}</span>
              {isActive && !isTranslating && <Check className="h-4 w-4 shrink-0 text-green" weight="regular" />}
              {isTranslating && !isActive && (
                <div className="h-4 w-4 shrink-0 rounded-full border-2 border-green border-t-transparent animate-spin" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
