import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['fi', 'en', 'sv'],
  defaultLocale: 'fi',
  localePrefix: 'as-needed',
  localeDetection: false,
  pathnames: {
    '/': '/',
    '/ala': { fi: '/ala', en: '/fields', sv: '/omraden' },
    '/ala/[slug]': { fi: '/ala/[slug]', en: '/fields/[slug]', sv: '/omraden/[slug]' },
    '/vari': { fi: '/vari', en: '/colors', sv: '/farger' },
    '/vari/[slug]': { fi: '/vari/[slug]', en: '/colors/[slug]', sv: '/farger/[slug]' },
    '/oppilaitos': { fi: '/oppilaitos', en: '/institutions', sv: '/institutioner' },
    '/oppilaitos/[slug]': {
      fi: '/oppilaitos/[slug]',
      en: '/institutions/[slug]',
      sv: '/institutioner/[slug]',
    },
    '/alue': { fi: '/alue', en: '/areas', sv: '/regioner' },
    '/alue/[slug]': { fi: '/alue/[slug]', en: '/areas/[slug]', sv: '/regioner/[slug]' },
    '/haalari/[slug]': { fi: '/haalari/[slug]', en: '/overall/[slug]', sv: '/overaller/[slug]' },
    '/blog': { fi: '/blog', en: '/blog', sv: '/blogg' },
    '/blog/[slug]': { fi: '/blog/[slug]', en: '/blog/[slug]', sv: '/blogg/[slug]' },
    '/tietosuoja': { fi: '/tietosuoja', en: '/privacy', sv: '/integritet' },
    '/kayttoehdot': { fi: '/kayttoehdot', en: '/terms', sv: '/villkor' },
  },
});

export const { Link, redirect, usePathname, useRouter, getPathname, permanentRedirect } =
  createNavigation(routing);
