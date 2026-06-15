import Link from 'next/link';
import BrandMark from '@/components/branding/BrandMark';
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
    return (
        <main className={styles.page} data-tahoe-auth-shell>
            <div className={styles.shell}>
                <aside className={styles.marketingPanel} aria-hidden="true">
                    <div className={styles.brandLockup}>
                        <Link href="/" className={styles.brandLink} tabIndex={-1}>
                            <BrandMark compact />
                        </Link>
                        <span className={styles.brandEyebrow}>Recruiter Operating System</span>
                    </div>

                    <div className={styles.heroBlock}>
                        <span className={styles.heroEyebrow}>Recruiter workflow</span>
                        <h1 className={styles.heroTitle}>
                            Search, organize, enrich, and launch from one calm surface.
                        </h1>
                        <p className={styles.heroBody}>
                            Tahoe keeps the recruiter flow direct: search in your own words, focused lists,
                            native outreach, and product-grade operational visibility.
                        </p>
                    </div>

                    <ul className={styles.featureList}>
                        <li><span className={styles.bullet} aria-hidden="true" />Search candidates in your own words</li>
                        <li><span className={styles.bullet} aria-hidden="true" />Send from your own inbox</li>
                        <li><span className={styles.bullet} aria-hidden="true" />Credits and actions stay explicit</li>
                    </ul>
                </aside>

                <section className={styles.formPanel}>
                    <div className={styles.formCard}>
                        <Link href="/" className={styles.formBrandLink} aria-label="Tahoe home">
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
