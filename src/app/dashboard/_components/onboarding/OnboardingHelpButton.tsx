'use client';

import dashStyles from '@/app/dashboard/dashboard.module.css';
import { useOnboarding } from './OnboardingProvider';

/**
 * Sidebar "? Getting started" button. Relaunches the tour. It disappears once the
 * user has finished every step (tour_status === 'completed') — at that point the
 * walkthrough has served its purpose and the durable checklist remains available.
 * Rendered inside <OnboardingProvider> so it can read state/relaunch directly.
 */
export default function OnboardingHelpButton({ collapsed }: { collapsed: boolean }) {
    const { state, relaunch } = useOnboarding();

    if (state.tour_status === 'completed') return null;

    return (
        <button className={dashStyles.navButton} type="button" onClick={relaunch} aria-label="Getting started">
            <span className={dashStyles.navIcon} aria-hidden="true">?</span>
            {!collapsed ? <span className={dashStyles.navLabel}>Getting started</span> : null}
        </button>
    );
}
