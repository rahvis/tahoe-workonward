'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createJob, type JobInput } from '@/lib/jobs';
import JobForm from '../_components/JobForm';
import styles from '../postings.module.css';

export default function NewJobPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const onSubmit = async (values: JobInput) => {
        setSaving(true);
        setError('');
        try {
            const job = await createJob(values);
            router.push(`/dashboard/jobs/postings/${job.id}/edit`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create job');
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.pageHead}>
                <div>
                    <p className={styles.breadcrumb}>
                        <Link href="/dashboard/jobs/postings">Job Postings</Link> › New Job
                    </p>
                    <h1 className={styles.pageTitle}>New Job</h1>
                </div>
            </header>
            <JobForm submitLabel="Save draft" saving={saving} error={error} onSubmit={onSubmit} />
        </div>
    );
}
