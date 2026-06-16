'use client';

import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { useLocale } from '@/i18n/useLocale';
import styles from './[lang]/legal.module.css';

const T = {
    en: {
        code: '404',
        title: 'This page could not be found.',
        body: 'The page you are looking for may have moved, or never existed. Head back to the homepage to find what you need.',
        cta: 'Back to home',
    },
    ko: {
        code: '404',
        title: '페이지를 찾을 수 없습니다.',
        body: '찾으시는 페이지가 이동되었거나 존재하지 않을 수 있습니다. 홈페이지로 돌아가 필요한 내용을 찾아보세요.',
        cta: '홈으로 돌아가기',
    },
} as const;

export default function NotFound() {
    const lang = useLocale();
    const t = T[lang];

    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <div className={styles.container}>
                <section className={styles.hero}>
                    <span className={styles.eyebrow}>{t.code}</span>
                    <h1 className={styles.title}>{t.title}</h1>
                    <p className={styles.lede}>{t.body}</p>
                    <p>
                        <Link className={styles.inlineLink} href={`/${lang}`}>{t.cta}</Link>
                    </p>
                </section>
            </div>
            <PublicSiteFooter />
        </main>
    );
}
