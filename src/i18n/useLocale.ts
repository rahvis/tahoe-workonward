'use client';
import { usePathname } from 'next/navigation';
import { defaultLocale, isLocale, type Locale } from './config';

/** Current locale derived from the URL (/en/... or /ko/...). */
export function useLocale(): Locale {
    const pathname = usePathname() || '/';
    const first = pathname.split('/')[1];
    return isLocale(first) ? first : defaultLocale;
}

/** The path with the leading locale segment stripped (e.g. /en/product -> /product). */
export function usePathWithoutLocale(): string {
    const pathname = usePathname() || '/';
    const parts = pathname.split('/');
    if (isLocale(parts[1])) {
        const rest = '/' + parts.slice(2).join('/');
        return rest === '/' ? '/' : rest.replace(/\/$/, '');
    }
    return pathname;
}
