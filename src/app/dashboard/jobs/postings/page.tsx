'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/tahoe-ui';
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
import styles from './postings.module.css';

const STATUS_TABS: Array<{ value: string; label: string }> = [
    { value: '', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
    { value: 'closed', label: 'Closed' },
];

function fmtDate(value?: string | null) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(d);
}

export default function JobPostingsPage() {
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

    // Keep the URL query string in sync (shareable, back-button safe).
    const setParam = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value); else params.delete(key);
        router.replace(`${pathname}?${params.toString()}`);
    }, [pathname, router, searchParams]);

    // Debounce the search box → URL.
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
            if (id !== requestIdRef.current) return; // stale response
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
        <div className={styles.page}>
            <header className={styles.pageHead}>
                <div>
                    <p className={styles.breadcrumb}>Jobs › Job Postings</p>
                    <h1 className={styles.pageTitle}>Job Postings</h1>
                </div>
                <Link href="/dashboard/jobs/postings/new"><Button>+ New Job</Button></Link>
            </header>

            <div className={styles.toolbar}>
                <div className={styles.chips} role="tablist" aria-label="Filter by status">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            role="tab"
                            aria-selected={status === tab.value}
                            className={`${styles.chip} ${status === tab.value ? styles.chipActive : ''}`}
                            onClick={() => setParam('status', tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <input
                    className={styles.search}
                    type="search"
                    placeholder="Search jobs…"
                    aria-label="Search jobs"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
            </div>

            {error && <p className={styles.errorText} role="alert">{error}</p>}

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Title</th><th>Status</th><th>Department</th><th>Published</th><th aria-label="Actions" />
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5}><div className={styles.loading}>Loading…</div></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={5}><div className={styles.empty}>No jobs yet. Create your first posting.</div></td></tr>
                        ) : (
                            items.map((job) => (
                                <tr key={job.id}>
                                    <td className={styles.titleCell}>
                                        <Link href={`/dashboard/jobs/postings/${job.id}/edit`}>{job.title}</Link>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[`status_${job.status}`]}`}>
                                            {STATUS_LABELS[job.status as JobStatus]}
                                        </span>
                                    </td>
                                    <td className={styles.muted}>{job.department || '—'}</td>
                                    <td className={styles.muted}>{fmtDate(job.published_at)}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <Link className={styles.actionBtn} href={`/dashboard/jobs/postings/${job.id}/edit`}>Edit</Link>
                                            <Link className={styles.actionBtn} href={`/dashboard/jobs/postings/${job.id}/form`}>Form</Link>
                                            <Link className={styles.actionBtn} href={`/dashboard/jobs/postings/${job.id}/publish`}>Publish</Link>
                                            {job.status === 'published' && job.slug && (
                                                <a className={styles.actionBtn} href={`/jobs/${job.slug}`} target="_blank" rel="noreferrer">View ↗</a>
                                            )}
                                            <button className={styles.actionBtn} disabled={busyId === job.id} onClick={() => onDuplicate(job)}>Duplicate</button>
                                            {job.status === 'published' && (
                                                <button className={styles.actionBtn} disabled={busyId === job.id} onClick={() => withBusy(job.id, () => closeJob(job.id))}>Close</button>
                                            )}
                                            {job.status === 'closed' && (
                                                <button className={styles.actionBtn} disabled={busyId === job.id} onClick={() => withBusy(job.id, () => reopenJob(job.id))}>Reopen</button>
                                            )}
                                            <button className={`${styles.actionBtn} ${styles.danger}`} disabled={busyId === job.id} onClick={() => onDelete(job)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {nextCursor && (
                <div className={styles.loadMore}>
                    <Button variant="soft" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}</Button>
                </div>
            )}
        </div>
    );
}
