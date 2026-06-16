import type { Locale } from './config';
import { defaultLocale } from './config';

// Server-side dictionary loader. Each locale is dynamically imported so only the
// requested locale's strings are sent to the server bundle for a given request.
const dictionaries = {
    en: () => import('./dictionaries/en').then((m) => m.en),
    ko: () => import('./dictionaries/ko').then((m) => m.ko),
};

export async function getDictionary(locale: Locale) {
    const load = dictionaries[locale] ?? dictionaries[defaultLocale];
    return load();
}

export type Dictionary = Awaited<ReturnType<typeof dictionaries['en']>>;
