import type { Metadata, Viewport } from "next";
import { Theme } from "@radix-ui/themes";
import { Inter, Montserrat } from "next/font/google";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import "./tahoe-theme.css";

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
      <body className={`${inter.variable} ${montserrat.variable}`}>
        <Theme accentColor="orange" grayColor="sand" radius="large" scaling="100%" panelBackground="solid">
          {children}
        </Theme>
      </body>
    </html>
  );
}
