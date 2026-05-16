import * as CookieConsent from 'vanilla-cookieconsent';

export const GA_MEASUREMENT_ID =
    (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-JLBXPV59L0').trim();

export const PUBLIC_ANALYTICS_PATHS = new Set(['/']);

type GtagCommand =
    | ['js', Date]
    | ['config', string, Record<string, unknown>?]
    | ['consent', 'default' | 'update', Record<string, unknown>]
    | ['event', string, Record<string, unknown>?];

declare global {
    interface Window {
        dataLayer: GtagCommand[];
        gtag?: (...args: GtagCommand) => void;
        __tahoeGaScriptRequested?: boolean;
        __tahoeGaConfigured?: boolean;
        __tahoeLastTrackedPagePath?: string | null;
    }
}

function hasWindow() {
    return typeof window !== 'undefined';
}

function normalizePathname(pathname: string): string {
    if (!pathname || pathname === '/') {
        return '/';
    }

    return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function isPublicAnalyticsPath(pathname: string): boolean {
    return PUBLIC_ANALYTICS_PATHS.has(normalizePathname(pathname));
}

export function clearTrackedPublicPage() {
    if (!hasWindow()) {
        return;
    }

    window.__tahoeLastTrackedPagePath = null;
}

export function ensureGoogleTagBase() {
    if (!hasWindow() || !GA_MEASUREMENT_ID) {
        return;
    }

    window.dataLayer = window.dataLayer || [];

    if (!window.gtag) {
        window.gtag = (...args: GtagCommand) => {
            window.dataLayer.push(args);
        };
    }

    window.gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        wait_for_update: 500,
    });
}

export function loadGoogleTagScript(): Promise<boolean> {
    if (!hasWindow() || !GA_MEASUREMENT_ID) {
        return Promise.resolve(false);
    }

    if (window.__tahoeGaScriptRequested) {
        return Promise.resolve(true);
    }

    window.__tahoeGaScriptRequested = true;

    return new Promise((resolve) => {
        const existing = document.querySelector<HTMLScriptElement>(
            `script[src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`,
        );

        if (existing) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        script.onload = () => resolve(true);
        script.onerror = () => {
            window.__tahoeGaScriptRequested = false;
            resolve(false);
        };
        document.head.appendChild(script);
    });
}

export function configureGoogleAnalytics() {
    if (!hasWindow() || !GA_MEASUREMENT_ID || !window.gtag || window.__tahoeGaConfigured) {
        return;
    }

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: false,
        anonymize_ip: true,
    });
    window.__tahoeGaConfigured = true;
}

export function isAnalyticsConsentGranted() {
    if (!hasWindow()) {
        return false;
    }

    try {
        return CookieConsent.acceptedCategory('analytics');
    } catch {
        return false;
    }
}

export async function syncAnalyticsConsent() {
    if (!hasWindow() || !GA_MEASUREMENT_ID) {
        return false;
    }

    ensureGoogleTagBase();

    const granted = isAnalyticsConsentGranted();

    window.gtag?.('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: granted ? 'granted' : 'denied',
    });

    if (!granted) {
        return false;
    }

    const scriptLoaded = await loadGoogleTagScript();

    if (!scriptLoaded) {
        return false;
    }

    configureGoogleAnalytics();
    return true;
}

function isTrackingReady() {
    return hasWindow() && Boolean(window.gtag) && Boolean(window.__tahoeGaConfigured) && isAnalyticsConsentGranted();
}

export function trackPublicPageView(pathname: string) {
    if (!hasWindow() || !GA_MEASUREMENT_ID || !isPublicAnalyticsPath(pathname) || !isTrackingReady()) {
        return;
    }

    const pagePath = normalizePathname(pathname);

    if (window.__tahoeLastTrackedPagePath === pagePath) {
        return;
    }

    window.__tahoeLastTrackedPagePath = pagePath;
    window.gtag?.('event', 'page_view', {
        send_to: GA_MEASUREMENT_ID,
        page_title: document.title,
        page_location: window.location.href,
        page_path: pagePath,
    });
}

export function trackLandingEvent(eventName: string, params: Record<string, string | number | boolean> = {}) {
    if (!hasWindow() || !GA_MEASUREMENT_ID || !isTrackingReady()) {
        return;
    }

    window.gtag?.('event', eventName, {
        send_to: GA_MEASUREMENT_ID,
        page_path: window.location.pathname,
        ...params,
    });
}

export function resetPublicAnalyticsForTests() {
    if (!hasWindow()) {
        return;
    }

    window.dataLayer = [];
    window.gtag = undefined;
    window.__tahoeGaScriptRequested = false;
    window.__tahoeGaConfigured = false;
    window.__tahoeLastTrackedPagePath = null;
}
