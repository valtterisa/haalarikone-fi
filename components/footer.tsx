'use client';

import { EnvelopeSimpleIcon, GithubLogoIcon } from '@phosphor-icons/react';
import { Link } from '@/i18n/routing';
import Logo from '@/components/logo';
import { useTranslations } from 'next-intl';
import DiscordLogo from './discord-logo';
import { useTranslatedRoutes, type InternalHref } from '@/lib/use-translated-routes';
import { trackHubClick, type HubType } from '@/lib/analytics-events';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const routes = useTranslatedRoutes();

  const hubLinks: {
    href: InternalHref;
    label: string;
    description: string;
    type: HubType;
  }[] = [
    {
      href: routes.colors(),
      label: t('colors'),
      description: tNav('colorsDescription'),
      type: 'color',
    },
    {
      href: routes.fields(),
      label: t('fields'),
      description: tNav('fieldsDescription'),
      type: 'field',
    },
    {
      href: routes.universities(),
      label: t('schools'),
      description: tNav('schoolsDescription'),
      type: 'university',
    },
    {
      href: routes.areas(),
      label: t('areas'),
      description: tNav('areasDescription'),
      type: 'area',
    },
  ];

  return (
    <footer className="w-full border-t border-border/60 bg-background">
      <div className="container mx-auto flex w-full flex-col gap-10 px-4 pb-6 pt-10">
        <div className="flex w-full flex-col items-center justify-center text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div className="mx-auto flex w-full max-w-xl flex-col items-center md:mx-0 md:items-start">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex gap-8 pt-6 md:gap-10 md:pt-0">
            <div className="w-auto text-left">
              <p className="text-sm font-semibold text-foreground">{t('navigation')}</p>
              <ul className="mt-2">
                <li>
                  <Link
                    href={routes.blog()}
                    prefetch={false}
                    className="group flex flex-col py-1 text-left transition hover:text-green"
                  >
                    <span className="text-sm font-medium text-foreground group-hover:text-green">
                      {t('blog')}
                    </span>
                    <span className="text-xs text-muted-foreground">{tNav('blogDescription')}</span>
                  </Link>
                </li>
                {hubLinks.map((link) => (
                  <li key={link.type}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="group flex flex-col py-1 text-left transition hover:text-green"
                      onClick={() => {
                        trackHubClick('footer', link.type, 'index');
                      }}
                    >
                      <span className="text-sm font-medium text-foreground group-hover:text-green">
                        {link.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{link.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-auto text-left">
              <p className="text-sm font-semibold text-foreground">{t('contact')}</p>
              <ul className="mt-2 space-y-0 text-sm text-muted-foreground">
                <li>
                  <a
                    href="mailto:savonen.emppu@gmail.com"
                    aria-label={t('sendEmail')}
                    className="flex items-center gap-2 py-1 transition hover:text-green"
                  >
                    <EnvelopeSimpleIcon className="h-4 w-4" weight="regular" />
                    {t('email')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/valtterisa/student-overall-app"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t('openGithub')}
                    className="flex items-center gap-2 py-1 transition hover:text-green"
                  >
                    <GithubLogoIcon className="h-4 w-4" weight="regular" />
                    {t('github')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/mNNYxtHSVr"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t('discordJoin')}
                    className="flex items-center gap-2 py-1 transition hover:text-green"
                  >
                    <DiscordLogo className="h-4 w-4" />
                    {t('discord')}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground md:flex-row">
          <p>
            Made by{' '}
            <a
              href="https://valtterisavonen.fi"
              target="_blank"
              rel="noreferrer"
              className="font-semibold transition hover:text-green"
            >
              valtterisa
            </a>
          </p>
          <div className="flex gap-4">
            <Link href="/tietosuoja" className="inline-flex min-h-11 items-center transition hover:text-green">
              {t('privacy')}
            </Link>
            <Link href="/kayttoehdot" className="inline-flex min-h-11 items-center transition hover:text-green">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
