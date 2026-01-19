"use client";

import { Github, Mail } from "lucide-react";
import { Link } from "@/i18n/routing";
import Logo from "@/components/logo";
import { useTranslations } from "next-intl";
import DiscordLogo from "./discord-logo";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="w-full border-t border-border/60 bg-background">
      <div className="container mx-auto flex w-full flex-col gap-10 px-4 pb-4 pt-8">
        <div className="flex w-full flex-col items-center justify-center text-center md:flex-row md:justify-between md:text-left">
          <div className="mx-auto flex w-full max-w-xl flex-col items-center md:mx-0 md:items-start">
            <Logo />

            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <div className="flex gap-8 pt-6 md:pt-0">
            <div className="w-auto">
              <p className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("navigation")}
              </p>
              <ul className="mt-4 space-y-2 text-left text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/"
                    className="transition-colors hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {t("home")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="transition-colors hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {t("blog")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/vari"
                    className="transition-colors hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {t("colors")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ala"
                    className="transition-colors hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {t("fields")}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="w-auto">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("contact")}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="mailto:savonen.emppu@gmail.com"
                    aria-label={t("sendEmail")}
                    className="group flex items-center gap-2 transition-colors hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-green" />
                    {t("email")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com/valtterisa/student-overall-app"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t("openGithub")}
                    className="group flex items-center gap-2 transition-colors hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Github className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-green" />
                    {t("github")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://discord.gg/mNNYxtHSVr"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t("joinDiscord")}
                    className="group flex items-center gap-2 transition-colors hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <DiscordLogo className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-green" />
                    Discord
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-center border-t border-border/60 pt-4 text-center text-xs text-muted-foreground md:flex-row md:items-center">
          <p>
            {t("builtBy")}{" "}
            <Link
              href="https://valtterisavonen.fi"
              target="_blank"
              className="font-semibold transition-colors hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              valtterisa
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
