import type { ReactNode } from 'react';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import styles from './public.module.css';

// The public job board lives at /jobs/* (un-localized). It borrows the same
// marketing navbar + footer as tahoe.workonward.com so the careers pages read as
// part of the brand site. PublicSiteHeader/Footer resolve locale from the URL and
// default to `en` here (no /{locale} segment), linking back to the localized site.
export default function PublicJobsLayout({ children }: { children: ReactNode }) {
    return (
        <div className={styles.shell}>
            <PublicSiteHeader placement="jobs" />
            <main className={styles.main}>{children}</main>
            <PublicSiteFooter placement="jobs" />
        </div>
    );
}
