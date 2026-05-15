import type { Metadata } from "next";
import { Newsreader, Inter_Tight, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { OWNER } from "@/lib/mock-data";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://yourdomain.com"
  ),
  title: {
    default: `${OWNER.name} — Logbook`,
    template: `%s | ${OWNER.name}`,
  },
  description: OWNER.bio[0],
  keywords: ["software engineer", "robotics", "embedded systems", "portfolio", OWNER.name],
  authors: [{ name: OWNER.name }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: `${OWNER.name} — Portfolio`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={`${newsreader.variable} ${interTight.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Script
          id="logbook-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('logbook-theme');document.documentElement.setAttribute('data-theme',t||'dark');}catch(e){}})()`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
