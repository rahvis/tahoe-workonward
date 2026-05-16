'use client';

const cache = new Map<string, unknown>();

export function readAnalyticsCache<T>(key: string): T | null {
    return (cache.get(key) as T | undefined) ?? null;
}

export function writeAnalyticsCache<T>(key: string, value: T) {
    cache.set(key, value);
}

export function clearAnalyticsCache() {
    cache.clear();
}
