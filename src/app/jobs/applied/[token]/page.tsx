import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchStatus } from '@/lib/public-jobs';
import styles from '../../public.module.css';
import Confetti from './Confetti';

export const metadata: Metadata = { title: 'Application status', robots: { index: false } };

type Params = Promise<{ token: string }>;

export default async function AppliedPage({ params }: { params: Params }) {
    const { token } = await params;
    const status = await fetchStatus(token).catch(() => null);

    if (!status) {
        return (
            <div className={styles.statusCard}>
                <h1 className={styles.statusTitle}>Link not found</h1>
                <p className={styles.statusSub}>This status link is invalid or has expired.</p>
                <Link href="/jobs" className={styles.browseBtn}>Browse more jobs</Link>
            </div>
        );
    }

    return (
        <div className={`${styles.statusCard} ${styles.statusCardSuccess}`}>
            <Confetti />
            <h1 className={styles.statusTitleSuccess}>Application received</h1>
            <p className={styles.statusSub}>
                Thanks for applying to <strong>{status.job_title}</strong>. We’ve emailed you a link to track your status.
            </p>
            <div className={styles.timeline} aria-label="Application status">
                {status.timeline.map((step, i) => (
                    <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
                        {i > 0 && <span className={styles.bar} />}
                        <div className={styles.step}>
                            <span className={`${styles.dot} ${step.done ? styles.dotDone : ''}`} />
                            <span>{step.label}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: 24 }}>
                <Link href="/jobs" className={styles.browseBtn}>Browse more jobs</Link>
            </div>
        </div>
    );
}
