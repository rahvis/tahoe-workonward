'use client';

import { useEffect, useRef, useState } from 'react';
import Confetti from '../Confetti';
import { useOnboarding } from './OnboardingProvider';
import styles from './celebration.module.css';

/**
 * Brief confetti + toast shown EXACTLY ONCE — the moment the user finishes the
 * tour in this session. It keys off `justCompleted` (a rising edge set only by the
 * complete() action), so a later login that merely loads an already-completed
 * state never re-triggers it.
 */
export default function OnboardingCelebration() {
    const { justCompleted } = useOnboarding();
    const fired = useRef(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!justCompleted || fired.current) return;
        fired.current = true; // guard against any re-run within the session
        // Defer the setState so it isn't a synchronous set-state-in-effect.
        const raf = requestAnimationFrame(() => setShow(true));
        const hide = window.setTimeout(() => setShow(false), 2600);
        return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(hide);
        };
    }, [justCompleted]);

    if (!show) return null;

    return (
        <div className={styles.layer}>
            <Confetti count={32} />
            <div className={styles.toast}>
                <strong>You&apos;re set up.</strong>
                <span>Finish the checklist to get your first reply — we saved your spot.</span>
            </div>
        </div>
    );
}
