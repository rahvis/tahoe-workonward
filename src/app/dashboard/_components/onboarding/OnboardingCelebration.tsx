'use client';

import { useEffect, useRef, useState } from 'react';
import Confetti from '../Confetti';
import { useOnboarding } from './OnboardingProvider';
import styles from './celebration.module.css';

/** Brief confetti + toast when the tour transitions to completed (this session only). */
export default function OnboardingCelebration() {
    const { state } = useOnboarding();
    const prevStatus = useRef(state.tour_status);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const justCompleted = prevStatus.current !== 'completed' && state.tour_status === 'completed';
        prevStatus.current = state.tour_status;
        if (!justCompleted) return;
        // Defer the setState so it isn't a synchronous set-state-in-effect.
        const raf = requestAnimationFrame(() => setShow(true));
        const hide = window.setTimeout(() => setShow(false), 2600);
        return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(hide);
        };
    }, [state.tour_status]);

    if (!show) return null;

    return (
        <div className={styles.layer}>
            <Confetti count={32} />
            <div className={styles.toast}>
                <strong>🎉 You&apos;re set up.</strong>
                <span>Finish the checklist to get your first reply — we saved your spot.</span>
            </div>
        </div>
    );
}
