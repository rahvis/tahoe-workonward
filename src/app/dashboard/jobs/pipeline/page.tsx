'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/tahoe-ui';
import { type Job, STATUS_LABELS, listJobs } from '@/lib/jobs';
import JobsBreadcrumb from '../_components/JobsBreadcrumb';
import shared from '../_components/jobs-shared.module.css';
import styles from './pipeline.module.css';

const STATUS_COLOR: Record<string, string> = {
    draft: 'gray', scheduled: 'amber', published: 'green', closed: 'red', archived: 'gray',
};

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
        <div className={shared.page}>
            <JobsBreadcrumb items={[{ label: 'Candidates' }]} />
            <p className={shared.subtle}>Pick a job to open its applicant pipeline.</p>
            {error && <p className={shared.error}>{error}</p>}
            {loading ? (
                <div className={shared.loading}>Loading…</div>
            ) : jobs.length === 0 ? (
                <div className={shared.empty}>No jobs yet. Create one under Job Postings.</div>
            ) : (
                <ul className={styles.jobPicker}>
                    {jobs.map((j) => (
                        <li key={j.id}>
                            <Link href={`/dashboard/jobs/pipeline/${j.id}`} className={styles.jobPick}>
                                <span className={styles.jobPickTitle}>{j.title}</span>
                                <Badge variant="soft" color={STATUS_COLOR[j.status] ?? 'gray'}>{STATUS_LABELS[j.status]}</Badge>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
