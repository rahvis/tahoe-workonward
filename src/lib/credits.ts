// Per-action credit costs + the suppressible-confirm preference.
//
// The authoritative source is the backend rate card (`/billing/catalog` → rate_card);
// the constants below are the synchronous fallback and match pricing.md §3.1. Sending
// outreach is free; a failed reveal is free (success-based billing).
import { fetchBillingCatalog } from './organization';

export type CreditAction = 'search' | 'personal_email' | 'phone' | 'work_email' | 'outreach';

export const ACTION_COST: Record<CreditAction, number> = {
    search: 2,
    personal_email: 3,
    phone: 10,
    work_email: 1,
    outreach: 0,
};

// rate_card key (backend) → our action key.
const RATE_CARD_MAP: Record<string, CreditAction> = {
    search_preview_page_fetched_from_provider: 'search',
    personal_email_found: 'personal_email',
    phone_found: 'phone',
    work_email_found: 'work_email',
    outreach_email_sent: 'outreach',
};

let cachedCosts: Record<CreditAction, number> | null = null;

/** Load per-action costs from the live rate card (cached). Falls back to ACTION_COST. */
export async function loadActionCosts(): Promise<Record<CreditAction, number>> {
    if (cachedCosts) return cachedCosts;
    try {
        const catalog = await fetchBillingCatalog();
        const costs = { ...ACTION_COST };
        for (const [rateKey, action] of Object.entries(RATE_CARD_MAP)) {
            const value = catalog.rate_card?.[rateKey];
            if (typeof value === 'number') costs[action] = value;
        }
        cachedCosts = costs;
        return costs;
    } catch {
        return { ...ACTION_COST };
    }
}

export function creditLabel(n: number): string {
    return `${n} credit${n === 1 ? '' : 's'}`;
}

// ── Per-device "don't show credit confirmations again" preference ───────────────
const SUPPRESS_KEY = 'tahoe_suppress_credit_confirm';
export const CREDIT_PREF_EVENT = 'tahoe:credit-confirm-pref';

export function isCreditConfirmSuppressed(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(SUPPRESS_KEY) === '1';
    } catch {
        return false;
    }
}

export function setCreditConfirmSuppressed(suppressed: boolean): void {
    if (typeof window === 'undefined') return;
    try {
        if (suppressed) window.localStorage.setItem(SUPPRESS_KEY, '1');
        else window.localStorage.removeItem(SUPPRESS_KEY);
        window.dispatchEvent(new Event(CREDIT_PREF_EVENT));
    } catch {
        /* private mode / quota — ignore */
    }
}
