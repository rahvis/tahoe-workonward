export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TourStep {
    /** Matches `data-onboarding="…"` on the real element to spotlight. */
    anchor: string;
    title: string;
    body: string;
    /** Optional secondary line (e.g. credits/gate/honesty note). */
    note?: string;
    /** Override the primary button label (default "Next"; last step = "Finish"). */
    primaryLabel?: string;
    placement?: TooltipPlacement;
}

/**
 * The 5-step interactive tour. Anchors are chosen to be reliably present on the
 * search page while in demo mode (search-bar, filters, result-row) or always
 * present in the shell (credits panel, mailboxes nav) — so a step never dangles.
 */
export const TOUR_STEPS: TourStep[] = [
    {
        anchor: 'search-bar',
        title: 'Describe who you want',
        body: "This is where you type who you're looking for in plain English — no boolean strings.",
        note: 'Hit Run search to see example matches — no real search runs during the tour.',
        primaryLabel: 'Run search',
        placement: 'bottom',
    },
    {
        anchor: 'filters',
        title: 'Your words became filters',
        body: 'Tahoe turns your query into editable filters — tweak or remove any of them.',
        placement: 'bottom',
    },
    {
        anchor: 'result-row',
        title: 'Ranked example matches',
        body: 'Candidates are ranked with a clear match score and the evidence behind each one.',
        note: '👋 These are example candidates so you can see how Tahoe works — not real people. You’ll search real profiles right after this.',
        placement: 'top',
    },
    {
        anchor: 'credits',
        title: 'Save, then reveal contacts',
        body: 'Save people to a project, then enrich to reveal a verified work email and mobile.',
        note: 'Enrichment uses Enrich credits and needs an active plan.',
        placement: 'right',
    },
    {
        anchor: 'mailboxes',
        title: 'Reach out from your own inbox',
        body: 'Connect your mailbox once — Tahoe sends as you, and replies land in your inbox.',
        primaryLabel: 'Finish',
        placement: 'right',
    },
];

export const LAST_STEP_INDEX = TOUR_STEPS.length - 1;
