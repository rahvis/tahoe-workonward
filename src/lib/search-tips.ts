/**
 * Search-tips hint gating.
 *
 * The search page shows a small orange "Search tips & tricks" link next to the
 * recruiter workflow rail. It is meant to nudge new recruiters toward writing
 * better natural-language queries, then get out of the way:
 *   - it shows for the user's first {@link SEARCH_TIP_MAX_LOGINS} logins, then
 *     auto-hides forever;
 *   - the user can dismiss it at any time via the "×" control.
 *
 * The login counter is incremented from `setToken()` (the single choke point
 * every successful login passes through), so it tracks logins rather than page
 * loads. All state lives in localStorage and is best-effort (storage failures
 * are swallowed so they can never break auth or the search page).
 */

const LOGIN_COUNT_KEY = 'tahoe_search_tip_login_count';
const DISMISSED_KEY = 'tahoe_search_tip_dismissed';

/** Destination for the tip link (opens in a new tab). */
export const SEARCH_TIPS_URL = 'https://tahoe.workonward.com/en/resources/search-tips-and-tricks';

/** Number of logins the tip stays visible before it auto-hides. */
export const SEARCH_TIP_MAX_LOGINS = 5;

/** Increment the login counter. Called once per successful login. */
export function recordLoginForSearchTip(): void {
    if (typeof window === 'undefined') return;
    try {
        const prev = Number(window.localStorage.getItem(LOGIN_COUNT_KEY) ?? '0');
        const next = Number.isFinite(prev) && prev > 0 ? prev + 1 : 1;
        window.localStorage.setItem(LOGIN_COUNT_KEY, String(next));
    } catch {
        // Storage unavailable (private mode / quota) — silently skip.
    }
}

function getLoginCount(): number {
    if (typeof window === 'undefined') return 0;
    try {
        const value = Number(window.localStorage.getItem(LOGIN_COUNT_KEY) ?? '0');
        return Number.isFinite(value) ? value : 0;
    } catch {
        return 0;
    }
}

/** True once the user has explicitly hidden the tip. */
export function isSearchTipDismissed(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
        return false;
    }
}

/** Permanently hide the tip for this user/device. */
export function dismissSearchTip(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
        // Ignore — worst case the tip reappears next load.
    }
}

/**
 * Whether the tip link should render. Hidden once dismissed, and auto-hidden
 * after the first {@link SEARCH_TIP_MAX_LOGINS} logins. A count of 0 (existing
 * session that predates this feature) still counts as "early", so the tip shows.
 *
 * Must only be called on the client (reads localStorage); gate it behind an
 * effect to avoid SSR/hydration mismatches.
 */
export function shouldShowSearchTip(): boolean {
    if (isSearchTipDismissed()) return false;
    return getLoginCount() <= SEARCH_TIP_MAX_LOGINS;
}
