'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import posthog from 'posthog-js';
import { Badge, Button, TextField } from '@/components/ui/tahoe-ui';
import {
    type Job,
    closeJob,
    generateJobSearchQuery,
    getJob,
    publishJob,
    reopenJob,
    unpublishJob,
} from '@/lib/jobs';
import JobsBreadcrumb from '../../../_components/JobsBreadcrumb';
import JobPostedModal from '../_components/JobPostedModal';
import shared from '../../../_components/jobs-shared.module.css';
import styles from './publish.module.css';

const CAN_PUBLISH_NOW = new Set(['draft', 'scheduled', 'closed']);
const CAN_SCHEDULE = new Set(['draft', 'scheduled']);
const STATUS_COLOR: Record<string, string> = {
    draft: 'gray', scheduled: 'amber', published: 'green', closed: 'red', archived: 'gray',
};

function toIso(local: string): string | null {
    if (!local) return null;
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function PublishPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [publishAt, setPublishAt] = useState('');
    const [closeAt, setCloseAt] = useState('');
    const [postedOpen, setPostedOpen] = useState(false);
    const [finding, setFinding] = useState(false);

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

    // Publish now → on success the job goes live; show the "find candidates" popup once.
    const handlePublishNow = useCallback(async () => {
        setBusy(true); setError('');
        try {
            const updated = await publishJob(jobId, { mode: 'now' });
            setJob(updated);
            if (updated.status === 'published') {
                posthog.capture('job_posted_popup_shown', { job_id: jobId });
                setPostedOpen(true);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Action failed');
        } finally {
            setBusy(false);
        }
    }, [jobId]);

    // Build a search query from the job (Claude, with a server-side fallback) and open
    // search pre-filled. Navigation unmounts this page, so `finding` need not be reset.
    const handleFindCandidates = useCallback(async () => {
        posthog.capture('job_posted_find_candidates_clicked', { job_id: jobId });
        setFinding(true);
        const title = (job?.title ?? '').trim();
        let q = title;
        try {
            const res = await generateJobSearchQuery(jobId);
            q = (res.query || '').trim() || title;
        } catch {
            // Endpoint failure: still go to search, seeded with the job title.
        }
        router.push(`/dashboard/search/new?q=${encodeURIComponent(q)}&src=job&jobId=${jobId}`);
    }, [jobId, job?.title, router]);

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

    if (loading) return <div className={shared.page}><div className={shared.loading}>Loading…</div></div>;
    if (!job) return <div className={shared.page}><p className={shared.error}>{error || 'Not found'}</p></div>;

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
        <div className={shared.page}>
            <JobsBreadcrumb items={[
                { label: 'Job Postings', href: '/dashboard/jobs/postings' },
                { label: job.title, href: `/dashboard/jobs/postings/${jobId}/edit` },
                { label: 'Publish' },
            ]} />

            <div className={shared.toolbar}>
                <Badge variant="soft" color={STATUS_COLOR[job.status] ?? 'gray'}>{job.status}</Badge>
            </div>

            {error && <p className={shared.error} role="alert">{error}</p>}

            <div className={styles.grid}>
                <section className={shared.card}>
                    <p className={shared.sectionLabel}>Status &amp; actions</p>

                    {job.status === 'published' && job.slug && (
                        <p className={styles.live}>● Live at <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a></p>
                    )}
                    {job.status === 'scheduled' && job.publish_at && (
                        <p className={shared.muted}>◷ Scheduled to publish {new Date(job.publish_at).toLocaleString()}</p>
                    )}

                    <div className={styles.actionRow}>
                        {CAN_PUBLISH_NOW.has(job.status) && (
                            <Button disabled={busy} onClick={handlePublishNow}>Publish now</Button>
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
                            <p className={shared.sectionLabel}>Schedule for later</p>
                            <label className={styles.field}>Publish at
                                <TextField.Root type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
                            </label>
                            <label className={styles.field}>Auto-close at (optional)
                                <TextField.Root type="datetime-local" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} />
                            </label>
                            <Button variant="soft" disabled={busy} onClick={onSchedule}>Schedule</Button>
                        </div>
                    )}
                </section>

                <section className={shared.card}>
                    <p className={shared.sectionLabel}>SEO preview</p>
                    <div className={styles.seoPreview}>
                        <p className={styles.seoUrl}>{publicUrl || `…/jobs/${'<slug minted on publish>'}`}</p>
                        <p className={styles.seoTitle}>{job.title} — Careers</p>
                        <p className={styles.seoDesc}>{job.summary || 'Add a summary to improve search snippets.'}</p>
                    </div>
                    <p className={shared.sectionLabel} style={{ marginTop: 12 }}>JSON-LD (JobPosting)</p>
                    <pre className={styles.jsonLd}>{JSON.stringify(jsonLd, null, 2)}</pre>
                </section>
            </div>

            <JobPostedModal
                open={postedOpen}
                jobTitle={job.title}
                publicUrl={publicUrl}
                finding={finding}
                onFindCandidates={handleFindCandidates}
                onView={() => posthog.capture('job_posted_view_clicked', { job_id: jobId })}
                onClose={() => setPostedOpen(false)}
            />
        </div>
    );
}
