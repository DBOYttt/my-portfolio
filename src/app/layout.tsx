import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { OWNER } from "@/lib/mock-data";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://yourdomain.com"
  ),
  title: {
    default: `${OWNER.name} — Software Engineer`,
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
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
