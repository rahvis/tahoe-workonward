'use client';

import Link from 'next/link';
import styles from './jobs-shared.module.css';

export interface Crumb {
    label: string;
    href?: string;
}

/**
 * Clickable breadcrumb used at the top of every Jobs page. The last item is the
 * current page (plain text); all earlier items are real links so the in-page nav
 * always navigates. Replaces the old static "Jobs › …" text + redundant H1s.
 */
export default function JobsBreadcrumb({ items }: { items: Crumb[] }) {
    return (
        <nav className={styles.crumbs} aria-label="Breadcrumb">
            {items.map((item, i) => {
                const isLast = i === items.length - 1;
                return (
                    <span key={`${item.label}-${i}`} className={styles.crumbItem}>
                        {item.href && !isLast ? (
                            <Link href={item.href} className={styles.crumbLink}>{item.label}</Link>
                        ) : (
                            <span className={isLast ? styles.crumbCurrent : styles.crumbLink} aria-current={isLast ? 'page' : undefined}>
                                {item.label}
                            </span>
                        )}
                        {!isLast && <span className={styles.crumbSep} aria-hidden="true">›</span>}
                    </span>
                );
            })}
        </nav>
    );
}
