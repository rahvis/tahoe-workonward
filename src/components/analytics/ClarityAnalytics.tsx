'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';

// The project ID is public by design (it ships inside the client-side tag script).
// The env var only adds flexibility to swap or disable Clarity per environment; it
// mirrors the GA_MEASUREMENT_ID || 'G-…' default convention in lib/public-analytics.ts.
const CLARITY_PROJECT_ID = (process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || 'x94q9pnbrh').trim();

// Module-level guard so React StrictMode / re-mounts can't double-initialize Clarity.
let initialized = false;

/**
 * Loads Microsoft Clarity (session replays + heatmaps) site-wide. Mounted once in the
 * root layout so a single init covers every route — Clarity tracks SPA navigations on
 * its own after that. Returns null (no UI).
 */
export default function ClarityAnalytics() {
    useEffect(() => {
        if (typeof window === 'undefined' || initialized || !CLARITY_PROJECT_ID) {
            return;
        }

        initialized = true;
        Clarity.init(CLARITY_PROJECT_ID);
    }, []);

    return null;
}
