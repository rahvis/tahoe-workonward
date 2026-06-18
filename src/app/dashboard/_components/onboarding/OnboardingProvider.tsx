'use client';

import { useRouter } from 'next/navigation';
import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    type ChecklistKey,
    type OnboardingSegment,
    type OnboardingState,
    type OnboardingUpdate,
    defaultOnboardingState,
    getOnboarding,
    normalizeOnboardingState,
    patchOnboarding,
} from '@/lib/onboarding';
import { LAST_STEP_INDEX } from './steps';

const LS_KEY = 'tahoe_onboarding';
const SEARCH_ROUTE = '/dashboard/search/new';

interface OnboardingContextValue {
    loaded: boolean;
    state: OnboardingState;
    showWelcome: boolean;
    tourActive: boolean;
    step: number;
    demoActive: boolean;
    showChecklist: boolean;
    setSegment: (segment: OnboardingSegment) => void;
    startTour: () => void;
    advance: () => void;
    back: () => void;
    skip: () => void;
    complete: () => void;
    markTask: (task: ChecklistKey) => void;
    dismissChecklist: () => void;
    relaunch: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

// Safe no-op used when a consumer renders without the provider (e.g. unit tests,
// or a surface mounted outside the dashboard). Onboarding simply stays inactive.
const NOOP_ONBOARDING: OnboardingContextValue = {
    loaded: false,
    state: defaultOnboardingState(),
    showWelcome: false,
    tourActive: false,
    step: 0,
    demoActive: false,
    showChecklist: false,
    setSegment: () => {},
    startTour: () => {},
    advance: () => {},
    back: () => {},
    skip: () => {},
    complete: () => {},
    markTask: () => {},
    dismissChecklist: () => {},
    relaunch: () => {},
};

export function useOnboarding(): OnboardingContextValue {
    return useContext(OnboardingContext) ?? NOOP_ONBOARDING;
}

function readLocal(): OnboardingState | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(LS_KEY);
        return raw ? normalizeOnboardingState(JSON.parse(raw)) : null;
    } catch {
        return null;
    }
}

function writeLocal(state: OnboardingState) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
        /* private mode / quota — ignore */
    }
}

export default function OnboardingProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [state, setState] = useState<OnboardingState>(() => readLocal() ?? defaultOnboardingState());
    const [loaded, setLoaded] = useState(false);

    // Keep a synchronous mirror so actions compute from the freshest value.
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // Server is the source of truth; reconcile localStorage on mount.
    useEffect(() => {
        const ctrl = new AbortController();
        getOnboarding(ctrl.signal)
            .then((raw) => {
                const server = normalizeOnboardingState(raw);
                stateRef.current = server;
                setState(server);
                writeLocal(server);
            })
            .catch(() => {
                /* offline → keep local/default */
            })
            .finally(() => setLoaded(true));
        return () => ctrl.abort();
    }, []);

    // Fire-and-forget persistence. We do NOT apply the response to state: the
    // optimistic local value is the session source of truth, and applying out-of-
    // order responses could revert a newer step. The next GET reconciles.
    const serverPatch = useCallback((update: OnboardingUpdate) => {
        patchOnboarding(update).catch(() => {
            /* keep optimistic local state; reconciles on next load */
        });
    }, []);

    // Optimistically apply locally + persist to the server.
    const apply = useCallback(
        (patch: Partial<OnboardingState>, update: OnboardingUpdate) => {
            const next = { ...stateRef.current, ...patch };
            stateRef.current = next;
            setState(next);
            writeLocal(next);
            serverPatch(update);
        },
        [serverPatch],
    );

    const setSegment = useCallback(
        (segment: OnboardingSegment) => apply({ segment }, { segment }),
        [apply],
    );

    const goSearch = useCallback(() => router.push(SEARCH_ROUTE), [router]);

    const startTour = useCallback(() => {
        apply({ tour_status: 'in_progress', tour_step: 0 }, { tour_status: 'in_progress', tour_step: 0 });
        goSearch();
    }, [apply, goSearch]);

    const complete = useCallback(
        () =>
            apply(
                { tour_status: 'completed', completed_at: new Date().toISOString() },
                { tour_status: 'completed' },
            ),
        [apply],
    );

    const advance = useCallback(() => {
        const prev = stateRef.current;
        if (prev.tour_step >= LAST_STEP_INDEX) {
            complete();
            return;
        }
        const step = prev.tour_step + 1;
        apply({ tour_step: step }, { tour_step: step });
    }, [apply, complete]);

    const back = useCallback(() => {
        const step = Math.max(0, stateRef.current.tour_step - 1);
        apply({ tour_step: step }, { tour_step: step });
    }, [apply]);

    const skip = useCallback(
        () => apply({ tour_status: 'skipped' }, { tour_status: 'skipped' }),
        [apply],
    );

    const markTask = useCallback(
        (task: ChecklistKey) => {
            if (stateRef.current.checklist[task]) return; // already done — no churn
            apply(
                { checklist: { ...stateRef.current.checklist, [task]: true } },
                { checklist_task: task },
            );
        },
        [apply],
    );

    const dismissChecklist = useCallback(
        () => apply({ checklist_dismissed: true }, { checklist_dismissed: true }),
        [apply],
    );

    const relaunch = useCallback(() => {
        apply(
            { tour_status: 'in_progress', tour_step: 0, checklist_dismissed: false },
            { tour_status: 'in_progress', tour_step: 0, checklist_dismissed: false },
        );
        goSearch();
    }, [apply, goSearch]);

    // Let any success handler mark a checklist task via a window event.
    useEffect(() => {
        const handler = (event: Event) => {
            const task = (event as CustomEvent).detail?.task as ChecklistKey | undefined;
            if (task) markTask(task);
        };
        window.addEventListener('tahoe:onboarding-task', handler as EventListener);
        return () => window.removeEventListener('tahoe:onboarding-task', handler as EventListener);
    }, [markTask]);

    // Relaunch the tour from the sidebar Help button (decoupled via an event so the
    // layout doesn't need to consume this context).
    useEffect(() => {
        const handler = () => relaunch();
        window.addEventListener('tahoe:onboarding-relaunch', handler);
        return () => window.removeEventListener('tahoe:onboarding-relaunch', handler);
    }, [relaunch]);

    const value = useMemo<OnboardingContextValue>(
        () => ({
            loaded,
            state,
            showWelcome: loaded && state.tour_status === 'pending',
            // Gate on `loaded` so the first client render matches SSR (no overlay)
            // and we never act on stale localStorage before the server confirms.
            tourActive: loaded && state.tour_status === 'in_progress',
            step: state.tour_step,
            // Demo results appear once the user "runs" the example (step >= 1).
            demoActive: loaded && state.tour_status === 'in_progress' && state.tour_step >= 1,
            showChecklist: loaded && state.tour_status !== 'pending' && !state.checklist_dismissed,
            setSegment,
            startTour,
            advance,
            back,
            skip,
            complete,
            markTask,
            dismissChecklist,
            relaunch,
        }),
        [loaded, state, setSegment, startTour, advance, back, skip, complete, markTask, dismissChecklist, relaunch],
    );

    return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
