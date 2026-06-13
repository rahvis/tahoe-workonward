"use client";

import { useEffect, useState } from "react";

import { MicrophoneIcon, StopIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/tahoe-ui";

import styles from "./langgraph-search.module.css";
import type { DictationStatus } from "./useDictation";

const WAVEFORM_BARS = 18;
// Fixed per-bar multipliers give the single amplitude scalar a lively shape.
const BAR_MULTIPLIERS = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
    const center = (WAVEFORM_BARS - 1) / 2;
    const distance = Math.abs(i - center) / center; // 0 at center → 1 at edges
    return 0.45 + (1 - distance) * 0.85;
});

interface MicButtonProps {
    supported: boolean;
    status: DictationStatus;
    /** Live amplitude 0–1 for the waveform. */
    amplitude: number;
    /** Disabled while a search is in flight. */
    disabled?: boolean;
    onStart: () => void;
    onStop: () => void;
}

function formatElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * In-search-bar voice control. Renders a mic toggle docked at the right edge of
 * the search input; while recording it overlays a live waveform with an elapsed
 * timer and a stop button (the Metaview look). Hidden entirely when the browser
 * can't capture audio so typing is never obstructed.
 */
export default function MicButton({
    supported,
    status,
    amplitude,
    disabled = false,
    onStart,
    onStop,
}: MicButtonProps) {
    const [elapsed, setElapsed] = useState(0);
    const recording = status === "recording";
    const transcribing = status === "transcribing";

    useEffect(() => {
        if (!recording) return;
        const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
        // Reset on teardown so the next recording starts the timer from 0:00.
        return () => {
            clearInterval(timer);
            setElapsed(0);
        };
    }, [recording]);

    if (!supported) return null;

    if (recording) {
        return (
            <div className={styles.micWaveformOverlay} role="status" aria-live="polite">
                <span className={styles.micRecordingDot} aria-hidden="true" />
                <div className={styles.micWaveform} aria-label="Recording your search">
                    {BAR_MULTIPLIERS.map((multiplier, i) => {
                        const height = Math.max(0.12, Math.min(1, amplitude * multiplier));
                        return (
                            <span
                                key={i}
                                className={styles.micWaveformBar}
                                style={{ transform: `scaleY(${height})` }}
                            />
                        );
                    })}
                </div>
                <span className={styles.micElapsed}>{formatElapsed(elapsed)}</span>
                <button
                    type="button"
                    className={styles.micStopButton}
                    onClick={onStop}
                    aria-label="Stop recording"
                >
                    <StopIcon width="14" height="14" />
                </button>
            </div>
        );
    }

    return (
        <button
            type="button"
            className={styles.micButton}
            onClick={onStart}
            disabled={disabled || transcribing}
            aria-label={transcribing ? "Transcribing your search" : "Start voice search"}
            title="Search by voice"
        >
            {transcribing ? <Spinner size="1" /> : <MicrophoneIcon width="18" height="18" />}
        </button>
    );
}
