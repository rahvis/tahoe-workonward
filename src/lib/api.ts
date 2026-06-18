import { recordLoginForSearchTip } from "@/lib/search-tips";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
}

/**
 * Error thrown by {@link apiRequest} for a non-OK HTTP response. Extends Error
 * (so existing `err instanceof Error` / `err.message` handling keeps working)
 * while also exposing the HTTP `status` for callers that need to branch on it
 * — e.g. silently recovering from a 404 expired-session.
 */
export class ApiError extends Error {
    readonly status: number;
    /** Raw parsed `detail` from the error body (object/array/string), when present.
     * Lets callers branch on structured codes, e.g. `detail.code === "subscription_required"`. */
    readonly detail: unknown;
    constructor(status: number, message: string, detail?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.detail = detail;
    }
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = "GET", body, headers = {}, signal } = options;

    const token =
        typeof window !== "undefined" ? localStorage.getItem("tahoe_token") : null;

    const config: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        ...(signal ? { signal } : {}),
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    let response: Response;
    try {
        response = await fetch(getApiUrl(endpoint), config);
    } catch {
        // fetch() rejects with a TypeError ("Load failed" / "Failed to fetch")
        // when the request never reaches the server — offline, DNS/CORS, or the
        // API briefly unavailable (e.g. mid-deploy). Surface an actionable message
        // instead of the browser's cryptic default.
        throw new Error("Couldn't reach the server. Please check your connection and try again.");
    }

    if (!response.ok) {
        let error;
        try {
            error = await response.json();
        } catch {
            error = { detail: "Request failed" };
        }
        let detailStr = error.detail || `HTTP ${response.status}`;
        if (Array.isArray(detailStr)) {
            detailStr = detailStr
                .map((e: { loc?: Array<string | number>; msg: string }) => `${e.loc?.join('.') || 'body'}: ${e.msg}`)
                .join(', ');
        } else if (typeof detailStr === 'object') {
            detailStr = JSON.stringify(detailStr);
        }
        // A generic 5xx means the server failed before producing a useful
        // message — show a friendly, actionable line. Specific server messages
        // (e.g. "Database unavailable, please try again") are preserved.
        if (
            response.status >= 500 &&
            (detailStr === 'Internal server error' ||
                detailStr === 'Request failed' ||
                detailStr === `HTTP ${response.status}`)
        ) {
            detailStr = 'Something went wrong on our end. Please try again in a moment.';
        }
        throw new ApiError(response.status, detailStr, error.detail);
    }

    return response.json();
}

export function getApiUrl(endpoint: string): string {
    return `${API_URL}${endpoint}`;
}

/**
 * Upload a recorded audio clip for speech-to-text and return the transcript.
 *
 * Sends the raw audio bytes as the request body (the blob's MIME type becomes
 * the Content-Type) rather than JSON, so it can't reuse {@link apiRequest}.
 * Throws {@link ApiError} on a non-OK response, matching apiRequest's contract.
 */
export async function transcribeAudio(blob: Blob): Promise<{ transcript: string }> {
    const token =
        typeof window !== "undefined" ? localStorage.getItem("tahoe_token") : null;

    let response: Response;
    try {
        response = await fetch(getApiUrl("/search/transcribe"), {
            method: "POST",
            headers: {
                "Content-Type": blob.type || "audio/webm",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: blob,
        });
    } catch {
        throw new Error("Couldn't reach the server. Please check your connection and try again.");
    }

    if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
            const error = await response.json();
            if (error?.detail) detail = typeof error.detail === "string" ? error.detail : JSON.stringify(error.detail);
        } catch {
            // keep the default detail
        }
        throw new ApiError(response.status, detail);
    }

    return response.json();
}

export function setToken(token: string) {
    localStorage.setItem("tahoe_token", token);
    // Both login paths (password + Google) funnel through here, so this is the
    // single place to count logins for the search-tips hint gating.
    recordLoginForSearchTip();
}

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("tahoe_token");
}

export function removeToken() {
    localStorage.removeItem("tahoe_token");
}

export function isLoggedIn(): boolean {
    return !!getToken();
}

export function disableGoogleAutoSelect() {
    if (typeof window === "undefined") return;
    window.google?.accounts.id.disableAutoSelect();
}

// ---------------------------------------------------------------------------
// Phase 2 — search session helpers
// ---------------------------------------------------------------------------

export interface SearchSessionLatestPage {
    page: number;
    results: unknown[];
    total_results: number;
    total_pages: number;
    preview_total_results: number;
    query_hash: string | null;
}

export type SearchSourceType = "prompt" | "job_description" | "prompt_and_job_description";
export type SearchIntakeStatus =
    | "draft"
    | "generating"
    | "needs_clarification"
    | "ready_for_review"
    | "executed"
    | "failed";

export type SearchIntakeQuestionType =
    | "single_choice"
    | "multi_choice"
    | "short_text"
    | "number_range"
    | "boolean"
    | "skip_or_default";

export interface SearchIntakeQuestionOption {
    label: string;
    value: unknown;
}

export interface SearchIntakeQuestion {
    id: string;
    slot: string;
    question: string;
    type: SearchIntakeQuestionType;
    options: SearchIntakeQuestionOption[];
    default_option_index: number | null;
    required_for_search: boolean;
}

export interface SearchRequirementsSummary {
    title: string | null;
    must_have: string[];
    nice_to_have: string[];
    location: string[];
    company_context: string[];
    experience: string | null;
    assumptions: string[];
}

export type AIReasoningItemType =
    | "filter_mapping"
    | "question_rationale"
    | "answer_update"
    | "assumption"
    | "non_queryable_criterion"
    | "schema_guardrail"
    | "confidence_note"
    | "zero_result_relaxation"
    | "candidate_match_rationale";

export type AIReasoningSource =
    | "job_description"
    | "search_prompt"
    | "recruiter_answer"
    | "schema_rule"
    | "deterministic_default"
    | "search_result";

export interface AIReasoningItem {
    id: string;
    type: AIReasoningItemType;
    title: string;
    plain_language_explanation: string;
    source: AIReasoningSource;
    source_excerpt_or_reference: string | null;
    affected_filter_path: string | null;
    coresignal_fields: string[];
    confidence: "high" | "medium" | "low" | null;
    visible_to_recruiter: boolean;
    created_at?: string | null;
}

export interface AssistantMessage {
    role: string;
    type: string;
    content?: unknown;
    question_id?: string | null;
    reasoning_item_ids?: string[];
    created_at?: string | null;
}

export interface SearchIntakeStartRequest {
    source_type: SearchSourceType;
    search_prompt?: string | null;
    job_description?: string | null;
    project_id?: string | null;
    role_title?: string | null;
}

export interface SearchIntakeAnswerRequest {
    question_id: string;
    answer: unknown;
}

export interface SearchIntakeResponse {
    search_session_id: string;
    status: SearchIntakeStatus;
    popup_model: Record<string, unknown>;
    parsed_intent: Record<string, unknown>;
    requirements_summary: SearchRequirementsSummary;
    questions: SearchIntakeQuestion[];
    missing_slots: string[];
    confidence: "high" | "medium" | "low" | null;
    readiness_score: number;
    reasoning_summary: string | null;
    reasoning_items: AIReasoningItem[];
    assistant_messages?: AssistantMessage[];
}

export interface SearchSessionPayload {
    session_id: string;
    workspace_id: string;
    owner_user_id: string;
    prompt: string;
    normalized_query_hash: string | null;
    mode: "legacy" | "langgraph";
    parsed_intent: Record<string, unknown>;
    structured_filters: Record<string, unknown>;
    popup_model: Record<string, unknown> | null;
    total_results: number;
    total_pages: number;
    preview_total_results: number;
    last_page_loaded: number;
    pages_loaded: Record<string, unknown>;
    created_at: string | null;
    last_accessed_at: string | null;
    latest_page?: SearchSessionLatestPage;
    source_type?: SearchSourceType | null;
    job_description?: string | null;
    role_title?: string | null;
    project_id?: string | null;
    intake_status?: SearchIntakeStatus | null;
    requirements_summary?: SearchRequirementsSummary | null;
    assistant_messages?: AssistantMessage[];
    clarification_questions?: SearchIntakeQuestion[];
    answered_questions?: Record<string, unknown>;
    missing_slots?: string[];
    readiness_score?: number | null;
    reasoning_summary?: string | null;
    reasoning_items?: AIReasoningItem[];
    input_context_hash?: string | null;
}

export async function getSearchSession(sessionId: string): Promise<SearchSessionPayload> {
    return apiRequest<SearchSessionPayload>(`/search/sessions/${encodeURIComponent(sessionId)}`);
}

export async function startSearchIntake(payload: SearchIntakeStartRequest): Promise<SearchIntakeResponse> {
    return apiRequest<SearchIntakeResponse>("/search/intake/start", {
        method: "POST",
        body: payload,
    });
}

export async function answerSearchIntake(
    sessionId: string,
    payload: SearchIntakeAnswerRequest,
): Promise<SearchIntakeResponse> {
    return apiRequest<SearchIntakeResponse>(
        `/search/intake/${encodeURIComponent(sessionId)}/answer`,
        {
            method: "POST",
            body: payload,
        },
    );
}

export interface SavedSearchRerunResponse {
    search_session_id: string;
    mode: "legacy" | "langgraph";
    prompt: string;
    parsed_intent: Record<string, unknown>;
    structured_filters: Record<string, unknown>;
    popup_model: Record<string, unknown> | null;
    source_type?: SearchSourceType | null;
    job_description?: string | null;
    role_title?: string | null;
    project_id?: string | null;
    requirements_summary?: SearchRequirementsSummary | null;
    reasoning_summary?: string | null;
    assistant_transcript_summary?: string | null;
}

export async function rerunSavedSearch(savedSearchId: string): Promise<SavedSearchRerunResponse> {
    return apiRequest<SavedSearchRerunResponse>(
        `/saved-searches/${encodeURIComponent(savedSearchId)}/rerun`,
        { method: "POST" }
    );
}
