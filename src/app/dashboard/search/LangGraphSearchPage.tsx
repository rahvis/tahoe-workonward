"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    answerSearchIntake,
    apiRequest,
    getSearchSession,
    startSearchIntake,
    type AIReasoningItem,
    type AssistantMessage,
    type SearchIntakeQuestion,
    type SearchIntakeResponse,
    type SearchIntakeStatus,
    type SearchRequirementsSummary,
    type SearchSessionPayload,
    type SearchSourceType,
} from "@/lib/api";
import type { SearchPageBootstrapPayload } from "@/lib/search-page-bootstrap";
import SaveToListDialog from "../_components/SaveToListDialog";
import { previewCandidateToImportPayload } from "@/lib/organization";
import { clearAnalyticsCache } from "../analytics/_components/analytics-cache";
import PreviewCapBanner from "./preview-cap-banner";
import {
    Badge,
    Box,
    Button,
    Callout,
    Dialog,
    Flex,
    Heading,
    Separator,
    Spinner,
    Text,
    TextField,
} from "@/components/ui/tahoe-ui";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    Cross2Icon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    PlusIcon,
} from "@/components/ui/icons";
import AIIntakeDrawer from "./AIIntakeDrawer";
import AIIntakeSheet from "./AIIntakeSheet";
import CandidatePanel, {
    MISSING_PREVIEW_EVIDENCE,
    type CandidateMatchRationale,
    type PreviewData,
} from "./CandidatePanel";
import styles from "./langgraph-search.module.css";
import PreviewGrid, { type PreviewGridRow } from "./preview-grid";
import SearchBriefSummary from "./SearchBriefSummary";

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

type ViewState =
    | "idle"
    | "parsing"
    | "intake_generating"
    | "intake_clarifying"
    | "review"
    | "searching"
    | "results"
    | "diagnosis";
const SESSION_KEY = "langgraph_search_preview_state_v1";
type SessionResumeStage = "idle" | "review" | "results";
type IntakeReasoningView = "summary" | "evidence" | "filters" | "assumptions" | "not_used";

interface SearchPageState {
    query: string;
    sourceType: SearchSourceType;
    jobDescription: string;
    roleTitle: string;
    intakeStatus: SearchIntakeStatus;
    intakeDrawerOpen: boolean;
    intakeQuestions: SearchIntakeQuestion[];
    missingSlots: string[];
    requirementsSummary: SearchRequirementsSummary | null;
    readinessScore: number;
    assistantMessages: AssistantMessage[];
    reasoningSummary: string | null;
    reasoningItems: AIReasoningItem[];
    reasoningPanelOpen: boolean;
    reasoningView: IntakeReasoningView;
    intakeAnswerPendingQuestionId: string | null;
    viewState: ViewState;
    error: string;
    searchSessionId: string | null;
    checkpointId: string | null;
    popupModel: PopupIntentModel;
    confirmedPopupModel: PopupIntentModel | null;
    /** Desktop Tahoe filter popup visibility (>=769px). */
    desktopFiltersOpen: boolean;
    /** True once the recruiter has manually edited any filter in the popup/sheet.
     * When true, the recruiter's popupModel survives the next /search/parse
     * (parse only anchors a fresh session; recruiter edits remain authoritative). */
    popupDirty: boolean;
    /** Mobile bottom-sheet visibility (≤768px viewports). */
    mobileFiltersOpen: boolean;
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
    | { type: "session_hydrated_with_intake"; payload: Partial<SearchPageState> }
    | { type: "patch"; payload: Partial<SearchPageState> }
    | { type: "source_mode_changed"; sourceType: SearchSourceType }
    | { type: "intake_start_pending" }
    | { type: "intake_response_applied"; payload: SearchIntakeResponse }
    | { type: "intake_answer_pending"; questionId: string }
    | { type: "intake_failed"; message: string }
    | { type: "reasoning_view_changed"; view: IntakeReasoningView }
    | { type: "parse_success"; payload: { searchSessionId: string; checkpointId: string; popupModel: PopupIntentModel } }
    | { type: "execute_success"; payload: ExecuteResponse; confirmedIntent?: PopupIntentModel }
    | { type: "page_loaded"; payload: PreviewPageResponse }
    | { type: "set_current_page"; page: number }
    | { type: "toggle_candidate"; candidateId: number | null };

interface LangGraphSearchPageProps {
    bootstrap?: SearchPageBootstrapPayload | null;
}

function sanitizePersistedState(payload: Partial<SearchPageState>): Partial<SearchPageState> {
    return {
        ...payload,
        error: "",
        paginatingPage: null,
        activeCandidateId: null,
        desktopFiltersOpen: false,
        mobileFiltersOpen: false,
    };
}

function initialSearchState(): SearchPageState {
    return {
        query: "",
        sourceType: "prompt",
        jobDescription: "",
        roleTitle: "",
        intakeStatus: "draft",
        intakeDrawerOpen: false,
        intakeQuestions: [],
        missingSlots: [],
        requirementsSummary: null,
        readinessScore: 0,
        assistantMessages: [],
        reasoningSummary: null,
        reasoningItems: [],
        reasoningPanelOpen: false,
        reasoningView: "summary",
        intakeAnswerPendingQuestionId: null,
        viewState: "idle",
        error: "",
        searchSessionId: null,
        checkpointId: null,
        popupModel: emptyPopupModel(),
        confirmedPopupModel: null,
        desktopFiltersOpen: false,
        popupDirty: false,
        mobileFiltersOpen: false,
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

function viewStateForIntakeStatus(status: SearchIntakeStatus): ViewState {
    if (status === "generating") return "intake_generating";
    if (status === "needs_clarification") return "intake_clarifying";
    if (status === "ready_for_review" || status === "executed") return "review";
    if (status === "failed") return "idle";
    return "idle";
}

function stateFromIntakeResponse(response: SearchIntakeResponse): Partial<SearchPageState> {
    return {
        searchSessionId: response.search_session_id,
        checkpointId: response.search_session_id,
        popupModel: (response.popup_model as unknown as PopupIntentModel | null) || emptyPopupModel(),
        confirmedPopupModel: null,
        popupDirty: false,
        needsFreshSession: false,
        intakeStatus: response.status,
        intakeDrawerOpen: true,
        intakeQuestions: response.questions ?? [],
        missingSlots: response.missing_slots ?? [],
        requirementsSummary: response.requirements_summary ?? null,
        readinessScore: response.readiness_score ?? 0,
        assistantMessages: response.assistant_messages ?? [],
        reasoningSummary: response.reasoning_summary ?? null,
        reasoningItems: response.reasoning_items ?? [],
        reasoningPanelOpen: Boolean(response.reasoning_summary || response.reasoning_items?.length),
        intakeAnswerPendingQuestionId: null,
        viewState: viewStateForIntakeStatus(response.status),
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
}

function clearedIntakeState(): Partial<SearchPageState> {
    return {
        jobDescription: "",
        roleTitle: "",
        ...clearedIntakeArtifactsState(),
    };
}

function clearedIntakeArtifactsState(): Partial<SearchPageState> {
    return {
        intakeStatus: "draft",
        intakeDrawerOpen: false,
        intakeQuestions: [],
        missingSlots: [],
        requirementsSummary: null,
        readinessScore: 0,
        assistantMessages: [],
        reasoningSummary: null,
        reasoningItems: [],
        reasoningPanelOpen: false,
        reasoningView: "summary",
        intakeAnswerPendingQuestionId: null,
    };
}

function clearedSearchRunState(): Partial<SearchPageState> {
    return {
        searchSessionId: null,
        checkpointId: null,
        popupModel: emptyPopupModel(),
        confirmedPopupModel: null,
        desktopFiltersOpen: false,
        popupDirty: false,
        mobileFiltersOpen: false,
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
        viewState: "idle",
    };
}

function searchStateReducer(state: SearchPageState, action: SearchPageAction): SearchPageState {
    switch (action.type) {
        case "hydrate":
        case "session_hydrated_with_intake":
            {
                const restoredViewState =
                    action.payload.viewState === "parsing"
                    || action.payload.viewState === "intake_generating"
                    || action.payload.viewState === "searching"
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
        case "source_mode_changed":
            if (action.sourceType === state.sourceType) {
                return state;
            }
            return {
                ...state,
                ...clearedSearchRunState(),
                sourceType: action.sourceType,
                ...(action.sourceType === "prompt"
                    ? clearedIntakeState()
                    : { ...clearedIntakeArtifactsState(), intakeDrawerOpen: true }),
                error: "",
            };
        case "intake_start_pending":
            return {
                ...state,
                ...clearedSearchRunState(),
                ...clearedIntakeArtifactsState(),
                desktopFiltersOpen: state.desktopFiltersOpen,
                mobileFiltersOpen: state.mobileFiltersOpen,
                error: "",
                intakeStatus: "generating",
                intakeDrawerOpen: true,
                intakeAnswerPendingQuestionId: null,
                viewState: "intake_generating",
            };
        case "intake_response_applied":
            return {
                ...state,
                ...stateFromIntakeResponse(action.payload),
            };
        case "intake_answer_pending":
            return {
                ...state,
                error: "",
                intakeAnswerPendingQuestionId: action.questionId,
            };
        case "intake_failed":
            return {
                ...state,
                error: action.message,
                intakeStatus: "failed",
                intakeAnswerPendingQuestionId: null,
                viewState: state.pagesByNumber[1]?.length ? "results" : "idle",
            };
        case "reasoning_view_changed":
            return {
                ...state,
                reasoningPanelOpen: true,
                reasoningView: action.view,
            };
        case "parse_success":
            return {
                ...state,
                sourceType: "prompt",
                ...clearedIntakeState(),
                searchSessionId: action.payload.searchSessionId,
                checkpointId: action.payload.checkpointId,
                popupModel: action.payload.popupModel,
                confirmedPopupModel: null,
                popupDirty: false,
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
                viewState: action.payload.diagnosis ? "diagnosis" : "results",
                intakeStatus: state.sourceType === "prompt" ? state.intakeStatus : "executed",
                intakeDrawerOpen: state.sourceType === "prompt" ? state.intakeDrawerOpen : false,
                confirmedPopupModel: action.confirmedIntent ?? state.popupModel,
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

function getSearchPromptForRun(query: string, model: PopupIntentModel): string {
    const trimmedQuery = query.trim();
    if (trimmedQuery) return trimmedQuery;
    if (countActiveFilters(model) > 0) return "Candidates matching selected filters";
    return "";
}

const JOB_FIELDS_WITHOUT_SUGGESTIONS = new Set([
    "job.current_title_keywords",
    "job.departments",
    "job.management_levels",
]);

function getFieldPlaceholder(): string {
    return "";
}

function TagInput({
    label,
    placeholder,
    tags,
    suggestions,
    onChange,
}: {
    label: string;
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
        <Box className={styles.tagInputRoot}>
            <Box className={styles.tagList}>
                {tags.map((tag) => (
                    <Badge key={tag} variant="soft" color="amber" className={styles.tagBadge}>
                        <span className={styles.tagBadgeText}>{tag}</span>
                        <Cross2Icon
                            width={10}
                            height={10}
                            className={styles.tagRemoveIcon}
                            onClick={() => onChange(tags.filter((item) => item !== tag))}
                        />
                    </Badge>
                ))}
            </Box>
            <TextField.Root
                className={styles.tagInputField}
                aria-label={label}
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
                <Box className={styles.optionGrid}>
                    {visibleSuggestions.map((suggestion) => (
                        <Button
                            key={suggestion}
                            size="1"
                            variant="soft"
                            className={styles.suggestionButton}
                            onClick={() => onChange([...tags, suggestion])}
                        >
                            {suggestion}
                        </Button>
                    ))}
                </Box>
            )}
        </Box>
    );
}

function NumberInput({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string;
    value: number | null;
    placeholder: string;
    onChange: (next: number | null) => void;
}) {
    return (
        <TextField.Root
            aria-label={label}
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
        <Flex wrap="wrap" className={styles.toggleRow}>
            <Button
                size="1"
                variant={value === null ? "solid" : "soft"}
                className={`${styles.choiceButton} ${value === null ? styles.choiceButtonActive : ""}`}
                onClick={() => onChange(null)}
            >
                Any
            </Button>
            <Button
                size="1"
                variant={value === true ? "solid" : "soft"}
                className={`${styles.choiceButton} ${value === true ? styles.choiceButtonActive : ""}`}
                onClick={() => onChange(true)}
            >
                Yes
            </Button>
            <Button
                size="1"
                variant={value === false ? "solid" : "soft"}
                className={`${styles.choiceButton} ${value === false ? styles.choiceButtonActive : ""}`}
                onClick={() => onChange(false)}
            >
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
        <Box className={styles.optionGrid}>
            {options.map((option) => {
                const active = selected.includes(option);
                return (
                    <Button
                        key={option}
                        size="1"
                        variant={active ? "solid" : "soft"}
                        className={`${styles.optionButton} ${active ? styles.optionButtonActive : ""}`}
                        onClick={() => onChange(active ? selected.filter((item) => item !== option) : [...selected, option])}
                    >
                        {option}
                    </Button>
                );
            })}
        </Box>
    );
}

function buildServerSessionHydrationState(
    session: SearchSessionPayload,
): { stage: SessionResumeStage; payload: Partial<SearchPageState> } {
    const popup = (session.popup_model as unknown as PopupIntentModel | null) || emptyPopupModel();
    const latest = session.latest_page;
    const sourceType = session.source_type ?? "prompt";
    const intakeStatus = session.intake_status ?? "draft";
    const patch: Partial<SearchPageState> = {
        query: session.prompt || "",
        sourceType,
        jobDescription: session.job_description ?? "",
        roleTitle: session.role_title ?? "",
        intakeStatus,
        intakeDrawerOpen: sourceType !== "prompt",
        intakeQuestions: session.clarification_questions ?? [],
        missingSlots: session.missing_slots ?? [],
        requirementsSummary: session.requirements_summary ?? null,
        readinessScore: session.readiness_score ?? 0,
        assistantMessages: session.assistant_messages ?? [],
        reasoningSummary: session.reasoning_summary ?? null,
        reasoningItems: session.reasoning_items ?? [],
        reasoningPanelOpen: Boolean(session.reasoning_summary || session.reasoning_items?.length),
        reasoningView: "summary",
        intakeAnswerPendingQuestionId: null,
        searchSessionId: session.session_id,
        checkpointId: session.session_id,
        popupModel: popup,
        confirmedPopupModel: latest && Array.isArray(latest.results) ? popup : null,
        needsFreshSession: false,
        previewCap: 100,
        error: "",
        diagnosis: null,
        diagnosisType: null,
        rootCause: null,
        suggestions: [],
        activeCandidateId: null,
        paginatingPage: null,
    };
    if (latest && Array.isArray(latest.results)) {
        patch.pagesByNumber = { [latest.page]: latest.results as SearchResultItem[] };
        patch.currentPage = latest.page;
        patch.totalPages = latest.total_pages;
        patch.totalResults = latest.total_results;
        patch.previewTotalResults = latest.preview_total_results;
        patch.queryHash = latest.query_hash ?? session.normalized_query_hash;
        patch.viewState = "results";
        return { stage: "results", payload: patch };
    }

    if (session.mode === "langgraph") {
        patch.pagesByNumber = {};
        patch.currentPage = 1;
        patch.totalPages = 1;
        patch.totalResults = null;
        patch.previewTotalResults = null;
        patch.queryHash = null;
        patch.viewState = sourceType === "prompt" ? "review" : viewStateForIntakeStatus(intakeStatus);
        if (patch.viewState === "idle" && sourceType !== "prompt") {
            patch.viewState = "review";
        }
        return { stage: "review", payload: patch };
    }

    patch.viewState = "idle";
    return { stage: "idle", payload: patch };
}

function buildBootstrapHydrationState(bootstrap: SearchPageBootstrapPayload): Partial<SearchPageState> {
    const sourceType = bootstrap.sourceType ?? "prompt";
    return {
        query: bootstrap.prompt || "",
        sourceType,
        jobDescription: bootstrap.jobDescription ?? "",
        roleTitle: bootstrap.roleTitle ?? "",
        intakeStatus: sourceType === "prompt" ? "draft" : "ready_for_review",
        intakeDrawerOpen: sourceType !== "prompt",
        intakeQuestions: [],
        missingSlots: [],
        requirementsSummary: bootstrap.requirementsSummary ?? null,
        readinessScore: 0,
        assistantMessages: [],
        reasoningSummary: bootstrap.reasoningSummary ?? null,
        reasoningItems: [],
        reasoningPanelOpen: Boolean(bootstrap.reasoningSummary),
        reasoningView: "summary",
        intakeAnswerPendingQuestionId: null,
        searchSessionId: bootstrap.searchSessionId,
        checkpointId: bootstrap.searchSessionId,
        popupModel: (bootstrap.popupModel as PopupIntentModel | null) || emptyPopupModel(),
        confirmedPopupModel: null,
        popupDirty: false,
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
        error: "",
        viewState: "review",
    };
}

function sessionUnavailableMessage(): string {
    return "This search session is no longer available. Start a new search or rerun the saved search.";
}

function isDesktopViewport(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return true;
    }
    return window.matchMedia("(min-width: 769px)").matches;
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

const MAX_CANDIDATE_MATCH_RATIONALES = 6;

type PreviewEvidenceSource = {
    label: string;
    value: string | null | undefined;
};

function normalizedMatchText(value: string | null | undefined): string {
    return (value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function cleanCriteria(values: Array<string | null | undefined>): string[] {
    const seen = new Set<string>();
    const criteria: string[] = [];
    values.forEach((value) => {
        const trimmed = (value ?? "").trim();
        const key = trimmed.toLowerCase();
        if (!trimmed || seen.has(key)) return;
        seen.add(key);
        criteria.push(trimmed);
    });
    return criteria;
}

function findPreviewEvidence(
    criteria: string[],
    sources: PreviewEvidenceSource[],
): { criterion: string; evidence: string } | null {
    for (const criterion of criteria) {
        const normalizedCriterion = normalizedMatchText(criterion);
        if (!normalizedCriterion) continue;
        for (const source of sources) {
            const normalizedSource = normalizedMatchText(source.value);
            if (normalizedSource && normalizedSource.includes(normalizedCriterion)) {
                return {
                    criterion,
                    evidence: `${source.label}: ${source.value}`,
                };
            }
        }
    }
    return null;
}

function pushCandidateRationale(
    rationales: CandidateMatchRationale[],
    next: CandidateMatchRationale,
): void {
    if (rationales.length >= MAX_CANDIDATE_MATCH_RATIONALES) return;
    const duplicate = rationales.some(
        (item) => item.title === next.title && item.criterion === next.criterion && item.evidence === next.evidence,
    );
    if (!duplicate) {
        rationales.push(next);
    }
}

function pushMissingPreviewEvidence(
    rationales: CandidateMatchRationale[],
    title: string,
    criterion: string,
): void {
    pushCandidateRationale(rationales, {
        title,
        criterion,
        evidence: MISSING_PREVIEW_EVIDENCE,
        confidence: "low",
    });
}

function buildCandidateMatchRationales(
    model: PopupIntentModel | null,
    preview: PreviewData | null,
): CandidateMatchRationale[] {
    if (!model || !preview) return [];

    const rationales: CandidateMatchRationale[] = [];
    const generalFilters = model.general ?? emptyPopupModel().general;
    const titleCriteria = cleanCriteria(model.job?.current_title_keywords ?? []);
    const titleMatch = findPreviewEvidence(titleCriteria, [
        { label: "Current title", value: preview.job_title },
        { label: "Headline", value: preview.headline },
    ]);
    if (titleMatch) {
        pushCandidateRationale(rationales, {
            title: "Current title matched",
            criterion: `Title: ${titleMatch.criterion}`,
            evidence: titleMatch.evidence,
            confidence: titleMatch.evidence.startsWith("Current title") ? "high" : "medium",
        });
    } else if (titleCriteria.length > 0 && !preview.job_title && !preview.headline) {
        pushMissingPreviewEvidence(rationales, "Title evidence unavailable", `Title: ${titleCriteria.join(", ")}`);
    }

    const skillCriteria = cleanCriteria(model.keywords?.skills ?? []);
    const skillMatch = findPreviewEvidence(skillCriteria, [
        { label: "Headline", value: preview.headline },
        { label: "Current title", value: preview.job_title },
    ]);
    if (skillMatch) {
        pushCandidateRationale(rationales, {
            title: "Skill evidence in preview",
            criterion: `Skill: ${skillMatch.criterion}`,
            evidence: skillMatch.evidence,
            confidence: "medium",
        });
    } else if (skillCriteria.length > 0) {
        pushMissingPreviewEvidence(rationales, "Skill evidence unavailable", `Skills: ${skillCriteria.join(", ")}`);
    }

    const locationCriteria = cleanCriteria([
        ...(model.locations?.cities ?? []),
        ...(model.locations?.states ?? []),
        ...(model.locations?.countries ?? []),
    ]);
    const locationMatch = findPreviewEvidence(locationCriteria, [
        { label: "Location", value: preview.location_full },
        { label: "Country", value: preview.location_country },
    ]);
    if (locationMatch) {
        pushCandidateRationale(rationales, {
            title: "Location matched",
            criterion: `Location: ${locationMatch.criterion}`,
            evidence: locationMatch.evidence,
            confidence: "high",
        });
    } else if (locationCriteria.length > 0 && !preview.location_full && !preview.location_country) {
        pushMissingPreviewEvidence(rationales, "Location evidence unavailable", `Location: ${locationCriteria.join(", ")}`);
    }

    const currentCompanyCriteria = cleanCriteria(model.company?.current_company_names ?? []);
    const currentCompanyMatch = findPreviewEvidence(currentCompanyCriteria, [
        { label: "Current company", value: preview.company_name },
    ]);
    if (currentCompanyMatch) {
        pushCandidateRationale(rationales, {
            title: "Current company matched",
            criterion: `Company: ${currentCompanyMatch.criterion}`,
            evidence: currentCompanyMatch.evidence,
            confidence: "high",
        });
    }

    const backgroundCompanyCriteria = cleanCriteria([
        ...(model.company?.past_company_names ?? []),
        ...(model.company?.optional_company_names ?? []),
    ]);
    const backgroundCompanyMatch = findPreviewEvidence(backgroundCompanyCriteria, [
        { label: "Current company", value: preview.company_name },
    ]);
    if (backgroundCompanyMatch) {
        pushCandidateRationale(rationales, {
            title: "Company background evidence in preview",
            criterion: `Company background: ${backgroundCompanyMatch.criterion}`,
            evidence: backgroundCompanyMatch.evidence,
            confidence: "medium",
        });
    } else if (backgroundCompanyCriteria.length > 0) {
        pushMissingPreviewEvidence(
            rationales,
            "Company background evidence unavailable",
            `Company background: ${backgroundCompanyCriteria.join(", ")}`,
        );
    }

    const industryCriteria = cleanCriteria([
        ...(model.company?.industries ?? []),
        ...(model.company?.optional_industries ?? []),
    ]);
    const industryMatch = findPreviewEvidence(industryCriteria, [
        { label: "Company industry", value: preview.company_industry },
    ]);
    if (industryMatch) {
        pushCandidateRationale(rationales, {
            title: "Industry matched",
            criterion: `Industry: ${industryMatch.criterion}`,
            evidence: industryMatch.evidence,
            confidence: "high",
        });
    } else if (industryCriteria.length > 0 && !preview.company_industry) {
        pushMissingPreviewEvidence(rationales, "Industry evidence unavailable", `Industry: ${industryCriteria.join(", ")}`);
    }

    const departmentCriteria = cleanCriteria(model.job?.departments ?? []);
    const departmentMatch = findPreviewEvidence(departmentCriteria, [
        { label: "Department", value: preview.department },
    ]);
    if (departmentMatch) {
        pushCandidateRationale(rationales, {
            title: "Department matched",
            criterion: `Department: ${departmentMatch.criterion}`,
            evidence: departmentMatch.evidence,
            confidence: "high",
        });
    } else if (departmentCriteria.length > 0 && !preview.department) {
        pushMissingPreviewEvidence(rationales, "Department evidence unavailable", `Department: ${departmentCriteria.join(", ")}`);
    }

    const managementCriteria = cleanCriteria(model.job?.management_levels ?? []);
    const managementMatch = findPreviewEvidence(managementCriteria, [
        { label: "Management level", value: preview.management_level },
    ]);
    if (managementMatch) {
        pushCandidateRationale(rationales, {
            title: "Management level matched",
            criterion: `Management level: ${managementMatch.criterion}`,
            evidence: managementMatch.evidence,
            confidence: "high",
        });
    } else if (managementCriteria.length > 0 && !preview.management_level) {
        pushMissingPreviewEvidence(
            rationales,
            "Management level evidence unavailable",
            `Management level: ${managementCriteria.join(", ")}`,
        );
    }

    if (generalFilters.min_experience_months !== null || generalFilters.max_experience_months !== null) {
        const minYears = generalFilters.min_experience_months !== null
            ? `${Math.round(generalFilters.min_experience_months / 12)}+ years`
            : null;
        const maxYears = generalFilters.max_experience_months !== null
            ? `up to ${Math.round(generalFilters.max_experience_months / 12)} years`
            : null;
        pushMissingPreviewEvidence(
            rationales,
            "Experience evidence unavailable",
            `Experience: ${cleanCriteria([minYears, maxYears]).join(", ")}`,
        );
    }

    const educationCriteria = cleanCriteria([
        ...(model.education?.institution_names ?? []),
        ...(model.education?.degree_keywords ?? []),
    ]);
    if (educationCriteria.length > 0) {
        pushMissingPreviewEvidence(rationales, "Education evidence unavailable", `Education: ${educationCriteria.join(", ")}`);
    }

    const certificationCriteria = cleanCriteria([
        ...(model.certifications?.title_keywords ?? []),
        ...(model.certifications?.issuers ?? []),
    ]);
    if (certificationCriteria.length > 0) {
        pushMissingPreviewEvidence(
            rationales,
            "Certification evidence unavailable",
            `Certification: ${certificationCriteria.join(", ")}`,
        );
    }

    const languageCriteria = cleanCriteria((model.languages ?? []).map((item) => item.language));
    if (languageCriteria.length > 0) {
        pushMissingPreviewEvidence(rationales, "Language evidence unavailable", `Language: ${languageCriteria.join(", ")}`);
    }

    const companySizeCriteria = cleanCriteria([
        ...(model.company?.company_size_ranges ?? []),
        ...(model.company?.optional_company_size_ranges ?? []),
    ]);
    if (companySizeCriteria.length > 0) {
        pushMissingPreviewEvidence(
            rationales,
            "Company size evidence unavailable",
            `Company size: ${companySizeCriteria.join(", ")}`,
        );
    }

    const hqCriteria = cleanCriteria([
        ...(model.company?.company_hq_countries ?? []),
        ...(model.company?.optional_company_hq_countries ?? []),
    ]);
    if (hqCriteria.length > 0) {
        pushMissingPreviewEvidence(rationales, "Company HQ evidence unavailable", `Company HQ: ${hqCriteria.join(", ")}`);
    }

    if (preview.score !== null && rationales.length > 0 && rationales.length < MAX_CANDIDATE_MATCH_RATIONALES) {
        pushCandidateRationale(rationales, {
            title: "Preview score returned",
            criterion: "Coresignal preview score",
            evidence: `Preview score returned: ${preview.score.toFixed(2)}. This is not a full fit score.`,
            confidence: "low",
        });
    }

    return rationales;
}

function notifyCreditsChanged() {
    clearAnalyticsCache();
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tahoe:credits-updated"));
    }
}

export default function LangGraphSearchPage({ bootstrap }: LangGraphSearchPageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const sessionFromUrl = searchParams?.get("session") ?? null;
    const [state, dispatch] = useReducer(searchStateReducer, undefined, initialSearchState);
    const [metadata, setMetadata] = useState<FilterMetadata | null>(null);
    const [activeSection, setActiveSection] = useState("general");
    const [hydrated, setHydrated] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [popupSearchPending, setPopupSearchPending] = useState(false);
    const [desktopLayout, setDesktopLayout] = useState(() => isDesktopViewport());
    const sessionUrlConsumedRef = useRef<string | null>(null);
    const bootstrapAppliedRef = useRef<string | null>(null);
    const previousQueryHashRef = useRef<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    const popupModel = state.popupModel;
    const currentResults = useMemo(
        () => state.pagesByNumber[state.currentPage] ?? [],
        [state.currentPage, state.pagesByNumber],
    );
    const allLoadedRows = useMemo(
        () => Object.values(state.pagesByNumber).flat(),
        [state.pagesByNumber],
    );
    const activeCandidate = useMemo<PreviewData | null>(() => {
        if (state.activeCandidateId == null) return null;
        const row = allLoadedRows.find((item) => item.id === state.activeCandidateId);
        return row ? toPreviewData(row) : null;
    }, [allLoadedRows, state.activeCandidateId]);
    const activeCandidateMatchRationales = useMemo(
        () => buildCandidateMatchRationales(state.confirmedPopupModel, activeCandidate),
        [activeCandidate, state.confirmedPopupModel],
    );
    const hasResumeEligibleResults = state.viewState === "results" || state.viewState === "diagnosis";

    const clearSessionParam = useCallback(() => {
        if (!sessionFromUrl) return;
        const params = new URLSearchParams(searchParams?.toString() || "");
        if (!params.has("session")) return;
        params.delete("session");
        const target = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(target);
    }, [pathname, router, searchParams, sessionFromUrl]);

    const closeMobileSheet = useCallback(() => {
        dispatch({ type: "patch", payload: { mobileFiltersOpen: false } });
    }, []);

    const closeDesktopDialog = useCallback(() => {
        dispatch({ type: "patch", payload: { desktopFiltersOpen: false } });
    }, []);

    const openFilterSurface = useCallback(() => {
        if (isDesktopViewport()) {
            dispatch({
                type: "patch",
                payload: {
                    desktopFiltersOpen: true,
                    mobileFiltersOpen: false,
                },
            });
            return;
        }
        dispatch({
            type: "patch",
            payload: {
                desktopFiltersOpen: false,
                mobileFiltersOpen: true,
            },
        });
    }, []);

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
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
        const mediaQuery = window.matchMedia("(min-width: 769px)");
        const updateLayout = () => setDesktopLayout(mediaQuery.matches);
        updateLayout();
        mediaQuery.addEventListener?.("change", updateLayout);
        return () => {
            mediaQuery.removeEventListener?.("change", updateLayout);
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") {
            setHydrated(true);
            return;
        }

        if (bootstrap?.mode === "langgraph") {
            if (bootstrapAppliedRef.current !== bootstrap.searchSessionId) {
                bootstrapAppliedRef.current = bootstrap.searchSessionId;
                dispatch({
                    type: "hydrate",
                    payload: sanitizePersistedState(buildBootstrapHydrationState(bootstrap)),
                });
                openFilterSurface();
            }
            setHydrated(true);
            return;
        }

        if (sessionFromUrl) {
            setHydrated(true);
            return;
        }

        setHydrated(true);
    }, [bootstrap, openFilterSurface, sessionFromUrl]);

    useEffect(() => {
        if (!hydrated || !sessionFromUrl) return;

        const locallyOwnedSession =
            sessionFromUrl === state.searchSessionId
            && (state.viewState === "review" || hasResumeEligibleResults);
        if (locallyOwnedSession || sessionUrlConsumedRef.current === sessionFromUrl) {
            return;
        }

        sessionUrlConsumedRef.current = sessionFromUrl;
        (async () => {
            try {
                const session = await getSearchSession(sessionFromUrl);
                const hydration = buildServerSessionHydrationState(session);
                dispatch({
                    type: hydration.payload.sourceType && hydration.payload.sourceType !== "prompt"
                        ? "session_hydrated_with_intake"
                        : "hydrate",
                    payload: sanitizePersistedState(hydration.payload),
                });
                if (hydration.stage !== "results") {
                    openFilterSurface();
                    clearSessionParam();
                } else {
                    dispatch({
                        type: "patch",
                        payload: {
                            desktopFiltersOpen: false,
                            mobileFiltersOpen: false,
                        },
                    });
                }
            } catch (error) {
                console.warn("Failed to hydrate from search session URL", error);
                dispatch({
                    type: "patch",
                    payload: {
                        error: sessionUnavailableMessage(),
                        viewState: "idle",
                    },
                });
                clearSessionParam();
            }
        })();
    }, [
        clearSessionParam,
        hasResumeEligibleResults,
        hydrated,
        openFilterSurface,
        sessionFromUrl,
        state.searchSessionId,
        state.viewState,
    ]);

    useEffect(() => {
        if (!hydrated || !state.searchSessionId || typeof window === "undefined") return;
        if (!hasResumeEligibleResults) return;
        if (state.searchSessionId === sessionFromUrl) return;
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set("session", state.searchSessionId);
        const target = `${pathname}?${params.toString()}`;
        router.replace(target);
    }, [hasResumeEligibleResults, hydrated, state.searchSessionId, sessionFromUrl, pathname, searchParams, router]);

    useEffect(() => {
        if (!hydrated || typeof window === "undefined") return;
        if (hasResumeEligibleResults || state.viewState === "review") {
            window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(sanitizePersistedState(state)));
            return;
        }
        window.sessionStorage.removeItem(SESSION_KEY);
    }, [hasResumeEligibleResults, hydrated, state]);

    useEffect(() => {
        if (previousQueryHashRef.current === state.queryHash) return;
        previousQueryHashRef.current = state.queryHash;
        setSelectedIds(new Set());
    }, [state.queryHash]);

    const activeFilterCount = useMemo(() => countActiveFilters(popupModel), [popupModel]);
    const selectedRows = useMemo(
        () => Object.entries(state.pagesByNumber).flatMap(([page, rows]) =>
            rows
                .filter((row) => selectedIds.has(row.id))
                .map((row) => ({ row, page: Number(page) })),
        ),
        [state.pagesByNumber, selectedIds],
    );
    const selectedImportPayload = useMemo(
        () => selectedRows.map(({ row, page }) => previewCandidateToImportPayload(row, {
            queryHash: state.queryHash,
            searchPrompt: state.query,
            previewPage: page,
            pipeline: "langgraph_search",
            searchedAt: new Date().toISOString(),
        })),
        [selectedRows, state.query, state.queryHash],
    );

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

    async function handleGenerateSearchPlan() {
        const trimmedPrompt = state.query.trim();
        const trimmedJd = state.jobDescription.trim();
        const trimmedRoleTitle = state.roleTitle.trim();
        if (state.sourceType === "prompt") return;
        if (!trimmedJd) return;

        try {
            dispatch({ type: "intake_start_pending" });
            const response = await startSearchIntake({
                source_type: state.sourceType,
                search_prompt: trimmedPrompt || null,
                job_description: trimmedJd,
                role_title: trimmedRoleTitle || null,
            });
            dispatch({ type: "intake_response_applied", payload: response });
        } catch (err: unknown) {
            dispatch({
                type: "intake_failed",
                message: err instanceof Error ? err.message : "Unable to generate the search plan.",
            });
        }
    }

    async function handleAnswerIntakeQuestion(question: SearchIntakeQuestion, answer: unknown) {
        if (!state.searchSessionId) return;
        try {
            dispatch({ type: "intake_answer_pending", questionId: question.id });
            const response = await answerSearchIntake(state.searchSessionId, {
                question_id: question.id,
                answer,
            });
            dispatch({ type: "intake_response_applied", payload: response });
        } catch (err: unknown) {
            dispatch({
                type: "intake_failed",
                message: err instanceof Error ? err.message : "Unable to apply the answer.",
            });
        }
    }

    function handleUseDefaultAnswer(question: SearchIntakeQuestion) {
        const option =
            question.default_option_index !== null && question.default_option_index >= 0
                ? question.options[question.default_option_index]
                : null;
        void handleAnswerIntakeQuestion(question, option ?? { label: "Use defaults", use_default: true });
    }

    function handleSkipQuestion(question: SearchIntakeQuestion) {
        void handleAnswerIntakeQuestion(question, { label: "Skip", skip: true });
    }

    /**
     * Single recruiter action: "Find candidates".
     * Always anchor a fresh session via /search/parse, then resume the
     * await_human_review interrupt via /search/execute. Filter-editor edits win:
     * if popupDirty, the user's popupModel is what gets sent as confirmed_intent
     * (parse just establishes the session). Otherwise the parse's popup_model
     * replaces the current filter-editor state so the recruiter sees what their
     * prompt produced.
     */
    async function runFindCandidates({
        closeDesktopOnSuccess = false,
        launchedFromPopup = false,
    }: {
        closeDesktopOnSuccess?: boolean;
        launchedFromPopup?: boolean;
    } = {}) {
        const searchPromptForRun = getSearchPromptForRun(state.query, popupModel);
        const hasFilters = countActiveFilters(popupModel) > 0;
        if (!searchPromptForRun && !hasFilters) return false;
        if (launchedFromPopup) {
            setPopupSearchPending(true);
        }
        try {
            setSelectedIds(new Set());
            dispatch({ type: "patch", payload: { error: "", viewState: "searching" } });

            if (state.sourceType !== "prompt") {
                const sessionId = state.searchSessionId;
                const checkpointId = state.checkpointId ?? sessionId;
                if (!sessionId || !checkpointId) {
                    dispatch({
                        type: "patch",
                        payload: {
                            error: "Generate a search plan before running a JD-derived search.",
                            viewState: state.intakeQuestions.length > 0 ? "intake_clarifying" : "review",
                        },
                    });
                    return false;
                }

                const executeResponse = await apiRequest<ExecuteResponse>("/search/execute", {
                    method: "POST",
                    body: {
                        search_session_id: sessionId,
                        checkpoint_id: checkpointId,
                        confirmed_intent: popupModel,
                    },
                });
                dispatch({ type: "execute_success", payload: executeResponse, confirmedIntent: popupModel });
                notifyCreditsChanged();
                dispatch({
                    type: "patch",
                    payload: {
                        popupDirty: false,
                        mobileFiltersOpen: false,
                        ...(closeDesktopOnSuccess ? { desktopFiltersOpen: false } : {}),
                    },
                });
                return true;
            }

            const wasDirty = state.popupDirty;
            const preEditPopupModel = popupModel;

            const parseResponse = await apiRequest<ParseResponse>("/search/parse", {
                method: "POST",
                body: { search_prompt: searchPromptForRun },
            });

            // If the recruiter has manual edits, keep them. Otherwise, use the
            // parse's popup_model as the new filter-editor state.
            const intentForExecute = wasDirty
                ? preEditPopupModel
                : (parseResponse.popup_model ?? emptyPopupModel());

            dispatch({
                type: "patch",
                payload: {
                    searchSessionId: parseResponse.search_session_id,
                    checkpointId: parseResponse.checkpoint_id,
                    needsFreshSession: false,
                    popupModel: intentForExecute,
                    popupDirty: wasDirty,
                    error: "",
                },
            });

            const executeResponse = await apiRequest<ExecuteResponse>("/search/execute", {
                method: "POST",
                body: {
                    search_session_id: parseResponse.search_session_id,
                    checkpoint_id: parseResponse.checkpoint_id,
                    confirmed_intent: intentForExecute,
                },
            });
            dispatch({ type: "execute_success", payload: executeResponse, confirmedIntent: intentForExecute });
            notifyCreditsChanged();
            // Keep the filter editor aligned to the recruiter's now-effective state.
            dispatch({
                type: "patch",
                payload: {
                    popupDirty: false,
                    mobileFiltersOpen: false,
                    ...(closeDesktopOnSuccess ? { desktopFiltersOpen: false } : {}),
                },
            });
            return true;
        } catch (err: unknown) {
            dispatch({
                type: "patch",
                payload: {
                    error: err instanceof Error ? err.message : "Unable to run recruiter search.",
                    viewState: currentResults.length > 0 ? "results" : "idle",
                    paginatingPage: null,
                },
            });
            return false;
        } finally {
            if (launchedFromPopup) {
                setPopupSearchPending(false);
            }
        }
    }

    async function handleFindCandidates(event?: { preventDefault(): void }) {
        event?.preventDefault();
        await runFindCandidates();
    }

    async function handlePopupFindCandidates() {
        await runFindCandidates({ closeDesktopOnSuccess: true, launchedFromPopup: true });
    }

    /** Re-fire /search/parse with the current prompt and replace filter-editor
     * filters with the response. Does NOT execute. Resets popupDirty=false. */
    async function handleMatchPrompt() {
        const trimmedQuery = state.query.trim();
        if (!trimmedQuery) return;
        try {
            await parseQuery(trimmedQuery);
        } catch (err: unknown) {
            dispatch({
                type: "patch",
                payload: {
                    error: err instanceof Error ? err.message : "Unable to parse search.",
                },
            });
        }
    }

    /** Clear all recruiter filters. Does NOT execute. Resets popupDirty=false. */
    function handleResetFilters() {
        dispatch({
            type: "patch",
            payload: { popupModel: emptyPopupModel(), popupDirty: false },
        });
    }

    function updatePopup(mutator: (draft: PopupIntentModel) => void) {
        const next = JSON.parse(JSON.stringify(popupModel)) as PopupIntentModel;
        mutator(next);
        dispatch({ type: "patch", payload: { popupModel: next, popupDirty: true } });
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
            notifyCreditsChanged();
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

    function handleStartNewSearch() {
        const freshState = initialSearchState();
        try {
            window.sessionStorage.removeItem(SESSION_KEY);
            window.sessionStorage.removeItem("search_page_state");
        } catch {
            // Ignore storage failures.
        }
        setSelectedIds(new Set());
        setSaveDialogOpen(false);
        setPopupSearchPending(false);
        sessionUrlConsumedRef.current = sessionFromUrl ?? state.searchSessionId;
        bootstrapAppliedRef.current = null;
        dispatch({ type: "hydrate", payload: freshState });
        router.replace("/dashboard/search/new");
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    function openSavedList(listId: string, options?: { enrich?: boolean }) {
        router.push(`/dashboard/projects/lists/${listId}${options?.enrich ? "?enrich=1" : ""}`);
    }

    function renderField(field: FilterField) {
        const value = getNestedValue(popupModel as unknown as Record<string, unknown>, field.key);
        const placeholder = getFieldPlaceholder();

        if (field.control === "number") {
            return (
                <NumberInput
                    label={field.label}
                    placeholder={placeholder}
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
                    label={field.label}
                    placeholder={placeholder}
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
                    label={field.label}
                    placeholder={placeholder}
                    tags={Array.isArray(value) ? (value as string[]) : []}
                    suggestions={JOB_FIELDS_WITHOUT_SUGGESTIONS.has(field.key) ? [] : field.suggestions}
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
                    aria-label={field.label}
                    placeholder={placeholder}
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
                                        aria-label={`Language ${index + 1}`}
                                        placeholder=""
                                        value={entry.language}
                                        onChange={(event) => updatePopup((draft) => {
                                            draft.languages[index].language = event.target.value;
                                        })}
                                    />
                                    {field.suggestions.length > 0 && (
                                        <Box className={styles.optionGrid} mt="2">
                                            {field.suggestions
                                                .filter((suggestion) => !entry.language || suggestion.toLowerCase().includes(entry.language.toLowerCase()))
                                                .slice(0, 6)
                                                .map((suggestion) => (
                                                    <Button
                                                        key={`${suggestion}-${index}-language`}
                                                        size="1"
                                                        variant="soft"
                                                        className={styles.suggestionButton}
                                                        onClick={() => updatePopup((draft) => {
                                                            draft.languages[index].language = suggestion;
                                                        })}
                                                    >
                                                        {suggestion}
                                                    </Button>
                                                ))}
                                        </Box>
                                    )}
                                </Box>
                                <Box style={{ flex: 1 }}>
                                    <TextField.Root
                                        aria-label={`Proficiency ${index + 1}`}
                                        placeholder=""
                                        value={entry.proficiency ?? ""}
                                        onChange={(event) => updatePopup((draft) => {
                                            draft.languages[index].proficiency = event.target.value
                                                ? event.target.value as LanguageProficiency
                                                : null;
                                        })}
                                    />
                                    {field.options.length > 0 && (
                                        <Box className={styles.optionGrid} mt="2">
                                            {field.options
                                                .filter((option) => !entry.proficiency || option.toLowerCase().includes(entry.proficiency.toLowerCase()))
                                                .slice(0, 5)
                                                .map((option) => (
                                                    <Button
                                                        key={`${option}-${index}-proficiency`}
                                                        size="1"
                                                        variant="soft"
                                                        className={styles.optionButton}
                                                        onClick={() => updatePopup((draft) => {
                                                            draft.languages[index].proficiency = option as LanguageProficiency;
                                                        })}
                                                    >
                                                        {option}
                                                    </Button>
                                                ))}
                                        </Box>
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
    const isJdMode = state.sourceType !== "prompt";
    const showPromptInput = state.sourceType !== "job_description";
    const canGenerateSearchPlan = isJdMode && Boolean(state.jobDescription.trim());
    const showPreviewCapBanner =
        state.totalResults != null && state.previewTotalResults != null && state.totalResults > 0;
    const showStartNewSearch =
        state.viewState !== "idle"
        || Boolean(state.searchSessionId)
        || Boolean(state.queryHash)
        || Object.keys(state.pagesByNumber).length > 0;
    const hasResultView = state.viewState === "results" || state.viewState === "diagnosis";

    const findButtonDisabled =
        state.viewState === "parsing" ||
        state.viewState === "intake_generating" ||
        state.viewState === "searching" ||
        (isJdMode
            ? (!state.searchSessionId || countActiveFilters(popupModel) === 0)
            : (!state.query.trim() && countActiveFilters(popupModel) === 0));
    const canFindCandidates = !findButtonDisabled;
    const isBusy =
        state.viewState === "parsing"
        || state.viewState === "intake_generating"
        || state.viewState === "searching";
    const showAssistantSurface = isJdMode && state.intakeDrawerOpen && !activeCandidate;
    const assistantSurfaceProps = {
        status: state.intakeStatus,
        summary: state.requirementsSummary,
        roleTitle: state.roleTitle,
        questions: state.intakeQuestions,
        missingSlots: state.missingSlots,
        readinessScore: state.readinessScore,
        reasoningSummary: state.reasoningSummary,
        reasoningItems: state.reasoningItems,
        reasoningView: state.reasoningView,
        pendingQuestionId: state.intakeAnswerPendingQuestionId,
        isBusy,
        canGeneratePlan: canGenerateSearchPlan,
        canFindCandidates,
        onGeneratePlan: () => void handleGenerateSearchPlan(),
        onAnswerQuestion: (question: SearchIntakeQuestion, answer: unknown) => void handleAnswerIntakeQuestion(question, answer),
        onUseDefault: (question: SearchIntakeQuestion) => handleUseDefaultAnswer(question),
        onSkip: (question: SearchIntakeQuestion) => handleSkipQuestion(question),
        onOpenFilters: openFilterSurface,
        onFindCandidates: () => void runFindCandidates(),
        onReasoningViewChange: (view: IntakeReasoningView) => dispatch({ type: "reasoning_view_changed", view }),
        onCollapse: () => dispatch({ type: "patch", payload: { intakeDrawerOpen: false } }),
    };
    return (
        <Box className={styles.page}>
            <Box className={styles.searchBar}>
                <form onSubmit={handleFindCandidates}>
                    {isJdMode ? (
                        <div className={styles.jdInputGrid}>
                            <label className={styles.inputLabel}>
                                <span>Role title</span>
                                <TextField.Root
                                    aria-label="Role title"
                                    size="3"
                                    placeholder="Senior Backend Engineer"
                                    value={state.roleTitle}
                                    onChange={(event) => dispatch({ type: "patch", payload: { roleTitle: event.target.value } })}
                                    disabled={isBusy}
                                />
                            </label>
                            <label className={`${styles.inputLabel} ${styles.jdTextareaLabel}`}>
                                <span>Job description</span>
                                <textarea
                                    aria-label="Job description"
                                    className={styles.jdTextarea}
                                    placeholder="Paste the job description or role brief"
                                    value={state.jobDescription}
                                    onChange={(event) => dispatch({ type: "patch", payload: { jobDescription: event.target.value } })}
                                    disabled={isBusy}
                                    rows={4}
                                />
                            </label>
                        </div>
                    ) : null}
                    <Flex gap="3" align="center" wrap="wrap">
                        {showPromptInput ? (
                            <Box style={{ flexGrow: 1, minWidth: 0 }}>
                                <TextField.Root
                                    ref={searchInputRef}
                                    size="3"
                                    placeholder='Try: "Senior ML engineers in Europe with Python skills"'
                                    value={state.query}
                                    onChange={(event) => dispatch({ type: "patch", payload: { query: event.target.value } })}
                                    disabled={isBusy}
                                    aria-label="Search prompt"
                                >
                                    <TextField.Slot>
                                        <MagnifyingGlassIcon width="16" height="16" />
                                    </TextField.Slot>
                                </TextField.Root>
                            </Box>
                        ) : null}
                        {showPreviewCapBanner ? (
                            <PreviewCapBanner
                                className={styles.inlineResultsCount}
                                totalResults={state.totalResults || 0}
                                previewTotalResults={state.previewTotalResults || 0}
                                totalPages={state.totalPages}
                            />
                        ) : null}
                        <button
                            type="button"
                            className={styles.filtersButton}
                            onClick={openFilterSurface}
                            aria-haspopup="dialog"
                        >
                            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                        </button>
                        {showStartNewSearch ? (
                            <Button
                                size="3"
                                variant="soft"
                                type="button"
                                className={styles.startNewSearchButton}
                                onClick={handleStartNewSearch}
                                disabled={isBusy}
                            >
                                <Cross2Icon width="15" height="15" />
                                Start new search
                            </Button>
                        ) : null}
                        {selectedIds.size > 0 ? (
                            <Button
                                size="3"
                                className={styles.saveToListButton}
                                type="button"
                                onClick={() => setSaveDialogOpen(true)}
                            >
                                Save {selectedIds.size} to list
                            </Button>
                        ) : null}
                        {!hasResultView ? (
                            <>
                                {isJdMode ? (
                                    <Button
                                        size="3"
                                        variant="soft"
                                        className={styles.findCandidatesButton}
                                        type="button"
                                        disabled={!canGenerateSearchPlan || isBusy}
                                        onClick={() => void handleGenerateSearchPlan()}
                                    >
                                        {state.viewState === "intake_generating" ? <Spinner /> : "Generate search plan"}
                                    </Button>
                                ) : null}
                                <Button
                                    size="3"
                                    className={styles.findCandidatesButton}
                                    type="submit"
                                    disabled={findButtonDisabled}
                                >
                                    {state.viewState === "searching" ? <Spinner /> : "Find candidates"}
                                </Button>
                            </>
                        ) : null}
                    </Flex>
                </form>
                {isJdMode && hasResultView && !state.intakeDrawerOpen ? (
                    <SearchBriefSummary
                        summary={state.requirementsSummary}
                        roleTitle={state.roleTitle}
                        missingSlots={state.missingSlots}
                        readinessScore={state.readinessScore}
                        compact
                        onOpen={() => dispatch({ type: "patch", payload: { intakeDrawerOpen: true } })}
                    />
                ) : null}
                <div className={styles.workflowRail} aria-label="Recruiter workflow">
                    <span>Search</span>
                    <span>Review filters</span>
                    <span>Results</span>
                    <span>Save to list</span>
                    <span>Enrich</span>
                    <span>Campaign</span>
                </div>
            </Box>

            {state.error && (
                <Box px="4" py="3">
                    <Callout.Root color="red">
                        <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                        <Callout.Text>{state.error}</Callout.Text>
                    </Callout.Root>
                </Box>
            )}

            <Box className={styles.shellGrid}>
                <Box className={styles.resultsArea} style={{ position: "relative" }}>
                    {(state.viewState === "idle" || state.viewState === "review" || state.viewState === "intake_clarifying") && (
                        <Flex direction="column" align="center" justify="center" gap="4" className={styles.emptyState}>
                            <MagnifyingGlassIcon width="52" height="52" />
                            <Heading size="5">Search, review filters, then run the query</Heading>
                            <Text size="2" color="gray" align="center" style={{ maxWidth: 520 }}>
                                Type a natural-language query, refine filters in the popup (or skip them), and page through the top 100 preview matches in 20-result pages.
                            </Text>
                        </Flex>
                    )}

                    {state.viewState === "intake_generating" && (
                        <Flex direction="column" align="center" gap="3" py="9">
                            <Spinner size="3" />
                            <Heading size="4">Building search plan</Heading>
                            <Text size="2" color="gray">Reading the JD and mapping it to editable filters.</Text>
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
                        <Box className={styles.resultsLayout}>
                            <Box className={styles.resultsTableRegion}>
                                <PreviewGrid
                                    className={styles.resultsPreviewGrid}
                                    rows={currentResults}
                                    selectable
                                    showCandidateSubtitle={false}
                                    hiddenColumnKeys={["id", "page", "pipeline", "search_prompt"]}
                                    selectedRowIds={selectedIds}
                                    activeRowId={state.activeCandidateId}
                                    emptyMessage="No preview rows were returned for this search."
                                    onToggleAllSelection={(checked) => {
                                        setSelectedIds((current) => {
                                            const next = new Set(current);
                                            const currentPageIds = currentResults.map((row) => row.id);
                                            if (checked) {
                                                currentPageIds.forEach((id) => next.add(id));
                                            } else {
                                                currentPageIds.forEach((id) => next.delete(id));
                                            }
                                            return next;
                                        });
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
                                    onRowClick={(row) => dispatch({ type: "toggle_candidate", candidateId: row.id })}
                                />
                            </Box>

                            {state.totalPages > 1 && (
                                <Flex justify="center" align="center" gap="2" wrap="wrap" className={styles.paginationFooter}>
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
                        </Box>
                    )}
                </Box>

                {activeCandidate && (
                    <CandidatePanel
                        preview={activeCandidate}
                        matchRationales={activeCandidateMatchRationales}
                        onClose={() => dispatch({ type: "toggle_candidate", candidateId: null })}
                        onSaveToList={(id) => {
                            setSelectedIds(new Set([id]));
                            setSaveDialogOpen(true);
                        }}
                    />
                )}
                {showAssistantSurface && desktopLayout ? (
                    <AIIntakeDrawer {...assistantSurfaceProps} />
                ) : null}
                {showAssistantSurface && !desktopLayout ? (
                    <AIIntakeSheet {...assistantSurfaceProps} />
                ) : null}
            </Box>

            <Dialog.Root
                open={state.desktopFiltersOpen}
                onOpenChange={(open) => dispatch({ type: "patch", payload: { desktopFiltersOpen: open } })}
            >
                <Dialog.Content
                    maxWidth="1040px"
                    className={styles.filtersDialogContent}
                    aria-label="Search filters"
                >
                    <Box className={styles.filtersDialogHeader}>
                        <Flex align="start" justify="between" gap="4" className={styles.filtersDialogHeaderRow}>
                            <Box className={styles.filtersDialogHeading}>
                                <Flex align="center" gap="3" wrap="wrap" className={styles.filtersDialogTitleRow}>
                                    <Dialog.Title className={styles.filtersDialogTitle}>Filters</Dialog.Title>
                                    {activeFilterCount > 0 ? (
                                        <Badge color="orange" variant="soft" radius="full">
                                            {activeFilterCount} active
                                        </Badge>
                                    ) : null}
                                </Flex>
                                <Dialog.Description className={styles.filtersDialogDescription}>
                                    Review or refine the parsed filters before the next search.
                                </Dialog.Description>
                            </Box>
                            <Dialog.Close asChild>
                                <Button variant="ghost" size="2" className={styles.filtersDialogClose} aria-label="Close filters">
                                    <Cross2Icon />
                                </Button>
                            </Dialog.Close>
                        </Flex>
                    </Box>

                    <Box className={styles.filtersDialogWorkArea}>
                        <Box className={styles.filtersDialogBody} aria-busy={popupSearchPending}>
                            {renderFilterBody()}
                        </Box>

                        <Flex className={styles.filtersDialogFooter} align="center" justify="between" gap="3">
                            <Button
                                size="2"
                                variant="soft"
                                color="gray"
                                disabled={activeFilterCount === 0 || isBusy}
                                onClick={handleResetFilters}
                            >
                                Reset filters
                            </Button>
                            <Flex gap="2" wrap="wrap" justify="end">
                                <Button
                                    size="2"
                                    variant="soft"
                                    disabled={isJdMode ? !canGenerateSearchPlan || isBusy : !state.query.trim() || isBusy}
                                    onClick={() => {
                                        if (isJdMode) {
                                            void handleGenerateSearchPlan();
                                            return;
                                        }
                                        void handleMatchPrompt();
                                    }}
                                    title={isJdMode ? "Replace filters with what the JD maps to" : "Replace filters with what the prompt parses to"}
                                >
                                    {isJdMode ? "Match JD again" : "Match prompt"}
                                </Button>
                                <Button size="2" disabled={findButtonDisabled} onClick={() => void handlePopupFindCandidates()}>
                                    {popupSearchPending ? <Spinner /> : "Find candidates"}
                                </Button>
                                <Dialog.Close asChild>
                                    <Button size="2" disabled={popupSearchPending} onClick={closeDesktopDialog}>
                                        Done
                                    </Button>
                                </Dialog.Close>
                            </Flex>
                        </Flex>
                        {popupSearchPending ? (
                            <Box className={styles.filtersDialogLoadingOverlay} role="status" aria-live="polite">
                                <Box className={styles.filtersDialogLoadingCard}>
                                    <Box className={styles.filtersDialogLoadingSpinner}>
                                        <Spinner size="3" />
                                    </Box>
                                    <Heading size="4">Searching candidates...</Heading>
                                    <Text size="2" color="gray" align="center">
                                        Applying your filters, validating the search, and fetching the first preview matches.
                                    </Text>
                                </Box>
                            </Box>
                        ) : null}
                    </Box>
                </Dialog.Content>
            </Dialog.Root>

            <SaveToListDialog
                open={saveDialogOpen}
                onOpenChange={setSaveDialogOpen}
                candidates={selectedImportPayload}
                onSaved={async () => {
                    setSelectedIds(new Set());
                }}
                onOpenList={(list) => openSavedList(list.id)}
                onEnrichList={(list) => openSavedList(list.id, { enrich: true })}
            />

            {state.mobileFiltersOpen && (
                <>
                    <div
                        className={styles.bottomSheetOverlay}
                        onClick={closeMobileSheet}
                        aria-hidden="true"
                    />
                    <div
                        className={styles.bottomSheetContent}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Search filters"
                    >
                        <div className={styles.bottomSheetHandle} aria-hidden="true" />
                        <Flex className={styles.bottomSheetHeader}>
                            <Box>
                                <Text size="2" weight="bold">Filters</Text>
                                {activeFilterCount > 0 ? (
                                    <Badge color="orange" variant="soft" radius="full" ml="2">
                                        {activeFilterCount} active
                                    </Badge>
                                ) : null}
                            </Box>
                            <Button size="2" variant="ghost" onClick={closeMobileSheet} aria-label="Close filters">
                                <Cross2Icon />
                            </Button>
                        </Flex>
                        <Box className={styles.bottomSheetBody}>{renderFilterBody()}</Box>
                        <Box className={styles.bottomSheetFooter}>
                            <Button
                                size="2"
                                variant="soft"
                                color="gray"
                                disabled={activeFilterCount === 0}
                                onClick={handleResetFilters}
                            >
                                Reset
                            </Button>
                            <Button size="2" onClick={closeMobileSheet}>
                                Done
                            </Button>
                        </Box>
                    </div>
                </>
            )}
        </Box>
    );

    function renderFilterBody() {
        return (
            <Flex className={styles.filterBody}>
                <Box className={styles.sectionNav}>
                    {sections.map((section) => (
                        <Button
                            key={section.id}
                            size="2"
                            variant="ghost"
                            className={`${styles.sectionButton} ${activeSection === section.id ? styles.sectionButtonActive : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            {section.title}
                        </Button>
                    ))}
                </Box>

                <Box className={styles.sectionContent}>
                    {activeSectionData?.fields.map((field) => (
                        <Box key={field.key} className={styles.fieldBlock}>
                            <Text size="1" weight="bold" className={styles.fieldLabel}>{field.label}</Text>
                            {field.help_text && (
                                <Text size="1" color="gray" className={styles.fieldHelp}>
                                    {field.help_text}
                                </Text>
                            )}
                            <Box mt="2">{renderField(field)}</Box>
                        </Box>
                    ))}

                    <Separator size="4" my="4" />

                    <Box mb="4">
                        <Text size="1" weight="bold">Ambiguities</Text>
                        <Box mt="2">
                            <TagInput
                                label="Ambiguities"
                                placeholder=""
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
        );
    }
}
