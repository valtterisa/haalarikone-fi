'use client';

import { Link } from '@/i18n/routing';
import { useState, type ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import {
  ListIcon,
  XIcon,
  PaletteIcon,
  StackIcon,
  GraduationCapIcon,
  MapPinIcon,
  NewspaperIcon,
} from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Logo from '@/components/logo';
import { PAGE_WIDTH } from '@/components/page';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';
import { trackHubClick, type HubType } from '@/lib/analytics-events';
import { useTranslatedRoutes, type InternalHref } from '@/lib/use-translated-routes';
import { usePathname } from '@/i18n/routing';

function internalHrefKey(href: InternalHref): string {
  if (typeof href === 'string') return href;
  return `${href.pathname}:${href.params.slug}`;
}

function pathMatches(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

type CategoryLink = {
  label: string;
  shortLabel: string;
  href: InternalHref;
  description: string;
  icon: Icon;
  hubType: HubType;
  matchRoot: string;
};

export function HeaderCategoryLink({
  link,
  onNavigate,
}: {
  link: CategoryLink;
  onNavigate?: () => void;
}) {
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      className="group flex items-center gap-3 py-4 text-foreground transition-colors active:scale-[0.98]"
      onClick={() => {
        trackHubClick('header', link.hubType, 'index');
        onNavigate?.();
      }}
    >
      <Icon className="h-6 w-6 shrink-0 text-green" weight="regular" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-3xl font-semibold tracking-tight leading-[1.1] transition-colors group-hover:text-green">
          {link.label}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{link.description}</span>
      </span>
    </Link>
  );
}

export function HeaderCategories({
  links,
  onNavigate,
}: {
  links: CategoryLink[];
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col divide-y divide-border" aria-label="Categories">
      {links.map((link) => (
        <Header.CategoryLink
          key={`mobile-nav-${internalHrefKey(link.href)}`}
          link={link}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export function HeaderDesktopNav({
  links,
  blogHref,
  blogLabel,
  pathname,
}: {
  links: CategoryLink[];
  blogHref: InternalHref;
  blogLabel: string;
  pathname: string;
}) {
  return (
    <nav
      className="flex items-center gap-1 text-[13px] font-semibold tracking-tight"
      aria-label="Primary"
    >
      {links.map((link) => {
        const active = pathMatches(pathname, link.matchRoot);
        return (
          <Link
            key={internalHrefKey(link.href)}
            href={link.href}
            onClick={() => trackHubClick('header', link.hubType, 'index')}
            className={cn(
              'relative rounded-lg px-2.5 py-2 transition-colors duration-200 ease-smooth',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green',
              active
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {link.shortLabel}
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-green transition-opacity duration-200',
                active ? 'opacity-100' : 'opacity-0',
              )}
            />
          </Link>
        );
      })}
      <Link
        href={blogHref}
        className={cn(
          'relative rounded-lg px-2.5 py-2 transition-colors duration-200 ease-smooth',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green',
          pathMatches(pathname, '/blog')
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {blogLabel}
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-green transition-opacity duration-200',
            pathMatches(pathname, '/blog') ? 'opacity-100' : 'opacity-0',
          )}
        />
      </Link>
    </nav>
  );
}

export function HeaderNavLinks({
  links,
  onNavigate,
}: {
  links: { label: string; href: InternalHref }[];
  onNavigate?: () => void;
}) {
  if (links.length === 0) return null;

  return (
    <nav className="flex flex-col border-t border-border pt-2" aria-label="Pages">
      {links.map((link) => (
        <Link
          key={`mobile-nav-${internalHrefKey(link.href)}`}
          href={link.href}
          className="group flex items-center gap-3 py-4 text-foreground transition-colors hover:text-green active:scale-[0.98]"
          onClick={onNavigate}
        >
          <NewspaperIcon
            className="h-6 w-6 shrink-0 text-green"
            weight="regular"
            aria-hidden="true"
          />
          <span className="text-3xl font-semibold tracking-tight leading-[1.1]">
            {link.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}

export function HeaderRoot() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const t = useTranslations();
  const tNav = useTranslations('nav');
  const tFooter = useTranslations('footer');
  const routes = useTranslatedRoutes();
  const pathname = usePathname();

  const closeMobileMenu = () => setMobileOpen(false);

  const navLinks = [{ label: t('common.blog'), href: routes.blog() }];

  const categoryLinks: CategoryLink[] = [
    {
      label: tNav('allColors'),
      shortLabel: tFooter('colors'),
      href: routes.colors(),
      description: tNav('colorsDescription'),
      icon: PaletteIcon,
      hubType: 'color',
      matchRoot: '/vari',
    },
    {
      label: tNav('allFields'),
      shortLabel: tFooter('fields'),
      href: routes.fields(),
      description: tNav('fieldsDescription'),
      icon: StackIcon,
      hubType: 'field',
      matchRoot: '/ala',
    },
    {
      label: tNav('allSchools'),
      shortLabel: tFooter('schools'),
      href: routes.universities(),
      description: tNav('schoolsDescription'),
      icon: GraduationCapIcon,
      hubType: 'university',
      matchRoot: '/oppilaitos',
    },
    {
      label: tNav('allAreas'),
      shortLabel: tFooter('areas'),
      href: routes.areas(),
      description: tNav('areasDescription'),
      icon: MapPinIcon,
      hubType: 'area',
      matchRoot: '/alue',
    },
  ];

  return (
    <header className="sticky top-0 z-sticky w-full border-b border-border bg-background/92 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="relative">
        <div className={cn(PAGE_WIDTH, 'flex h-16 items-center gap-4')}>
          <div className="shrink-0" onClick={closeMobileMenu}>
            <Logo priority />
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex">
            <Header.DesktopNav
              links={categoryLinks}
              blogHref={routes.blog()}
              blogLabel={t('common.blog')}
              pathname={pathname}
            />
            <span aria-hidden="true" className="h-5 w-px bg-border" />
            <div className="flex items-center gap-0.5">
              <LanguageSwitcher instanceId="desktop" />
              <ThemeSwitcher />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-0.5 md:hidden">
            <ThemeSwitcher />
            <LanguageSwitcher instanceId="mobile" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-11 min-h-11 w-11 shrink-0 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
              aria-label={mobileOpen ? tNav('closeMenu') : tNav('openMenu')}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <span className="relative block h-5 w-5">
                <motion.span
                  className="absolute inset-0 flex items-center justify-center"
                  initial={false}
                  animate={
                    reduceMotion
                      ? { opacity: mobileOpen ? 0 : 1 }
                      : {
                          opacity: mobileOpen ? 0 : 1,
                          rotate: mobileOpen ? 90 : 0,
                          scale: mobileOpen ? 0.65 : 1,
                        }
                  }
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden={mobileOpen}
                >
                  <ListIcon className="h-5 w-5" weight="regular" aria-hidden="true" />
                </motion.span>
                <motion.span
                  className="absolute inset-0 flex items-center justify-center"
                  initial={false}
                  animate={
                    reduceMotion
                      ? { opacity: mobileOpen ? 1 : 0 }
                      : {
                          opacity: mobileOpen ? 1 : 0,
                          rotate: mobileOpen ? 0 : -90,
                          scale: mobileOpen ? 1 : 0.65,
                        }
                  }
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden={!mobileOpen}
                >
                  <XIcon className="h-5 w-5" weight="regular" aria-hidden="true" />
                </motion.span>
              </span>
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {mobileOpen && (
            <Header.MobileMenu reduceMotion={!!reduceMotion}>
              <Header.Categories links={categoryLinks} onNavigate={closeMobileMenu} />
              <Header.NavLinks links={navLinks} onNavigate={closeMobileMenu} />
            </Header.MobileMenu>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export function HeaderMobileMenu({
  children,
  reduceMotion = false,
}: {
  children: ReactNode;
  reduceMotion?: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-x-0 top-full origin-top overflow-hidden border-b border-border bg-background md:hidden"
      initial={reduceMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className={cn(PAGE_WIDTH, 'space-y-2 py-1')}
        initial={reduceMotion ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.32, delay: reduceMotion ? 0 : 0.04, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export const Header = Object.assign(HeaderRoot, {
  Categories: HeaderCategories,
  CategoryLink: HeaderCategoryLink,
  DesktopNav: HeaderDesktopNav,
  NavLinks: HeaderNavLinks,
  MobileMenu: HeaderMobileMenu,
});

export default Header;
