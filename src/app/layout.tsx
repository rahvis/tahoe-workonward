import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Sans, Montserrat } from "next/font/google";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import "./globals.css";
import "./tahoe-theme.css";
import PublicGoogleAnalytics from "@/components/analytics/PublicGoogleAnalytics";
import PublicCookieConsent from "@/components/consent/PublicCookieConsent";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "TahoeAI - AI-Powered Talent Intelligence",
  description: "Find the perfect candidates with AI-powered search and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${montserrat.variable} ${instrumentSans.variable}`}>
        <PublicGoogleAnalytics />
        <PublicCookieConsent />
        {children}
      </body>
    </html>
  );
}
