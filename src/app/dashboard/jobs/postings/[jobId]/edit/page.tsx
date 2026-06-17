'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { type Job, type JobInput, getJob, updateJob } from '@/lib/jobs';
import JobForm from '../../_components/JobForm';
import styles from '../../postings.module.css';

export default function EditJobPage() {
    const params = useParams<{ jobId: string }>();
    const jobId = params.jobId;

    const [job, setJob] = useState<Job | null>(null);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            setJob(await getJob(jobId));
            setLoadError('');
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : 'Failed to load job');
        }
    }, [jobId]);

    useEffect(() => { load(); }, [load]);

    const onSubmit = async (values: JobInput) => {
        if (!job) return;
        setSaving(true);
        setError('');
        try {
            const updated = await updateJob(jobId, job.updated_at, values);
            setJob(updated);
        } catch (e) {
            if (e instanceof ApiError && e.status === 409) {
                setError('This job was changed elsewhere — reloaded the latest version. Re-apply your edits and save again.');
                await load();
            } else {
                setError(e instanceof Error ? e.message : 'Failed to save');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loadError) return <div className={styles.page}><p className={styles.errorText}>{loadError}</p></div>;
    if (!job) return <div className={styles.page}><div className={styles.loading}>Loading…</div></div>;

    const header = (
        <div className={styles.editHeader}>
            <div>
                <span className={`${styles.statusBadge} ${styles[`status_${job.status}`]}`}>{job.status}</span>
                {job.status === 'published' && job.slug && (
                    <a className={styles.viewLink} href={`/jobs/${job.slug}`} target="_blank" rel="noreferrer">View public ↗</a>
                )}
            </div>
            <div className={styles.editLinks}>
                <Link href={`/dashboard/jobs/postings/${jobId}/form`}>Application form →</Link>
                <Link href={`/dashboard/jobs/postings/${jobId}/publish`}>Publish / schedule →</Link>
            </div>
        </div>
    );

    return (
        <div className={styles.page}>
            <header className={styles.pageHead}>
                <div>
                    <p className={styles.breadcrumb}><Link href="/dashboard/jobs/postings">Job Postings</Link> › Edit</p>
                    <h1 className={styles.pageTitle}>Edit Job</h1>
                </div>
            </header>
            <JobForm
                jobId={jobId}
                initial={job}
                submitLabel="Save changes"
                saving={saving}
                error={error}
                onSubmit={onSubmit}
                headerExtra={header}
            />
        </div>
    );
}
