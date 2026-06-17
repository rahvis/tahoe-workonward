'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, TahoeSelect, TextField } from '@/components/ui/tahoe-ui';
import {
    type Job,
    type JobStatus,
    STATUS_LABELS,
    closeJob,
    deleteJob,
    duplicateJob,
    listJobs,
    reopenJob,
} from '@/lib/jobs';
import JobsBreadcrumb from '../_components/JobsBreadcrumb';
import shared from '../_components/jobs-shared.module.css';
import styles from './postings.module.css';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: '', label: 'All statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
    { value: 'closed', label: 'Closed' },
];

const STATUS_COLOR: Record<string, string> = {
    draft: 'gray', scheduled: 'amber', published: 'green', closed: 'red', archived: 'gray',
};

function fmtDate(value?: string | null) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(d);
}

function JobPostingsInner() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const status = searchParams.get('status') ?? '';
    const q = searchParams.get('q') ?? '';

    const [items, setItems] = useState<Job[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState(q);
    const [busyId, setBusyId] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    const setParam = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value); else params.delete(key);
        router.replace(`${pathname}?${params.toString()}`);
    }, [pathname, router, searchParams]);

    useEffect(() => {
        const handle = setTimeout(() => { if (searchInput !== q) setParam('q', searchInput); }, 300);
        return () => clearTimeout(handle);
    }, [searchInput, q, setParam]);

    const load = useCallback(async () => {
        const id = ++requestIdRef.current;
        setLoading(true);
        setError('');
        try {
            const page = await listJobs({ status: status || undefined, q: q || undefined, limit: 20 });
            if (id !== requestIdRef.current) return;
            setItems(page.items);
            setNextCursor(page.next_cursor);
        } catch (e) {
            if (id === requestIdRef.current) setError(e instanceof Error ? e.message : 'Failed to load jobs');
        } finally {
            if (id === requestIdRef.current) setLoading(false);
        }
    }, [status, q]);

    useEffect(() => { load(); }, [load]);

    const loadMore = useCallback(async () => {
        if (!nextCursor) return;
        setLoadingMore(true);
        try {
            const page = await listJobs({ status: status || undefined, q: q || undefined, cursor: nextCursor, limit: 20 });
            setItems((prev) => [...prev, ...page.items]);
            setNextCursor(page.next_cursor);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load more');
        } finally {
            setLoadingMore(false);
        }
    }, [nextCursor, status, q]);

    const withBusy = useCallback(async (id: string, fn: () => Promise<unknown>) => {
        setBusyId(id);
        setError('');
        try { await fn(); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Action failed'); }
        finally { setBusyId(null); }
    }, [load]);

    const onDuplicate = (job: Job) => withBusy(job.id, async () => {
        const copy = await duplicateJob(job.id);
        router.push(`/dashboard/jobs/postings/${copy.id}/edit`);
    });
    const onDelete = (job: Job) => {
        if (!window.confirm(`Delete “${job.title}”? This cannot be undone.`)) return;
        return withBusy(job.id, () => deleteJob(job.id));
    };

    return (
        <div className={shared.page}>
            <JobsBreadcrumb items={[{ label: 'Job Postings' }]} />

            <div className={styles.toolbar}>
                <TextField.Root
                    type="search"
                    placeholder="Search jobs…"
                    aria-label="Search jobs"
                    rootClassName={styles.search}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
                <TahoeSelect className={styles.statusSelect} value={status} aria-label="Filter by status" onChange={(e) => setParam('status', e.target.value)}>
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </TahoeSelect>
                <Link href="/dashboard/jobs/postings/new"><Button size="3">Create job</Button></Link>
            </div>

            {error && <p className={shared.error} role="alert">{error}</p>}

            {loading ? (
                <div className={shared.loading}>Loading…</div>
            ) : items.length === 0 ? (
                <div className={shared.empty}>No jobs yet. Create your first posting.</div>
            ) : (
                <table className={shared.table}>
                    <thead>
                        <tr><th>Title</th><th>Status</th><th>Department</th><th>Published</th><th aria-label="Actions" /></tr>
                    </thead>
                    <tbody>
                        {items.map((job) => (
                            <tr key={job.id}>
                                <td>
                                    <Link href={`/dashboard/jobs/postings/${job.id}/edit`}>{job.title}</Link>
                                </td>
                                <td>
                                    <Badge variant="soft" color={STATUS_COLOR[job.status] ?? 'gray'}>
                                        {STATUS_LABELS[job.status as JobStatus]}
                                    </Badge>
                                </td>
                                <td className={shared.muted}>{job.department || '—'}</td>
                                <td className={shared.muted}>{fmtDate(job.published_at)}</td>
                                <td>
                                    <div className={shared.actionsRow}>
                                        <Link href={`/dashboard/jobs/postings/${job.id}/edit`}><Button variant="ghost" size="1">Edit</Button></Link>
                                        <Link href={`/dashboard/jobs/postings/${job.id}/form`}><Button variant="ghost" size="1">Form</Button></Link>
                                        <Link href={`/dashboard/jobs/postings/${job.id}/publish`}><Button variant="ghost" size="1">Publish</Button></Link>
                                        {job.status === 'published' && job.slug && (
                                            <a href={`/jobs/${job.slug}`} target="_blank" rel="noreferrer"><Button variant="ghost" size="1">View ↗</Button></a>
                                        )}
                                        <Button variant="ghost" size="1" disabled={busyId === job.id} onClick={() => onDuplicate(job)}>Duplicate</Button>
                                        {job.status === 'published' && (
                                            <Button variant="ghost" size="1" disabled={busyId === job.id} onClick={() => withBusy(job.id, () => closeJob(job.id))}>Close</Button>
                                        )}
                                        {job.status === 'closed' && (
                                            <Button variant="ghost" size="1" disabled={busyId === job.id} onClick={() => withBusy(job.id, () => reopenJob(job.id))}>Reopen</Button>
                                        )}
                                        <Button variant="ghost" size="1" color="red" disabled={busyId === job.id} onClick={() => onDelete(job)}>Delete</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {nextCursor && (
                <div className={styles.loadMore}>
                    <Button variant="soft" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}</Button>
                </div>
            )}
        </div>
    );
}

export default function JobPostingsPage() {
    return (
        <Suspense fallback={<div className={shared.page}><div className={shared.loading}>Loading…</div></div>}>
            <JobPostingsInner />
        </Suspense>
    );
}
