'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    PersonIcon,
} from '@/components/ui/icons';
import { Box, Button, Flex, TextField } from '@/components/ui/tahoe-ui';
import CreditsBadge from '@/app/dashboard/_components/CreditsBadge';
import EnrichModal from '@/app/dashboard/_components/EnrichModal';
import CandidatePanel, { type PreviewData } from '../../../search/CandidatePanel';
import { buildPaginationTokens } from '../../../search/pagination';
import PreviewGrid, { type PreviewGridExtraColumn, type PreviewGridRow } from '../../../search/preview-grid';
import {
    fetchEnrichmentRun,
    fetchEnrichmentRuns,
    fetchList,
    fetchListCandidates,
    removeListCandidates,
    updateListCandidateContact,
    type ContactFieldState,
    type EnrichmentRunSummary,
    type ListCandidateRow,
    type ListSummary,
} from '@/lib/organization';
import layoutStyles from '../../../candidates/candidates.module.css';
import projectStyles from '../../projects.module.css';

const PAGE_SIZE = 20;
type ContactField = 'phone' | 'work_email' | 'personal_email';
type SelectedCandidate = { candidateId: string; name: string | null };

const HIDDEN_LIST_COLUMN_KEYS = [
    'id',
    'profile_url',
    'headline',
    'location_full',
    'location_country',
    'connections_count',
    'followers_count',
    'company_name',
    'company_url',
    'company_website',
    'company_industry',
    'active_experience_title',
    'department',
    'management_level',
    'company_hq_full_address',
    'company_hq_country',
    'score',
];

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

function contactFieldValue(item: ListCandidateRow | undefined, field: ContactField) {
    if (!item?.contact) return '';
    if (field === 'phone') {
        return item.contact.phone?.number ?? '';
    }
    return item.contact[field]?.value ?? '';
}

function contactFieldState(item: ListCandidateRow | undefined, field: ContactField): ContactFieldState {
    const value = contactFieldValue(item, field);
    if (value) {
        const state = item?.contact_field_states?.[field] ?? item?.contact?.field_statuses?.[field];
        return { ...(state ?? {}), status: 'found' as const };
    }
    return item?.contact_field_states?.[field] ?? item?.contact?.field_statuses?.[field] ?? { status: 'not_requested' };
}

function mergeContactOverride(item: ListCandidateRow, override: ListCandidateRow): ListCandidateRow {
    return {
        ...item,
        contact: override.contact,
        contact_field_states: override.contact_field_states,
        enrichment_status: override.enrichment_status,
    };
}

function ContactFieldDisplay({ item, field }: { item: ListCandidateRow | undefined; field: ContactField }) {
    const state = contactFieldState(item, field);
    const value = contactFieldValue(item, field);

    if (value) {
        return <span className={projectStyles.contactEntry}>{value}</span>;
    }
    if (state.status === 'pending') {
        return <span className={projectStyles.contactPending} aria-label="Enrichment pending" />;
    }
    if (state.status === 'not_found' || state.status === 'failed') {
        return <span className={projectStyles.contactUnavailable}>N/A</span>;
    }
    return <span className={projectStyles.contactPlaceholder}>—</span>;
}

function ContactFieldCell({
    item,
    field,
    listId,
    onSaved,
}: {
    item: ListCandidateRow | undefined;
    field: ContactField;
    listId: string;
    onSaved: (updated: ListCandidateRow) => void;
}) {
    const value = contactFieldValue(item, field);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!editing && !saving) {
            setDraft(value);
        }
    }, [editing, saving, value]);

    async function commitDraft(nextDraft: string) {
        if (!item || saving) {
            return;
        }
        const trimmed = nextDraft.trim();
        if (trimmed === value) {
            setDraft(value);
            setError('');
            setEditing(false);
            return;
        }
        setSaving(true);
        setError('');
        try {
            const payload: { phone?: string | null; work_email?: string | null; personal_email?: string | null } = {};
            payload[field] = trimmed || null;
            const updated = await updateListCandidateContact(listId, item.candidate_id, payload);
            onSaved(updated);
            setDraft(contactFieldValue(updated, field));
            setEditing(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to save';
            setError(message);
            setEditing(true);
        } finally {
            setSaving(false);
        }
    }

    if (editing) {
        return (
            <div className={projectStyles.contactEditWrap} onClick={(event) => event.stopPropagation()}>
                <input
                    className={projectStyles.contactInput}
                    value={draft}
                    type={field === 'phone' ? 'tel' : 'email'}
                    autoFocus
                    aria-label={`Edit ${field.replaceAll('_', ' ')}`}
                    disabled={saving}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={() => void commitDraft(draft)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            void commitDraft(draft);
                        }
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            setDraft(value);
                            setError('');
                            setEditing(false);
                        }
                    }}
                />
                {saving ? <span className={projectStyles.contactSaving}>Saving...</span> : null}
                {error ? <span className={projectStyles.contactError}>{error}</span> : null}
            </div>
        );
    }

    return (
        <button
            type="button"
            className={projectStyles.contactEditableButton}
            onClick={(event) => {
                event.stopPropagation();
                setDraft(value);
                setError('');
                setEditing(true);
            }}
        >
            <ContactFieldDisplay item={item} field={field} />
        </button>
    );
}

export default function ListDetailPage() {
    const params = useParams<{ listId: string }>();
    const listId = String(params.listId);
    const [list, setList] = useState<ListSummary | null>(null);
    const [items, setItems] = useState<ListCandidateRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [selectedCandidates, setSelectedCandidates] = useState<Map<string, SelectedCandidate>>(new Map());
    const [activeCandidateId, setActiveCandidateId] = useState<number | null>(null);
    const [removing, setRemoving] = useState(false);
    const [enrichOpen, setEnrichOpen] = useState(false);
    const [activeRun, setActiveRun] = useState<EnrichmentRunSummary | null>(null);
    const [enrichmentNotice, setEnrichmentNotice] = useState('');
    const [creditRefreshKey, setCreditRefreshKey] = useState(0);
    const contactOverridesRef = useRef(new Map<string, ListCandidateRow>());

    const load = useCallback(async (options?: { background?: boolean }) => {
        const background = Boolean(options?.background);
        if (!background) {
            setLoading(true);
        }
        try {
            const [listItem, candidatePage] = await Promise.all([
                fetchList(listId),
                fetchListCandidates(listId, { page, perPage: PAGE_SIZE, search: search || undefined }),
            ]);
            setList(listItem);
            const contactOverrides = contactOverridesRef.current;
            setItems(candidatePage.items.map((item) => {
                const override = contactOverrides.get(item.candidate_id);
                return override ? mergeContactOverride(item, override) : item;
            }));
            setTotal(candidatePage.total);
            setTotalPages(candidatePage.total_pages);
            if (candidatePage.page !== page) {
                setPage(candidatePage.page);
            }
        } finally {
            if (!background) {
                setLoading(false);
            }
        }
    }, [listId, page, search]);

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
        void load();
    }, [load]);

    useEffect(() => {
        void loadRuns();
    }, [loadRuns]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setActiveCandidateId(null);
    }, [page, search]);

    useEffect(() => {
        contactOverridesRef.current = new Map();
        setSelectedCandidates(new Map());
        setActiveCandidateId(null);
    }, [listId]);

    const rows = useMemo<PreviewGridRow[]>(
        () => items.map((item, index) => ({
            id: index + 1,
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

    const itemsByRowId = useMemo(
        () => new Map(rows.map((row, index) => [row.id, items[index]])),
        [items, rows],
    );

    const selectedIds = useMemo(
        () => new Set(rows.filter((row) => {
            const item = itemsByRowId.get(row.id);
            return item ? selectedCandidates.has(item.candidate_id) : false;
        }).map((row) => row.id)),
        [itemsByRowId, rows, selectedCandidates],
    );

    const activeCandidate = useMemo(() => {
        const candidate = activeCandidateId == null ? null : itemsByRowId.get(activeCandidateId);
        return candidate ? toPreviewData(candidate) : null;
    }, [activeCandidateId, itemsByRowId]);

    const candidateIdsToRemove = useMemo(
        () => Array.from(selectedCandidates.values()).map((candidate) => candidate.candidateId),
        [selectedCandidates],
    );
    const selectedCount = selectedCandidates.size;

    const selectedCandidateIdsForEnrichment = useMemo(
        () => Array.from(selectedCandidates.values()).map((candidate) => candidate.candidateId),
        [selectedCandidates],
    );

    const activeRunId = activeRun?.id ?? null;
    const activeRunStatus = activeRun?.status ?? null;

    const handleContactSaved = useCallback((updated: ListCandidateRow) => {
        contactOverridesRef.current.set(updated.candidate_id, updated);
        setItems((current) => current.map((item) => (
            item.candidate_id === updated.candidate_id ? mergeContactOverride(item, updated) : item
        )));
    }, []);

    useEffect(() => {
        if (!activeRunId || (activeRunStatus !== 'pending' && activeRunStatus !== 'in_progress')) {
            return;
        }
        const runId = activeRunId;
        let cancelled = false;
        async function pollRun() {
            try {
                const refreshed = await fetchEnrichmentRun(runId);
                if (cancelled) {
                    return;
                }
                if (refreshed.status === 'pending' || refreshed.status === 'in_progress') {
                    setActiveRun(refreshed);
                    await load({ background: true });
                    return;
                }
                setActiveRun(null);
                setEnrichmentNotice('');
                setCreditRefreshKey((current) => current + 1);
                await Promise.all([load(), loadRuns()]);
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
    }, [activeRunId, activeRunStatus, load, loadRuns]);

    const extraColumns = useMemo<PreviewGridExtraColumn[]>(
        () => [
            {
                key: 'current_title',
                label: 'Current Title',
                className: projectStyles.textCell,
                render: (row) => <span className={projectStyles.truncateText} title={row.job_title || ''}>{row.job_title || '—'}</span>,
            },
            {
                key: 'company_name',
                label: 'Company Name',
                className: projectStyles.textCell,
                render: (row) => <span className={projectStyles.truncateText} title={row.company_name || ''}>{row.company_name || '—'}</span>,
            },
            {
                key: 'phone',
                label: 'Phone',
                className: projectStyles.contactCell,
                render: (row) => (
                    <ContactFieldCell
                        item={itemsByRowId.get(row.id)}
                        field="phone"
                        listId={listId}
                        onSaved={handleContactSaved}
                    />
                ),
            },
            {
                key: 'work_email',
                label: 'Work Email',
                className: projectStyles.contactCell,
                render: (row) => (
                    <ContactFieldCell
                        item={itemsByRowId.get(row.id)}
                        field="work_email"
                        listId={listId}
                        onSaved={handleContactSaved}
                    />
                ),
            },
            {
                key: 'personal_email',
                label: 'Personal Email',
                className: projectStyles.contactCell,
                render: (row) => (
                    <ContactFieldCell
                        item={itemsByRowId.get(row.id)}
                        field="personal_email"
                        listId={listId}
                        onSaved={handleContactSaved}
                    />
                ),
            },
            {
                key: 'enrichment',
                label: 'Enrichment',
                className: projectStyles.textCell,
                render: (row) => {
                    const item = itemsByRowId.get(row.id);
                    const statusValue = item?.enrichment_status ?? 'NOT_REQUESTED';
                    const className = [
                        projectStyles.statusPill,
                        statusValue === 'DONE' ? projectStyles.statusPillDone : '',
                        statusValue === 'PENDING' ? projectStyles.statusPillPending : '',
                        statusValue === 'EMAIL_NOT_FOUND' || statusValue === 'PHONE_NOT_FOUND' || statusValue === 'NO_DATA_FOUND'
                            ? projectStyles.statusPillMuted
                            : '',
                        statusValue === 'PARTIAL' ? projectStyles.statusPillWarning : '',
                        statusValue === 'FAILED' ? projectStyles.statusPillFailed : '',
                    ].filter(Boolean).join(' ');
                    return <span className={className}>{statusValue.replaceAll('_', ' ')}</span>;
                },
            },
        ],
        [handleContactSaved, itemsByRowId, listId],
    );

    async function handleRemoveSelected() {
        if (candidateIdsToRemove.length === 0) return;
        setRemoving(true);
        try {
            await removeListCandidates(listId, candidateIdsToRemove);
            setSelectedCandidates(new Map());
            await load();
        } finally {
            setRemoving(false);
        }
    }

    const paginationTokens = buildPaginationTokens(page, totalPages, 10);
    const listCandidateCount = list?.candidate_count ?? total;
    const canEnrich = !loading && listCandidateCount > 0;
    const activeRunIsOpen = activeRun?.status === 'pending' || activeRun?.status === 'in_progress';

    return (
        <section className={layoutStyles.page}>
            <header className={`${layoutStyles.header} ${layoutStyles.listHeader}`}>
                <Flex className={layoutStyles.listHeaderTop} gap="3" align="center" justify="between" wrap="wrap">
                    <div className={layoutStyles.listTitleGroup}>
                        <span className="tahoe-eyebrow">Durable candidate audience</span>
                        <h1 className={layoutStyles.listTitle}>{list?.name || 'List'}</h1>
                        <div className={layoutStyles.listPills}>
                            <span className={layoutStyles.listPill}>{list?.project_name || 'Project not loaded'}</span>
                            <span className={layoutStyles.listPill}>{listCandidateCount} candidate{listCandidateCount === 1 ? '' : 's'}</span>
                        </div>
                    </div>
                    <div className={layoutStyles.listActions}>
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
                </Flex>

                {activeRunIsOpen && activeRun ? (
                    <div className={layoutStyles.listRunBanner}>
                        An enrichment run for {activeRun.target_candidate_count} contact{activeRun.target_candidate_count === 1 ? '' : 's'} is in progress. Status is tracked from Tahoe run state.
                    </div>
                ) : null}
                {enrichmentNotice ? (
                    <div className={layoutStyles.listRunBanner} role="status" aria-live="polite">
                        {enrichmentNotice}
                    </div>
                ) : null}

                <Flex className={layoutStyles.headerRow} gap="3" align="center" wrap="wrap">
                    <Box className={layoutStyles.searchFieldWrap}>
                        <TextField.Root
                            size="3"
                            rootClassName={layoutStyles.searchShell}
                            className={layoutStyles.searchInput}
                            placeholder="Search this list"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                        >
                            <TextField.Slot>
                                <MagnifyingGlassIcon />
                            </TextField.Slot>
                        </TextField.Root>
                    </Box>
                    {selectedCount > 0 ? (
                        <div className={layoutStyles.selectionActions}>
                            <Button
                                size="3"
                                variant="soft"
                                color="gray"
                                type="button"
                                onClick={() => setSelectedCandidates(new Map())}
                            >
                                Clear selection
                            </Button>
                            <Button
                                size="3"
                                color="red"
                                type="button"
                                onClick={() => void handleRemoveSelected()}
                                disabled={removing}
                            >
                                {removing ? 'Removing...' : `Remove ${selectedCount} from list`}
                            </Button>
                        </div>
                    ) : null}
                </Flex>
            </header>

            <div className={layoutStyles.shellGrid}>
                <div className={layoutStyles.resultsArea}>
                    {loading ? (
                        <div className={layoutStyles.emptyState}>
                            <span className="tahoe-spinner" />
                            <p>Loading list candidates...</p>
                        </div>
                    ) : null}

                    {!loading && rows.length === 0 ? (
                        <div className={layoutStyles.emptyState}>
                            <div className={layoutStyles.emptyIcon}><PersonIcon width="48" height="48" /></div>
                            <h2 className={layoutStyles.emptyTitle}>No candidates found</h2>
                            <p className={layoutStyles.emptyBody}>
                                {search
                                    ? 'No candidates match your search. Try a different query.'
                                    : 'Save candidates from Search > New Search to populate this list.'}
                            </p>
                        </div>
                    ) : null}

                    {!loading && rows.length > 0 ? (
                        <div className={layoutStyles.resultsLayout}>
                            <div className={layoutStyles.resultsTableRegion}>
                                <PreviewGrid
                                    className={layoutStyles.resultsPreviewGrid}
                                    rows={rows}
                                    hiddenColumnKeys={HIDDEN_LIST_COLUMN_KEYS}
                                    extraColumns={extraColumns}
                                    showCandidateSubtitle={false}
                                    selectable
                                    selectedRowIds={selectedIds}
                                    activeRowId={activeCandidateId}
                                    emptyMessage="No candidates found."
                                    onToggleAllSelection={(checked) => {
                                        setSelectedCandidates((current) => {
                                            const next = new Map(current);
                                            for (const row of rows) {
                                                const item = itemsByRowId.get(row.id);
                                                if (checked && item) {
                                                    next.set(item.candidate_id, {
                                                        candidateId: item.candidate_id,
                                                        name: item.full_name ?? null,
                                                    });
                                                } else if (item) {
                                                    next.delete(item.candidate_id);
                                                }
                                            }
                                            return next;
                                        });
                                    }}
                                    onToggleRowSelection={(row) => {
                                        setSelectedCandidates((current) => {
                                            const item = itemsByRowId.get(row.id);
                                            if (!item) {
                                                return current;
                                            }
                                            const next = new Map(current);
                                            if (next.has(item.candidate_id)) {
                                                next.delete(item.candidate_id);
                                            } else {
                                                next.set(item.candidate_id, {
                                                    candidateId: item.candidate_id,
                                                    name: item.full_name ?? null,
                                                });
                                            }
                                            return next;
                                        });
                                    }}
                                    onRowClick={(row) => setActiveCandidateId(activeCandidateId === row.id ? null : row.id)}
                                />
                            </div>

                            {totalPages > 1 ? (
                                <Flex className={layoutStyles.paginationFooter} justify="center" align="center" gap="2" wrap="wrap">
                                    <Button
                                        size="1"
                                        variant="soft"
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                    >
                                        <ChevronLeftIcon />
                                        Previous
                                    </Button>
                                    {paginationTokens.map((token) =>
                                        typeof token === 'number' ? (
                                            <Button
                                                key={`page-${token}`}
                                                size="1"
                                                variant={token === page ? 'solid' : 'soft'}
                                                type="button"
                                                onClick={() => setPage(token)}
                                            >
                                                {token}
                                            </Button>
                                        ) : (
                                            <Button key={token} size="1" variant="ghost" type="button" disabled>
                                                …
                                            </Button>
                                        ),
                                    )}
                                    <Button
                                        size="1"
                                        variant="soft"
                                        type="button"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    >
                                        Next
                                        <ChevronRightIcon />
                                    </Button>
                                </Flex>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                {activeCandidate ? (
                    <CandidatePanel preview={activeCandidate} onClose={() => setActiveCandidateId(null)} />
                ) : null}
            </div>

            <EnrichModal
                open={enrichOpen}
                onOpenChange={setEnrichOpen}
                listId={listId}
                selectedCandidateIds={selectedCandidateIdsForEnrichment}
                onSubmitted={async (run) => {
                    if (run.status === 'pending' || run.status === 'in_progress') {
                        setActiveRun(run);
                        setEnrichmentNotice(
                            `Enrichment has started for ${run.target_candidate_count} candidate${run.target_candidate_count === 1 ? '' : 's'}. You can keep working or come back to this list later; contact details will appear here as FullEnrich returns them.`,
                        );
                    } else {
                        setActiveRun(null);
                        setEnrichmentNotice(
                            'No new enrichment was started because the selected contact fields are already complete or currently in progress.',
                        );
                    }
                    setCreditRefreshKey((current) => current + 1);
                    await Promise.all([load(), loadRuns()]);
                }}
            />
        </section>
    );
}
