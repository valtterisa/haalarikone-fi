'use client';

import { EnvelopeSimple, GithubLogo } from '@phosphor-icons/react';
import { Link } from '@/i18n/routing';
import Logo from '@/components/logo';
import { PAGE_WIDTH } from '@/components/page';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import DiscordLogo from './discord-logo';
import { useTranslatedRoutes, type InternalHref } from '@/lib/use-translated-routes';
import { trackHubClick, type HubType } from '@/lib/analytics-events';

type FooterHubLink = {
  href: InternalHref;
  label: string;
  description: string;
  type: HubType;
};

export function FooterRoot() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const routes = useTranslatedRoutes();

  const hubLinks: FooterHubLink[] = [
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
      <div className={cn(PAGE_WIDTH, 'flex flex-col gap-10 pb-6 pt-10')}>
        <div className="flex w-full flex-col items-center justify-center text-center md:flex-row md:items-start md:justify-between md:text-left">
          <Footer.Brand description={t('description')} />
          <div className="flex gap-8 pt-6 md:gap-10 md:pt-0">
            <Footer.Nav
              title={t('navigation')}
              blogLabel={t('blog')}
              blogDescription={tNav('blogDescription')}
              blogHref={routes.blog()}
              hubLinks={hubLinks}
            />
            <Footer.Contact
              title={t('contact')}
              emailLabel={t('email')}
              emailAria={t('sendEmail')}
              githubLabel={t('github')}
              githubAria={t('openGithub')}
              discordLabel={t('discord')}
              discordAria={t('discordJoin')}
            />
          </div>
        </div>
        <Footer.Meta
          builtBy={t('builtBy')}
          privacyLabel={t('privacy')}
          termsLabel={t('terms')}
        />
      </div>
    </footer>
  );
}

export function FooterBrand({ description }: { description: string }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center md:mx-0 md:items-start">
      <Logo />
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function FooterNav({
  title,
  blogLabel,
  blogDescription,
  blogHref,
  hubLinks,
}: {
  title: string;
  blogLabel: string;
  blogDescription: string;
  blogHref: InternalHref;
  hubLinks: FooterHubLink[];
}) {
  return (
    <div className="w-auto text-left">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ul className="mt-2">
        <li>
          <Link
            href={blogHref}
            prefetch={false}
            className="group flex flex-col py-1 text-left transition hover:text-green"
          >
            <span className="text-sm font-medium text-foreground group-hover:text-green">
              {blogLabel}
            </span>
            <span className="text-xs text-muted-foreground">{blogDescription}</span>
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
  );
}

export function FooterContact({
  title,
  emailLabel,
  emailAria,
  githubLabel,
  githubAria,
  discordLabel,
  discordAria,
}: {
  title: string;
  emailLabel: string;
  emailAria: string;
  githubLabel: string;
  githubAria: string;
  discordLabel: string;
  discordAria: string;
}) {
  return (
    <div className="w-auto text-left">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ul className="mt-2 space-y-0 text-sm text-muted-foreground">
        <li>
          <a
            href="mailto:savonen.emppu@gmail.com"
            aria-label={emailAria}
            className="flex items-center gap-2 py-1 transition hover:text-green"
          >
            <EnvelopeSimple className="h-4 w-4" weight="regular" />
            {emailLabel}
          </a>
        </li>
        <li>
          <a
            href="https://github.com/valtterisa/student-overall-app"
            target="_blank"
            rel="noreferrer"
            aria-label={githubAria}
            className="flex items-center gap-2 py-1 transition hover:text-green"
          >
            <GithubLogo className="h-4 w-4" weight="regular" />
            {githubLabel}
          </a>
        </li>
        <li>
          <a
            href="https://discord.gg/mNNYxtHSVr"
            target="_blank"
            rel="noreferrer"
            aria-label={discordAria}
            className="flex items-center gap-2 py-1 transition hover:text-green"
          >
            <DiscordLogo className="h-4 w-4" />
            {discordLabel}
          </a>
        </li>
      </ul>
    </div>
  );
}

export function FooterMeta({
  builtBy,
  privacyLabel,
  termsLabel,
}: {
  builtBy: string;
  privacyLabel: string;
  termsLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground md:flex-row">
      <p>
        {builtBy}{' '}
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
          {privacyLabel}
        </Link>
        <Link href="/kayttoehdot" className="inline-flex min-h-11 items-center transition hover:text-green">
          {termsLabel}
        </Link>
      </div>
    </div>
  );
}

export const Footer = Object.assign(FooterRoot, {
  Brand: FooterBrand,
  Nav: FooterNav,
  Contact: FooterContact,
  Meta: FooterMeta,
});

export default Footer;
