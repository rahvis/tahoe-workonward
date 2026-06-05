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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://tahoe.ai"),
  applicationName: "Tahoe AI",
  title: {
    default: "Tahoe AI | AI Recruiting Search and Outreach",
    template: "%s | Tahoe AI",
  },
  description:
    "Tahoe AI is recruiting software for plain-English candidate sourcing, contact enrichment, outreach sequencing, mailbox controls, and recruiting analytics.",
  keywords: [
    "AI recruiting software",
    "AI sourcing software",
    "candidate sourcing",
    "talent intelligence platform",
    "contact enrichment",
    "recruiting outreach",
    "recruiting analytics",
    "recruitment CRM",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Tahoe AI | AI Recruiting Search and Outreach",
    description:
      "Plain-English AI sourcing, candidate lists, enrichment, outreach, and analytics for modern recruiting teams.",
    url: "/",
    siteName: "Tahoe AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tahoe AI | AI Recruiting Search and Outreach",
    description:
      "AI recruiting software for sourcing, enrichment, outreach sequencing, mailbox controls, and analytics.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
