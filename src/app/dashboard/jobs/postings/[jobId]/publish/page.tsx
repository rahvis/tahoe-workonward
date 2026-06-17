'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/tahoe-ui';
import {
    type Job,
    closeJob,
    getJob,
    publishJob,
    reopenJob,
    unpublishJob,
} from '@/lib/jobs';
import styles from './publish.module.css';

const CAN_PUBLISH_NOW = new Set(['draft', 'scheduled', 'closed']);
const CAN_SCHEDULE = new Set(['draft', 'scheduled']);

function toIso(local: string): string | null {
    if (!local) return null;
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function PublishPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [publishAt, setPublishAt] = useState('');
    const [closeAt, setCloseAt] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try { setJob(await getJob(jobId)); setError(''); }
        catch (e) { setError(e instanceof Error ? e.message : 'Failed to load job'); }
        finally { setLoading(false); }
    }, [jobId]);
    useEffect(() => { load(); }, [load]);

    const run = useCallback(async (fn: () => Promise<Job>) => {
        setBusy(true); setError('');
        try { setJob(await fn()); } catch (e) { setError(e instanceof Error ? e.message : 'Action failed'); }
        finally { setBusy(false); }
    }, []);

    const onSchedule = () => {
        const publishIso = toIso(publishAt);
        if (!publishIso) { setError('Pick a valid publish date/time.'); return; }
        if (new Date(publishIso) <= new Date()) { setError('Publish time must be in the future.'); return; }
        const closeIso = toIso(closeAt);
        if (closeIso && new Date(closeIso) <= new Date(publishIso)) { setError('Close time must be after the publish time.'); return; }
        return run(() => publishJob(jobId, { mode: 'schedule', publish_at: publishIso, close_at: closeIso ?? undefined }));
    };

    const publicUrl = useMemo(() => {
        if (!job?.slug) return '';
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/jobs/${job.slug}`;
    }, [job?.slug]);

    if (loading) return <div className={styles.page}><div className={styles.loading}>Loading…</div></div>;
    if (!job) return <div className={styles.page}><p className={styles.errorText}>{error || 'Not found'}</p></div>;

    const jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title: job.title,
        description: job.summary ?? '',
        datePosted: job.published_at ?? undefined,
        employmentType: job.employment_type ?? undefined,
        hiringOrganization: { '@type': 'Organization', name: 'Your company' },
        ...(job.salary_min || job.salary_max
            ? { baseSalary: { '@type': 'MonetaryValue', currency: job.salary_currency, value: { '@type': 'QuantitativeValue', minValue: job.salary_min ?? undefined, maxValue: job.salary_max ?? undefined, unitText: (job.salary_interval ?? 'annual').toUpperCase() } } }
            : {}),
    };

    return (
        <div className={styles.page}>
            <header className={styles.head}>
                <div>
                    <p className={styles.breadcrumb}>
                        <Link href="/dashboard/jobs/postings">Job Postings</Link> ›{' '}
                        <Link href={`/dashboard/jobs/postings/${jobId}/edit`}>{job.title}</Link> › Publish
                    </p>
                    <h1 className={styles.title}>Publish / Schedule</h1>
                </div>
                <span className={`${styles.statusBadge} ${styles[`status_${job.status}`]}`}>{job.status}</span>
            </header>

            {error && <p className={styles.errorText} role="alert">{error}</p>}

            <div className={styles.grid}>
                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>Status & actions</h2>

                    {job.status === 'published' && job.slug && (
                        <p className={styles.live}>● Live at <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a></p>
                    )}
                    {job.status === 'scheduled' && job.publish_at && (
                        <p className={styles.muted}>◷ Scheduled to publish {new Date(job.publish_at).toLocaleString()}</p>
                    )}

                    <div className={styles.actionRow}>
                        {CAN_PUBLISH_NOW.has(job.status) && (
                            <Button disabled={busy} onClick={() => run(() => publishJob(jobId, { mode: 'now' }))}>Publish now</Button>
                        )}
                        {job.status === 'published' && (
                            <>
                                <Button variant="soft" disabled={busy} onClick={() => run(() => closeJob(jobId))}>Close</Button>
                                <Button variant="ghost" disabled={busy} onClick={() => run(() => unpublishJob(jobId))}>Unpublish</Button>
                            </>
                        )}
                        {job.status === 'scheduled' && (
                            <Button variant="ghost" disabled={busy} onClick={() => run(() => unpublishJob(jobId))}>Cancel schedule</Button>
                        )}
                        {job.status === 'closed' && (
                            <Button variant="soft" disabled={busy} onClick={() => run(() => reopenJob(jobId))}>Reopen</Button>
                        )}
                    </div>

                    {CAN_SCHEDULE.has(job.status) && (
                        <div className={styles.schedule}>
                            <h3 className={styles.scheduleTitle}>Schedule for later</h3>
                            <label className={styles.field}>Publish at
                                <input className={styles.input} type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
                            </label>
                            <label className={styles.field}>Auto-close at (optional)
                                <input className={styles.input} type="datetime-local" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} />
                            </label>
                            <Button variant="soft" disabled={busy} onClick={onSchedule}>Schedule</Button>
                        </div>
                    )}
                </section>

                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>SEO preview</h2>
                    <div className={styles.seoPreview}>
                        <p className={styles.seoUrl}>{publicUrl || `…/jobs/${'<slug minted on publish>'}`}</p>
                        <p className={styles.seoTitle}>{job.title} — Careers</p>
                        <p className={styles.seoDesc}>{job.summary || 'Add a summary to improve search snippets.'}</p>
                    </div>
                    <h3 className={styles.scheduleTitle}>JSON-LD (JobPosting)</h3>
                    <pre className={styles.jsonLd}>{JSON.stringify(jsonLd, null, 2)}</pre>
                </section>
            </div>
        </div>
    );
}
