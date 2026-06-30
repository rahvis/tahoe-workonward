/**
 * Recruiter-facing "Match" presentation for the raw relevance score.
 *
 * The backend `score` is the search provider's relevance score (Coresignal /
 * Elasticsearch `_score`): an unbounded, query-dependent number — observed in
 * the wild roughly in the 10–90 band, with strong agentic-search matches landing
 * in the mid-50s. A bare "54.66" means nothing to a recruiter, so we present it
 * two ways at once:
 *
 *   A) an absolute Match % — a fixed affine map onto 0–100, clamped, so the value
 *      is stable, sortable, and comparable across queries; and
 *   B) a coarse tier (Strong / Good / Possible) for an at-a-glance, colored chip.
 *
 * The scale is ABSOLUTE (not normalized against the result set) on purpose: a
 * query that only surfaces weak matches should top out at a lower tier rather
 * than inflating its best-of-a-bad-bunch hit to "Strong".
 *
 * MATCH_FLOOR / MATCH_CEIL are the calibrated anchors — tune them here (one
 * place) as real score distributions are observed. FLOOR→0%, CEIL→100%.
 */

export const MATCH_FLOOR = 10;
export const MATCH_CEIL = 60;

// Tier cutoffs are expressed on the Match % (single source of truth).
const STRONG_MIN_PCT = 80;
const GOOD_MIN_PCT = 50;

export type MatchTier = "strong" | "good" | "possible";

export interface MatchScore {
    /** 0–100, rounded and clamped. */
    pct: number;
    tier: MatchTier;
    /** Capitalized tier label, e.g. "Strong". */
    label: string;
}

const TIER_LABEL: Record<MatchTier, string> = {
    strong: "Strong",
    good: "Good",
    possible: "Possible",
};

/**
 * Map a raw relevance score onto a recruiter-facing Match % + tier.
 * Returns `null` when there is no score to show.
 */
export function scoreToMatch(raw: number | null | undefined): MatchScore | null {
    if (raw == null || Number.isNaN(raw)) return null;

    const ratio = (raw - MATCH_FLOOR) / (MATCH_CEIL - MATCH_FLOOR);
    const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
    const tier: MatchTier =
        pct >= STRONG_MIN_PCT ? "strong" : pct >= GOOD_MIN_PCT ? "good" : "possible";

    return { pct, tier, label: TIER_LABEL[tier] };
}
