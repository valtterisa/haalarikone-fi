'use client';

import { Github, Mail } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Logo from '@/components/logo';
import { useTranslations } from 'next-intl';
import DiscordLogo from './discord-logo';

export default function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="w-full border-t border-border/60 bg-white">
      <div className="container mx-auto flex w-full flex-col gap-10 px-4 pt-8 pb-4">
        <div className="flex flex-col w-full text-center md:flex-row items-center justify-center md:justify-between md:text-left">
          <div className="mx-auto max-w-xl md:mx-0 w-full flex flex-col items-center md:items-start">
            <Logo />

            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex gap-8 pt-6 md:pt-0">
            <div className="w-auto">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground text-left">
                {t('navigation')}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground text-left">
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
              </ul>
            </div>
            <div className="w-auto">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t('contact')}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="mailto:savonen.emppu@gmail.com"
                    aria-label={t('sendEmail')}
                    className="flex items-center gap-2 transition hover:text-green"
                  >
                    <Mail className="h-4 w-4" />
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
                    <Github className="h-4 w-4" />
                    {t('github')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/mNNYxtHSVr"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Join Discord"
                    className="flex items-center gap-2 transition hover:text-green"
                  >
                    <DiscordLogo className="h-4 w-4" />
                    Discord
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex justify-center border-t border-border/60 pt-4 text-center text-xs text-muted-foreground md:flex-row md:items-center ">
          <p>
            {t('builtBy')}{' '}
            <a
              href="https://valtterisavonen.fi"
              target="_blank"
              rel="noreferrer"
              className="font-semibold transition hover:text-green"
            >
              valtterisa
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
