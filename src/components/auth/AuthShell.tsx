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
    panelNote = 'Continue with your email. No hidden setup. No surprise UX.',
}: AuthShellProps) {
    return (
        <main className={styles.page}>
            <div className={styles.shell}>
                <section className={styles.brandPanel}>
                    <Link href="/" className={styles.brandLink} aria-label="Tahoe home">
                        <BrandMark subtitle />
                    </Link>
                    <div className={styles.brandCopy}>
                        <span className="tahoe-eyebrow">Recruiter workflow</span>
                        <h1 className={styles.brandTitle}>Search, organize, enrich, and launch from one calm surface.</h1>
                        <p className={styles.brandBody}>
                            Tahoe keeps the recruiter flow direct: plain-English search, focused lists, native outreach,
                            and product-grade operational visibility.
                        </p>
                    </div>
                    <div className={styles.brandChecklist}>
                        <div>Plain-English candidate search</div>
                        <div>Send from your own inbox</div>
                        <div>Credits and actions stay explicit</div>
                    </div>
                </section>

                <section className={styles.formPanel}>
                    <div className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <BrandMark compact />
                            <div>
                                <h2 className={styles.formTitle}>{title}</h2>
                                {subtitle && <p className={styles.formSubtitle}>{subtitle}</p>}
                            </div>
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
