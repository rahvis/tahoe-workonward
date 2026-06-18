'use client';

import { useEffect, type ReactNode } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

// Public project token (safe to ship in the client bundle). Env-overridable so it can
// be pointed at another project or disabled per environment (empty key → no PostHog).
const POSTHOG_KEY = (process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_r53U6SoKpxMwjXRkgf82nTxVFz2SmnMghTYrFcyBzxjm').trim();
const POSTHOG_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').trim();

// `defaults` opts into PostHog's recommended config bundle as of that date (SPA
// pageview capture on history changes, pageleave, person profiles for identified
// users). It's a real runtime option but isn't in posthog-js@1.390's exported types
// yet, hence the cast.
const POSTHOG_OPTIONS = {
    api_host: POSTHOG_HOST,
    defaults: '2026-05-30',
} as unknown as Parameters<typeof posthog.init>[1];

// Module-level guard so React StrictMode / re-mounts can't double-initialize.
let initialized = false;

/**
 * Initializes PostHog product analytics once on the client and provides the instance
 * via React context (so `usePostHog()`, feature flags, etc. work anywhere). Mounted
 * around the app in the root layout. With `defaults: '2026-05-30'`, pageviews are
 * captured automatically on client-side navigations — no manual route tracker needed.
 */
export default function PostHogProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        if (!POSTHOG_KEY || initialized) return;
        initialized = true;
        posthog.init(POSTHOG_KEY, POSTHOG_OPTIONS);
    }, []);

    return <PHProvider client={posthog}>{children}</PHProvider>;
}
