import type { ReactNode } from 'react';
import pageStyles from '@/app/[lang]/page.module.css';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import styles from './public.module.css';

// The public job board lives at /jobs/* (un-localized). It reuses the marketing
// navbar + footer and MUST be wrapped in the marketing `.page` class: that wrapper
// is where the landing design tokens live (--color-*, --space-*, --radius-*, the
// --font-body-stack font-family, the background, and the 84px top offset for the
// fixed header). Without it the chrome renders with undefined vars (run-together
// nav, serif fallback, content hidden under the header).
export default function PublicJobsLayout({ children }: { children: ReactNode }) {
    return (
        <div className={pageStyles.page}>
            <PublicSiteHeader placement="jobs" />
            <main className={styles.main}>{children}</main>
            <PublicSiteFooter placement="jobs" />
        </div>
    );
}
