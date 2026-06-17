'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button } from '@/components/ui/tahoe-ui';
import { ApiError } from '@/lib/api';
import { type Job, type JobInput, getJob, updateJob } from '@/lib/jobs';
import JobForm from '../../_components/JobForm';
import JobsBreadcrumb from '../../../_components/JobsBreadcrumb';
import shared from '../../../_components/jobs-shared.module.css';

const STATUS_COLOR: Record<string, string> = {
    draft: 'gray', scheduled: 'amber', published: 'green', closed: 'red', archived: 'gray',
};

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

    if (loadError) return <div className={shared.page}><p className={shared.error}>{loadError}</p></div>;
    if (!job) return <div className={shared.page}><div className={shared.loading}>Loading…</div></div>;

    const header = (
        <div className={shared.toolbar}>
            <Badge variant="soft" color={STATUS_COLOR[job.status] ?? 'gray'}>{job.status}</Badge>
            {job.status === 'published' && job.slug && (
                <a href={`/jobs/${job.slug}`} target="_blank" rel="noreferrer"><Button variant="ghost" size="1">View public ↗</Button></a>
            )}
            <span className={shared.spacer} />
            <Link href={`/dashboard/jobs/postings/${jobId}/form`}><Button variant="soft" size="2">Application form →</Button></Link>
            <Link href={`/dashboard/jobs/postings/${jobId}/publish`}><Button variant="soft" size="2">Publish / schedule →</Button></Link>
        </div>
    );

    return (
        <div className={shared.formPage}>
            <JobsBreadcrumb items={[{ label: 'Job Postings', href: '/dashboard/jobs/postings' }, { label: job.title || 'Edit' }]} />
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
