'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, TahoeSelect } from '@/components/ui/tahoe-ui';
import { ApiError } from '@/lib/api';
import {
    type ApplicationListItem,
    type PipelineStage,
    bulkApplications,
    listApplications,
    listStages,
    patchApplication,
} from '@/lib/jobs';
import JobsBreadcrumb from '../../_components/JobsBreadcrumb';
import shared from '../../_components/jobs-shared.module.css';
import styles from '../pipeline.module.css';

export default function JobPipelinePage() {
    const { jobId } = useParams<{ jobId: string }>();
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const view = params.get('view') === 'kanban' ? 'kanban' : 'table';
    const sort = params.get('sort') === 'recent' ? 'recent' : 'match';
    const statusFilter = params.get('status') ?? '';

    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [items, setItems] = useState<ApplicationListItem[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [overStage, setOverStage] = useState<string | null>(null);
    const reqId = useRef(0);

    const setParam = useCallback((k: string, v: string) => {
        const next = new URLSearchParams(params.toString());
        if (v) next.set(k, v); else next.delete(k);
        router.replace(`${pathname}?${next.toString()}`);
    }, [params, pathname, router]);

    const reload = useCallback(async () => {
        const id = ++reqId.current;
        setLoading(true);
        setError('');
        try {
            const [st, page] = await Promise.all([
                listStages(jobId),
                listApplications(jobId, { sort, status: statusFilter || undefined, limit: 100 }),
            ]);
            if (id !== reqId.current) return;
            setStages(st);
            setItems(page.items);
            setNextCursor(page.next_cursor);
            setSelected(new Set());
        } catch (e) {
            if (id === reqId.current) setError(e instanceof Error ? e.message : 'Failed to load pipeline');
        } finally {
            if (id === reqId.current) setLoading(false);
        }
    }, [jobId, sort, statusFilter]);

    useEffect(() => { reload(); }, [reload]);

    const refreshCounts = useCallback(async () => {
        try { setStages(await listStages(jobId)); } catch { /* counts are best-effort */ }
    }, [jobId]);

    const move = useCallback(async (app: ApplicationListItem, newStageId: string) => {
        if (app.stage_id === newStageId) return;
        const prevStage = app.stage_id;
        setItems((prev) => prev.map((i) => (i.id === app.id ? { ...i, stage_id: newStageId } : i)));  // optimistic
        try {
            const updated = await patchApplication(app.id, app.updated_at, { stage_id: newStageId });
            setItems((prev) => prev.map((i) => (i.id === app.id ? { ...i, stage_id: updated.stage_id, updated_at: updated.updated_at } : i)));
            refreshCounts();
        } catch (e) {
            setItems((prev) => prev.map((i) => (i.id === app.id ? { ...i, stage_id: prevStage } : i)));  // rollback
            if (e instanceof ApiError && e.status === 409) { setError('Candidate changed elsewhere — reloading.'); reload(); }
            else setError(e instanceof Error ? e.message : 'Move failed');
        }
    }, [refreshCounts, reload]);

    const toggle = (id: string) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const bulk = async (action: 'move_stage' | 'reject', stageId?: string) => {
        if (selected.size === 0) return;
        setError('');
        try {
            await bulkApplications({ ids: [...selected], action, stage_id: stageId });
            await reload();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Bulk action failed');
        }
    };

    const byStage = useMemo(() => {
        const map = new Map<string, ApplicationListItem[]>();
        for (const s of stages) map.set(s.id, []);
        for (const it of items) if (it.stage_id) (map.get(it.stage_id) ?? map.set(it.stage_id, []).get(it.stage_id)!).push(it);
        return map;
    }, [stages, items]);

    return (
        <div className={shared.fullPage}>
            <JobsBreadcrumb items={[{ label: 'Candidates', href: '/dashboard/jobs/pipeline' }, { label: 'Pipeline' }]} />

            <div className={shared.toolbar}>
                <div className={styles.viewToggle} role="tablist" aria-label="View">
                    <Button role="tab" aria-selected={view === 'table'} variant={view === 'table' ? 'solid' : 'ghost'} size="2" onClick={() => setParam('view', 'table')}>Table</Button>
                    <Button role="tab" aria-selected={view === 'kanban'} variant={view === 'kanban' ? 'solid' : 'ghost'} size="2" onClick={() => setParam('view', 'kanban')}>Kanban</Button>
                </div>
                <span className={shared.spacer} />
                <label className={shared.controlLabel}>Sort
                    <TahoeSelect value={sort} onChange={(e) => setParam('sort', e.target.value)}>
                        <option value="match">Match %</option>
                        <option value="recent">Most recent</option>
                    </TahoeSelect>
                </label>
                <label className={shared.controlLabel}>Status
                    <TahoeSelect value={statusFilter} onChange={(e) => setParam('status', e.target.value)}>
                        <option value="">All</option>
                        {['new', 'in_review', 'advanced', 'rejected', 'hired', 'withdrawn'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </TahoeSelect>
                </label>
            </div>

            {selected.size > 0 && (
                <div className={shared.bulkBar}>
                    <span>{selected.size} selected</span>
                    <label className={shared.controlLabel}>Move to
                        <TahoeSelect value="" onChange={(e) => { if (e.target.value) bulk('move_stage', e.target.value); }}>
                            <option value="">stage…</option>
                            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </TahoeSelect>
                    </label>
                    <Button variant="soft" color="red" size="2" onClick={() => bulk('reject')}>Reject</Button>
                    <Button variant="ghost" size="2" onClick={() => setSelected(new Set())}>Clear</Button>
                </div>
            )}

            {error && <p className={shared.error} role="alert">{error}</p>}

            {loading ? (
                <div className={shared.loading}>Loading…</div>
            ) : view === 'table' ? (
                <div className={shared.scrollArea}>
                    <TableView items={items} stages={stages} selected={selected} toggle={toggle} jobId={jobId} onMove={move} />
                    {nextCursor && (
                        <div className={styles.loadMore}>
                            <Button variant="soft" onClick={async () => {
                                const page = await listApplications(jobId, { sort, status: statusFilter || undefined, cursor: nextCursor, limit: 100 });
                                setItems((prev) => [...prev, ...page.items]);
                                setNextCursor(page.next_cursor);
                            }}>Load more</Button>
                        </div>
                    )}
                </div>
            ) : (
                <BoardView
                    stages={stages} byStage={byStage} jobId={jobId} onMove={move}
                    draggingId={draggingId} setDraggingId={setDraggingId} overStage={overStage} setOverStage={setOverStage}
                    items={items}
                />
            )}
        </div>
    );
}

function StageSelect({ app, stages, onMove, className }: {
    app: ApplicationListItem; stages: PipelineStage[]; onMove: (a: ApplicationListItem, s: string) => void; className?: string;
}) {
    return (
        <TahoeSelect
            className={className}
            size="1"
            value={app.stage_id ?? ''}
            aria-label={`Stage for ${app.candidate_name ?? app.candidate_email}`}
            onChange={(e) => onMove(app, e.target.value)}
        >
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </TahoeSelect>
    );
}

function TableView({ items, stages, selected, toggle, jobId, onMove }: {
    items: ApplicationListItem[]; stages: PipelineStage[]; selected: Set<string>;
    toggle: (id: string) => void; jobId: string; onMove: (a: ApplicationListItem, s: string) => void;
}) {
    if (items.length === 0) return <div className={shared.empty}>No applicants yet.</div>;
    return (
        <table className={shared.table}>
            <thead>
                <tr>
                    <th aria-label="select" /><th>Candidate</th><th>Match</th><th>Years</th><th>Location</th><th>Top evidence</th><th>Stage</th>
                </tr>
            </thead>
            <tbody>
                {items.map((a) => (
                    <tr key={a.id}>
                        <td><input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)} aria-label={`Select ${a.candidate_email}`} /></td>
                        <td>
                            <Link href={`/dashboard/jobs/pipeline/${jobId}/${a.id}`}>{a.candidate_name || a.candidate_email}</Link>
                            {a.parse_status === 'failed' && <span className={shared.muted}> · needs review</span>}
                            {a.parse_status === 'pending' && <span className={shared.muted}> · parsing…</span>}
                        </td>
                        <td className={styles.matchPill}>{a.match_pct != null ? `${Math.round(a.match_pct)}%` : '—'}</td>
                        <td className={shared.muted}>{a.years != null ? a.years : '—'}</td>
                        <td className={shared.muted}>{[a.city, a.country].filter(Boolean).join(', ') || '—'}</td>
                        <td className={styles.evidence}>{a.top_evidence || '—'}</td>
                        <td><StageSelect app={a} stages={stages} onMove={onMove} /></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function BoardView({ stages, byStage, jobId, onMove, draggingId, setDraggingId, overStage, setOverStage, items }: {
    stages: PipelineStage[]; byStage: Map<string, ApplicationListItem[]>; jobId: string;
    onMove: (a: ApplicationListItem, s: string) => void;
    draggingId: string | null; setDraggingId: (v: string | null) => void;
    overStage: string | null; setOverStage: (v: string | null) => void;
    items: ApplicationListItem[];
}) {
    const findApp = (id: string) => items.find((i) => i.id === id);
    return (
        <div className={styles.board}>
            {stages.map((s) => {
                const cards = byStage.get(s.id) ?? [];
                return (
                    <div
                        key={s.id}
                        className={`${styles.column} ${overStage === s.id ? styles.columnOver : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setOverStage(s.id); }}
                        onDragLeave={() => setOverStage(null)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setOverStage(null);
                            const id = e.dataTransfer.getData('text/plain') || draggingId;
                            const app = id ? findApp(id) : null;
                            if (app) onMove(app, s.id);
                            setDraggingId(null);
                        }}
                    >
                        <div className={styles.columnHead}><span>{s.name}</span><span className={styles.columnCount}>{cards.length}</span></div>
                        <div className={styles.columnBody}>
                            {cards.map((a) => (
                                <div
                                    key={a.id}
                                    className={styles.card}
                                    draggable
                                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', a.id); setDraggingId(a.id); }}
                                    onDragEnd={() => setDraggingId(null)}
                                >
                                    <div className={styles.cardTop}>
                                        <span className={styles.cardName}><Link href={`/dashboard/jobs/pipeline/${jobId}/${a.id}`}>{a.candidate_name || a.candidate_email}</Link></span>
                                        <span className={styles.matchPill}>{a.match_pct != null ? `${Math.round(a.match_pct)}%` : '—'}</span>
                                    </div>
                                    {a.top_evidence && <p className={styles.cardEvidence}>{a.top_evidence}</p>}
                                    <StageSelect app={a} stages={stages} onMove={onMove} className={styles.cardSelect} />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
