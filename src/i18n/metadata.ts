import { locales, ogLocale, type Locale } from './config';

// Helpers for per-page localized metadata: hreflang alternates, self-canonical,
// and Open Graph locale fields. `path` is the locale-agnostic path (no /en or
// /ko prefix), e.g. '' for the home page or '/product'. metadataBase (set in the
// root layout) resolves these relative URLs to absolute ones.

export function buildAlternates(lang: Locale, path: string) {
    const clean = path === '/' ? '' : path;
    const languages: Record<string, string> = {};
    for (const l of locales) {
        languages[l] = `/${l}${clean}`;
    }
    languages['x-default'] = `/en${clean}`;
    return {
        canonical: `/${lang}${clean}`,
        languages,
    };
}

export function buildOgLocale(lang: Locale) {
    return {
        locale: ogLocale[lang],
        alternateLocale: locales.filter((l) => l !== lang).map((l) => ogLocale[l]),
    };
}
