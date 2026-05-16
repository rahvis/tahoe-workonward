export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
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

    const response = await fetch(getApiUrl(endpoint), config);

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
        throw new Error(detailStr);
    }

    return response.json();
}

export function getApiUrl(endpoint: string): string {
    return `${API_URL}${endpoint}`;
}

export function setToken(token: string) {
    localStorage.setItem("tahoe_token", token);
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
}

export async function getSearchSession(sessionId: string): Promise<SearchSessionPayload> {
    return apiRequest<SearchSessionPayload>(`/search/sessions/${encodeURIComponent(sessionId)}`);
}

export interface SavedSearchRerunResponse {
    search_session_id: string;
    mode: "legacy" | "langgraph";
    prompt: string;
    parsed_intent: Record<string, unknown>;
    structured_filters: Record<string, unknown>;
    popup_model: Record<string, unknown> | null;
}

export async function rerunSavedSearch(savedSearchId: string): Promise<SavedSearchRerunResponse> {
    return apiRequest<SavedSearchRerunResponse>(
        `/saved-searches/${encodeURIComponent(savedSearchId)}/rerun`,
        { method: "POST" }
    );
}
