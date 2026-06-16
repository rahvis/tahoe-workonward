'use client';
import Link from 'next/link';
import BrandMark from '@/components/branding/BrandMark';
import { authT } from '@/i18n/auth-dictionary';
import { useLocale } from '@/i18n/useLocale';
import styles from './auth-shell.module.css';

interface AuthShellProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    panelNote?: string;
}

export default function AuthShell({
    title,
    subtitle,
    children,
    footer,
    panelNote = '',
}: AuthShellProps) {
    const lang = useLocale();
    const s = authT[lang].shell;
    const home = `/${lang}`;

    return (
        <main className={styles.page} data-tahoe-auth-shell>
            <div className={styles.shell}>
                <aside className={styles.marketingPanel} aria-hidden="true">
                    <div className={styles.brandLockup}>
                        <Link href={home} className={styles.brandLink} tabIndex={-1}>
                            <BrandMark compact />
                        </Link>
                        <span className={styles.brandEyebrow}>{s.brandEyebrow}</span>
                    </div>

                    <div className={styles.heroBlock}>
                        <span className={styles.heroEyebrow}>{s.heroEyebrow}</span>
                        <h1 className={styles.heroTitle}>{s.heroTitle}</h1>
                        <p className={styles.heroBody}>{s.heroBody}</p>
                    </div>

                    <ul className={styles.featureList}>
                        <li><span className={styles.bullet} aria-hidden="true" />{s.feature1}</li>
                        <li><span className={styles.bullet} aria-hidden="true" />{s.feature2}</li>
                        <li><span className={styles.bullet} aria-hidden="true" />{s.feature3}</li>
                    </ul>
                </aside>

                <section className={styles.formPanel}>
                    <div className={styles.formCard}>
                        <Link href={home} className={styles.formBrandLink} aria-label="Tahoe home">
                            <BrandMark compact />
                        </Link>
                        <div className={styles.formHeader}>
                            <h2 className={styles.formTitle}>{title}</h2>
                            {subtitle && <p className={styles.formSubtitle}>{subtitle}</p>}
                        </div>

                        {panelNote && <div className={styles.panelNote}>{panelNote}</div>}

                        {children}

                        {footer && <div className={styles.footer}>{footer}</div>}
                    </div>
                </section>
            </div>
        </main>
    );
}
