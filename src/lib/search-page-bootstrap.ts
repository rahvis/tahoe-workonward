"use client";

import type { SavedSearchRerunResponse, SearchRequirementsSummary, SearchSourceType } from "@/lib/api";

const SEARCH_PAGE_BOOTSTRAP_KEY = "tahoe_search_page_bootstrap_v1";
const SEARCH_PAGE_BOOTSTRAP_MAX_AGE_MS = 5 * 60 * 1000;
let cachedBootstrap: SearchPageBootstrapPayload | null | undefined;

export interface SearchPageBootstrapPayload {
    mode: "legacy" | "langgraph";
    searchSessionId: string;
    prompt: string;
    structuredFilters: Record<string, unknown>;
    parsedIntent: Record<string, unknown>;
    popupModel: Record<string, unknown> | null;
    sourceType?: SearchSourceType | null;
    jobDescription?: string | null;
    roleTitle?: string | null;
    projectId?: string | null;
    requirementsSummary?: SearchRequirementsSummary | null;
    reasoningSummary?: string | null;
    createdAtMs: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isBootstrapPayload(value: unknown): value is SearchPageBootstrapPayload {
    if (!isRecord(value)) return false;
    if (value.mode !== "legacy" && value.mode !== "langgraph") return false;
    if (typeof value.searchSessionId !== "string" || !value.searchSessionId.trim()) return false;
    if (typeof value.prompt !== "string") return false;
    if (!isRecord(value.structuredFilters)) return false;
    if (!isRecord(value.parsedIntent)) return false;
    if (!(value.popupModel === null || isRecord(value.popupModel))) return false;
    if (value.sourceType !== undefined
        && value.sourceType !== null
        && value.sourceType !== "prompt"
        && value.sourceType !== "job_description"
        && value.sourceType !== "prompt_and_job_description") return false;
    if (value.jobDescription !== undefined && value.jobDescription !== null && typeof value.jobDescription !== "string") return false;
    if (value.roleTitle !== undefined && value.roleTitle !== null && typeof value.roleTitle !== "string") return false;
    if (value.projectId !== undefined && value.projectId !== null && typeof value.projectId !== "string") return false;
    if (value.requirementsSummary !== undefined && value.requirementsSummary !== null && !isRecord(value.requirementsSummary)) return false;
    if (value.reasoningSummary !== undefined && value.reasoningSummary !== null && typeof value.reasoningSummary !== "string") return false;
    if (typeof value.createdAtMs !== "number") return false;
    return true;
}

export function storeSearchPageBootstrap(response: SavedSearchRerunResponse): void {
    if (typeof window === "undefined") return;
    const payload: SearchPageBootstrapPayload = {
        mode: response.mode,
        searchSessionId: response.search_session_id,
        prompt: response.prompt,
        structuredFilters: response.structured_filters ?? {},
        parsedIntent: response.parsed_intent ?? {},
        popupModel: response.popup_model ?? null,
        sourceType: response.source_type ?? "prompt",
        jobDescription: response.job_description ?? "",
        roleTitle: response.role_title ?? "",
        projectId: response.project_id ?? "",
        requirementsSummary: response.requirements_summary ?? null,
        reasoningSummary: response.reasoning_summary ?? null,
        createdAtMs: Date.now(),
    };
    cachedBootstrap = payload;
    window.sessionStorage.setItem(SEARCH_PAGE_BOOTSTRAP_KEY, JSON.stringify(payload));
}

export function readSearchPageBootstrap(): SearchPageBootstrapPayload | null {
    if (typeof window === "undefined") return null;
    if (cachedBootstrap !== undefined) {
        return cachedBootstrap;
    }

    const raw = window.sessionStorage.getItem(SEARCH_PAGE_BOOTSTRAP_KEY);
    if (!raw) {
        cachedBootstrap = null;
        return null;
    }

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!isBootstrapPayload(parsed)) {
            cachedBootstrap = null;
            window.sessionStorage.removeItem(SEARCH_PAGE_BOOTSTRAP_KEY);
            return null;
        }
        if (Date.now() - parsed.createdAtMs > SEARCH_PAGE_BOOTSTRAP_MAX_AGE_MS) {
            cachedBootstrap = null;
            window.sessionStorage.removeItem(SEARCH_PAGE_BOOTSTRAP_KEY);
            return null;
        }
        cachedBootstrap = parsed;
        return parsed;
    } catch {
        cachedBootstrap = null;
        window.sessionStorage.removeItem(SEARCH_PAGE_BOOTSTRAP_KEY);
        return null;
    }
}

export function clearSearchPageBootstrap(): void {
    cachedBootstrap = null;
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(SEARCH_PAGE_BOOTSTRAP_KEY);
}

export function consumeSearchPageBootstrap(): SearchPageBootstrapPayload | null {
    const payload = readSearchPageBootstrap();
    clearSearchPageBootstrap();
    return payload;
}
