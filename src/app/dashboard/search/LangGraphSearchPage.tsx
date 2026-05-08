"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
    Badge,
    Box,
    Button,
    Callout,
    Flex,
    Heading,
    Separator,
    Spinner,
    Text,
    TextField,
} from "@radix-ui/themes";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    Cross2Icon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    PlusIcon,
} from "@radix-ui/react-icons";
import CandidatePanel, { type PreviewData } from "./CandidatePanel";
import styles from "./langgraph-search.module.css";
import PreviewGrid, { type PreviewGridRow } from "./preview-grid";

type SearchResultItem = PreviewGridRow;

interface SearchSuggestion {
    rank: number;
    action: string;
    reasoning: string;
    estimated_results: string;
    revised_query_nl: string;
}

type LanguageProficiency = string;

interface PopupLanguageModel {
    language: string;
    proficiency: LanguageProficiency | null;
}

interface PopupIntentModel {
    general: {
        min_experience_months: number | null;
        max_experience_months: number | null;
        is_currently_employed: boolean | null;
        is_decision_maker: boolean | null;
        min_followers: number | null;
        min_connections: number | null;
    };
    locations: {
        countries: string[];
        states: string[];
        cities: string[];
    };
    job: {
        current_title_keywords: string[];
        departments: string[];
        management_levels: string[];
        recently_started: boolean | null;
        recently_left: boolean | null;
        recent_company_name: string | null;
    };
    company: {
        current_company_names: string[];
        past_company_names: string[];
        optional_company_names: string[];
        industries: string[];
        optional_industries: string[];
        company_size_ranges: string[];
        optional_company_size_ranges: string[];
        company_hq_countries: string[];
        optional_company_hq_countries: string[];
        is_b2b_company: boolean | null;
        optional_is_b2b_company: boolean | null;
    };
    keywords: {
        skills: string[];
        headline_keywords: string[];
        summary_keywords: string[];
    };
    education: {
        institution_names: string[];
        degree_keywords: string[];
        graduation_year_min: number | null;
        graduation_year_max: number | null;
    };
    certifications: {
        title_keywords: string[];
        issuers: string[];
    };
    languages: PopupLanguageModel[];
    ambiguities: string[];
    semantic_expansions: Record<string, string[] | string>;
}

interface ParseResponse {
    search_session_id: string;
    checkpoint_id: string;
    parsed_intent: Record<string, unknown>;
    confidence: string | null;
    ambiguities: string[];
    semantic_expansions: Record<string, string[] | string>;
    popup_model: PopupIntentModel;
    cache_hit: string | null;
    langsmith_run_id: string | null;
}

interface ExecuteResponse {
    state: string;
    results: SearchResultItem[];
    total_results: number | null;
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    query_hash: string | null;
    preview_total_results: number | null;
    preview_cap: number;
    diagnosis: string | null;
    diagnosis_type: string | null;
    root_cause: string | null;
    suggestions: SearchSuggestion[];
    ambiguous_terms: string[];
    search_session_id: string;
    langsmith_run_id: string | null;
}

interface PreviewPageResponse {
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

interface FilterField {
    key: string;
    label: string;
    control: "number" | "boolean" | "tags" | "tags_with_suggestions" | "multiselect" | "text" | "language_rows";
    help_text: string;
    options: string[];
    suggestions: string[];
    allow_custom: boolean;
}

interface FilterSection {
    id: string;
    title: string;
    fields: FilterField[];
}

interface FilterMetadata {
    version: string;
    sections: FilterSection[];
    management_levels: string[];
    departments: string[];
    company_size_ranges: string[];
    language_proficiencies: LanguageProficiency[];
    workforce_role_suggestions?: string[];
}

type ViewState = "idle" | "parsing" | "review" | "searching" | "results" | "diagnosis";
const SESSION_KEY = "langgraph_search_preview_state_v1";

interface SearchPageState {
    query: string;
    viewState: ViewState;
    error: string;
    searchSessionId: string | null;
    checkpointId: string | null;
    popupModel: PopupIntentModel;
    modalOpen: boolean;
    needsFreshSession: boolean;
    queryHash: string | null;
    pagesByNumber: Record<number, SearchResultItem[]>;
    currentPage: number;
    totalResults: number | null;
    totalPages: number;
    previewTotalResults: number | null;
    previewCap: number;
    diagnosis: string | null;
    diagnosisType: string | null;
    rootCause: string | null;
    suggestions: SearchSuggestion[];
    activeCandidateId: number | null;
    paginatingPage: number | null;
}

type SearchPageAction =
    | { type: "hydrate"; payload: Partial<SearchPageState> }
    | { type: "patch"; payload: Partial<SearchPageState> }
    | { type: "parse_success"; payload: { searchSessionId: string; checkpointId: string; popupModel: PopupIntentModel } }
    | { type: "execute_success"; payload: ExecuteResponse }
    | { type: "page_loaded"; payload: PreviewPageResponse }
    | { type: "set_current_page"; page: number }
    | { type: "toggle_candidate"; candidateId: number | null };

function initialSearchState(): SearchPageState {
    return {
        query: "",
        viewState: "idle",
        error: "",
        searchSessionId: null,
        checkpointId: null,
        popupModel: emptyPopupModel(),
        modalOpen: false,
        needsFreshSession: false,
        queryHash: null,
        pagesByNumber: {},
        currentPage: 1,
        totalResults: null,
        totalPages: 1,
        previewTotalResults: null,
        previewCap: 100,
        diagnosis: null,
        diagnosisType: null,
        rootCause: null,
        suggestions: [],
        activeCandidateId: null,
        paginatingPage: null,
    };
}

function searchStateReducer(state: SearchPageState, action: SearchPageAction): SearchPageState {
    switch (action.type) {
        case "hydrate":
            {
                const restoredViewState =
                    action.payload.viewState === "parsing" || action.payload.viewState === "searching"
                        ? (action.payload.pagesByNumber && Object.keys(action.payload.pagesByNumber).length > 0
                            ? (action.payload.diagnosis ? "diagnosis" : "results")
                            : "idle")
                        : action.payload.viewState;
            return {
                ...state,
                ...action.payload,
                viewState: restoredViewState ?? state.viewState,
                popupModel: action.payload.popupModel ?? state.popupModel,
                pagesByNumber: action.payload.pagesByNumber ?? state.pagesByNumber,
            };
            }
        case "patch":
            return { ...state, ...action.payload };
        case "parse_success":
            return {
                ...state,
                searchSessionId: action.payload.searchSessionId,
                checkpointId: action.payload.checkpointId,
                popupModel: action.payload.popupModel,
                modalOpen: true,
                needsFreshSession: false,
                viewState: "review",
                error: "",
                diagnosis: null,
                diagnosisType: null,
                rootCause: null,
                suggestions: [],
                queryHash: null,
                pagesByNumber: {},
                currentPage: 1,
                totalResults: null,
                totalPages: 1,
                previewTotalResults: null,
                activeCandidateId: null,
                paginatingPage: null,
            };
        case "execute_success":
            return {
                ...state,
                modalOpen: false,
                viewState: action.payload.diagnosis ? "diagnosis" : "results",
                error: "",
                queryHash: action.payload.query_hash,
                pagesByNumber: { 1: action.payload.results ?? [] },
                currentPage: action.payload.current_page ?? 1,
                totalResults: action.payload.total_results ?? 0,
                totalPages: action.payload.total_pages ?? 1,
                previewTotalResults: action.payload.preview_total_results ?? action.payload.total_results ?? 0,
                previewCap: action.payload.preview_cap ?? 100,
                diagnosis: action.payload.diagnosis,
                diagnosisType: action.payload.diagnosis_type,
                rootCause: action.payload.root_cause,
                suggestions: action.payload.suggestions ?? [],
                activeCandidateId: null,
                needsFreshSession: true,
                paginatingPage: null,
            };
        case "page_loaded":
            return {
                ...state,
                pagesByNumber: {
                    ...state.pagesByNumber,
                    [action.payload.current_page]: action.payload.results ?? [],
                },
                currentPage: action.payload.current_page,
                totalResults: action.payload.total_results,
                totalPages: action.payload.total_pages,
                previewTotalResults: action.payload.preview_total_results,
                previewCap: action.payload.preview_cap,
                queryHash: action.payload.query_hash,
                paginatingPage: null,
                activeCandidateId: null,
            };
        case "set_current_page":
            return {
                ...state,
                currentPage: action.page,
                paginatingPage: null,
                activeCandidateId: null,
            };
        case "toggle_candidate":
            return {
                ...state,
                activeCandidateId: state.activeCandidateId === action.candidateId ? null : action.candidateId,
            };
        default:
            return state;
    }
}

function emptyPopupModel(): PopupIntentModel {
    return {
        general: {
            min_experience_months: null,
            max_experience_months: null,
            is_currently_employed: null,
            is_decision_maker: null,
            min_followers: null,
            min_connections: null,
        },
        locations: {
            countries: [],
            states: [],
            cities: [],
        },
        job: {
            current_title_keywords: [],
            departments: [],
            management_levels: [],
            recently_started: null,
            recently_left: null,
            recent_company_name: null,
        },
        company: {
            current_company_names: [],
            past_company_names: [],
            optional_company_names: [],
            industries: [],
            optional_industries: [],
            company_size_ranges: [],
            optional_company_size_ranges: [],
            company_hq_countries: [],
            optional_company_hq_countries: [],
            is_b2b_company: null,
            optional_is_b2b_company: null,
        },
        keywords: {
            skills: [],
            headline_keywords: [],
            summary_keywords: [],
        },
        education: {
            institution_names: [],
            degree_keywords: [],
            graduation_year_min: null,
            graduation_year_max: null,
        },
        certifications: {
            title_keywords: [],
            issuers: [],
        },
        languages: [],
        ambiguities: [],
        semantic_expansions: {},
    };
}

function tagCount(tags: string[]): number {
    return tags.filter((item) => item.trim()).length;
}

function countActiveFilters(model: PopupIntentModel): number {
    return [
        tagCount(model.locations.countries),
        tagCount(model.locations.states),
        tagCount(model.locations.cities),
        tagCount(model.job.current_title_keywords),
        model.job.departments.length,
        model.job.management_levels.length,
        tagCount(model.company.current_company_names),
        tagCount(model.company.past_company_names),
        tagCount(model.company.optional_company_names),
        tagCount(model.company.industries),
        tagCount(model.company.optional_industries),
        model.company.company_size_ranges.length,
        model.company.optional_company_size_ranges.length,
        tagCount(model.company.company_hq_countries),
        tagCount(model.company.optional_company_hq_countries),
        tagCount(model.keywords.skills),
        tagCount(model.keywords.headline_keywords),
        tagCount(model.keywords.summary_keywords),
        tagCount(model.education.institution_names),
        tagCount(model.education.degree_keywords),
        tagCount(model.certifications.title_keywords),
        tagCount(model.certifications.issuers),
        model.languages.filter((item) => item.language.trim()).length,
        model.general.min_experience_months !== null ? 1 : 0,
        model.general.max_experience_months !== null ? 1 : 0,
        model.general.is_currently_employed !== null ? 1 : 0,
        model.general.is_decision_maker !== null ? 1 : 0,
        model.general.min_followers !== null ? 1 : 0,
        model.general.min_connections !== null ? 1 : 0,
        model.job.recently_started !== null ? 1 : 0,
        model.job.recently_left !== null ? 1 : 0,
        model.company.is_b2b_company !== null ? 1 : 0,
        model.company.optional_is_b2b_company !== null ? 1 : 0,
    ].reduce((sum, value) => sum + value, 0);
}

function getNestedValue(source: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce<unknown>((current, part) => {
        if (current && typeof current === "object" && part in current) {
            return (current as Record<string, unknown>)[part];
        }
        return undefined;
    }, source);
}

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown): void {
    const segments = path.split(".");
    let current: Record<string, unknown> = target;
    for (const segment of segments.slice(0, -1)) {
        const next = current[segment];
        if (!next || typeof next !== "object") {
            current[segment] = {};
        }
        current = current[segment] as Record<string, unknown>;
    }
    current[segments[segments.length - 1]] = value;
}

function TagInput({
    placeholder,
    tags,
    suggestions,
    onChange,
}: {
    placeholder: string;
    tags: string[];
    suggestions?: string[];
    onChange: (next: string[]) => void;
}) {
    const [input, setInput] = useState("");

    const visibleSuggestions = (suggestions ?? [])
        .filter((suggestion) => !tags.some((tag) => tag.toLowerCase() === suggestion.toLowerCase()))
        .filter((suggestion) => !input || suggestion.toLowerCase().includes(input.trim().toLowerCase()))
        .slice(0, 8);

    const addTag = () => {
        const value = input.trim();
        if (!value || tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
            setInput("");
            return;
        }
        onChange([...tags, value]);
        setInput("");
    };

    return (
        <Box>
            <Flex gap="1" wrap="wrap" mb="2">
                {tags.map((tag) => (
                    <Badge key={tag} variant="soft" color="blue" style={{ cursor: "pointer" }}>
                        {tag}
                        <Cross2Icon
                            width={10}
                            height={10}
                            style={{ marginLeft: 4 }}
                            onClick={() => onChange(tags.filter((item) => item !== tag))}
                        />
                    </Badge>
                ))}
            </Flex>
            <TextField.Root
                placeholder={placeholder}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onBlur={addTag}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addTag();
                    }
                }}
            />
            {visibleSuggestions.length > 0 && (
                <Flex gap="2" wrap="wrap" mt="2">
                    {visibleSuggestions.map((suggestion) => (
                        <Button
                            key={suggestion}
                            size="1"
                            variant="soft"
                            onClick={() => onChange([...tags, suggestion])}
                        >
                            {suggestion}
                        </Button>
                    ))}
                </Flex>
            )}
        </Box>
    );
}

function NumberInput({
    value,
    placeholder,
    onChange,
}: {
    value: number | null;
    placeholder: string;
    onChange: (next: number | null) => void;
}) {
    return (
        <TextField.Root
            placeholder={placeholder}
            value={value === null ? "" : String(value)}
            onChange={(event) => {
                const next = event.target.value.trim();
                if (!next) {
                    onChange(null);
                    return;
                }
                if (!/^\d+$/.test(next)) {
                    return;
                }
                onChange(Number(next));
            }}
        />
    );
}

function TriStateToggle({
    value,
    onChange,
}: {
    value: boolean | null;
    onChange: (next: boolean | null) => void;
}) {
    return (
        <Flex gap="2" wrap="wrap">
            <Button size="1" variant={value === null ? "solid" : "soft"} onClick={() => onChange(null)}>
                Any
            </Button>
            <Button size="1" variant={value === true ? "solid" : "soft"} onClick={() => onChange(true)}>
                Yes
            </Button>
            <Button size="1" variant={value === false ? "solid" : "soft"} onClick={() => onChange(false)}>
                No
            </Button>
        </Flex>
    );
}

function MultiSelect({
    options,
    selected,
    onChange,
}: {
    options: string[];
    selected: string[];
    onChange: (next: string[]) => void;
}) {
    return (
        <Flex gap="2" wrap="wrap">
            {options.map((option) => {
                const active = selected.includes(option);
                return (
                    <Button
                        key={option}
                        size="1"
                        variant={active ? "solid" : "soft"}
                        onClick={() => onChange(active ? selected.filter((item) => item !== option) : [...selected, option])}
                    >
                        {option}
                    </Button>
                );
            })}
        </Flex>
    );
}

function toPreviewData(item: SearchResultItem): PreviewData {
    return {
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
    };
}

export default function LangGraphSearchPage() {
    const [state, dispatch] = useReducer(searchStateReducer, undefined, initialSearchState);
    const [metadata, setMetadata] = useState<FilterMetadata | null>(null);
    const [activeSection, setActiveSection] = useState("general");
    const [hydrated, setHydrated] = useState(false);

    const popupModel = state.popupModel;
    const currentResults = useMemo(
        () => state.pagesByNumber[state.currentPage] ?? [],
        [state.currentPage, state.pagesByNumber],
    );
    const activeCandidate = useMemo<PreviewData | null>(() => {
        if (state.activeCandidateId == null) return null;
        const row = Object.values(state.pagesByNumber)
            .flat()
            .find((item) => item.id === state.activeCandidateId);
        return row ? toPreviewData(row) : null;
    }, [state.activeCandidateId, state.pagesByNumber]);

    useEffect(() => {
        let mounted = true;
        apiRequest<FilterMetadata>("/search/filter-metadata")
            .then((response) => {
                if (!mounted) return;
                setMetadata(response);
                setActiveSection(response.sections[0]?.id ?? "general");
            })
            .catch(() => {
                if (!mounted) return;
                setMetadata(null);
            });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") {
            setHydrated(true);
            return;
        }
        try {
            const raw = window.sessionStorage.getItem(SESSION_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<SearchPageState>;
                dispatch({
                    type: "hydrate",
                    payload: {
                        ...parsed,
                        popupModel: parsed.popupModel ?? emptyPopupModel(),
                    },
                });
            }
        } catch {
            window.sessionStorage.removeItem(SESSION_KEY);
        } finally {
            setHydrated(true);
        }
    }, []);

    useEffect(() => {
        if (!hydrated || typeof window === "undefined") return;
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    }, [hydrated, state]);

    const activeFilterCount = useMemo(() => countActiveFilters(popupModel), [popupModel]);

    const parseQuery = useCallback(async (nextQuery: string) => {
        dispatch({ type: "patch", payload: { error: "", viewState: "parsing", query: nextQuery } });
        const response = await apiRequest<ParseResponse>("/search/parse", {
            method: "POST",
            body: { search_prompt: nextQuery },
        });
        dispatch({
            type: "parse_success",
            payload: {
                searchSessionId: response.search_session_id,
                checkpointId: response.checkpoint_id,
                popupModel: response.popup_model ?? emptyPopupModel(),
            },
        });
    }, []);

    async function handleParseSubmit(event?: { preventDefault(): void }) {
        event?.preventDefault();
        if (!state.query.trim()) return;
        try {
            await parseQuery(state.query.trim());
        } catch (err: unknown) {
            dispatch({
                type: "patch",
                payload: {
                    error: err instanceof Error ? err.message : "Unable to parse search.",
                    viewState: "idle",
                },
            });
        }
    }

    async function ensureFreshSession(): Promise<{ sessionId: string; checkpoint: string }> {
        if (!state.needsFreshSession && state.searchSessionId && state.checkpointId) {
            return { sessionId: state.searchSessionId, checkpoint: state.checkpointId };
        }
        const response = await apiRequest<ParseResponse>("/search/parse", {
            method: "POST",
            body: { search_prompt: state.query.trim() },
        });
        dispatch({
            type: "patch",
            payload: {
                searchSessionId: response.search_session_id,
                checkpointId: response.checkpoint_id,
                needsFreshSession: false,
                popupModel: response.popup_model ?? state.popupModel,
            },
        });
        return { sessionId: response.search_session_id, checkpoint: response.checkpoint_id };
    }

    async function handleRunSearch() {
        try {
            dispatch({ type: "patch", payload: { error: "", viewState: "searching" } });
            const session = await ensureFreshSession();
            const response = await apiRequest<ExecuteResponse>("/search/execute", {
                method: "POST",
                body: {
                    search_session_id: session.sessionId,
                    checkpoint_id: session.checkpoint,
                    confirmed_intent: popupModel,
                },
            });
            dispatch({ type: "execute_success", payload: response });
        } catch (err: unknown) {
            dispatch({
                type: "patch",
                payload: {
                    error: err instanceof Error ? err.message : "Unable to execute recruiter search.",
                    viewState: currentResults.length > 0 ? "results" : "review",
                    paginatingPage: null,
                },
            });
        }
    }

    function updatePopup(mutator: (draft: PopupIntentModel) => void) {
        const next = JSON.parse(JSON.stringify(popupModel)) as PopupIntentModel;
        mutator(next);
        dispatch({ type: "patch", payload: { popupModel: next } });
    }

    async function handlePageChange(targetPage: number) {
        if (!state.queryHash || targetPage === state.currentPage || targetPage < 1 || targetPage > state.totalPages) {
            return;
        }
        if (state.pagesByNumber[targetPage]) {
            dispatch({ type: "set_current_page", page: targetPage });
            return;
        }
        try {
            dispatch({ type: "patch", payload: { paginatingPage: targetPage, error: "" } });
            const response = await apiRequest<PreviewPageResponse>(
                `/search/preview-page?query_hash=${encodeURIComponent(state.queryHash)}&page=${targetPage}`
            );
            dispatch({ type: "page_loaded", payload: response });
        } catch (err: unknown) {
            dispatch({
                type: "patch",
                payload: {
                    error: err instanceof Error ? err.message : "Unable to load the requested preview page.",
                    paginatingPage: null,
                },
            });
        }
    }

    function renderField(field: FilterField) {
        const value = getNestedValue(popupModel as unknown as Record<string, unknown>, field.key);

        if (field.control === "number") {
            return (
                <NumberInput
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    value={typeof value === "number" ? value : null}
                    onChange={(next) => updatePopup((draft) => {
                        setNestedValue(draft as unknown as Record<string, unknown>, field.key, next);
                    })}
                />
            );
        }

        if (field.control === "boolean") {
            return (
                <TriStateToggle
                    value={typeof value === "boolean" ? value : null}
                    onChange={(next) => updatePopup((draft) => {
                        setNestedValue(draft as unknown as Record<string, unknown>, field.key, next);
                    })}
                />
            );
        }

        if (field.control === "tags") {
            return (
                <TagInput
                    placeholder={`Add ${field.label.toLowerCase()}`}
                    tags={Array.isArray(value) ? (value as string[]) : []}
                    suggestions={[]}
                    onChange={(next) => updatePopup((draft) => {
                        setNestedValue(draft as unknown as Record<string, unknown>, field.key, next);
                    })}
                />
            );
        }

        if (field.control === "tags_with_suggestions") {
            return (
                <TagInput
                    placeholder={`Add ${field.label.toLowerCase()}`}
                    tags={Array.isArray(value) ? (value as string[]) : []}
                    suggestions={field.suggestions}
                    onChange={(next) => updatePopup((draft) => {
                        setNestedValue(draft as unknown as Record<string, unknown>, field.key, next);
                    })}
                />
            );
        }

        if (field.control === "multiselect") {
            return (
                <MultiSelect
                    options={field.options}
                    selected={Array.isArray(value) ? (value as string[]) : []}
                    onChange={(next) => updatePopup((draft) => {
                        setNestedValue(draft as unknown as Record<string, unknown>, field.key, next);
                    })}
                />
            );
        }

        if (field.control === "text") {
            return (
                <TextField.Root
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => updatePopup((draft) => {
                        setNestedValue(
                            draft as unknown as Record<string, unknown>,
                            field.key,
                            event.target.value.trim() ? event.target.value : null,
                        );
                    })}
                />
            );
        }

        if (field.control === "language_rows") {
            const languages = popupModel.languages;
            return (
                <Flex direction="column" gap="3">
                    {languages.map((entry, index) => (
                        <Box key={`${entry.language}-${index}`} className={styles.languageRow}>
                            <Flex gap="3" align="center">
                                <Box style={{ flex: 1 }}>
                                    <TextField.Root
                                        placeholder="Language"
                                        value={entry.language}
                                        onChange={(event) => updatePopup((draft) => {
                                            draft.languages[index].language = event.target.value;
                                        })}
                                    />
                                    {field.suggestions.length > 0 && (
                                        <Flex gap="2" wrap="wrap" mt="2">
                                            {field.suggestions
                                                .filter((suggestion) => !entry.language || suggestion.toLowerCase().includes(entry.language.toLowerCase()))
                                                .slice(0, 6)
                                                .map((suggestion) => (
                                                    <Button
                                                        key={`${suggestion}-${index}-language`}
                                                        size="1"
                                                        variant="soft"
                                                        onClick={() => updatePopup((draft) => {
                                                            draft.languages[index].language = suggestion;
                                                        })}
                                                    >
                                                        {suggestion}
                                                    </Button>
                                                ))}
                                        </Flex>
                                    )}
                                </Box>
                                <Box style={{ flex: 1 }}>
                                    <TextField.Root
                                        placeholder="Any proficiency"
                                        value={entry.proficiency ?? ""}
                                        onChange={(event) => updatePopup((draft) => {
                                            draft.languages[index].proficiency = event.target.value
                                                ? event.target.value as LanguageProficiency
                                                : null;
                                        })}
                                    />
                                    {field.options.length > 0 && (
                                        <Flex gap="2" wrap="wrap" mt="2">
                                            {field.options
                                                .filter((option) => !entry.proficiency || option.toLowerCase().includes(entry.proficiency.toLowerCase()))
                                                .slice(0, 5)
                                                .map((option) => (
                                                    <Button
                                                        key={`${option}-${index}-proficiency`}
                                                        size="1"
                                                        variant="soft"
                                                        onClick={() => updatePopup((draft) => {
                                                            draft.languages[index].proficiency = option as LanguageProficiency;
                                                        })}
                                                    >
                                                        {option}
                                                    </Button>
                                                ))}
                                        </Flex>
                                    )}
                                </Box>
                                <Button
                                    size="1"
                                    variant="ghost"
                                    onClick={() => updatePopup((draft) => {
                                        draft.languages = draft.languages.filter((_, languageIndex) => languageIndex !== index);
                                    })}
                                >
                                    <Cross2Icon />
                                </Button>
                            </Flex>
                        </Box>
                    ))}
                    <Button
                        size="2"
                        variant="soft"
                        onClick={() => updatePopup((draft) => {
                            draft.languages.push({ language: "", proficiency: null });
                        })}
                    >
                        <PlusIcon />
                        Add language
                    </Button>
                </Flex>
            );
        }

        return null;
    }

    const sections = metadata?.sections ?? [];
    const activeSectionData = sections.find((section) => section.id === activeSection) ?? sections[0];
    const previewWindowMessage =
        state.totalResults != null && state.previewTotalResults != null && state.totalResults > state.previewTotalResults
            ? `${state.totalResults.toLocaleString()} total matches; preview limited to the top ${state.previewTotalResults.toLocaleString()} across ${state.totalPages} pages`
            : null;

    return (
        <Box className={styles.page}>
            <Box className={styles.searchBar}>
                <form onSubmit={handleParseSubmit}>
                    <Flex gap="3" align="center">
                        <Box style={{ flexGrow: 1 }}>
                            <TextField.Root
                                size="3"
                                placeholder='Try: "Senior ML engineers in Europe with Python skills"'
                                value={state.query}
                                onChange={(event) => dispatch({ type: "patch", payload: { query: event.target.value } })}
                                disabled={state.viewState === "parsing" || state.viewState === "searching"}
                            >
                                <TextField.Slot>
                                    <MagnifyingGlassIcon width="16" height="16" />
                                </TextField.Slot>
                            </TextField.Root>
                        </Box>
                        <Button size="3" type="submit" disabled={!state.query.trim() || state.viewState === "parsing" || state.viewState === "searching"}>
                            {state.viewState === "parsing" ? <Spinner /> : "Search"}
                        </Button>
                    </Flex>
                </form>
            </Box>

            {state.error && (
                <Box px="4" py="3">
                    <Callout.Root color="red">
                        <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                        <Callout.Text>{state.error}</Callout.Text>
                    </Callout.Root>
                </Box>
            )}

            <Flex className={styles.layout}>
                <Box className={styles.resultsArea}>
                    {state.viewState === "idle" && (
                        <Flex direction="column" align="center" justify="center" gap="4" className={styles.emptyState}>
                            <MagnifyingGlassIcon width="52" height="52" />
                            <Heading size="5">Search, review filters, then run the query</Heading>
                            <Text size="2" color="gray" align="center" style={{ maxWidth: 520 }}>
                                Recruiters can type a natural-language query, inspect the parsed filters in a popup, and page through the top 100 preview matches in 20-result pages.
                            </Text>
                        </Flex>
                    )}

                    {state.viewState === "searching" && (
                        <Flex direction="column" align="center" gap="3" py="9">
                            <Spinner size="3" />
                            <Heading size="4">Running recruiter search…</Heading>
                            <Text size="2" color="gray">Building DSL, validating filters, and fetching preview results.</Text>
                        </Flex>
                    )}

                    {(state.viewState === "results" || state.viewState === "diagnosis") && (
                        <>
                            <Flex justify="between" align="center" mb="3">
                                <Flex direction="column" gap="1">
                                    {previewWindowMessage && <Text size="2" color="gray">{previewWindowMessage}</Text>}
                                </Flex>
                                <Button
                                    size="2"
                                    variant="soft"
                                    onClick={() => {
                                        dispatch({ type: "patch", payload: { modalOpen: true, needsFreshSession: true } });
                                    }}
                                >
                                    Edit Filters
                                </Button>
                            </Flex>

                            <PreviewGrid
                                rows={currentResults}
                                activeRowId={state.activeCandidateId}
                                emptyMessage="No preview rows were returned for this search."
                                onRowClick={(row) => dispatch({ type: "toggle_candidate", candidateId: row.id })}
                            />

                            {state.totalPages > 1 && (
                                <Flex justify="center" align="center" gap="2" mt="4" wrap="wrap">
                                    <Button
                                        size="1"
                                        variant="soft"
                                        disabled={state.currentPage <= 1 || state.paginatingPage !== null}
                                        onClick={() => void handlePageChange(state.currentPage - 1)}
                                    >
                                        <ChevronLeftIcon />
                                        Previous
                                    </Button>
                                    {Array.from({ length: state.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                                        <Button
                                            key={pageNumber}
                                            size="1"
                                            variant={pageNumber === state.currentPage ? "solid" : "soft"}
                                            disabled={state.paginatingPage !== null && pageNumber !== state.currentPage}
                                            onClick={() => void handlePageChange(pageNumber)}
                                        >
                                            {pageNumber === state.paginatingPage ? <Spinner /> : pageNumber}
                                        </Button>
                                    ))}
                                    <Button
                                        size="1"
                                        variant="soft"
                                        disabled={state.currentPage >= state.totalPages || state.paginatingPage !== null}
                                        onClick={() => void handlePageChange(state.currentPage + 1)}
                                    >
                                        Next
                                        <ChevronRightIcon />
                                    </Button>
                                </Flex>
                            )}
                        </>
                    )}
                </Box>

                {activeCandidate && (
                    <CandidatePanel preview={activeCandidate} onClose={() => dispatch({ type: "toggle_candidate", candidateId: null })} />
                )}
            </Flex>

            {state.modalOpen && (
                <Box className={styles.modalOverlay}>
                    <Box className={styles.modal}>
                        <Flex justify="between" align="center" className={styles.modalHeader}>
                            <Box>
                                <Heading size="5">Edit your search filters</Heading>
                                <Text size="2" color="gray">
                                    {activeFilterCount} active filters
                                </Text>
                            </Box>
                            <Flex gap="2">
                                <Button size="2" variant="soft" disabled>
                                    Save Preset
                                </Button>
                                <Button size="2" variant="ghost" onClick={() => dispatch({ type: "patch", payload: { modalOpen: false } })}>
                                    <Cross2Icon />
                                </Button>
                            </Flex>
                        </Flex>

                        <Flex className={styles.modalBody}>
                            <Box className={styles.sectionNav}>
                                {sections.map((section) => (
                                    <Button
                                        key={section.id}
                                        size="2"
                                        variant={activeSection === section.id ? "solid" : "ghost"}
                                        className={styles.sectionButton}
                                        onClick={() => setActiveSection(section.id)}
                                    >
                                        {section.title}
                                    </Button>
                                ))}
                            </Box>

                            <Box className={styles.sectionContent}>
                                {activeSectionData?.fields.map((field) => (
                                    <Box key={field.key} mb="4">
                                        <Text size="1" weight="bold">{field.label}</Text>
                                        {field.help_text && (
                                            <Text size="1" color="gray" style={{ display: "block", marginTop: 4, marginBottom: 8 }}>
                                                {field.help_text}
                                            </Text>
                                        )}
                                        <Box mt="2">
                                            {renderField(field)}
                                        </Box>
                                    </Box>
                                ))}

                                <Separator size="4" my="4" />

                                <Box mb="4">
                                    <Text size="1" weight="bold">Ambiguities</Text>
                                    <Box mt="2">
                                        <TagInput
                                            placeholder="Add or remove ambiguous recruiter terms"
                                            tags={popupModel.ambiguities}
                                            onChange={(next) => updatePopup((draft) => {
                                                draft.ambiguities = next;
                                            })}
                                        />
                                    </Box>
                                </Box>

                                {Object.keys(popupModel.semantic_expansions).length > 0 && (
                                    <Box>
                                        <Text size="1" weight="bold">Semantic expansions</Text>
                                        <Flex gap="2" wrap="wrap" mt="2">
                                            {Object.entries(popupModel.semantic_expansions).map(([key, value]) => (
                                                <Badge key={key} variant="soft" color="amber">
                                                    {key}: {Array.isArray(value) ? value.join(", ") : value}
                                                </Badge>
                                            ))}
                                        </Flex>
                                    </Box>
                                )}
                            </Box>
                        </Flex>

                        <Flex justify="between" align="center" className={styles.modalFooter}>
                            <Button
                                size="2"
                                variant="soft"
                                onClick={() => dispatch({ type: "patch", payload: { popupModel: emptyPopupModel() } })}
                            >
                                Clear all
                            </Button>
                            <Flex gap="2">
                                <Button size="2" variant="soft" onClick={() => dispatch({ type: "patch", payload: { modalOpen: false } })}>
                                    Cancel
                                </Button>
                                <Button size="2" onClick={() => void handleRunSearch()}>
                                    {state.viewState === "searching" ? <Spinner /> : "Run Search"}
                                </Button>
                            </Flex>
                        </Flex>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
