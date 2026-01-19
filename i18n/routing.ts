import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['fi', 'en', 'sv'],
  defaultLocale: 'fi',
  localePrefix: 'as-needed',
  localeDetection: false
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

