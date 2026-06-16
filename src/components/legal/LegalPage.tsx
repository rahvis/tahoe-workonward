import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import type { Locale } from '@/i18n/config';
import type { LegalDoc } from '@/i18n/legal-content';
import styles from '@/app/[lang]/legal.module.css';

export default function LegalPage({
    doc,
    locale,
    lastUpdatedLabel,
}: {
    doc: LegalDoc;
    locale: Locale;
    lastUpdatedLabel: string;
}) {
    const L = (path: string) => `/${locale}${path}`;

    return (
        <main className={styles.page}>
            <PublicSiteHeader />

            <div className={styles.container}>
                <section className={styles.hero}>
                    <h1 className={styles.title}>{doc.title}</h1>
                    <p className={styles.lede}>{doc.lede}</p>
                    <div className={styles.meta}>
                        <span><strong>{lastUpdatedLabel}</strong> {doc.lastUpdated}</span>
                    </div>
                </section>

                {doc.notice && <p className={styles.notice}>{doc.notice}</p>}

                <div className={styles.contentFlat}>
                    {doc.sections.map((section) => (
                        <div key={section.title} className={styles.flatSection}>
                            <h2 className={styles.flatSectionTitle}>{section.title}</h2>
                            {section.body && <p className={styles.paragraph}>{section.body}</p>}
                            {section.list && (
                                <ul className={styles.list}>
                                    {section.list.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}

                    {doc.linkBlocks.map((block) => (
                        <div key={block.title} className={styles.flatSection}>
                            <h2 className={styles.flatSectionTitle}>{block.title}</h2>
                            <p className={styles.paragraph}>{block.body}</p>
                            {block.links && (
                                <ul className={styles.list}>
                                    {block.links.map((link) =>
                                        link.internal ? (
                                            <li key={link.href}>
                                                <Link className={styles.inlineLink} href={L(link.href)}>{link.label}</Link>
                                            </li>
                                        ) : (
                                            <li key={link.href}>
                                                <a className={styles.inlineLink} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <PublicSiteFooter />
        </main>
    );
}
