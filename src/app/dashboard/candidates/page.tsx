'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { MagnifyingGlassIcon, PersonIcon } from '@radix-ui/react-icons';
import CandidatePanel, { type PreviewData } from '../search/CandidatePanel';
import PreviewGrid, { type PreviewGridRow } from '../search/preview-grid';
import styles from './candidates.module.css';

interface Candidate extends Omit<PreviewGridRow, 'id'> {
    id: string;
    coresignal_id: number;
    page: number | null;
    page_rank: number | null;
    pipeline: string | null;
    query_hash: string | null;
    search_session_id: string | null;
    search_prompt: string | null;
    searched_at: string | null;
}

interface CandidatesResponse {
    candidates: Candidate[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

type PaginationToken = number | 'ellipsis-left' | 'ellipsis-right';

function buildPaginationTokens(
    currentPage: number,
    totalPages: number,
    maxNumericButtons: number = 10
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

function toPreviewData(candidate: Candidate): PreviewData {
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

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [activeCandidateId, setActiveCandidateId] = useState<number | null>(null);

    const fetchCandidates = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), per_page: '20' });
            if (search) params.append('search', search);
            const data = await apiRequest<CandidatesResponse>(`/candidates?${params}`);
            setCandidates(data.candidates);
            setTotal(data.total);
            setTotalPages(data.total_pages);
        } catch {
            setCandidates([]);
            setTotal(0);
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
        [candidates]
    );
    const activeCandidate = useMemo(
        () => {
            const candidate = candidates.find((item) => item.coresignal_id === activeCandidateId);
            return candidate ? toPreviewData(candidate) : null;
        },
        [activeCandidateId, candidates]
    );

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className="tahoe-eyebrow">Saved talent</span>
                    <h1 className={styles.title}>Saved Candidates</h1>
                    <p className={styles.subtitle}>
                        {total} candidate{total !== 1 ? 's' : ''} saved across all preview pages
                    </p>
                </div>

                <label className={styles.searchShell}>
                    <MagnifyingGlassIcon />
                    <input
                        className={styles.searchInput}
                        placeholder="Search candidates..."
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                    />
                </label>
            </header>

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
                            : 'Fetched preview pages will appear here automatically.'}
                    </p>
                </div>
            )}

            {!loading && candidates.length > 0 && (
                <>
                    <PreviewGrid
                        rows={gridRows}
                        includeMetadata
                        activeRowId={activeCandidateId}
                        emptyMessage="No candidates found."
                        onRowClick={(row) => setActiveCandidateId(activeCandidateId === row.id ? null : row.id)}
                    />

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className="tahoe-button-secondary"
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage(Math.max(1, page - 1))}
                            >
                                Previous
                            </button>
                            {paginationTokens.map((token) =>
                                typeof token === 'number' ? (
                                    <button
                                        key={`page-${token}`}
                                        className={token === page ? 'tahoe-button' : 'tahoe-button-secondary'}
                                        type="button"
                                        onClick={() => setPage(token)}
                                    >
                                        {token}
                                    </button>
                                ) : (
                                    <button key={token} className="tahoe-button-ghost" type="button" disabled>
                                        …
                                    </button>
                                )
                            )}
                            <button
                                className="tahoe-button-secondary"
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {activeCandidate && (
                <CandidatePanel preview={activeCandidate} onClose={() => setActiveCandidateId(null)} />
            )}
        </section>
    );
}
