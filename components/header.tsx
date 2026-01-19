"use client";

import { Link } from "@/i18n/routing";
import { useState } from "react";
import { Menu, X, Palette, Layers, GraduationCap, ChevronDown } from "lucide-react";
import Logo from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './language-switcher';
import { useTranslatedRoutes } from '@/lib/use-translated-routes';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations();
  const tNav = useTranslations('nav');
  const routes = useTranslatedRoutes();

  const closeMobileMenu = () => setMobileOpen(false);

  const navLinks = [{ label: t('common.blog'), href: routes.blog() }];

  const dropdownLinks = [
    {
      label: tNav('allColors'),
      href: routes.colors(),
      description: tNav('colorsDescription'),
      icon: Palette,
    },
    {
      label: tNav('allFields'),
      href: routes.fields(),
      description: tNav('fieldsDescription'),
      icon: Layers,
    },
    {
      label: tNav('allSchools'),
      href: routes.universities(),
      description: tNav('schoolsDescription'),
      icon: GraduationCap,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-white/90 backdrop-blur">
      <div className="relative">
        <nav className="container mx-auto flex items-center justify-between px-4 py-4">
          <div onClick={closeMobileMenu}>
            <Logo priority />
          </div>
          <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 h-9 px-3 focus-visible:ring-0 focus-visible:ring-offset-0 group"
                >
                  <span>{t('common.categories')}</span>
                  <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {dropdownLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <DropdownMenuItem key={`kategoriat-${link.href}`} asChild>
                      <Link
                        href={link.href}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{link.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-green transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-border/80 p-2 text-muted-foreground transition-colors hover:border-green hover:text-green focus:outline-none focus:ring-2 focus:ring-green/40"
              aria-label={mobileOpen ? tNav('closeMenu') : tNav('openMenu')}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          </div>
        </nav>
        {mobileOpen && (
          <div className="absolute inset-x-0 top-full border-t border-border/60 bg-gradient-to-b from-white via-white to-white/95 shadow-[0_40px_80px_rgba(15,23,42,0.18)] md:hidden">
            <div className="container mx-auto px-4 py-5">
              <div className="rounded-3xl border border-border/40 bg-white/95 p-5 shadow-lg ring-1 ring-black/5">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {tNav('navigate')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tNav('navigateDescription')}
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {dropdownLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={`mobile-dropdown-${link.href}`}
                          href={link.href}
                          className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-foreground transition hover:border-green hover:bg-green/10"
                          onClick={closeMobileMenu}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-green shadow-inner">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">
                                {link.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {link.description}
                              </span>
                            </div>
                          </div>
                          <span className="text-lg text-muted-foreground">
                            ↗
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                  {navLinks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {tNav('otherPages')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {navLinks.map((link) => (
                          <Link
                            key={`mobile-nav-${link.href}`}
                            href={link.href}
                            className="rounded-full border border-border/60 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-green hover:bg-green/10 hover:text-green"
                            onClick={closeMobileMenu}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
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
