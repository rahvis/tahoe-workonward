export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    const token =
        typeof window !== "undefined" ? localStorage.getItem("tahoe_token") : null;

    const config: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
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
