"use client";

import type { SavedSearchRerunResponse } from "@/lib/api";

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
