// Timezone metadata + search helpers backing the shared TimezonePicker.
//
// We source the full IANA list from `Intl.supportedValuesOf('timeZone')` (supported in every
// modern browser and Node 18+) and merge a small fallback so UTC/common business zones are always
// present — Chrome historically omits the `Etc/*` zones (including plain `UTC`). All logic here is
// pure so it can be unit-tested without rendering the component.

export interface ZoneMeta {
    id: string; // canonical IANA id, e.g. "America/Los_Angeles"
    label: string; // display form, underscores -> spaces
    city: string; // last path segment, underscores -> spaces
    region: string; // first path segment
    offsetMinutes: number; // current UTC offset in minutes, e.g. -420
    offsetLabel: string; // "GMT-07:00"
    abbreviation: string; // "PDT" (empty when no alpha abbreviation exists)
    search: string; // lowercased haystack for substring matching
}

const COMMON_FALLBACK = [
    'UTC',
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
];

export function isValidZone(zone: string): boolean {
    if (!zone) return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: zone });
        return true;
    } catch {
        return false;
    }
}

export function detectTimezone(): string | null {
    try {
        return new Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch {
        return null;
    }
}

function listZones(): string[] {
    let zones: string[] = [];
    try {
        const supported = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
        if (typeof supported === 'function') {
            zones = supported('timeZone');
        }
    } catch {
        // fall through to the fallback list
    }
    return [...new Set([...zones, ...COMMON_FALLBACK])];
}

function formatOffsetLabel(minutes: number): string {
    const sign = minutes < 0 ? '-' : '+';
    const abs = Math.abs(minutes);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    return `GMT${sign}${hh}:${mm}`;
}

function offsetMinutesFor(zone: string, now: Date): number {
    try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(now);
        const token = parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
        const match = token.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
        if (!match) return 0; // bare "GMT" => UTC
        const sign = match[1] === '-' ? -1 : 1;
        const hours = parseInt(match[2], 10);
        const mins = match[3] ? parseInt(match[3], 10) : 0;
        return sign * (hours * 60 + mins);
    } catch {
        return 0;
    }
}

function abbreviationFor(zone: string, now: Date): string {
    try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'short' }).formatToParts(now);
        const token = parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
        // 'short' falls back to "GMT-7" for zones without an alpha abbreviation; keep only real abbreviations.
        return /^[A-Za-z]{2,5}$/.test(token) ? token : '';
    } catch {
        return '';
    }
}

function buildZoneMeta(id: string, now: Date): ZoneMeta {
    const segments = id.split('/');
    const region = segments[0] ?? id;
    const city = (segments[segments.length - 1] ?? id).replace(/_/g, ' ');
    const label = id.replace(/_/g, ' ');
    const offsetMinutes = id === 'UTC' ? 0 : offsetMinutesFor(id, now);
    const offsetLabel = formatOffsetLabel(offsetMinutes);
    const abbreviation = id === 'UTC' ? 'UTC' : abbreviationFor(id, now);
    const looseOffset = `gmt${offsetMinutes < 0 ? '-' : '+'}${Math.abs(Math.trunc(offsetMinutes / 60))}`;
    const search = [id, label, city, region, offsetLabel, abbreviation, looseOffset].join(' ').toLowerCase();
    return { id, label, city, region, offsetMinutes, offsetLabel, abbreviation, search };
}

// Build sorted metadata for every known zone. `ensure` guarantees a stored value (e.g. a valid but
// unlisted alias like "Asia/Calcutta") is present and self-matchable.
export function buildZones(now: Date, ensure?: string | null): ZoneMeta[] {
    const ids = listZones();
    if (ensure && isValidZone(ensure) && !ids.includes(ensure)) {
        ids.push(ensure);
    }
    return ids.map((id) => buildZoneMeta(id, now)).sort((a, b) => a.label.localeCompare(b.label));
}

// Maps offset-style queries ("gmt-7", "-7", "utc+5:30", "+05:30") to the canonical offset label.
export function normalizeOffsetQuery(query: string): string | null {
    const q = query.trim().toLowerCase().replace(/\s+/g, '');
    if (q === 'utc' || q === 'gmt') return 'GMT+00:00';
    const match = q.match(/^(?:gmt|utc)?([+-])(\d{1,2})(?::?(\d{2}))?$/);
    if (!match) return null;
    const sign = match[1] === '-' ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const mins = match[3] ? parseInt(match[3], 10) : 0;
    if (hours > 14 || mins > 59) return null;
    return formatOffsetLabel(sign * (hours * 60 + mins));
}

function scoreZone(query: string, offsetQuery: string | null, zone: ZoneMeta): number {
    const id = zone.id.toLowerCase();
    const city = zone.city.toLowerCase();
    const region = zone.region.toLowerCase();
    const abbr = zone.abbreviation.toLowerCase();
    if (id === query) return 0;
    if (city === query) return 1;
    if (abbr && abbr === query) return 2;
    if (city.startsWith(query)) return 3;
    if (region.startsWith(query)) return 4;
    if (offsetQuery && zone.offsetLabel === offsetQuery) return 5;
    if (zone.search.includes(query)) return 6;
    return Number.POSITIVE_INFINITY;
}

function suggestDefaults(meta: ZoneMeta[], detected: string | null, limit: number): ZoneMeta[] {
    const byId = new Map(meta.map((zone) => [zone.id, zone]));
    const out: ZoneMeta[] = [];
    const seen = new Set<string>();
    const push = (zone?: ZoneMeta) => {
        if (zone && !seen.has(zone.id)) {
            seen.add(zone.id);
            out.push(zone);
        }
    };
    if (detected) push(byId.get(detected));
    for (const id of COMMON_FALLBACK) push(byId.get(id));
    return out.slice(0, limit);
}

// Returns the top matches for a query (default 5). An empty query surfaces the detected zone first,
// then the common business zones — the "first few nearest" behavior the picker shows on focus.
export function rankZones(
    query: string,
    meta: ZoneMeta[],
    options: { limit?: number; detected?: string | null } = {},
): ZoneMeta[] {
    const limit = options.limit ?? 5;
    const q = query.trim().toLowerCase();
    if (!q) {
        return suggestDefaults(meta, options.detected ?? null, limit);
    }
    const offsetQuery = normalizeOffsetQuery(q);
    const scored: { zone: ZoneMeta; score: number }[] = [];
    for (const zone of meta) {
        const score = scoreZone(q, offsetQuery, zone);
        if (score < Number.POSITIVE_INFINITY) scored.push({ zone, score });
    }
    scored.sort(
        (a, b) =>
            a.score - b.score ||
            a.zone.offsetMinutes - b.zone.offsetMinutes ||
            a.zone.label.localeCompare(b.zone.label),
    );
    return scored.slice(0, limit).map((entry) => entry.zone);
}
