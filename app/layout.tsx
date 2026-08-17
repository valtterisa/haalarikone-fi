import { Arvo } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { getLocale } from "next-intl/server";
import Script from "next/script";

const arvo = Arvo({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning className={`${GeistSans.variable} ${arvo.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={GeistSans.className}>
        {children}
      </body>
    </html>
  );
}
