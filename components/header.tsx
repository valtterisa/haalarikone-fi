'use client';

import { Link } from '@/i18n/routing';
import { useRef, useState } from 'react';
import {
  List,
  X,
  Palette,
  Stack,
  GraduationCap,
  CaretDown,
  MapPin,
} from '@phosphor-icons/react';
import Logo from '@/components/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringDropdown = useRef(false);
  const closeByHoverRef = useRef(false);
  const t = useTranslations();
  const tNav = useTranslations('nav');
  const routes = useTranslatedRoutes();
  const pathname = usePathname();

  const closeMobileMenu = () => setMobileOpen(false);

  const handleDropdownHover = (isEntering: boolean) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    isHoveringDropdown.current = isEntering;
    if (isEntering) {
      setDropdownOpen(true);
      return;
    }
    closeTimeout.current = setTimeout(() => {
      isHoveringDropdown.current = false;
      closeByHoverRef.current = true;
      setDropdownOpen(false);
    }, 150);
  };

  const handleDropdownOpenChange = (open: boolean) => {
    if (open) {
      setDropdownOpen(true);
      return;
    }
    if (!isHoveringDropdown.current) {
      setDropdownOpen(false);
    }
  };

  const navLinks = [{ label: t('common.blog'), href: routes.blog() }];

  const dropdownLinks: {
    label: string;
    href: InternalHref;
    description: string;
    icon: typeof Palette;
    hubType: HubType;
  }[] = [
    {
      label: tNav('allColors'),
      href: routes.colors(),
      description: tNav('colorsDescription'),
      icon: Palette,
      hubType: 'color',
    },
    {
      label: tNav('allFields'),
      href: routes.fields(),
      description: tNav('fieldsDescription'),
      icon: Stack,
      hubType: 'field',
    },
    {
      label: tNav('allSchools'),
      href: routes.universities(),
      description: tNav('schoolsDescription'),
      icon: GraduationCap,
      hubType: 'university',
    },
    {
      label: tNav('allAreas'),
      href: routes.areas(),
      description: tNav('areasDescription'),
      icon: MapPin,
      hubType: 'area',
    },
  ];

  const isBlogActive = pathname === '/blog' || pathname.startsWith('/blog/');

  return (
    <header className="sticky top-0 z-sticky w-full border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="relative">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <div onClick={closeMobileMenu}>
            <Logo priority />
          </div>
          <div className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
            <DropdownMenu modal={false} open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
              <DropdownMenuTrigger asChild>
                <Button
                  id="header-categories-trigger"
                  variant="ghost"
                  size="sm"
                  className="h-11 min-h-11 gap-2 px-3 group data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                  onMouseEnter={() => handleDropdownHover(true)}
                  onMouseLeave={() => handleDropdownHover(false)}
                >
                  <span>{t('common.categories')}</span>
                  <CaretDown
                    className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180"
                    weight="regular"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                id="header-categories-content"
                align="start"
                sideOffset={0}
                onMouseEnter={() => handleDropdownHover(true)}
                onMouseLeave={() => handleDropdownHover(false)}
                onCloseAutoFocus={(e) => {
                  if (closeByHoverRef.current) {
                    e.preventDefault();
                    closeByHoverRef.current = false;
                  }
                }}
                className="relative w-80 rounded-xl border-border/60 p-2 pt-3 shadow-overlay before:pointer-events-auto before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:content-['']"
              >
                {dropdownLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <DropdownMenuItem
                      key={`kategoriat-${internalHrefKey(link.href)}`}
                      asChild
                      className="rounded-lg p-0 focus:bg-transparent"
                    >
                      <Link
                        href={link.href}
                        className="group/item flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-green/10 focus:bg-green/10 focus-visible:ring-2 focus-visible:ring-green"
                        onClick={() => {
                          trackHubClick('header', link.hubType, 'index');
                        }}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-green transition-colors group-hover/item:bg-green group-hover/item:text-white">
                          <Icon className="h-5 w-5" weight="regular" />
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {link.label}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {link.description}
                          </span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            {navLinks.map((link) => (
              <Link
                key={internalHrefKey(link.href)}
                href={link.href}
                className={`transition-colors hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${
                  isBlogActive ? 'text-foreground' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
            <LanguageSwitcher instanceId="desktop" />
            <ThemeSwitcher />
          </div>
          <div className="flex items-center gap-1 md:hidden">
            <ThemeSwitcher />
            <LanguageSwitcher instanceId="mobile" />
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border/80 text-muted-foreground transition-colors hover:border-green hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
              aria-label={mobileOpen ? tNav('closeMenu') : tNav('openMenu')}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" weight="regular" />
              ) : (
                <List className="h-5 w-5" weight="regular" />
              )}
            </button>
          </div>
        </nav>
        {mobileOpen && (
          <div className="absolute inset-x-0 top-full border-t border-border/60 bg-background shadow-overlay md:hidden">
            <div className="container mx-auto px-4 py-5">
              <div className="rounded-xl border border-border/40 bg-card p-5">
                <div className="space-y-6">
                  <div className="grid gap-3">
                    {dropdownLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={`mobile-nav-${internalHrefKey(link.href)}`}
                          href={link.href}
                          className="flex min-h-11 items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-foreground transition hover:border-green hover:bg-green/10"
                          onClick={() => {
                            trackHubClick('header', link.hubType, 'index');
                            closeMobileMenu();
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background text-green">
                              <Icon className="h-4 w-4" weight="regular" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">{link.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {link.description}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  {navLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {navLinks.map((link) => (
                        <Link
                          key={`mobile-nav-${internalHrefKey(link.href)}`}
                          href={link.href}
                          className="rounded-full border border-border/60 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-green hover:bg-green/10 hover:text-green"
                          onClick={closeMobileMenu}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
