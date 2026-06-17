'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { type Job, STATUS_LABELS, listJobs } from '@/lib/jobs';
import styles from './pipeline.module.css';

export default function PipelineIndexPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        listJobs({ limit: 100 })
            .then((page) => setJobs(page.items))
            .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load jobs'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className={styles.page}>
            <header className={styles.head}>
                <p className={styles.breadcrumb}>Jobs › Candidates</p>
                <h1 className={styles.title}>Candidates</h1>
                <p className={styles.subtle}>Pick a job to open its applicant pipeline.</p>
            </header>
            {error && <p className={styles.error}>{error}</p>}
            {loading ? (
                <div className={styles.loading}>Loading…</div>
            ) : jobs.length === 0 ? (
                <div className={styles.empty}>No jobs yet. Create one under Job Postings.</div>
            ) : (
                <ul className={styles.jobPicker}>
                    {jobs.map((j) => (
                        <li key={j.id}>
                            <Link href={`/dashboard/jobs/pipeline/${j.id}`} className={styles.jobPick}>
                                <span className={styles.jobPickTitle}>{j.title}</span>
                                <span className={`${styles.statusBadge} ${styles[`status_${j.status}`]}`}>{STATUS_LABELS[j.status]}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
