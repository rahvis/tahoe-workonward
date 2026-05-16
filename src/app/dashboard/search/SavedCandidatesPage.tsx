'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    PersonIcon,
} from '@/components/ui/icons';
import { Box, Button, Flex, TextField } from '@/components/ui/tahoe-ui';
import CandidatePanel, { type PreviewData } from './CandidatePanel';
import PreviewGrid, { type PreviewGridRow } from './preview-grid';
import SaveToListDialog from '../_components/SaveToListDialog';
import {
    fetchSavedCandidates,
    previewCandidateToImportPayload,
    type SavedCandidate,
} from '@/lib/organization';
import styles from '../candidates/candidates.module.css';

type PaginationToken = number | 'ellipsis-left' | 'ellipsis-right';

function buildPaginationTokens(
    currentPage: number,
    totalPages: number,
    maxNumericButtons: number = 10,
): PaginationToken[] {
    if (totalPages <= 0) return [];
    if (totalPages <= maxNumericButtons) {
        return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }

    const firstPage = 1;
    const lastPage = totalPages;
    const middleWindow = Math.max(3, maxNumericButtons - 2);
    let start = Math.max(2, currentPage - Math.floor(middleWindow / 2));
    let end = start + middleWindow - 1;

    if (end >= lastPage) {
        end = lastPage - 1;
        start = Math.max(2, end - middleWindow + 1);
    }

    const tokens: PaginationToken[] = [firstPage];
    if (start > 2) tokens.push('ellipsis-left');
    for (let pageNum = start; pageNum <= end; pageNum += 1) {
        tokens.push(pageNum);
    }
    if (end < lastPage - 1) tokens.push('ellipsis-right');
    tokens.push(lastPage);
    return tokens;
}

function toPreviewData(candidate: SavedCandidate): PreviewData {
    return {
        id: candidate.coresignal_id,
        full_name: candidate.full_name,
        headline: candidate.headline,
        job_title: candidate.job_title,
        company_name: candidate.company_name,
        location_full: candidate.location_full,
        location_country: candidate.location_country,
        management_level: candidate.management_level,
        company_industry: candidate.company_industry,
        websites_linkedin: candidate.websites_linkedin,
        connections_count: candidate.connections_count,
        follower_count: candidate.follower_count,
        company_linkedin_url: candidate.company_linkedin_url,
        company_website: candidate.company_website,
        department: candidate.department,
        company_location_hq_full_address: candidate.company_location_hq_full_address,
        company_location_hq_country: candidate.company_location_hq_country,
        score: candidate.score,
    };
}

export default function SavedCandidatesPage() {
    const [candidates, setCandidates] = useState<SavedCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [activeCandidateId, setActiveCandidateId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);

    const fetchCandidates = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchSavedCandidates({ page, search: search || undefined });
            setCandidates(data.candidates);
            setTotalPages(data.total_pages);
        } catch {
            setCandidates([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        void fetchCandidates();
    }, [fetchCandidates]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const paginationTokens = buildPaginationTokens(page, totalPages, 10);
    const gridRows = useMemo<PreviewGridRow[]>(
        () => candidates.map((candidate) => ({
            ...candidate,
            id: candidate.coresignal_id,
        })),
        [candidates],
    );

    const activeCandidate = useMemo(() => {
        const candidate = candidates.find((item) => item.coresignal_id === activeCandidateId);
        return candidate ? toPreviewData(candidate) : null;
    }, [activeCandidateId, candidates]);

    const selectedCandidates = useMemo(
        () => candidates.filter((candidate) => selectedIds.has(candidate.coresignal_id)),
        [candidates, selectedIds],
    );

    const selectedImportPayload = useMemo(
        () => selectedCandidates.map((candidate) => previewCandidateToImportPayload({
            ...candidate,
            id: candidate.coresignal_id,
        })),
        [selectedCandidates],
    );

    const legacySelectedCount = selectedCandidates.filter((candidate) => candidate.saved_origin === 'legacy_preview_compat').length;

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <Flex className={styles.headerRow} gap="3" align="center" wrap="wrap">
                    <Box className={styles.searchFieldWrap}>
                        <TextField.Root
                            size="3"
                            rootClassName={styles.searchShell}
                            className={styles.searchInput}
                            placeholder="Search candidates..."
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                        >
                            <TextField.Slot>
                                <MagnifyingGlassIcon />
                            </TextField.Slot>
                        </TextField.Root>
                    </Box>
                    {selectedCandidates.length > 0 ? (
                        <div className={styles.selectionActions}>
                            <Button size="3" type="button" onClick={() => setSaveDialogOpen(true)}>
                                {legacySelectedCount > 0 ? `Add ${legacySelectedCount} legacy candidate${legacySelectedCount === 1 ? '' : 's'} to a list` : `Save ${selectedCandidates.length} candidate${selectedCandidates.length === 1 ? '' : 's'} to another list`}
                            </Button>
                            <Button size="3" variant="soft" type="button" onClick={() => setSelectedIds(new Set())}>
                                Clear selection
                            </Button>
                        </div>
                    ) : null}
                </Flex>
            </header>

            <div className={styles.shellGrid}>
                <div className={styles.resultsArea}>
                    {loading && (
                        <div className={styles.emptyState}>
                            <span className="tahoe-spinner" />
                            <p>Loading candidates...</p>
                        </div>
                    )}

                    {!loading && candidates.length === 0 && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}><PersonIcon width="48" height="48" /></div>
                            <h2 className={styles.emptyTitle}>No candidates found</h2>
                            <p className={styles.emptyBody}>
                                {search
                                    ? 'No candidates match your search. Try a different query.'
                                    : 'Saved list candidates and legacy preview rows will appear here.'}
                            </p>
                        </div>
                    )}

                    {!loading && candidates.length > 0 && (
                        <>
                            <PreviewGrid
                                rows={gridRows}
                                includeMetadata
                                showCandidateSubtitle={false}
                                selectable
                                selectedRowIds={selectedIds}
                                activeRowId={activeCandidateId}
                                emptyMessage="No candidates found."
                                onToggleAllSelection={(checked) => {
                                    setSelectedIds(checked ? new Set(candidates.map((candidate) => candidate.coresignal_id)) : new Set());
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

                            {totalPages > 1 && (
                                <Flex className={styles.pagination} justify="center" align="center" gap="2" wrap="wrap">
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
                            )}
                        </>
                    )}
                </div>

                {activeCandidate && (
                    <CandidatePanel preview={activeCandidate} onClose={() => setActiveCandidateId(null)} />
                )}
            </div>

            <SaveToListDialog
                open={saveDialogOpen}
                onOpenChange={setSaveDialogOpen}
                candidates={selectedImportPayload}
                onSaved={async () => {
                    setSelectedIds(new Set());
                    await fetchCandidates();
                }}
            />
        </section>
    );
}
