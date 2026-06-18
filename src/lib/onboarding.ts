import { apiRequest } from './api';

export type TourStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export type ChecklistKey =
    | 'first_search'
    | 'save_candidate'
    | 'enrich_contact'
    | 'connect_mailbox'
    | 'first_outreach'
    | 'choose_plan';

export type OnboardingSegment = 'engineering' | 'design' | 'sales' | 'other';

export interface OnboardingState {
    tour_status: TourStatus;
    tour_step: number;
    segment: string | null;
    checklist: Record<ChecklistKey, boolean>;
    checklist_dismissed: boolean;
    completed_at: string | null;
}

export interface OnboardingUpdate {
    tour_status?: TourStatus;
    tour_step?: number;
    segment?: OnboardingSegment;
    checklist_dismissed?: boolean;
    /** Mark a single checklist task complete (idempotent). */
    checklist_task?: ChecklistKey;
}

export const CHECKLIST_KEYS: ChecklistKey[] = [
    'first_search',
    'save_candidate',
    'enrich_contact',
    'connect_mailbox',
    'first_outreach',
    'choose_plan',
];

/** A fresh default — used for instant first paint before the server responds. */
export function defaultOnboardingState(): OnboardingState {
    return {
        tour_status: 'pending',
        tour_step: 0,
        segment: null,
        checklist: {
            first_search: false,
            save_candidate: false,
            enrich_contact: false,
            connect_mailbox: false,
            first_outreach: false,
            choose_plan: false,
        },
        checklist_dismissed: false,
        completed_at: null,
    };
}

/** Project any partial/malformed value (stale localStorage, an empty API body, a
 *  mocked response) onto the full default shape so consumers never crash. */
export function normalizeOnboardingState(raw: unknown): OnboardingState {
    const base = defaultOnboardingState();
    if (!raw || typeof raw !== 'object') return base;
    const r = raw as Partial<OnboardingState>;
    const checklistRaw = (r.checklist && typeof r.checklist === 'object' ? r.checklist : {}) as Record<string, unknown>;
    const checklist = { ...base.checklist };
    for (const key of CHECKLIST_KEYS) checklist[key] = Boolean(checklistRaw[key]);
    return {
        tour_status: r.tour_status ?? base.tour_status,
        tour_step: typeof r.tour_step === 'number' ? r.tour_step : base.tour_step,
        segment: r.segment ?? null,
        checklist,
        checklist_dismissed: Boolean(r.checklist_dismissed),
        completed_at: r.completed_at ?? null,
    };
}

export async function getOnboarding(signal?: AbortSignal): Promise<OnboardingState> {
    return apiRequest<OnboardingState>('/onboarding', { signal });
}

export async function patchOnboarding(update: OnboardingUpdate): Promise<OnboardingState> {
    return apiRequest<OnboardingState>('/onboarding', { method: 'PATCH', body: update });
}

/**
 * Fire-and-forget helper any success handler can call to mark a checklist task
 * without importing the onboarding context. The provider listens for this event.
 */
export function markOnboardingTask(task: ChecklistKey): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('tahoe:onboarding-task', { detail: { task } }));
}
