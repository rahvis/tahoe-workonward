'use client';

import { type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LAST_STEP_INDEX, TOUR_STEPS, type TooltipPlacement } from './steps';
import { useOnboarding } from './OnboardingProvider';
import styles from './spotlight.module.css';

interface Rect { top: number; left: number; width: number; height: number; }

function readRect(anchor: string): Rect | null {
    if (typeof document === 'undefined') return null;
    const el = document.querySelector<HTMLElement>(`[data-onboarding="${anchor}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const CARD_W = 320;
const GAP = 14;

function tooltipStyle(rect: Rect | null, placement: TooltipPlacement = 'bottom'): CSSProperties {
    if (typeof window === 'undefined' || !rect) {
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = rect.left;
    if (placement === 'right') left = rect.left + rect.width + GAP;
    else if (placement === 'left') left = rect.left - CARD_W - GAP;
    left = Math.max(12, Math.min(left, vw - CARD_W - 12));

    if (placement === 'top') {
        // anchor the card's bottom just above the target
        return { left, width: CARD_W, bottom: Math.max(12, vh - rect.top + GAP) };
    }
    const top = placement === 'bottom' ? rect.top + rect.height + GAP : rect.top;
    return { left, width: CARD_W, top: Math.max(12, Math.min(top, vh - 240)) };
}

export default function SpotlightTour() {
    const { tourActive, step, advance, back, skip } = useOnboarding();
    const [rect, setRect] = useState<Rect | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const stepConfig = tourActive ? TOUR_STEPS[step] : undefined;
    const anchor = stepConfig?.anchor;

    // Measure the target (poll for late-rendered anchors); reposition on resize/scroll.
    // All setRect calls run inside rAF/timeout/event callbacks (never synchronously
    // in the effect body) so they don't trigger cascading renders.
    useEffect(() => {
        if (!tourActive || !anchor) {
            const clear = requestAnimationFrame(() => setRect(null));
            return () => cancelAnimationFrame(clear);
        }
        let timer = 0;
        let attempts = 0;
        const measure = () => {
            const r = readRect(anchor);
            setRect(r);
            if (!r && attempts < 60) {
                attempts += 1;
                timer = window.setTimeout(measure, 80);
            }
        };
        const raf = requestAnimationFrame(measure);
        const onChange = () => setRect(readRect(anchor));
        window.addEventListener('resize', onChange);
        window.addEventListener('scroll', onChange, true);
        return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(timer);
            window.removeEventListener('resize', onChange);
            window.removeEventListener('scroll', onChange, true);
        };
    }, [tourActive, anchor, step]);

    // Focus the card + global keyboard nav (Esc / arrows / Enter).
    useEffect(() => {
        if (!tourActive) return;
        cardRef.current?.focus();
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); skip(); }
            else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); advance(); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [tourActive, step, advance, back, skip]);

    if (!tourActive || !stepConfig || typeof document === 'undefined') return null;

    const isLast = step >= LAST_STEP_INDEX;
    const box = rect
        ? { top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }
        : null;

    // Keep Tab focus inside the card.
    const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Tab') return;
        const buttons = cardRef.current?.querySelectorAll<HTMLElement>('button');
        if (!buttons || buttons.length === 0) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    return createPortal(
        <div className={styles.layer}>
            <div className={styles.scrim} style={rect ? undefined : { background: 'rgba(20, 20, 20, 0.6)' }} />
            {box && <div className={styles.spotlight} style={box} />}
            {box && <div className={styles.ring} style={box} />}
            <div
                ref={cardRef}
                className={styles.card}
                style={tooltipStyle(rect, stepConfig.placement)}
                role="dialog"
                aria-modal="true"
                aria-label={stepConfig.title}
                tabIndex={-1}
                onKeyDown={trapTab}
            >
                <div className={styles.stepCount} aria-live="polite">Step {step + 1} of {TOUR_STEPS.length}</div>
                <h3 className={styles.title}>{stepConfig.title}</h3>
                <p className={styles.body}>{stepConfig.body}</p>
                {stepConfig.note && <p className={styles.note}>{stepConfig.note}</p>}
                <div className={styles.footer}>
                    <div className={styles.dots} aria-hidden="true">
                        {TOUR_STEPS.map((_, i) => (
                            <span key={i} className={i === step ? styles.dotActive : styles.dot} />
                        ))}
                    </div>
                    <div className={styles.actions}>
                        {step > 0 && <button className={styles.ghostBtn} type="button" onClick={back}>Back</button>}
                        <button className={styles.ghostBtn} type="button" onClick={skip}>Skip</button>
                        <button className={styles.primaryBtn} type="button" onClick={advance}>
                            {stepConfig.primaryLabel ?? (isLast ? 'Finish' : 'Next')}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
