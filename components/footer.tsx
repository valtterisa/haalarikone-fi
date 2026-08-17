'use client';

import { GithubLogo, EnvelopeSimple } from '@phosphor-icons/react';
import { Link } from '@/i18n/routing';
import Logo from '@/components/logo';
import { useTranslations } from 'next-intl';
import DiscordLogo from './discord-logo';
import { useTranslatedRoutes } from '@/lib/use-translated-routes';
import { trackHubClick } from '@/lib/analytics-events';

export default function Footer() {
  const t = useTranslations('footer');
  const routes = useTranslatedRoutes();
  return (
    <footer className="w-full border-t border-border/60 bg-background">
      <div className="container mx-auto flex w-full flex-col gap-10 px-4 pb-6 pt-10">
        <div className="flex w-full flex-col items-center justify-center text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div className="mx-auto flex w-full max-w-xl flex-col items-center md:mx-0 md:items-start">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex gap-10 pt-6 md:pt-0">
            <div className="w-auto">
              <p className="text-left text-sm font-semibold text-foreground">{t('navigation')}</p>
              <ul className="mt-4 space-y-2 text-left text-sm text-muted-foreground">
                <li>
                  <Link href="/" prefetch={false} className="transition hover:text-green">
                    {t('home')}
                  </Link>
                </li>
                <li>
                  <Link href="/blog" prefetch={false} className="transition hover:text-green">
                    {t('blog')}
                  </Link>
                </li>
                <li>
                  <Link href="/vari" prefetch={false} className="transition hover:text-green">
                    {t('colors')}
                  </Link>
                </li>
                <li>
                  <Link href="/ala" prefetch={false} className="transition hover:text-green">
                    {t('fields')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={routes.universities()}
                    prefetch={false}
                    className="inline-flex min-h-11 items-center transition hover:text-green"
                    onClick={() => {
                      trackHubClick('footer', 'university', 'index');
                    }}
                  >
                    {t('schools')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={routes.areas()}
                    prefetch={false}
                    className="inline-flex min-h-11 items-center transition hover:text-green"
                    onClick={() => {
                      trackHubClick('footer', 'area', 'index');
                    }}
                  >
                    {t('areas')}
                  </Link>
                </li>
              </ul>
            </div>
            <div className="w-auto">
              <p className="text-sm font-semibold text-foreground">{t('contact')}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="mailto:savonen.emppu@gmail.com"
                    aria-label={t('sendEmail')}
                    className="flex items-center gap-2 transition hover:text-green"
                  >
                    <EnvelopeSimple className="h-4 w-4" weight="regular" />
                    {t('email')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/valtterisa/student-overall-app"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t('openGithub')}
                    className="flex items-center gap-2 transition hover:text-green"
                  >
                    <GithubLogo className="h-4 w-4" weight="regular" />
                    {t('github')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/mNNYxtHSVr"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t('discordJoin')}
                    className="flex items-center gap-2 transition hover:text-green"
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
            <Link href="/tietosuoja" className="transition hover:text-green">
              {t('privacy')}
            </Link>
            <Link href="/kayttoehdot" className="transition hover:text-green">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
