import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './public.module.css';

export default function PublicJobsLayout({ children }: { children: ReactNode }) {
    return (
        <div className={styles.shell}>
            <header className={styles.topbar}>
                <Link href="/jobs" className={styles.brand}>Careers</Link>
            </header>
            <main className={styles.main}>{children}</main>
            <footer className={styles.footer}>
                <span>Powered by Tahoe · WorkOnward</span>
            </footer>
        </div>
    );
}
