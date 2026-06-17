'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/tahoe-ui';
import {
    type Job,
    type PipelineStage,
    type SearchResultItem,
    bulkApplications,
    listJobs,
    listStages,
    talentSearch,
} from '@/lib/jobs';
import styles from './search.module.css';

export default function TalentSearchPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [scope, setScope] = useState<string>('');           // '' = all my jobs
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[] | null>(null);
    const [parsed, setParsed] = useState<Record<string, unknown> | null>(null);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { listJobs({ limit: 100 }).then((p) => setJobs(p.items)).catch(() => undefined); }, []);
    useEffect(() => {
        setSelected(new Set());
        if (scope) listStages(scope).then(setStages).catch(() => setStages([]));
        else setStages([]);
    }, [scope]);

    const run = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (query.trim().length < 2) return;
        setLoading(true);
        setError('');
        setSelected(new Set());
        try {
            const res = await talentSearch(query.trim(), scope || undefined);
            setResults(res.results);
            setParsed(res.parsed_filters);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setLoading(false);
        }
    }, [query, scope]);

    const toggle = (id: string) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const bulk = async (action: 'move_stage' | 'reject', stageId?: string) => {
        if (selected.size === 0) return;
        try {
            await bulkApplications({ ids: [...selected], action, stage_id: stageId });
            await run();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bulk action failed');
        }
    };

    const parsedChips = parsed
        ? [
            ...(((parsed.skills as string[]) ?? []).map((s) => `skill: ${s}`)),
            parsed.min_years != null ? `years ≥ ${parsed.min_years}` : null,
            parsed.seniority ? `seniority: ${parsed.seniority}` : null,
            parsed.country ? `country: ${parsed.country}` : null,
        ].filter(Boolean) as string[]
        : [];

    return (
        <div className={styles.page}>
            <header className={styles.head}>
                <p className={styles.breadcrumb}>Jobs › Talent Search</p>
                <h1 className={styles.title}>Talent Search</h1>
                <p className={styles.subtle}>Ask in plain English. Searches only your own applicants.</p>
            </header>

            <form className={styles.searchBar} onSubmit={run}>
                <select className={styles.scope} value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Search scope">
                    <option value="">All my jobs</option>
                    {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
                <input
                    className={styles.queryInput}
                    placeholder="e.g. backend engineers with Kafka and 5+ yrs who can work remote in the EU"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search query"
                />
                <Button type="submit" disabled={loading || query.trim().length < 2}>{loading ? 'Searching…' : 'Search'}</Button>
            </form>

            {parsedChips.length > 0 && (
                <div className={styles.chips}>
                    <span className={styles.chipsLabel}>Parsed filters:</span>
                    {parsedChips.map((c) => <span key={c} className={styles.chip}>{c}</span>)}
                </div>
            )}

            {selected.size > 0 && (
                <div className={styles.bulkBar}>
                    <span>{selected.size} selected</span>
                    {scope && stages.length > 0 && (
                        <label>Move to{' '}
                            <select className={styles.scope} defaultValue="" onChange={(e) => { if (e.target.value) bulk('move_stage', e.target.value); e.currentTarget.value = ''; }}>
                                <option value="">stage…</option>
                                {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </label>
                    )}
                    <Button variant="soft" color="red" onClick={() => bulk('reject')}>Reject</Button>
                    <button type="button" className={styles.clear} onClick={() => setSelected(new Set())}>Clear</button>
                </div>
            )}

            {error && <p className={styles.error} role="alert">{error}</p>}

            {results === null ? (
                <div className={styles.empty}>Enter a query to search your applicant pool.</div>
            ) : results.length === 0 ? (
                <div className={styles.empty}>No matching candidates.</div>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr><th aria-label="select" /><th>Candidate</th><th>Match</th><th>Yrs</th><th>Location</th><th>Why / cited evidence</th></tr>
                    </thead>
                    <tbody>
                        {results.map((r) => (
                            <tr key={r.application_id}>
                                <td><input type="checkbox" checked={selected.has(r.application_id)} onChange={() => toggle(r.application_id)} aria-label={`Select ${r.candidate_email}`} /></td>
                                <td className={styles.cand}>
                                    <Link href={`/dashboard/jobs/pipeline/${r.job_id}/${r.application_id}`}>{r.candidate_name || r.candidate_email}</Link>
                                </td>
                                <td className={styles.match}>{r.match_pct != null ? `${Math.round(r.match_pct)}%` : '—'}</td>
                                <td className={styles.muted}>{r.years ?? '—'}</td>
                                <td className={styles.muted}>{[r.city, r.country].filter(Boolean).join(', ') || '—'}</td>
                                <td className={styles.why}>
                                    {r.why && <div className={styles.whyLine}>{r.why}</div>}
                                    {r.evidence && <div className={styles.evidence}>“{r.evidence}”</div>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
