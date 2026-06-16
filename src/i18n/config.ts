// Central i18n configuration. EN is the default/source locale, KO is the
// translated locale. Marketing, legal, and auth pages live under /[lang]/...
export const locales = ['en', 'ko'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isLocale(value: string | undefined | null): value is Locale {
    return !!value && (locales as readonly string[]).includes(value);
}

/** Human label shown in the language switcher. */
export const localeLabels: Record<Locale, string> = {
    en: 'English',
    ko: '한국어',
};

/** Short code shown in the compact switcher chip. */
export const localeShort: Record<Locale, string> = {
    en: 'EN',
    ko: 'KO',
};

/** Open Graph locale codes. */
export const ogLocale: Record<Locale, string> = {
    en: 'en_US',
    ko: 'ko_KR',
};
