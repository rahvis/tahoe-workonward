"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    answerSearchIntake,
    apiRequest,
    ApiError,
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
import { useCreditConfirm } from "@/app/dashboard/_components/CreditConfirmDialog";
import { ACTION_COST, loadActionCosts } from "@/lib/credits";
import { SEARCH_TIPS_URL, dismissSearchTip, shouldShowSearchTip } from "@/lib/search-tips";
import { fetchSearchAccess, autocompleteLocations, autocompleteJobs, autocompleteCompany, autocompleteEducation, autocompleteCertifications, type LocationField, type JobField, type CompanyField, type EducationField, type CertificationField } from "@/lib/organization";
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
    TahoeSelect,
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
import MicButton from "./MicButton";
import PreviewGrid, { type PreviewGridRow } from "./preview-grid";
import { useOnboarding } from "../_components/onboarding/OnboardingProvider";
import { SAMPLE_CANDIDATES, SAMPLE_QUERY } from "../_components/onboarding/sampleCandidates";
import { markOnboardingTask } from "@/lib/onboarding";
import SearchBriefSummary from "./SearchBriefSummary";
import UpgradePaywallModal, { type PaywallReason } from "./UpgradePaywallModal";
import { useDictation } from "./useDictation";
import {
    PARSE_STAGE_MESSAGES,
    SEARCH_STAGE_MESSAGES,
    useStagedMessages,
} from "./useStagedMessages";

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

// Job fields backed by the /search/jobs/autocomplete typeahead, keyed by field key.
const JOB_AUTOCOMPLETE_FIELDS: Record<string, JobField> = {
    "job.current_title_keywords": "title",
    "job.departments": "department",
    "job.management_levels": "management_level",
};

// Company fields backed by the /search/company/autocomplete typeahead (HQ countries
// and industries), keyed by field key. Both the primary and optional variants map
// to the same source.
const COMPANY_AUTOCOMPLETE_FIELDS: Record<string, CompanyField> = {
    "company.current_company_names": "company_name",
    "company.past_company_names": "company_name",
    "company.optional_company_names": "company_name",
    "company.company_hq_countries": "hq_country",
    "company.optional_company_hq_countries": "hq_country",
    "company.industries": "industry",
    "company.optional_industries": "industry",
};

// Education fields backed by the /search/education/autocomplete typeahead.
const EDUCATION_AUTOCOMPLETE_FIELDS: Record<string, EducationField> = {
    "education.institution_names": "institution",
    "education.degree_keywords": "degree",
};

// Certification fields backed by the /search/certifications/autocomplete typeahead.
const CERTIFICATION_AUTOCOMPLETE_FIELDS: Record<string, CertificationField> = {
    "certifications.title_keywords": "title",
    "certifications.issuers": "issuer",
};

function getFieldPlaceholder(): string {
    return "";
}

// Company-size buckets are stored in Coresignal's "N employees" format but shown
// compactly (e.g. "1-10 employees" -> "1-10"). Display only — the value is unchanged.
function formatCompanySizeLabel(value: string): string {
    return value.replace(/\s*employees?$/i, "").trim();
}

function TagInput({
    label,
    placeholder,
    tags,
    suggestions,
    onChange,
    formatLabel,
}: {
    label: string;
    placeholder: string;
    tags: string[];
    suggestions?: string[];
    onChange: (next: string[]) => void;
    // Display-only transform for chips/suggestions; the stored value is unchanged.
    formatLabel?: (value: string) => string;
}) {
    const [input, setInput] = useState("");
    const display = formatLabel ?? ((value: string) => value);

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
                        <span className={styles.tagBadgeText}>{display(tag)}</span>
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
                            {display(suggestion)}
                        </Button>
                    ))}
                </Box>
            )}
        </Box>
    );
}

/**
 * Generic tag input with a debounced, server-backed typeahead dropdown.
 *
 * The caller supplies `loadSuggestions(query, signal)`; `refreshKey` should encode
 * any parent context the loader closes over (e.g. the selected countries for the
 * Locations cascade) so suggestions refetch when that context changes. Free-text
 * entries are always allowed via Enter.
 */
function TagAutocomplete({
    label,
    tags,
    onChange,
    loadSuggestions,
    refreshKey = "",
}: {
    label: string;
    tags: string[];
    onChange: (next: string[]) => void;
    loadSuggestions: (query: string, signal: AbortSignal) => Promise<string[]>;
    refreshKey?: string;
}) {
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const loadRef = useRef(loadSuggestions);

    useEffect(() => {
        loadRef.current = loadSuggestions;
    });

    useEffect(() => {
        if (!open) return;
        const handle = setTimeout(() => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            setLoading(true);
            loadRef.current(input, controller.signal)
                .then((next) => {
                    setSuggestions(next);
                    setActiveIndex(-1);
                })
                .catch((err) => {
                    if ((err as { name?: string })?.name === "AbortError") return;
                    setSuggestions([]);
                })
                .finally(() => setLoading(false));
        }, 180);
        return () => clearTimeout(handle);
        // refreshKey stands in for any parent context the loader closes over.
    }, [open, input, refreshKey]);

    useEffect(() => {
        if (!open) return;
        const onDocMouseDown = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, [open]);

    const visibleSuggestions = suggestions.filter(
        (suggestion) => !tags.some((tag) => tag.toLowerCase() === suggestion.toLowerCase()),
    );

    const addValue = (value: string) => {
        const cleaned = value.trim();
        if (!cleaned) return;
        if (!tags.some((tag) => tag.toLowerCase() === cleaned.toLowerCase())) {
            onChange([...tags, cleaned]);
        }
        setInput("");
        setSuggestions([]);
        setActiveIndex(-1);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, visibleSuggestions.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            if (activeIndex >= 0 && activeIndex < visibleSuggestions.length) {
                addValue(visibleSuggestions[activeIndex]);
            } else {
                addValue(input);
            }
        } else if (event.key === "Escape") {
            setOpen(false);
        }
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
            <div className={styles.tagAutocompleteWrap} ref={containerRef}>
                <TextField.Root
                    aria-label={label}
                    placeholder=""
                    value={input}
                    autoComplete="off"
                    onFocus={() => setOpen(true)}
                    onChange={(event) => {
                        setInput(event.target.value);
                        setOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                />
                {open && (loading || visibleSuggestions.length > 0) && (
                    <Box className={styles.tagAutocompleteMenu} role="listbox">
                        {visibleSuggestions.length === 0 && loading ? (
                            <Box className={styles.tagAutocompleteEmpty}>Searching…</Box>
                        ) : (
                            visibleSuggestions.map((suggestion, index) => (
                                <button
                                    type="button"
                                    key={suggestion}
                                    role="option"
                                    aria-selected={index === activeIndex}
                                    className={`${styles.tagAutocompleteOption} ${index === activeIndex ? styles.tagAutocompleteOptionActive : ""}`}
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        addValue(suggestion);
                                    }}
                                    onMouseEnter={() => setActiveIndex(index)}
                                >
                                    {suggestion}
                                </button>
                            ))
                        )}
                    </Box>
                )}
            </div>
        </Box>
    );
}

/**
 * Cascading location picker for the Countries / States / Cities filter fields.
 * State suggestions are scoped by the chosen countries, city suggestions by the
 * chosen states.
 */
function LocationAutocomplete({
    level,
    label,
    tags,
    countries,
    states,
    onChange,
}: {
    level: LocationField;
    label: string;
    tags: string[];
    countries: string[];
    states: string[];
    onChange: (next: string[]) => void;
}) {
    return (
        <TagAutocomplete
            label={label}
            tags={tags}
            onChange={onChange}
            refreshKey={`${level}|${countries.join("|")}|${states.join("|")}`}
            loadSuggestions={async (query, signal) => {
                const res = await autocompleteLocations({ field: level, query, countries, states }, { signal });
                return res.suggestions;
            }}
        />
    );
}

/**
 * Typeahead picker for the Job filter fields (Current Titles, Departments,
 * Management Levels), backed by /search/jobs/autocomplete.
 */
function JobAutocomplete({
    field,
    label,
    tags,
    onChange,
}: {
    field: JobField;
    label: string;
    tags: string[];
    onChange: (next: string[]) => void;
}) {
    return (
        <TagAutocomplete
            label={label}
            tags={tags}
            onChange={onChange}
            refreshKey={field}
            loadSuggestions={async (query, signal) => {
                const res = await autocompleteJobs({ field, query }, { signal });
                return res.suggestions;
            }}
        />
    );
}

/**
 * Typeahead picker for the Company filter fields that have a controlled source:
 * HQ Countries (ISO country names) and Industries (LinkedIn/Coresignal taxonomy).
 */
function CompanyAutocomplete({
    field,
    label,
    tags,
    onChange,
}: {
    field: CompanyField;
    label: string;
    tags: string[];
    onChange: (next: string[]) => void;
}) {
    return (
        <TagAutocomplete
            label={label}
            tags={tags}
            onChange={onChange}
            refreshKey={field}
            loadSuggestions={async (query, signal) => {
                const res = await autocompleteCompany({ field, query }, { signal });
                return res.suggestions;
            }}
        />
    );
}

/**
 * Typeahead picker for the Education filter fields: Institutions (all US colleges
 * & universities) and Degree Keywords (degree levels + fields of study).
 */
function EducationAutocomplete({
    field,
    label,
    tags,
    onChange,
}: {
    field: EducationField;
    label: string;
    tags: string[];
    onChange: (next: string[]) => void;
}) {
    return (
        <TagAutocomplete
            label={label}
            tags={tags}
            onChange={onChange}
            refreshKey={field}
            loadSuggestions={async (query, signal) => {
                const res = await autocompleteEducation({ field, query }, { signal });
                return res.suggestions;
            }}
        />
    );
}

/**
 * Typeahead picker for the Certifications filter fields: Certification Titles and
 * Issuers (abbreviations like "PMP" / "OSHA 30" resolve to the canonical name).
 */
function CertificationAutocomplete({
    field,
    label,
    tags,
    onChange,
}: {
    field: CertificationField;
    label: string;
    tags: string[];
    onChange: (next: string[]) => void;
}) {
    return (
        <TagAutocomplete
            label={label}
            tags={tags}
            onChange={onChange}
            refreshKey={field}
            loadSuggestions={async (query, signal) => {
                const res = await autocompleteCertifications({ field, query }, { signal });
                return res.suggestions;
            }}
        />
    );
}

/**
 * Single-value typeahead (one selected value, not a tag list) filtered client-side
 * over a provided list. Used for the per-row language picker. Free-text is allowed.
 */
function SingleAutocomplete({
    label,
    value,
    suggestions,
    onChange,
}: {
    label: string;
    value: string;
    suggestions: string[];
    onChange: (next: string) => void;
}) {
    const [input, setInput] = useState(value);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setInput(value);
    }, [value]);

    useEffect(() => {
        if (!open) return;
        const onDocMouseDown = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, [open]);

    const needle = input.trim().toLowerCase();
    const prefix = suggestions.filter((s) => s.toLowerCase().startsWith(needle));
    const contains = needle
        ? suggestions.filter((s) => !s.toLowerCase().startsWith(needle) && s.toLowerCase().includes(needle))
        : [];
    const visible = [...prefix, ...contains].slice(0, 8);

    const commit = (next: string) => {
        onChange(next);
        setInput(next);
        setOpen(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, visible.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === "Enter") {
            event.preventDefault();
            commit(activeIndex >= 0 && activeIndex < visible.length ? visible[activeIndex] : input.trim());
        } else if (event.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div className={styles.tagAutocompleteWrap} ref={containerRef}>
            <TextField.Root
                aria-label={label}
                placeholder=""
                value={input}
                autoComplete="off"
                onFocus={() => setOpen(true)}
                onChange={(event) => {
                    setInput(event.target.value);
                    setOpen(true);
                }}
                onBlur={() => {
                    if (input.trim() !== value) onChange(input.trim());
                }}
                onKeyDown={handleKeyDown}
            />
            {open && visible.length > 0 && (
                <Box className={styles.tagAutocompleteMenu} role="listbox">
                    {visible.map((suggestion, index) => (
                        <button
                            type="button"
                            key={suggestion}
                            role="option"
                            aria-selected={index === activeIndex}
                            className={`${styles.tagAutocompleteOption} ${index === activeIndex ? styles.tagAutocompleteOptionActive : ""}`}
                            onMouseDown={(event) => {
                                event.preventDefault();
                                commit(suggestion);
                            }}
                            onMouseEnter={() => setActiveIndex(index)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </Box>
            )}
        </div>
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
    const { demoActive } = useOnboarding();
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

    // Voice search: dictated text is appended to whatever is already typed, then
    // we refocus the input so the recruiter can keep editing. The query ref lets
    // the transcript callback read the latest query without re-subscribing.
    const stateQueryRef = useRef(state.query);
    stateQueryRef.current = state.query;
    const dictation = useDictation(
        useCallback((text: string) => {
            const existing = stateQueryRef.current.trim();
            dispatch({
                type: "patch",
                payload: { query: existing ? `${existing} ${text}` : text },
            });
            window.setTimeout(() => searchInputRef.current?.focus(), 0);
        }, []),
    );
    const isDictating = dictation.status === "recording" || dictation.status === "transcribing";

    // Free-search trial paywall. `searchLocked` (from /search/access) means the
    // recruiter has used their one free search and isn't subscribed; gated actions
    // open the upgrade modal. The backend 402 (subscription_required) is the
    // authoritative gate; this drives proactive locking + the modal.
    const [searchLocked, setSearchLocked] = useState(false);
    const [subscriptionActive, setSubscriptionActive] = useState(false);
    const [searchCost, setSearchCost] = useState(ACTION_COST.search);
    const [paywallReason, setPaywallReason] = useState<PaywallReason | null>(null);
    const [showSearchTip, setShowSearchTip] = useState(false);
    const { confirmSpend, creditConfirmDialog } = useCreditConfirm();

    // Search-tips hint: client-only gate (reads localStorage) so it can't cause
    // a hydration mismatch. Shows for the first 5 logins, dismissible anytime.
    useEffect(() => {
        setShowSearchTip(shouldShowSearchTip());
    }, []);

    const handleDismissSearchTip = useCallback(() => {
        dismissSearchTip();
        setShowSearchTip(false);
    }, []);

    const refreshAccess = useCallback(async () => {
        try {
            const access = await fetchSearchAccess();
            setSearchLocked(access.locked);
            setSubscriptionActive(access.subscription_active);
        } catch {
            // Non-fatal: the backend 402 still gates the action.
        }
    }, []);

    useEffect(() => {
        void refreshAccess();
    }, [refreshAccess]);

    // Live per-search credit cost (falls back to the constant).
    useEffect(() => {
        void loadActionCosts().then((costs) => setSearchCost(costs.search));
    }, []);

    /** If `err` is a 402 paywall response, open the upgrade modal and report handled. */
    const handlePaywallError = useCallback((err: unknown): boolean => {
        if (err instanceof ApiError && err.status === 402) {
            const code = (err.detail as { code?: string } | null | undefined)?.code;
            setPaywallReason(code === "insufficient_credits" ? "insufficient_credits" : "subscription_required");
            void refreshAccess();
            return true;
        }
        return false;
    }, [refreshAccess]);

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
     * Run /search/execute, silently recovering from an expired/missing session.
     *
     * A 404 means the search session was not found or has expired (for example
     * it was created on a different backend instance and TTL'd out before the
     * recruiter clicked Find candidates). Rather than dead-end the recruiter, we
     * re-anchor a fresh session via /search/parse and retry once, preserving the
     * recruiter's confirmed filters. Any other error is rethrown unchanged.
     */
    async function executeSearchWithRecovery(params: {
        sessionId: string;
        checkpointId: string;
        confirmedIntent: PopupIntentModel;
        reanchorPrompt: string;
    }): Promise<ExecuteResponse> {
        const { sessionId, checkpointId, confirmedIntent, reanchorPrompt } = params;
        try {
            return await apiRequest<ExecuteResponse>("/search/execute", {
                method: "POST",
                body: {
                    search_session_id: sessionId,
                    checkpoint_id: checkpointId,
                    confirmed_intent: confirmedIntent,
                },
            });
        } catch (err: unknown) {
            if (!(err instanceof ApiError && err.status === 404 && reanchorPrompt)) {
                throw err;
            }
            const reparse = await apiRequest<ParseResponse>("/search/parse", {
                method: "POST",
                body: { search_prompt: reanchorPrompt },
            });
            dispatch({
                type: "patch",
                payload: {
                    searchSessionId: reparse.search_session_id,
                    checkpointId: reparse.checkpoint_id,
                    needsFreshSession: false,
                },
            });
            return await apiRequest<ExecuteResponse>("/search/execute", {
                method: "POST",
                body: {
                    search_session_id: reparse.search_session_id,
                    checkpoint_id: reparse.checkpoint_id,
                    confirmed_intent: confirmedIntent,
                },
            });
        }
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
        // Subscribed searches spend credits — confirm once (suppressible). The free
        // trial search and the onboarding demo never charge, so skip the prompt there.
        if (subscriptionActive && !demoActive) {
            const ok = await confirmSpend({ actionLabel: "Run this search", cost: searchCost });
            if (!ok) return false;
        }
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

                const executeResponse = await executeSearchWithRecovery({
                    sessionId,
                    checkpointId,
                    confirmedIntent: popupModel,
                    reanchorPrompt: searchPromptForRun,
                });
                dispatch({ type: "execute_success", payload: executeResponse, confirmedIntent: popupModel });
                markOnboardingTask("first_search");
                notifyCreditsChanged();
                void refreshAccess();
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

            // What the recruiter reviewed is authoritative. If they hand-edited
            // (dirty) OR they already have populated filters from the review
            // step, execute exactly those — never silently swap in a fresh
            // re-parse the recruiter never saw. Only fall back to the parse's
            // popup_model when there's nothing reviewed yet (e.g. the popup was
            // opened via Filters before any parse populated it).
            const intentForExecute =
                wasDirty || countActiveFilters(preEditPopupModel) > 0
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

            const executeResponse = await executeSearchWithRecovery({
                sessionId: parseResponse.search_session_id,
                checkpointId: parseResponse.checkpoint_id,
                confirmedIntent: intentForExecute,
                reanchorPrompt: searchPromptForRun,
            });
            dispatch({ type: "execute_success", payload: executeResponse, confirmedIntent: intentForExecute });
            markOnboardingTask("first_search");
            notifyCreditsChanged();
            void refreshAccess();
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
            if (handlePaywallError(err)) {
                dispatch({
                    type: "patch",
                    payload: {
                        error: "",
                        viewState: currentResults.length > 0 ? "results" : "idle",
                        paginatingPage: null,
                    },
                });
                return false;
            }
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

    /**
     * Step 1 of the mandatory two-step prompt flow: parse the prompt (showing
     * staged progress) and open the filter popup pre-filled for review. The
     * recruiter then reviews/edits and clicks Find candidates inside the popup
     * to execute (handlePopupFindCandidates). JD mode already has its own
     * two-step (Generate search plan → review → execute).
     */
    async function handlePromptReview() {
        const searchPromptForRun = getSearchPromptForRun(state.query, popupModel);
        const hasFilters = countActiveFilters(popupModel) > 0;
        if (!searchPromptForRun && !hasFilters) return;
        // If the recruiter has hand-edited filters, their edits win: re-parsing
        // anchors a session but we restore their popupModel afterwards so the
        // review popup shows what they set, not what the prompt re-derived.
        const wasDirty = state.popupDirty;
        const preEditPopupModel = popupModel;
        try {
            if (searchPromptForRun) {
                await parseQuery(searchPromptForRun);
                if (wasDirty) {
                    dispatch({ type: "patch", payload: { popupModel: preEditPopupModel, popupDirty: true } });
                }
            }
            openFilterSurface();
        } catch (err: unknown) {
            dispatch({
                type: "patch",
                payload: {
                    error: err instanceof Error ? err.message : "Couldn't understand that search. Please try again.",
                    viewState: "idle",
                },
            });
        }
    }

    async function handleFindCandidates(event?: { preventDefault(): void }) {
        event?.preventDefault();
        if (isDictating) return;
        // Free search already used and not subscribed → show the paywall instead of
        // running another search (also avoids a wasted LLM parse).
        if (searchLocked) {
            setPaywallReason("subscription_required");
            return;
        }
        if (state.sourceType !== "prompt") {
            await runFindCandidates();
            return;
        }
        await handlePromptReview();
    }

    async function handlePopupFindCandidates() {
        if (searchLocked) {
            setPaywallReason("subscription_required");
            return;
        }
        await runFindCandidates({ closeDesktopOnSuccess: true, launchedFromPopup: true });
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
            // Already-fetched pages are free to view even when locked.
            dispatch({ type: "set_current_page", page: targetPage });
            return;
        }
        // Fetching a new page costs a credit; a locked (free-search-used) recruiter
        // must subscribe first. Show the paywall instead of a doomed 402.
        if (searchLocked) {
            setPaywallReason("subscription_required");
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
            if (handlePaywallError(err)) {
                dispatch({ type: "patch", payload: { error: "", paginatingPage: null } });
                return;
            }
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

        // The Locations fields use a cascading autocomplete: state suggestions are
        // scoped by the chosen countries and city suggestions by the chosen states.
        if (field.key.startsWith("locations.")) {
            const level: LocationField = field.key.endsWith(".countries")
                ? "country"
                : field.key.endsWith(".states")
                    ? "state"
                    : "city";
            return (
                <LocationAutocomplete
                    level={level}
                    label={field.label}
                    tags={Array.isArray(value) ? (value as string[]) : []}
                    countries={popupModel.locations.countries}
                    states={popupModel.locations.states}
                    onChange={(next) => updatePopup((draft) => {
                        setNestedValue(draft as unknown as Record<string, unknown>, field.key, next);
                    })}
                />
            );
        }

        // Job titles / departments / management levels use server-backed typeahead.
        if (field.key in JOB_AUTOCOMPLETE_FIELDS) {
            return (
                <JobAutocomplete
                    field={JOB_AUTOCOMPLETE_FIELDS[field.key]}
                    label={field.label}
                    tags={Array.isArray(value) ? (value as string[]) : []}
                    onChange={(next) => updatePopup((draft) => {
                        setNestedValue(draft as unknown as Record<string, unknown>, field.key, next);
                    })}
                />
            );
        }

        // Company HQ countries / industries use server-backed typeahead.
        if (field.key in COMPANY_AUTOCOMPLETE_FIELDS) {
            return (
                <CompanyAutocomplete
                    field={COMPANY_AUTOCOMPLETE_FIELDS[field.key]}
                    label={field.label}
                    tags={Array.isArray(value) ? (value as string[]) : []}
                    onChange={(next) => updatePopup((draft) => {
                        setNestedValue(draft as unknown as Record<string, unknown>, field.key, next);
                    })}
                />
            );
        }

        // Education institutions / degrees use server-backed typeahead.
        if (field.key in EDUCATION_AUTOCOMPLETE_FIELDS) {
            return (
                <EducationAutocomplete
                    field={EDUCATION_AUTOCOMPLETE_FIELDS[field.key]}
                    label={field.label}
                    tags={Array.isArray(value) ? (value as string[]) : []}
                    onChange={(next) => updatePopup((draft) => {
                        setNestedValue(draft as unknown as Record<string, unknown>, field.key, next);
                    })}
                />
            );
        }

        // Certification titles / issuers use server-backed typeahead (with aliases).
        if (field.key in CERTIFICATION_AUTOCOMPLETE_FIELDS) {
            return (
                <CertificationAutocomplete
                    field={CERTIFICATION_AUTOCOMPLETE_FIELDS[field.key]}
                    label={field.label}
                    tags={Array.isArray(value) ? (value as string[]) : []}
                    onChange={(next) => updatePopup((draft) => {
                        setNestedValue(draft as unknown as Record<string, unknown>, field.key, next);
                    })}
                />
            );
        }

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
                    suggestions={field.suggestions}
                    formatLabel={field.key.endsWith("company_size_ranges") ? formatCompanySizeLabel : undefined}
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
                <Flex direction="column" gap="2">
                    {languages.map((entry, index) => (
                        <Flex key={`lang-${index}`} className={styles.languageRow} gap="2" align="center">
                            <Box className={styles.languageRowName}>
                                <SingleAutocomplete
                                    label={`Language ${index + 1}`}
                                    value={entry.language}
                                    suggestions={field.suggestions}
                                    onChange={(next) => updatePopup((draft) => {
                                        draft.languages[index].language = next;
                                    })}
                                />
                            </Box>
                            <TahoeSelect
                                aria-label={`Proficiency ${index + 1}`}
                                className={styles.languageRowProficiency}
                                value={entry.proficiency ?? ""}
                                onChange={(event) => updatePopup((draft) => {
                                    draft.languages[index].proficiency = (event.target.value || null) as LanguageProficiency | null;
                                })}
                            >
                                <option value="">Any proficiency</option>
                                {field.options.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </TahoeSelect>
                            <Button
                                size="1"
                                variant="ghost"
                                aria-label={`Remove language ${index + 1}`}
                                className={styles.languageRowRemove}
                                onClick={() => updatePopup((draft) => {
                                    draft.languages = draft.languages.filter((_, languageIndex) => languageIndex !== index);
                                })}
                            >
                                <Cross2Icon />
                            </Button>
                        </Flex>
                    ))}
                    <Button
                        size="2"
                        variant="soft"
                        className={styles.addLanguageButton}
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
        isDictating ||
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
    const parseStageMessage = useStagedMessages(
        PARSE_STAGE_MESSAGES,
        state.viewState === "parsing",
    );
    const searchStageMessage = useStagedMessages(
        SEARCH_STAGE_MESSAGES,
        popupSearchPending || state.viewState === "searching",
    );
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
            <Box className={styles.searchBar} data-onboarding="search-bar">
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
                            <Box className={styles.promptInputWrap}>
                                <TextField.Root
                                    ref={searchInputRef}
                                    size="3"
                                    placeholder='Try: "Senior ML engineers in Europe with Python skills"'
                                    value={state.query}
                                    onChange={(event) => {
                                        if (dictation.errorMessage) dictation.clearError();
                                        dispatch({ type: "patch", payload: { query: event.target.value } });
                                    }}
                                    disabled={isBusy || isDictating}
                                    aria-label="Search prompt"
                                >
                                    <TextField.Slot>
                                        <MagnifyingGlassIcon width="16" height="16" />
                                    </TextField.Slot>
                                </TextField.Root>
                                <MicButton
                                    supported={dictation.supported}
                                    status={dictation.status}
                                    amplitude={dictation.amplitude}
                                    disabled={isBusy}
                                    onStart={() => void dictation.start()}
                                    onStop={dictation.stop}
                                />
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
                            data-onboarding="filters"
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
                                    {state.viewState === "searching"
                                        ? <Spinner />
                                        : subscriptionActive ? `Find candidates · ${searchCost} cr` : "Find candidates"}
                                </Button>
                            </>
                        ) : null}
                    </Flex>
                </form>
                {dictation.errorMessage ? (
                    <Text as="p" className={styles.micError} role="alert">
                        {dictation.errorMessage}
                    </Text>
                ) : null}
                {state.viewState === "parsing" ? (
                    <Box className={styles.stageProgressCard} role="status" aria-live="polite">
                        <Spinner size="2" />
                        <Text className={styles.stageProgressMessage}>{parseStageMessage}</Text>
                    </Box>
                ) : null}
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
                <div className={styles.workflowRow}>
                    <div className={styles.workflowRail} aria-label="Recruiter workflow">
                        <span>Search</span>
                        <span>Review filters</span>
                        <span>Results</span>
                        <span>Save to list</span>
                        <span>Enrich</span>
                        <span>Campaign</span>
                    </div>
                    {showSearchTip ? (
                        <span className={styles.workflowTip}>
                            <a
                                className={styles.workflowTipLink}
                                href={SEARCH_TIPS_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Search tips &amp; tricks &#8599;
                            </a>
                            <button
                                type="button"
                                className={styles.workflowTipDismiss}
                                onClick={handleDismissSearchTip}
                                aria-label="Hide search tips"
                                title="Hide search tips"
                            >
                                &#215;
                            </button>
                        </span>
                    ) : null}
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
                    {demoActive && (
                        <Box data-onboarding="result-row">
                            <Callout.Root color="gray" style={{ marginBottom: 12 }}>
                                <Callout.Text>
                                    These are <strong>example candidates</strong> so you can see how Tahoe works — they&apos;re not real people. You&apos;ll search real profiles right after this quick tour.
                                </Callout.Text>
                            </Callout.Root>
                            <Flex align="center" gap="2" mb="3" wrap="wrap">
                                <Badge color="gray" variant="soft">Example data</Badge>
                                <Text size="2" color="gray">{SAMPLE_QUERY}</Text>
                            </Flex>
                            <PreviewGrid
                                rows={SAMPLE_CANDIDATES}
                                showCandidateSubtitle
                                hiddenColumnKeys={["id", "page", "pipeline", "search_prompt"]}
                                emptyMessage="—"
                            />
                        </Box>
                    )}

                    {!demoActive && (state.viewState === "idle" || state.viewState === "review" || state.viewState === "intake_clarifying") && (
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

                    {!demoActive && (state.viewState === "results" || state.viewState === "diagnosis") && (
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
                                <Button size="2" disabled={findButtonDisabled} onClick={() => void handlePopupFindCandidates()}>
                                    {popupSearchPending ? <Spinner /> : "Find candidates"}
                                </Button>
                            </Flex>
                        </Flex>
                        {popupSearchPending ? (
                            <Box className={styles.filtersDialogLoadingOverlay} role="status" aria-live="polite">
                                <Box className={styles.filtersDialogLoadingCard}>
                                    <Box className={styles.filtersDialogLoadingSpinner}>
                                        <Spinner size="3" />
                                    </Box>
                                    <Heading size="4">Searching candidates…</Heading>
                                    <Text size="2" color="gray" align="center">
                                        {searchStageMessage}
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
                    markOnboardingTask("save_candidate");
                }}
                onOpenList={(list) => openSavedList(list.id)}
                onEnrichList={(list) => openSavedList(list.id, { enrich: true })}
            />

            <UpgradePaywallModal
                open={paywallReason !== null}
                reason={paywallReason ?? "subscription_required"}
                onClose={() => setPaywallReason(null)}
            />

            {creditConfirmDialog}

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

                    {/*
                      * Ambiguities are intentionally not rendered. The model resolves
                      * recruiter intent into concrete filters and keeps any residual
                      * uncertainty as an internal assumption (e.g. "remote" is treated
                      * as a preference, not a hard Coresignal location filter) rather
                      * than asking the recruiter to resolve it. popupModel.ambiguities
                      * still round-trips so that backend logic keeps working.
                      */}
                    {Object.keys(popupModel.semantic_expansions).length > 0 && (
                        <>
                            <Separator size="4" my="4" />
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
                        </>
                    )}
                </Box>
            </Flex>
        );
    }
}
