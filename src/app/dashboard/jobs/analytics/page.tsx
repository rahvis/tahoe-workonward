'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import {
    type AnalyticsOverview,
    type EeoResponse,
    type Job,
    getAnalytics,
    getEeo,
    listJobs,
} from '@/lib/jobs';
import styles from './analytics.module.css';

const STATUS_ORDER = ['new', 'in_review', 'advanced', 'hired', 'rejected', 'withdrawn'];

function fmtDays(d: number | null): string {
    return d == null ? '—' : d >= 1 ? `${Math.round(d)}d` : `${Math.round(d * 24)}h`;
}

/** Accessible horizontal bar chart: each row's label + value is real text, wrapped
 *  in a <figure>/<figcaption> so screen readers get a full text alternative. */
function BarChart({ caption, data }: { caption: string; data: Array<{ label: string; value: number; sub?: string }> }) {
    const max = Math.max(1, ...data.map((d) => d.value));
    return (
        <figure className={styles.chart}>
            <figcaption className={styles.chartCaption}>{caption}</figcaption>
            <ul className={styles.bars}>
                {data.map((d) => (
                    <li key={d.label} className={styles.barRow}>
                        <span className={styles.barLabel}>{d.label}</span>
                        <span className={styles.barTrack} aria-hidden="true">
                            <span className={styles.barFill} style={{ width: `${(d.value / max) * 100}%` }} />
                        </span>
                        <span className={styles.barValue}>{d.sub ?? d.value}</span>
                    </li>
                ))}
            </ul>
        </figure>
    );
}

export default function AnalyticsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [scope, setScope] = useState('');
    const [data, setData] = useState<AnalyticsOverview | null>(null);
    const [eeo, setEeo] = useState<EeoResponse | null>(null);
    const [eeoRestricted, setEeoRestricted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { listJobs({ limit: 100 }).then((p) => setJobs(p.items)).catch(() => undefined); }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const ov = await getAnalytics(scope || undefined);
            setData(ov);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
        // EEO is access-gated; a 403 is expected for non-owners
        try {
            setEeoRestricted(false);
            setEeo(await getEeo(scope || undefined));
        } catch (e) {
            if (e instanceof ApiError && e.status === 403) { setEeoRestricted(true); setEeo(null); }
            else setEeo(null);
        }
    }, [scope]);

    useEffect(() => { load(); }, [load]);

    return (
        <div className={styles.page}>
            <header className={styles.head}>
                <p className={styles.breadcrumb}>Jobs › Analytics</p>
                <h1 className={styles.title}>Analytics</h1>
            </header>

            <label className={styles.scopeLabel}>Scope{' '}
                <select className={styles.scope} value={scope} onChange={(e) => setScope(e.target.value)}>
                    <option value="">All jobs</option>
                    {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
            </label>

            {error && <p className={styles.error} role="alert">{error}</p>}
            {loading && !data ? (
                <div className={styles.loading}>Loading…</div>
            ) : !data || data.total_applications === 0 ? (
                <div className={styles.empty}>No applications yet for this scope.</div>
            ) : (
                <>
                    <div className={styles.kpis}>
                        <div className={styles.kpi}><span className={styles.kpiN}>{data.total_applications}</span><span className={styles.kpiL}>Applications</span></div>
                        <div className={styles.kpi}><span className={styles.kpiN}>{data.status_breakdown.hired ?? 0}</span><span className={styles.kpiL}>Hired</span></div>
                        <div className={styles.kpi}><span className={styles.kpiN}>{fmtDays(data.time_to_hire.median_days)}</span><span className={styles.kpiL}>Median time-to-hire</span></div>
                    </div>

                    <div className={styles.grid}>
                        <BarChart caption="Funnel (by stage)" data={data.funnel.map((f) => ({ label: f.label, value: f.count }))} />
                        <BarChart caption="Status" data={STATUS_ORDER.filter((s) => data.status_breakdown[s]).map((s) => ({ label: s.replace('_', ' '), value: data.status_breakdown[s] }))} />
                        <BarChart caption="Source mix" data={Object.entries(data.source_mix).map(([k, v]) => ({ label: k.replace('_', ' '), value: v }))} />
                        <BarChart caption="Median time in stage" data={data.time_in_stage.map((t) => ({ label: t.label, value: t.median_days ?? 0, sub: `${fmtDays(t.median_days)} (n=${t.n})` }))} />
                    </div>

                    <section className={styles.eeo}>
                        <h2 className={styles.sectionH}>EEO / diversity (aggregate)</h2>
                        {eeoRestricted ? (
                            <p className={styles.subtle}>Restricted to workspace owners/admins.</p>
                        ) : !eeo || eeo.dimensions.length === 0 ? (
                            <p className={styles.subtle}>No aggregate diversity data above the minimum cohort size.</p>
                        ) : (
                            <>
                                <p className={styles.note}>{eeo.note}</p>
                                {eeo.dimensions.map((d) => (
                                    <div key={d.dimension} className={styles.eeoDim}>
                                        <h3 className={styles.eeoTitle}>{d.dimension} <span className={styles.subtle}>(n={d.total_responses}{d.suppressed_cells > 0 ? `, ${d.suppressed_cells} suppressed` : ''})</span></h3>
                                        <ul className={styles.eeoBuckets}>
                                            {d.buckets.map((b) => <li key={b.answer}>{b.answer}: <strong>{b.count}</strong></li>)}
                                        </ul>
                                    </div>
                                ))}
                            </>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
