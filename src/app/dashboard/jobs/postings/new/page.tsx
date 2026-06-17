'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createJob, type JobInput } from '@/lib/jobs';
import JobForm from '../_components/JobForm';
import JobsBreadcrumb from '../../_components/JobsBreadcrumb';
import shared from '../../_components/jobs-shared.module.css';

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
        <div className={shared.page}>
            <JobsBreadcrumb items={[{ label: 'Job Postings', href: '/dashboard/jobs/postings' }, { label: 'New' }]} />
            <JobForm submitLabel="Save draft" saving={saving} error={error} onSubmit={onSubmit} />
        </div>
    );
}
