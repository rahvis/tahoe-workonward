'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Flex, TextField } from '@/components/ui/tahoe-ui';
import CreditsBadge from '@/app/dashboard/_components/CreditsBadge';
import EnrichModal from '@/app/dashboard/_components/EnrichModal';
import CandidatePanel, { type PreviewData } from '../../../search/CandidatePanel';
import PreviewGrid, { type PreviewGridExtraColumn, type PreviewGridRow } from '../../../search/preview-grid';
import {
    fetchEnrichmentRun,
    fetchEnrichmentRuns,
    fetchList,
    fetchListCandidates,
    removeListCandidates,
    type EnrichmentRunSummary,
    type ListCandidateRow,
    type ListSummary,
} from '@/lib/organization';
import styles from '../../projects.module.css';

function toPreviewData(candidate: ListCandidateRow): PreviewData {
    return {
        id: Number(candidate.source_id) || 0,
        full_name: candidate.full_name ?? null,
        headline: candidate.headline ?? null,
        job_title: candidate.job_title ?? null,
        company_name: candidate.company_name ?? null,
        location_full: candidate.location_full ?? null,
        location_country: candidate.location_country ?? null,
        management_level: candidate.management_level ?? null,
        company_industry: candidate.company_industry ?? null,
        websites_linkedin: candidate.websites_linkedin ?? null,
        connections_count: candidate.connections_count ?? null,
        follower_count: candidate.follower_count ?? null,
        company_linkedin_url: candidate.company_linkedin_url ?? null,
        company_website: candidate.company_website ?? null,
        department: candidate.department ?? null,
        company_location_hq_full_address: candidate.company_location_hq_full_address ?? null,
        company_location_hq_country: candidate.company_location_hq_country ?? null,
        score: candidate.score ?? null,
    };
}

export default function ListDetailPage() {
    const params = useParams<{ listId: string }>();
    const listId = String(params.listId);
    const [list, setList] = useState<ListSummary | null>(null);
    const [items, setItems] = useState<ListCandidateRow[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [activeCandidateId, setActiveCandidateId] = useState<number | null>(null);
    const [removing, setRemoving] = useState(false);
    const [enrichOpen, setEnrichOpen] = useState(false);
    const [activeRun, setActiveRun] = useState<EnrichmentRunSummary | null>(null);
    const [creditRefreshKey, setCreditRefreshKey] = useState(0);

    const load = useCallback(async (cursor?: string | null, append = false) => {
        setLoading(!append);
        try {
            const [listItem, candidatePage] = await Promise.all([
                fetchList(listId),
                fetchListCandidates(listId, { cursor: cursor || undefined, search: search || undefined }),
            ]);
            setList(listItem);
            setItems((current) => (append ? [...current, ...candidatePage.items] : candidatePage.items));
            setNextCursor(candidatePage.next_cursor);
        } finally {
            setLoading(false);
        }
    }, [listId, search]);

    const loadRuns = useCallback(async () => {
        try {
            const response = await fetchEnrichmentRuns(listId);
            const nextActiveRun = response.items.find((run) => run.status === 'pending' || run.status === 'in_progress') ?? null;
            setActiveRun(nextActiveRun);
        } catch {
            setActiveRun(null);
        }
    }, [listId]);

    useEffect(() => {
        void load(null, false);
    }, [load]);

    useEffect(() => {
        void loadRuns();
    }, [loadRuns]);

    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(searchInput), 250);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    const rows = useMemo<PreviewGridRow[]>(
        () => items.map((item) => ({
            id: Number(item.source_id) || 0,
            full_name: item.full_name ?? null,
            websites_linkedin: item.websites_linkedin ?? null,
            headline: item.headline ?? null,
            location_full: item.location_full ?? null,
            location_country: item.location_country ?? null,
            connections_count: item.connections_count ?? null,
            follower_count: item.follower_count ?? null,
            company_name: item.company_name ?? null,
            company_linkedin_url: item.company_linkedin_url ?? null,
            company_website: item.company_website ?? null,
            company_industry: item.company_industry ?? null,
            job_title: item.job_title ?? null,
            department: item.department ?? null,
            management_level: item.management_level ?? null,
            company_location_hq_full_address: item.company_location_hq_full_address ?? null,
            company_location_hq_country: item.company_location_hq_country ?? null,
            score: item.score ?? null,
            page: item.source_preview_page ?? null,
            search_prompt: item.source_search_prompt ?? null,
            searched_at: item.searched_at ?? item.added_at ?? null,
            query_hash: item.source_query_hash ?? null,
            pipeline: item.pipeline ?? null,
        })),
        [items],
    );

    const rowsBySourceId = useMemo(
        () => new Map(items.map((item) => [Number(item.source_id) || 0, item])),
        [items],
    );

    const activeCandidate = useMemo(() => {
        const candidate = items.find((item) => (Number(item.source_id) || 0) === activeCandidateId);
        return candidate ? toPreviewData(candidate) : null;
    }, [activeCandidateId, items]);

    const candidateIdsToRemove = useMemo(
        () => items.filter((item) => selectedIds.has(Number(item.source_id) || 0)).map((item) => item.candidate_id),
        [items, selectedIds],
    );

    const selectedCandidateIdsForEnrichment = useMemo(
        () => items.filter((item) => selectedIds.has(Number(item.source_id) || 0)).map((item) => item.candidate_id),
        [items, selectedIds],
    );

    useEffect(() => {
        if (!activeRun || (activeRun.status !== 'pending' && activeRun.status !== 'in_progress')) {
            return;
        }
        const activeRunId = activeRun.id;
        let cancelled = false;
        async function pollRun() {
            try {
                const refreshed = await fetchEnrichmentRun(activeRunId);
                if (cancelled) {
                    return;
                }
                if (refreshed.status === 'pending' || refreshed.status === 'in_progress') {
                    setActiveRun(refreshed);
                    return;
                }
                setActiveRun(null);
                setCreditRefreshKey((current) => current + 1);
                await Promise.all([load(null, false), loadRuns()]);
            } catch {
                if (!cancelled) {
                    setActiveRun(null);
                }
            }
        }
        void pollRun();
        const interval = window.setInterval(() => {
            void pollRun();
        }, 5000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [activeRun, load, loadRuns]);

    const extraColumns = useMemo<PreviewGridExtraColumn[]>(
        () => [
            {
                key: 'contact',
                label: 'Contact',
                className: styles.wideTextCell,
                render: (row) => {
                    const item = rowsBySourceId.get(row.id);
                    const contact = item?.contact;
                    if (!contact) {
                        return <span className={styles.contactPlaceholder}>—</span>;
                    }
                    return (
                        <div className={styles.contactStack}>
                            {contact.work_email?.value ? (
                                <span className={styles.contactEntry}>{contact.work_email.value}</span>
                            ) : null}
                            {contact.personal_email?.value ? (
                                <span className={styles.contactEntry}>{contact.personal_email.value}</span>
                            ) : null}
                            {contact.phone?.number ? (
                                <span className={styles.contactEntry}>{contact.phone.number}</span>
                            ) : null}
                            {!contact.work_email?.value && !contact.personal_email?.value && !contact.phone?.number ? (
                                <span className={styles.contactPlaceholder}>—</span>
                            ) : null}
                        </div>
                    );
                },
            },
            {
                key: 'enrichment',
                label: 'Enrichment',
                className: styles.textCell,
                render: (row) => {
                    const item = rowsBySourceId.get(row.id);
                    const statusValue = item?.enrichment_status ?? 'NOT_REQUESTED';
                    const className = [
                        styles.statusPill,
                        statusValue === 'DONE' ? styles.statusPillDone : '',
                        statusValue === 'PENDING' ? styles.statusPillPending : '',
                        statusValue === 'EMAIL_NOT_FOUND' || statusValue === 'PHONE_NOT_FOUND'
                            ? styles.statusPillMuted
                            : '',
                        statusValue === 'PARTIAL' ? styles.statusPillWarning : '',
                        statusValue === 'FAILED' ? styles.statusPillFailed : '',
                    ].filter(Boolean).join(' ');
                    return <span className={className}>{statusValue.replaceAll('_', ' ')}</span>;
                },
            },
        ],
        [rowsBySourceId],
    );

    async function handleRemoveSelected() {
        if (candidateIdsToRemove.length === 0) return;
        setRemoving(true);
        try {
            await removeListCandidates(listId, candidateIdsToRemove);
            setSelectedIds(new Set());
            await load(null, false);
        } finally {
            setRemoving(false);
        }
    }

    const canEnrich = !loading && rows.length > 0;

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className="tahoe-eyebrow">Durable candidate audience</span>
                    <h1 className={styles.title}>{list?.name || 'List'}</h1>
                    <div className={styles.pills}>
                        <span className={styles.pill}>{list?.project_name || 'Project not loaded'}</span>
                        <span className={styles.pill}>{list?.candidate_count ?? items.length} candidate{(list?.candidate_count ?? items.length) === 1 ? '' : 's'}</span>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <CreditsBadge refreshKey={creditRefreshKey} />
                    <button
                        type="button"
                        className="tahoe-button"
                        disabled={!canEnrich}
                        onClick={() => setEnrichOpen(true)}
                    >
                        Enrich
                    </button>
                    <Link href={`/dashboard/outreach/campaigns/new?list_id=${encodeURIComponent(listId)}`} className="tahoe-button-secondary">
                        Push to campaign
                    </Link>
                    <Link href="/dashboard/projects/lists" className="tahoe-button-secondary">
                        Back to all lists
                    </Link>
                </div>
            </header>

            {activeRun ? (
                <div className={styles.runBanner}>
                    An enrichment run for {activeRun.target_candidate_count} contact{activeRun.target_candidate_count === 1 ? '' : 's'} is in progress. Status is tracked from Tahoe run state.
                </div>
            ) : null}

            <div className={styles.tableTools}>
                <TextField.Root
                    size="3"
                    style={{ minWidth: 280 }}
                    placeholder="Search this list"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                />
                {selectedIds.size > 0 ? (
                    <Flex gap="2">
                        <Button
                            size="3"
                            variant="soft"
                            color="gray"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Clear selection
                        </Button>
                        <Button
                            size="3"
                            color="red"
                            onClick={() => void handleRemoveSelected()}
                            disabled={removing}
                        >
                            {removing ? 'Removing…' : `Remove ${selectedIds.size} from list`}
                        </Button>
                    </Flex>
                ) : null}
            </div>

            {loading ? (
                <div className={styles.emptyState}>
                    <span className="tahoe-spinner" />
                    <p>Loading list candidates…</p>
                </div>
            ) : null}

            {!loading && rows.length === 0 ? (
                <div className={styles.emptyState}>
                    <h2>No candidates in this list</h2>
                    <p>Save candidates from Search &gt; New Search to populate this list.</p>
                </div>
            ) : null}

            {!loading && rows.length > 0 ? (
                <div className={styles.tableShell}>
                    <PreviewGrid
                        rows={rows}
                        includeMetadata
                        hiddenColumnKeys={['id', 'headline', 'connections_count', 'followers_count', 'score', 'page', 'pipeline', 'search_prompt']}
                        extraColumns={extraColumns}
                        showCandidateSubtitle={false}
                        selectable
                        selectedRowIds={selectedIds}
                        activeRowId={activeCandidateId}
                        emptyMessage="No candidates found."
                        onToggleAllSelection={(checked) => {
                            setSelectedIds(checked ? new Set(rows.map((row) => row.id)) : new Set());
                        }}
                        onToggleRowSelection={(row) => {
                            setSelectedIds((current) => {
                                const next = new Set(current);
                                if (next.has(row.id)) {
                                    next.delete(row.id);
                                } else {
                                    next.add(row.id);
                                }
                                return next;
                            });
                        }}
                        onRowClick={(row) => setActiveCandidateId(activeCandidateId === row.id ? null : row.id)}
                    />
                </div>
            ) : null}

            {nextCursor ? (
                <Flex justify="center">
                    <Button size="3" variant="soft" onClick={() => void load(nextCursor, true)}>
                        Load more
                    </Button>
                </Flex>
            ) : null}

            {activeCandidate ? (
                <CandidatePanel preview={activeCandidate} onClose={() => setActiveCandidateId(null)} />
            ) : null}

            <EnrichModal
                open={enrichOpen}
                onOpenChange={setEnrichOpen}
                listId={listId}
                selectedCandidateIds={selectedCandidateIdsForEnrichment}
                onSubmitted={async (run) => {
                    setActiveRun(run);
                    setCreditRefreshKey((current) => current + 1);
                    await Promise.all([load(null, false), loadRuns()]);
                }}
            />
        </section>
    );
}
