'use client';
import Link from 'next/link';
import { locales, localeShort } from '@/i18n/config';
import { useLocale, usePathWithoutLocale } from '@/i18n/useLocale';
import styles from './LanguageSwitcher.module.css';

// EN / KO toggle. Links to the same page in the other locale and persists the
// choice in the NEXT_LOCALE cookie so the middleware honours it next visit.
export default function LanguageSwitcher() {
    const current = useLocale();
    const rest = usePathWithoutLocale();

    const setCookie = (loc: string) => {
        document.cookie = `NEXT_LOCALE=${loc};path=/;max-age=31536000;samesite=lax`;
    };

    return (
        <div className={styles.switch} role="group" aria-label="Language">
            {locales.map((loc) => {
                const href = `/${loc}${rest === '/' ? '' : rest}`;
                const active = loc === current;
                return (
                    <Link
                        key={loc}
                        href={href}
                        hrefLang={loc}
                        prefetch={false}
                        aria-current={active ? 'true' : undefined}
                        onClick={() => setCookie(loc)}
                        className={active ? `${styles.option} ${styles.active}` : styles.option}
                    >
                        {localeShort[loc]}
                    </Link>
                );
            })}
        </div>
    );
}
