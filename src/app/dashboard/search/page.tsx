"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
    clearSearchPageBootstrap,
    readSearchPageBootstrap,
    type SearchPageBootstrapPayload,
} from "@/lib/search-page-bootstrap";
import SaveToListDialog from "../_components/SaveToListDialog";
import { fetchBillingSummary, previewCandidateToImportPayload, type BillingSummary } from "@/lib/organization";
import { clearAnalyticsCache } from "../analytics/_components/analytics-cache";
import {
    Badge,
    Box,
    Button,
    Callout,
    Checkbox,
    Flex,
    Heading,
    Separator,
    Spinner,
    Switch,
    Table,
    Text,
    TextField,
} from "@/components/ui/tahoe-ui";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    Cross2Icon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    MixerHorizontalIcon,
} from "@/components/ui/icons";
import styles from "./search.module.css";
import CandidatePanel, { type PreviewData } from "./CandidatePanel";
import LangGraphSearchPage from "./LangGraphSearchPage";
import PreviewCapBanner from "./preview-cap-banner";

// Maximum pages the Coresignal preview endpoint supports.
const MAX_PREVIEW_PAGES = 5;
const SEARCH_LANGGRAPH_ENABLED = process.env.NEXT_PUBLIC_SEARCH_LANGGRAPH_ENABLED !== "false";

function notifyCreditsChanged() {
    clearAnalyticsCache();
    window.dispatchEvent(new Event('tahoe:credits-updated'));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResultItem {
    id: number;
    full_name: string | null;
    websites_linkedin: string | null;
    headline: string | null;
    location_full: string | null;
    location_country: string | null;
    connections_count: number | null;
    follower_count: number | null;
    company_name: string | null;
    company_linkedin_url: string | null;
    company_website: string | null;
    company_industry: string | null;
    job_title: string | null;
    department: string | null;
    management_level: string | null;
    company_location_hq_full_address: string | null;
    company_location_hq_country: string | null;
    score: number | null;
}

interface SearchExecuteResponse {
    results: SearchResultItem[];
    total_results: number;
    total_pages: number;
    current_page: number;
    ui_page: number;
    has_next: boolean;
    has_prev: boolean;
    query_hash: string;
    search_session_id: string;
}

interface SearchFilters {
    job_titles: string[];
    companies: string[];
    location_countries: string[];
    location_cities: string[];
    industries: string[];
    management_levels: string[];
    skills: string[];
    is_working: boolean | null;
    min_experience_months: number | null;
    max_experience_months: number | null;
}

function emptyFilters(): SearchFilters {
    return {
        job_titles: [],
        companies: [],
        location_countries: [],
        location_cities: [],
        industries: [],
        management_levels: [],
        skills: [],
        is_working: null,
        min_experience_months: null,
        max_experience_months: null,
    };
}

function coerceBootstrapFilters(raw: Record<string, unknown> | null | undefined): SearchFilters {
    const source = raw ?? {};
    const toStringArray = (value: unknown): string[] =>
        Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    const toNullableBool = (value: unknown): boolean | null =>
        typeof value === "boolean" ? value : null;
    const toNullableNumber = (value: unknown): number | null =>
        typeof value === "number" && Number.isFinite(value) ? value : null;

    return {
        job_titles: toStringArray(source.job_titles),
        companies: toStringArray(source.companies),
        location_countries: toStringArray(source.location_countries),
        location_cities: toStringArray(source.location_cities),
        industries: toStringArray(source.industries),
        management_levels: toStringArray(source.management_levels),
        skills: toStringArray(source.skills),
        is_working: toNullableBool(source.is_working),
        min_experience_months: toNullableNumber(source.min_experience_months),
        max_experience_months: toNullableNumber(source.max_experience_months),
    };
}

function getLegacyBootstrapState(bootstrap?: SearchPageBootstrapPayload | null): {
    query: string;
    filters: SearchFilters;
    searchSessionId: string;
} | null {
    if (!bootstrap || bootstrap.mode !== "legacy") return null;
    return {
        query: bootstrap.prompt ?? "",
        filters: coerceBootstrapFilters(bootstrap.structuredFilters),
        searchSessionId: bootstrap.searchSessionId,
    };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MANAGEMENT_LEVELS = ["C-Suite", "VP", "Director", "Manager", "Individual Contributor"];

const INDUSTRIES = [
    "Technology",
    "Financial Services",
    "Healthcare",
    "Retail",
    "Manufacturing",
    "Media",
    "Education",
    "Real Estate",
    "Consulting",
    "Telecommunications",
    "Energy",
    "Transportation",
    "Government",
    "Non-profit",
    "Legal",
    "Other",
];

const LEVEL_COLORS: Record<string, "gold" | "blue" | "violet" | "green" | "gray"> = {
    "C-Suite": "gold",
    "VP": "blue",
    "Director": "violet",
    "Manager": "green",
    "Individual Contributor": "gray",
};

// ---------------------------------------------------------------------------
// Tag Input helper component
// ---------------------------------------------------------------------------

function TagInput({
    placeholder,
    tags,
    onAdd,
    onRemove,
}: {
    placeholder: string;
    tags: string[];
    onAdd: (v: string) => void;
    onRemove: (v: string) => void;
}) {
    const [input, setInput] = useState("");

    const commit = () => {
        const v = input.trim();
        if (v && !tags.includes(v)) onAdd(v);
        setInput("");
    };

    return (
        <Box>
            <Flex gap="1" wrap="wrap" mb="1">
                {tags.map((tag) => (
                    <Badge key={tag} variant="soft" color="blue" size="1" style={{ cursor: "pointer" }}>
                        {tag}
                        <Cross2Icon
                            width={10}
                            height={10}
                            style={{ marginLeft: 4, verticalAlign: "middle" }}
                            onClick={() => onRemove(tag)}
                        />
                    </Badge>
                ))}
            </Flex>
            <TextField.Root
                size="1"
                placeholder={placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        commit();
                    }
                }}
                onBlur={commit}
            />
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function LegacySearchPage({ bootstrap }: { bootstrap?: SearchPageBootstrapPayload | null }) {
    const router = useRouter();
    const bootstrapState = getLegacyBootstrapState(bootstrap);
    const [query, setQuery] = useState(bootstrapState?.query ?? "");
    const [filters, setFilters] = useState<SearchFilters>(bootstrapState?.filters ?? emptyFilters());
    const [lastCommittedQuery, setLastCommittedQuery] = useState(bootstrapState?.query ?? "");
    const [showFilters, setShowFilters] = useState(true);

    const [stage, setStage] = useState<"idle" | "searching" | "results" | "paginating">("idle");
    const [error, setError] = useState("");

    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [totalResults, setTotalResults] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [uiPage, setUiPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectedCandidatesById, setSelectedCandidatesById] = useState<Map<number, { item: SearchResultItem; page: number }>>(new Map());
    const [activeCandidate, setActiveCandidate] = useState<PreviewData | null>(null);
    const [queryHash, setQueryHash] = useState<string | null>(null);
    const [searchSessionId, setSearchSessionId] = useState<string | null>(bootstrapState?.searchSessionId ?? null);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const bootstrapRunStartedRef = useRef(false);

    // Keep latest committed search query/filters so pagination reuses them
    const committedQuery = useRef(bootstrapState?.query ?? "");
    const committedFilters = useRef<SearchFilters>(bootstrapState?.filters ?? emptyFilters());

    // ---------------------------------------------------------------------------
    // sessionStorage persistence — restore on in-app nav, save on results change
    // ---------------------------------------------------------------------------

    const SESSION_KEY = "search_page_state";

    useEffect(() => {
        if (bootstrap) return;
        // "New Search" should be a fresh workspace. Explicit saved-search
        // bootstraps still hydrate through the bootstrap path above.
        try {
            sessionStorage.removeItem(SESSION_KEY);
        } catch {
            // ignore storage errors
        }
    }, [bootstrap]);

    useEffect(() => {
        if (results.length === 0) return;
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({
                query: committedQuery.current,
                filters: committedFilters.current,
                results,
                totalResults,
                totalPages,
                uiPage,
                hasNext,
                hasPrev,
                queryHash,
                searchSessionId,
            }));
        } catch {
            // ignore quota errors
        }
    }, [results, totalResults, totalPages, uiPage, hasNext, hasPrev, queryHash, searchSessionId]);

    // ---------------------------------------------------------------------------
    // Search execution
    // ---------------------------------------------------------------------------

    const runSearch = useCallback(
        async (
            searchQuery: string,
            searchFilters: SearchFilters,
            page: number,
            isPaginating = false,
            currentQueryHash: string | null = null,
            currentSearchSessionId: string | null = null,
        ) => {
            if (!searchQuery.trim() && searchFilters.job_titles.length === 0) return;

            setError("");
            setStage(isPaginating ? "paginating" : "searching");
            if (!isPaginating) {
                setResults([]);
                setTotalResults(0);
                setSelectedIds(new Set());
                setSelectedCandidatesById(new Map());
                setActiveCandidate(null);
            }

            try {
                const body: Record<string, unknown> = {
                    search_prompt: searchQuery,
                    filters: searchFilters,
                    ui_page: page,
                };
                // Send cached query_hash on pagination so backend skips LLM re-call
                if (isPaginating && currentQueryHash) {
                    body.query_hash = currentQueryHash;
                }
                if (currentSearchSessionId) {
                    body.search_session_id = currentSearchSessionId;
                }

                const response = await apiRequest<SearchExecuteResponse>("/search/execute", {
                    method: "POST",
                    body,
                });

                setResults(response.results);
                setTotalResults(response.total_results);
                setTotalPages(Math.min(response.total_pages, MAX_PREVIEW_PAGES));
                setUiPage(response.ui_page);
                setHasNext(response.has_next);
                setHasPrev(response.has_prev);
                setQueryHash(response.query_hash);
                setSearchSessionId(response.search_session_id);
                setStage("results");
                notifyCreditsChanged();
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
                setError(msg);
                setStage(isPaginating ? "results" : "idle");
            }
        },
        []
    );


    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        committedQuery.current = query;
        committedFilters.current = filters;
        setLastCommittedQuery(query);
        setQueryHash(null);
        setSearchSessionId(null);
        // Clear sessionStorage so stale results don't persist if search fails
        try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
        await runSearch(query, filters, 1, false, null, null);
    };

    const handlePageChange = async (newPage: number) => {
        await runSearch(committedQuery.current, committedFilters.current, newPage, true, queryHash, searchSessionId);
    };

    useEffect(() => {
        if (!bootstrapState || bootstrapRunStartedRef.current) return;
        bootstrapRunStartedRef.current = true;

        try {
            sessionStorage.removeItem(SESSION_KEY);
        } catch {
            // ignore storage errors
        }

        queueMicrotask(() => {
            void runSearch(
                bootstrapState.query,
                bootstrapState.filters,
                1,
                false,
                null,
                bootstrapState.searchSessionId,
            );
        });
    }, [bootstrapState, runSearch]);

    // ---------------------------------------------------------------------------
    // Filter helpers
    // ---------------------------------------------------------------------------

    const addTag = (key: keyof Pick<SearchFilters, "job_titles" | "companies" | "location_countries" | "location_cities" | "industries" | "skills">, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: [...prev[key], value] }));
    };

    const removeTag = (key: keyof Pick<SearchFilters, "job_titles" | "companies" | "location_countries" | "location_cities" | "industries" | "skills">, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: prev[key].filter((v) => v !== value) }));
    };

    const toggleLevel = (level: string) => {
        setFilters((prev) => {
            const levels = prev.management_levels.includes(level)
                ? prev.management_levels.filter((l) => l !== level)
                : [...prev.management_levels, level];
            return { ...prev, management_levels: levels };
        });
    };

    const toggleIndustry = (industry: string) => {
        setFilters((prev) => {
            const industries = prev.industries.includes(industry)
                ? prev.industries.filter((i) => i !== industry)
                : [...prev.industries, industry];
            return { ...prev, industries };
        });
    };

    const clearFilters = () => {
        setFilters(emptyFilters());
    };

    const activeFilterCount = [
        filters.job_titles.length,
        filters.companies.length,
        filters.location_countries.length,
        filters.location_cities.length,
        filters.industries.length,
        filters.management_levels.length,
        filters.skills.length,
        filters.is_working !== null ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    // ---------------------------------------------------------------------------
    // Selection helpers
    // ---------------------------------------------------------------------------

    const handleToggleSelectAll = (checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            results.forEach((item) => {
                if (checked) next.add(item.id);
                else next.delete(item.id);
            });
            return next;
        });
        setSelectedCandidatesById((prev) => {
            const next = new Map(prev);
            results.forEach((item) => {
                if (checked) next.set(item.id, { item, page: uiPage });
                else next.delete(item.id);
            });
            return next;
        });
    };

    const handleToggleSelect = (id: number) => {
        const selectedItem = results.find((item) => item.id === id);
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
        setSelectedCandidatesById((prev) => {
            const next = new Map(prev);
            if (next.has(id)) {
                next.delete(id);
            } else if (selectedItem) {
                next.set(id, { item: selectedItem, page: uiPage });
            }
            return next;
        });
    };

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    const isLoading = stage === "searching";
    const isPaginating = stage === "paginating";
    const hasResultView = stage === "results" || stage === "paginating";
    const selectedImportPayload = useMemo(
        () =>
            Array.from(selectedCandidatesById.values())
                .map((item) =>
                    previewCandidateToImportPayload(
                        {
                            ...item.item,
                            page: item.page,
                            query_hash: queryHash,
                            search_prompt: lastCommittedQuery || query,
                        },
                        {
                            queryHash,
                            searchPrompt: lastCommittedQuery || query,
                            previewPage: item.page,
                            pipeline: "legacy_search",
                            searchedAt: new Date().toISOString(),
                        },
                    ),
                ),
        [lastCommittedQuery, query, queryHash, selectedCandidatesById],
    );

    function openSavedList(listId: string, options?: { enrich?: boolean }) {
        router.push(`/dashboard/projects/lists/${listId}${options?.enrich ? "?enrich=1" : ""}`);
    }

    function handlePanelSaveToList(id: number) {
        const selectedItem = results.find((item) => item.id === id);
        if (!selectedItem) return;
        setSelectedIds(new Set([id]));
        setSelectedCandidatesById(new Map([[id, { item: selectedItem, page: uiPage }]]));
        setSaveDialogOpen(true);
    }

    return (
        <Box className={styles.pageWrapper}>
            {/* ── Top Search Bar ── */}
            <Box className={styles.searchBarArea}>
                <form onSubmit={handleSearch}>
                    <Flex gap="2" align="center">
                        <Box style={{ flexGrow: 1 }}>
                            <TextField.Root
                                size="3"
                                placeholder='Try: "Senior ML engineers in Europe with Python skills" or "VP of Sales at SaaS companies"'
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                disabled={isLoading}
                            >
                                <TextField.Slot>
                                    <MagnifyingGlassIcon height="16" width="16" />
                                </TextField.Slot>
                            </TextField.Root>
                        </Box>
                        {(stage === "results" || stage === "paginating") && totalResults > 0 ? (
                            <PreviewCapBanner
                                className={styles.inlineResultsCount}
                                totalResults={totalResults}
                                previewTotalResults={Math.min(totalResults, 100)}
                                totalPages={totalPages || 5}
                            />
                        ) : null}
                        {selectedIds.size > 0 ? (
                            <Button size="3" type="button" onClick={() => setSaveDialogOpen(true)}>
                                Save {selectedIds.size} to list
                            </Button>
                        ) : null}
                        {!hasResultView ? (
                            <Button size="3" type="submit" disabled={isLoading || (!query.trim() && activeFilterCount === 0)}>
                                {isLoading ? <Spinner /> : "Search"}
                            </Button>
                        ) : null}
                        <Button
                            size="3"
                            variant={showFilters ? "solid" : "soft"}
                            type="button"
                            onClick={() => setShowFilters((v) => !v)}
                            style={{ gap: 6 }}
                        >
                            <MixerHorizontalIcon />
                            Filters
                            {activeFilterCount > 0 && (
                                <Badge size="1" color="blue" style={{ marginLeft: 4 }}>
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                    </Flex>
                </form>
            </Box>

            {/* ── Error ── */}
            {error && (
                <Box px="4" pb="2">
                    <Callout.Root color="red" role="alert">
                        <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                        <Callout.Text>{error}</Callout.Text>
                    </Callout.Root>
                </Box>
            )}

            {/* ── Main layout: sidebar + results ── */}
            <Flex className={styles.mainLayout} gap="0">

                {/* ── Filter Sidebar ── */}
                {showFilters && (
                    <Box className={styles.filterSidebar}>
                        <Flex justify="between" align="center" mb="3">
                            <Text size="2" weight="bold">Filters</Text>
                            {activeFilterCount > 0 && (
                                <Button size="1" variant="ghost" color="gray" onClick={clearFilters}>
                                    Clear all
                                </Button>
                            )}
                        </Flex>

                        {/* Job Title */}
                        <Box className={styles.filterSection}>
                            <Text size="1" weight="bold" className={styles.filterLabel}>Job Title</Text>
                            <TagInput
                                placeholder="e.g. Software Engineer"
                                tags={filters.job_titles}
                                onAdd={(v) => addTag("job_titles", v)}
                                onRemove={(v) => removeTag("job_titles", v)}
                            />
                        </Box>

                        <Separator size="4" my="3" />

                        {/* Company */}
                        <Box className={styles.filterSection}>
                            <Text size="1" weight="bold" className={styles.filterLabel}>Company</Text>
                            <TagInput
                                placeholder="e.g. Google"
                                tags={filters.companies}
                                onAdd={(v) => addTag("companies", v)}
                                onRemove={(v) => removeTag("companies", v)}
                            />
                        </Box>

                        <Separator size="4" my="3" />

                        {/* Location */}
                        <Box className={styles.filterSection}>
                            <Text size="1" weight="bold" className={styles.filterLabel}>Country</Text>
                            <TagInput
                                placeholder="e.g. United States"
                                tags={filters.location_countries}
                                onAdd={(v) => addTag("location_countries", v)}
                                onRemove={(v) => removeTag("location_countries", v)}
                            />
                        </Box>

                        <Box className={styles.filterSection} mt="2">
                            <Text size="1" weight="bold" className={styles.filterLabel}>City</Text>
                            <TagInput
                                placeholder="e.g. San Francisco"
                                tags={filters.location_cities}
                                onAdd={(v) => addTag("location_cities", v)}
                                onRemove={(v) => removeTag("location_cities", v)}
                            />
                        </Box>

                        <Separator size="4" my="3" />

                        {/* Seniority */}
                        <Box className={styles.filterSection}>
                            <Text size="1" weight="bold" className={styles.filterLabel}>Seniority Level</Text>
                            <Flex direction="column" gap="2" mt="1">
                                {MANAGEMENT_LEVELS.map((level) => (
                                    <Flex key={level} align="center" gap="2">
                                        <Checkbox
                                            size="1"
                                            checked={filters.management_levels.includes(level)}
                                            onCheckedChange={() => toggleLevel(level)}
                                        />
                                        <Badge
                                            color={LEVEL_COLORS[level] ?? "gray"}
                                            variant="soft"
                                            size="1"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => toggleLevel(level)}
                                        >
                                            {level}
                                        </Badge>
                                    </Flex>
                                ))}
                            </Flex>
                        </Box>

                        <Separator size="4" my="3" />

                        {/* Skills */}
                        <Box className={styles.filterSection}>
                            <Text size="1" weight="bold" className={styles.filterLabel}>Skills</Text>
                            <TagInput
                                placeholder="e.g. Python, AWS"
                                tags={filters.skills}
                                onAdd={(v) => addTag("skills", v)}
                                onRemove={(v) => removeTag("skills", v)}
                            />
                        </Box>

                        <Separator size="4" my="3" />

                        {/* Industry */}
                        <Box className={styles.filterSection}>
                            <Text size="1" weight="bold" className={styles.filterLabel}>Industry</Text>
                            <Flex direction="column" gap="2" mt="1">
                                {INDUSTRIES.map((ind) => (
                                    <Flex key={ind} align="center" gap="2">
                                        <Checkbox
                                            size="1"
                                            checked={filters.industries.includes(ind)}
                                            onCheckedChange={() => toggleIndustry(ind)}
                                        />
                                        <Text
                                            size="1"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => toggleIndustry(ind)}
                                        >
                                            {ind}
                                        </Text>
                                    </Flex>
                                ))}
                            </Flex>
                        </Box>

                        <Separator size="4" my="3" />

                        {/* Currently Employed */}
                        <Box className={styles.filterSection}>
                            <Flex align="center" justify="between">
                                <Text size="1" weight="bold" className={styles.filterLabel}>
                                    Currently Employed
                                </Text>
                                <Switch
                                    size="1"
                                    checked={filters.is_working === true}
                                    onCheckedChange={(checked) =>
                                        setFilters((prev) => ({ ...prev, is_working: checked ? true : null }))
                                    }
                                />
                            </Flex>
                        </Box>

                        <Separator size="4" my="3" />

                        {/* Apply button */}
                        <Button
                            size="2"
                            style={{ width: "100%" }}
                            onClick={handleSearch}
                            disabled={isLoading || (!query.trim() && activeFilterCount === 0)}
                        >
                            {isLoading ? <Spinner /> : "Apply & Search"}
                        </Button>
                    </Box>
                )}

                {/* ── Results Panel ── */}
                <Box className={styles.resultsPanel}>
                    {/* Idle state */}
                    {stage === "idle" && !error && (
                        <Flex direction="column" align="center" gap="4" py="9" style={{ opacity: 0.5 }}>
                            <MagnifyingGlassIcon width="52" height="52" />
                            <Heading size="4" color="gray">Search for talent across all industries</Heading>
                            <Text size="2" color="gray" align="center" style={{ maxWidth: 380 }}>
                                Use natural language like &quot;Senior ML engineers in Europe&quot; or add
                                structured filters on the left.
                            </Text>
                        </Flex>
                    )}

                    {/* Searching state */}
                    {stage === "searching" && (
                        <Flex direction="column" align="center" gap="4" py="9">
                            <Spinner size="3" />
                            <Heading size="4">Searching…</Heading>
                            <Text size="2" color="gray">Translating query and fetching candidates</Text>
                        </Flex>
                    )}

                    {/* Results */}
                    {(stage === "results" || stage === "paginating") && (
                        <Box className={styles.legacyResultsLayout}>
                            {/* Results header */}
                            <Flex justify="between" align="center" mb="3" px="1">
                                <Flex align="center" gap="3">
                                    <Text size="2" color="gray">
                            {totalResults > 0
                                            ? `${totalResults.toLocaleString()} candidates found`
                                            : "No results found"}
                                    </Text>
                                    {isPaginating && <Spinner size="1" />}
                                </Flex>
                            </Flex>

                            {/* Results table */}
                            <Box className={`${styles.tableContainer} ${styles.scrollableTableContainer}`}>
                                <Table.Root variant="surface">
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.ColumnHeaderCell style={{ width: 36 }}>
                                                <Checkbox
                                                    size="1"
                                                    checked={results.length > 0 && results.every((r) => selectedIds.has(r.id))}
                                                    onCheckedChange={handleToggleSelectAll}
                                                />
                                            </Table.ColumnHeaderCell>
                                            <Table.ColumnHeaderCell>Candidate</Table.ColumnHeaderCell>
                                            <Table.ColumnHeaderCell>Title & Level</Table.ColumnHeaderCell>
                                            <Table.ColumnHeaderCell>Company</Table.ColumnHeaderCell>
                                            <Table.ColumnHeaderCell>Location</Table.ColumnHeaderCell>
                                            <Table.ColumnHeaderCell>Industry</Table.ColumnHeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {results.map((item) => (
                                            <Table.Row
                                                key={item.id}
                                                className={
                                                    activeCandidate?.id === item.id
                                                        ? styles.trActive
                                                        : styles.trHover
                                                }
                                                onClick={() =>
                                                    setActiveCandidate(
                                                        activeCandidate?.id === item.id
                                                            ? null
                                                            : {
                                                                id: item.id,
                                                                full_name: item.full_name,
                                                                headline: item.headline,
                                                                job_title: item.job_title,
                                                                company_name: item.company_name,
                                                                location_full: item.location_full,
                                                                location_country: item.location_country,
                                                                management_level: item.management_level,
                                                                company_industry: item.company_industry,
                                                                websites_linkedin: item.websites_linkedin,
                                                                connections_count: item.connections_count,
                                                                follower_count: item.follower_count,
                                                                company_linkedin_url: item.company_linkedin_url,
                                                                company_website: item.company_website,
                                                                department: item.department,
                                                                company_location_hq_full_address: item.company_location_hq_full_address,
                                                                company_location_hq_country: item.company_location_hq_country,
                                                                score: item.score,
                                                            }
                                                    )
                                                }
                                                style={{ cursor: "pointer" }}
                                            >
                                                <Table.Cell onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        size="1"
                                                        checked={selectedIds.has(item.id)}
                                                        onCheckedChange={() => handleToggleSelect(item.id)}
                                                    />
                                                </Table.Cell>
                                                <Table.RowHeaderCell>
                                                    {item.websites_linkedin ? (
                                                        <a
                                                            href={item.websites_linkedin}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ textDecoration: "none" }}
                                                        >
                                                            <Text weight="bold" size="2" color="blue" style={{ textDecoration: "underline" }}>
                                                                {item.full_name || "—"}
                                                            </Text>
                                                        </a>
                                                    ) : (
                                                        <Text weight="bold" size="2">
                                                            {item.full_name || "—"}
                                                        </Text>
                                                    )}
                                                </Table.RowHeaderCell>
                                                <Table.Cell>
                                                    <Flex direction="column" gap="1">
                                                        <Text size="2">{item.job_title || "—"}</Text>
                                                        {item.management_level && (
                                                            <Badge
                                                                size="1"
                                                                variant="soft"
                                                                color={LEVEL_COLORS[item.management_level] ?? "gray"}
                                                            >
                                                                {item.management_level}
                                                            </Badge>
                                                        )}
                                                    </Flex>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Text size="2">{item.company_name || "—"}</Text>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Text size="2">
                                                        {item.location_full || item.location_country || "—"}
                                                    </Text>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {item.company_industry ? (
                                                        <Badge size="1" variant="soft" color="gray">
                                                            {item.company_industry}
                                                        </Badge>
                                                    ) : (
                                                        <Text size="2" color="gray">—</Text>
                                                    )}
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                        {results.length === 0 && (
                                            <Table.Row>
                                                <Table.Cell colSpan={6} align="center">
                                                    <Text color="gray" size="2">No results for this query. Try broadening your search.</Text>
                                                </Table.Cell>
                                            </Table.Row>
                                        )}
                                    </Table.Body>
                                </Table.Root>
                            </Box>

                            {/* Pagination */}
                            {(() => {
                                const safeTotalPages = Math.min(totalPages, MAX_PREVIEW_PAGES);
                                return safeTotalPages > 1 && (
                                    <Flex className={styles.paginationBar} justify="center" align="center" gap="2">
                                        <Button
                                            size="2"
                                            variant="soft"
                                            disabled={uiPage === 1 || isPaginating}
                                            onClick={() => handlePageChange(1)}
                                        >
                                            First
                                        </Button>
                                        <Button
                                            size="2"
                                            variant="soft"
                                            disabled={!hasPrev || isPaginating}
                                            onClick={() => handlePageChange(uiPage - 1)}
                                        >
                                            <ChevronLeftIcon />
                                        </Button>

                                        {isPaginating ? (
                                            <Flex align="center" gap="2" px="2">
                                                <Spinner size="1" />
                                                <Text size="2" color="gray">Loading…</Text>
                                            </Flex>
                                        ) : (
                                            Array.from({ length: safeTotalPages }, (_, i) => i + 1).map((pageNum) => (
                                                <Button
                                                    key={pageNum}
                                                    size="2"
                                                    variant={pageNum === uiPage ? "solid" : "soft"}
                                                    onClick={() => { if (pageNum !== uiPage) handlePageChange(pageNum); }}
                                                >
                                                    {pageNum}
                                                </Button>
                                            ))
                                        )}

                                        <Button
                                            size="2"
                                            variant="soft"
                                            disabled={!hasNext || isPaginating}
                                            onClick={() => handlePageChange(uiPage + 1)}
                                        >
                                            <ChevronRightIcon />
                                        </Button>
                                        <Button
                                            size="2"
                                            variant="soft"
                                            disabled={uiPage === safeTotalPages || isPaginating}
                                            onClick={() => handlePageChange(safeTotalPages)}
                                        >
                                            Last
                                        </Button>
                                    </Flex>
                                );
                            })()}
                        </Box>
                    )}
                </Box>

                {/* ── Candidate Detail Panel ── */}
                {activeCandidate && (
                    <CandidatePanel
                        preview={activeCandidate}
                        onClose={() => setActiveCandidate(null)}
                        onSaveToList={handlePanelSaveToList}
                    />
                )}

                <SaveToListDialog
                    open={saveDialogOpen}
                    onOpenChange={setSaveDialogOpen}
                    candidates={selectedImportPayload}
                    onSaved={async () => {
                        setSelectedIds(new Set());
                        setSelectedCandidatesById(new Map());
                    }}
                    onOpenList={(list) => openSavedList(list.id)}
                    onEnrichList={(list) => openSavedList(list.id, { enrich: true })}
                />
            </Flex>
        </Box>
    );
}

function SearchPageInner() {
    const searchParams = useSearchParams();
    const bootstrap = useMemo(
        () => (typeof window === "undefined" ? null : readSearchPageBootstrap()),
        [],
    );
    const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);

    useEffect(() => {
        if (bootstrap) {
            clearSearchPageBootstrap();
        }
    }, [bootstrap]);

    useEffect(() => {
        let cancelled = false;
        async function loadBilling() {
            try {
                const summary = await fetchBillingSummary();
                if (!cancelled) {
                    setBillingSummary(summary);
                }
            } catch {
                if (!cancelled) {
                    setBillingSummary(null);
                }
            }
        }
        void loadBilling();
        window.addEventListener('tahoe:credits-updated', loadBilling);
        return () => {
            cancelled = true;
            window.removeEventListener('tahoe:credits-updated', loadBilling);
        };
    }, []);

    const forcedMode = searchParams.get("mode");
    const resolvedMode = forcedMode ?? bootstrap?.mode ?? (SEARCH_LANGGRAPH_ENABLED ? "langgraph" : "legacy");

    return (
        <div className={styles.searchRouteShell}>
            {billingSummary && ['low', 'critical', 'empty'].includes(billingSummary.low_credit_state) ? (
                <Box className={styles.creditCallout}>
                    <Callout.Root color={billingSummary.low_credit_state === 'low' ? 'orange' : 'red'}>
                        <Callout.Icon>
                            <ExclamationTriangleIcon />
                        </Callout.Icon>
                        <Callout.Text>
                            Credit runway is getting tight. Tahoe only charges search when it makes a new provider-backed preview fetch, and top-up credits never expire.
                        </Callout.Text>
                    </Callout.Root>
                </Box>
            ) : null}
            {resolvedMode === "langgraph"
                ? <LangGraphSearchPage bootstrap={bootstrap?.mode === "langgraph" ? bootstrap : null} />
                : <LegacySearchPage bootstrap={bootstrap?.mode === "legacy" ? bootstrap : null} />}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<Box className={styles.searchRouteShell}><span className="tahoe-spinner" /></Box>}>
            <SearchPageInner />
        </Suspense>
    );
}
