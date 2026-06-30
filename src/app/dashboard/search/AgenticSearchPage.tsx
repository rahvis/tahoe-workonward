"use client";

/**
 * Coresignal Agentic Search mode (flag: NEXT_PUBLIC_AGENTIC_SEARCH_CORESIGNAL).
 *
 * A deliberately lean search surface that does NOT use the LangGraph/DSL flow:
 *   - Typing a query and pressing Enter runs the search immediately (there is no
 *     "Find candidates" button).
 *   - The typed prompt is turned into one natural-language query by the backend
 *     (Claude Haiku→Sonnet) and sent to /v2/agentic_search/fast.
 *   - The backend returns the top 100 in one call; we show 20 per page and page
 *     through the cached set (pages 2–5 cost no extra credits).
 *   - An empty result set shows a "broaden your search" message.
 */

import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import {
    fetchSearchAccess,
    previewCandidateToImportPayload,
    type SaveToListCandidatePayload,
} from "@/lib/organization";
import { clearAnalyticsCache } from "../analytics/_components/analytics-cache";
import {
    Box,
    Button,
    Flex,
    Heading,
    Spinner,
    Text,
    TextField,
} from "@/components/ui/tahoe-ui";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
} from "@/components/ui/icons";
import PreviewGrid, { type PreviewGridRow } from "./preview-grid";
import CandidatePanel, { type PreviewData } from "./CandidatePanel";
import MicButton from "./MicButton";
import { useDictation } from "./useDictation";
import { useStagedMessages } from "./useStagedMessages";
import styles from "./langgraph-search.module.css";
import SaveToListDialog from "../_components/SaveToListDialog";
import UpgradePaywallModal, { type PaywallReason } from "./UpgradePaywallModal";
import {
    agenticFiltersAreEmpty,
    emptyAgenticFilters,
    type AgenticFilters,
} from "./_shared/agentic-filters";

type SearchResultItem = PreviewGridRow;

interface AgenticExecuteResponse {
    results: SearchResultItem[];
    total_results: number;
    total_pages: number;
    current_page: number;
    ui_page: number;
    has_next: boolean;
    has_prev: boolean;
    query_hash: string;
    search_session_id: string;
    preview_total_results: number;
    preview_cap: number;
}

interface AgenticPageResponse {
    results: SearchResultItem[];
    total_results: number;
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    query_hash: string;
    preview_total_results: number;
    preview_cap: number;
}

function notifyCreditsChanged() {
    clearAnalyticsCache();
    window.dispatchEvent(new Event("tahoe:credits-updated"));
}

// Dispatched by the sidebar "New Search" link so this page resets to a blank slate
// even when it's already mounted (clicking the active route does not remount).
const NEW_SEARCH_EVENT = "tahoe:new-search";

// Rotating, progress-style status shown (in orange) while a search is in flight.
// Each line maps to a real step of the pipeline so it reads as progress.
const AGENTIC_SEARCH_STAGES = [
    "Understanding your search…",
    "Building the query with AI…",
    "Searching 800M+ professional profiles…",
    "Ranking candidates by relevance…",
    "Preparing your preview…",
];

export default function AgenticSearchPage({ initialQuery }: { initialQuery?: string | null }) {
    const [query, setQuery] = useState(initialQuery ?? "");
    const [filters, setFilters] = useState<AgenticFilters>(emptyAgenticFilters());

    const [stage, setStage] = useState<"idle" | "searching" | "results">("idle");
    const [error, setError] = useState("");

    // Free-search trial state (from GET /search/access). `searchLocked` = the recruiter
    // has used their one free search and isn't subscribed; gated actions open the paywall
    // instead of firing a doomed request. The backend 402 remains the authoritative gate.
    const [searchLocked, setSearchLocked] = useState(false);
    const [subscriptionActive, setSubscriptionActive] = useState(false);
    const [freeSearchUsed, setFreeSearchUsed] = useState(false);
    const [trialEnabled, setTrialEnabled] = useState(false);
    const [paywallReason, setPaywallReason] = useState<PaywallReason | null>(null);

    const [pagesByNumber, setPagesByNumber] = useState<Record<number, SearchResultItem[]>>({});
    const [rowsById, setRowsById] = useState<Map<number, SearchResultItem>>(new Map());
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [previewTotalResults, setPreviewTotalResults] = useState(0);
    const [queryHash, setQueryHash] = useState<string | null>(null);
    const [paginatingPage, setPaginatingPage] = useState<number | null>(null);

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [activeRow, setActiveRow] = useState<SearchResultItem | null>(null);

    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [saveCandidates, setSaveCandidates] = useState<SaveToListCandidatePayload[]>([]);

    const dictation = useDictation((text) => setQuery((q) => (q ? `${q} ${text}` : text)));

    const currentResults = pagesByNumber[currentPage] ?? [];
    const isSearching = stage === "searching";
    const searchStatus = useStagedMessages(AGENTIC_SEARCH_STAGES, isSearching);
    // The recruiter still has their one free search available (brand-new, unsubscribed).
    const freeSearchAvailable = trialEnabled && !freeSearchUsed && !subscriptionActive;

    const refreshAccess = useCallback(async () => {
        try {
            const access = await fetchSearchAccess();
            setSearchLocked(access.locked);
            setSubscriptionActive(access.subscription_active);
            setFreeSearchUsed(access.free_search_used);
            setTrialEnabled(access.trial_enabled);
        } catch {
            // Non-fatal: the backend 402 still gates the search.
        }
    }, []);

    useEffect(() => {
        void refreshAccess();
    }, [refreshAccess]);

    // "New Search" in the sidebar should return a blank slate. Clicking the
    // already-active route does NOT remount the page, so the nav link dispatches an
    // event and we reset all state here. (Plain navigation / refresh already mounts
    // this page blank — there is no cross-load persistence by design.)
    useEffect(() => {
        function resetToBlank() {
            setQuery("");
            setFilters(emptyAgenticFilters());
            setStage("idle");
            setError("");
            setPaywallReason(null);
            setPagesByNumber({});
            setRowsById(new Map());
            setCurrentPage(1);
            setTotalPages(1);
            setTotalResults(0);
            setPreviewTotalResults(0);
            setQueryHash(null);
            setPaginatingPage(null);
            setSelectedIds(new Set());
            setActiveRow(null);
        }
        window.addEventListener(NEW_SEARCH_EVENT, resetToBlank);
        return () => window.removeEventListener(NEW_SEARCH_EVENT, resetToBlank);
    }, []);

    function indexRows(rows: SearchResultItem[]) {
        setRowsById((prev) => {
            const next = new Map(prev);
            for (const row of rows) next.set(row.id, row);
            return next;
        });
    }

    async function runSearch(event?: { preventDefault(): void }) {
        event?.preventDefault();
        if (isSearching) return;

        // Free search already used and not subscribed → show the paywall up front
        // rather than firing a request the backend will reject with 402.
        if (searchLocked) {
            setPaywallReason("subscription_required");
            return;
        }

        const trimmed = query.trim();
        const usedFilters = !agenticFiltersAreEmpty(filters);
        if (!trimmed && !usedFilters) {
            setError("Enter a search query or add at least one filter.");
            return;
        }

        setStage("searching");
        setError("");

        try {
            const resp = await apiRequest<AgenticExecuteResponse>("/search/agentic/execute", {
                method: "POST",
                body: { search_prompt: query, filters, ui_page: 1 },
            });

            setPagesByNumber({ 1: resp.results });
            setRowsById(new Map(resp.results.map((r) => [r.id, r])));
            setCurrentPage(1);
            setTotalPages(resp.total_pages);
            setTotalResults(resp.total_results);
            setPreviewTotalResults(resp.preview_total_results);
            setQueryHash(resp.query_hash);
            setSelectedIds(new Set());
            setActiveRow(null);
            setStage("results");

            // A filters-based search resets the filters once results are shown.
            if (usedFilters) setFilters(emptyAgenticFilters());

            notifyCreditsChanged();
            // The free search may have just been consumed — refresh so the next search
            // is gated proactively and the "1 free search" hint disappears.
            void refreshAccess();
        } catch (err: unknown) {
            if (err instanceof ApiError && err.status === 402) {
                const code = (err.detail as { code?: string } | null | undefined)?.code;
                setPaywallReason(code === "insufficient_credits" ? "insufficient_credits" : "subscription_required");
                void refreshAccess();
            } else {
                setError(err instanceof Error ? err.message : "Search failed. Please try again.");
            }
            // Keep any previously loaded results visible; otherwise fall back to idle.
            setStage(Object.keys(pagesByNumber).length > 0 ? "results" : "idle");
        }
    }

    async function handlePageChange(targetPage: number) {
        if (
            !queryHash ||
            targetPage === currentPage ||
            targetPage < 1 ||
            targetPage > totalPages ||
            paginatingPage !== null
        ) {
            return;
        }
        if (pagesByNumber[targetPage]) {
            setCurrentPage(targetPage);
            return;
        }
        setPaginatingPage(targetPage);
        setError("");
        try {
            const resp = await apiRequest<AgenticPageResponse>(
                `/search/agentic/page?query_hash=${encodeURIComponent(queryHash)}&page=${targetPage}`,
            );
            setPagesByNumber((prev) => ({ ...prev, [targetPage]: resp.results }));
            indexRows(resp.results);
            setCurrentPage(targetPage);
        } catch (err: unknown) {
            if (err instanceof ApiError && err.status === 402) {
                const code = (err.detail as { code?: string } | null | undefined)?.code;
                setPaywallReason(code === "insufficient_credits" ? "insufficient_credits" : "subscription_required");
                void refreshAccess();
            } else {
                setError(err instanceof Error ? err.message : "Unable to load that page.");
            }
        } finally {
            setPaginatingPage(null);
        }
    }

    function toggleRow(row: SearchResultItem) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(row.id)) next.delete(row.id);
            else next.add(row.id);
            return next;
        });
    }

    function toggleAll(checked: boolean) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const row of currentResults) {
                if (checked) next.add(row.id);
                else next.delete(row.id);
            }
            return next;
        });
    }

    function buildPayloads(ids: number[]): SaveToListCandidatePayload[] {
        return ids
            .map((id) => rowsById.get(id))
            .filter((row): row is SearchResultItem => Boolean(row))
            .map((row) =>
                previewCandidateToImportPayload(row, {
                    queryHash,
                    searchPrompt: query,
                    previewPage: row.page ?? null,
                    pipeline: "agentic",
                    searchedAt: row.searched_at ?? null,
                }),
            );
    }

    function openBulkSave() {
        const payloads = buildPayloads([...selectedIds]);
        if (payloads.length === 0) return;
        setSaveCandidates(payloads);
        setSaveDialogOpen(true);
    }

    function openSingleSave(id: number) {
        const payloads = buildPayloads([id]);
        if (payloads.length === 0) return;
        setSaveCandidates(payloads);
        setSaveDialogOpen(true);
    }

    return (
        <Flex direction="column" style={{ height: "100%", minHeight: 0 }}>
            {/* Search bar (fixed top) — Enter runs the search; no Find candidates button. */}
            <Box style={{ flex: "0 0 auto", padding: "24px 24px 0" }}>
                <form onSubmit={runSearch}>
                    <Flex gap="3" align="center" wrap="wrap">
                        <Box className={styles.promptInputWrap} style={{ minWidth: 280 }}>
                            <TextField.Root
                                size="3"
                                placeholder='Try: "sushi chef in New York" — press Enter to search'
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                disabled={isSearching}
                                aria-label="Search prompt"
                            >
                                <TextField.Slot>
                                    <MagnifyingGlassIcon width="16" height="16" />
                                </TextField.Slot>
                            </TextField.Root>
                            {dictation.supported && (
                                <MicButton
                                    supported={dictation.supported}
                                    status={dictation.status}
                                    amplitude={dictation.amplitude}
                                    disabled={isSearching}
                                    onStart={() => void dictation.start()}
                                    onStop={dictation.stop}
                                />
                            )}
                        </Box>
                    </Flex>
                </form>

                {error && (
                    <Flex align="center" gap="2" mt="3">
                        <ExclamationTriangleIcon />
                        <Text size="2" color="red">
                            {error}
                        </Text>
                    </Flex>
                )}

                {!error && freeSearchAvailable && (
                    <Flex align="center" gap="2" mt="3">
                        <Text size="2" color="gray">
                            You have 1 free search — preview the top results, no card required.
                        </Text>
                    </Flex>
                )}
            </Box>

            {/* Main area fills the remaining height: results column + candidate panel. */}
            <Flex style={{ flex: 1, minHeight: 0 }}>
                <Box style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
                    {stage === "idle" && !error && (
                        <Flex
                            direction="column"
                            align="center"
                            justify="center"
                            gap="3"
                            style={{ flex: 1, minHeight: 0, padding: 24, opacity: 0.6 }}
                        >
                            <MagnifyingGlassIcon width="48" height="48" />
                            <Heading size="5" color="gray">
                                Search, then run the query
                            </Heading>
                            <Text size="2" color="gray" align="center" style={{ maxWidth: 480 }}>
                                Type a natural-language query and press Enter, or add filters. Page through the
                                top 100 matches in 20-result pages.
                            </Text>
                        </Flex>
                    )}

                    {isSearching && (
                        <Flex
                            direction="column"
                            align="center"
                            justify="center"
                            gap="3"
                            style={{ flex: 1, minHeight: 0 }}
                        >
                            <Spinner size="3" />
                            <Heading size="4">Searching…</Heading>
                            <Text
                                size="3"
                                weight="medium"
                                align="center"
                                aria-live="polite"
                                style={{ color: "var(--tahoe-color-accent)", transition: "opacity 150ms ease" }}
                            >
                                {searchStatus}
                            </Text>
                        </Flex>
                    )}

                    {stage === "results" && totalResults === 0 && !isSearching && (
                        <Flex
                            direction="column"
                            align="center"
                            justify="center"
                            gap="3"
                            style={{ flex: 1, minHeight: 0, padding: 24 }}
                        >
                            <MagnifyingGlassIcon width="40" height="40" style={{ opacity: 0.5 }} />
                            <Heading size="4">No candidates matched</Heading>
                            <Text size="2" color="gray" align="center" style={{ maxWidth: 480 }}>
                                Try broadening your search — remove a filter, search by country instead of a
                                specific city, or simplify your query (for example, &ldquo;sushi chef&rdquo;
                                instead of a very specific phrase).
                            </Text>
                        </Flex>
                    )}

                    {stage === "results" && totalResults > 0 && (
                        <Box className={styles.resultsArea}>
                            <Box className={styles.resultsLayout}>
                                <Flex
                                    justify="between"
                                    align="center"
                                    wrap="wrap"
                                    gap="2"
                                    className={styles.resultsToolbar}
                                >
                                    <Text size="2" color="gray">
                                        Showing {currentResults.length} of {previewTotalResults} previewed
                                        {totalResults > previewTotalResults ? ` (of ${totalResults}+ matches)` : ""}
                                        {totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ""}
                                    </Text>
                                    {selectedIds.size > 0 && (
                                        <Button size="2" onClick={openBulkSave}>
                                            Save {selectedIds.size} to list
                                        </Button>
                                    )}
                                </Flex>

                                <Box className={styles.resultsTableRegion}>
                                    <PreviewGrid
                                        className={styles.resultsPreviewGrid}
                                        rows={currentResults}
                                        selectable
                                        selectedRowIds={selectedIds}
                                        activeRowId={activeRow?.id ?? null}
                                        emptyMessage="No preview rows for this page."
                                        hiddenColumnKeys={["id", "page", "pipeline", "search_prompt"]}
                                        onToggleAllSelection={toggleAll}
                                        onToggleRowSelection={toggleRow}
                                        onRowClick={(row) => setActiveRow(row)}
                                    />
                                </Box>

                                {totalPages > 1 && (
                                    <Flex
                                        justify="center"
                                        align="center"
                                        gap="2"
                                        wrap="wrap"
                                        className={styles.paginationFooter}
                                    >
                                        <Button
                                            size="1"
                                            variant="soft"
                                            disabled={currentPage <= 1 || paginatingPage !== null}
                                            onClick={() => void handlePageChange(currentPage - 1)}
                                        >
                                            <ChevronLeftIcon />
                                            Previous
                                        </Button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                                            <Button
                                                key={pageNumber}
                                                size="1"
                                                variant={pageNumber === currentPage ? "solid" : "soft"}
                                                disabled={paginatingPage !== null && pageNumber !== currentPage}
                                                onClick={() => void handlePageChange(pageNumber)}
                                            >
                                                {pageNumber === paginatingPage ? <Spinner /> : pageNumber}
                                            </Button>
                                        ))}
                                        <Button
                                            size="1"
                                            variant="soft"
                                            disabled={currentPage >= totalPages || paginatingPage !== null}
                                            onClick={() => void handlePageChange(currentPage + 1)}
                                        >
                                            Next
                                            <ChevronRightIcon />
                                        </Button>
                                    </Flex>
                                )}
                            </Box>
                        </Box>
                    )}
                </Box>

                {activeRow && (
                    <CandidatePanel
                        preview={activeRow as unknown as PreviewData}
                        onClose={() => setActiveRow(null)}
                        onSaveToList={(id) => openSingleSave(id)}
                    />
                )}
            </Flex>

            <SaveToListDialog
                open={saveDialogOpen}
                onOpenChange={setSaveDialogOpen}
                candidates={saveCandidates}
                onSaved={async () => {
                    setSelectedIds(new Set());
                    setSaveDialogOpen(false);
                }}
            />

            <UpgradePaywallModal
                open={paywallReason !== null}
                reason={paywallReason ?? "subscription_required"}
                onClose={() => setPaywallReason(null)}
            />
        </Flex>
    );
}
