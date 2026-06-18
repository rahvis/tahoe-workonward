import type { NextConfig } from "next";

// PostHog CSP violation reporting (US cloud). The project token is public (it ships in
// the client bundle anyway); env-overridable to match the PostHog provider. We omit the
// session_id/distinct_id URL params on purpose — a single static security header can't
// carry per-user values; token + version + sample_rate are enough to ingest and track
// violations. Raise sample_rate to 1.0 for full capture (here 0.5 per the PostHog UI).
const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_r53U6SoKpxMwjXRkgf82nTxVFz2SmnMghTYrFcyBzxjm";
const POSTHOG_REPORT_URL = `https://us.i.posthog.com/report/?token=${POSTHOG_KEY}&v=1&sample_rate=0.5`;

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // script-src: GA + Google Sign-In, Microsoft Clarity (*.clarity.ms), and PostHog
      // lazy-loaded assets (recorder/surveys from us-assets.i.posthog.com).
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://*.clarity.ms https://us-assets.i.posthog.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      // connect-src already allows all https (analytics event ingestion to PostHog,
      // Clarity, GA) plus wss for mic dictation.
      "connect-src 'self' http://localhost:8000 https: wss:",
      // worker-src: PostHog session replay spins up a blob worker for compression.
      "worker-src 'self' blob:",
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
      // CSP violation reporting → PostHog (legacy report-uri + modern report-to).
      `report-uri ${POSTHOG_REPORT_URL}`,
      "report-to posthog",
    ].join("; "),
  },
  {
    // Modern Reporting API endpoint referenced by the CSP `report-to posthog` directive.
    key: "Reporting-Endpoints",
    value: `posthog="${POSTHOG_REPORT_URL}"`,
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
