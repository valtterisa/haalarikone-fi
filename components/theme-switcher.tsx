'use client';

import { Button } from '@/components/ui/button';
import { MoonIcon, SunIcon } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('theme');
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-11 min-h-11 w-11 px-0"
        aria-label={t('label')}
        disabled
      />
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-11 min-h-11 w-11 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
      aria-label={isDark ? t('light') : t('dark')}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <SunIcon size={16} weight="regular" /> : <MoonIcon size={16} weight="regular" />}
    </Button>
  );
}
