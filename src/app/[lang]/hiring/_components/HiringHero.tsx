'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import page from '../../page.module.css';
import styles from '../hiring.module.css';
import MatchRadar, { type Axis } from './MatchRadar';

type Frame = { key: string; label: string; tag: string; title: string; lines: readonly string[] };

const CYCLE_MS = 4200;

/**
 * Animated hero for /hiring — auto-cycles the "agentic hiring loop" frames (mirrors the
 * landing-page hero pattern). The keyed frame card re-mounts to replay a soft entrance.
 * Manual chips scrub; hover pauses; `prefers-reduced-motion` stops the auto-cycle.
 * The copy (h1/lede/CTAs) is server-rendered HTML even though this is a client island.
 */
export default function HiringHero({
    h1,
    lede,
    ctaStart,
    ctaStartNote,
    demoCta,
    framesLabel,
    frames,
    matchAxes,
    matchRequired,
    radarAria,
    signupHref,
    demoUrl,
}: {
    h1: string;
    lede: string;
    ctaStart: string;
    ctaStartNote: string;
    demoCta: string;
    framesLabel: string;
    frames: readonly Frame[];
    matchAxes: readonly Axis[];
    matchRequired: number;
    radarAria: string;
    signupHref: string;
    demoUrl: string;
}) {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const id = window.setInterval(() => setActive((i) => (i + 1) % frames.length), CYCLE_MS);
        return () => window.clearInterval(id);
    }, [paused, frames.length]);

    const frame = frames[active];

    return (
        <section className={styles.hero}>
            <div className={page.container}>
                <div className={styles.heroGrid}>
                    <div className={styles.heroCopy}>
                        <h1 className={styles.heroTitle}>{h1}</h1>
                        <p className={styles.heroLede}>{lede}</p>
                        <div className={styles.heroActions}>
                            <Link href={signupHref} className={page.primaryAction}>{ctaStart}</Link>
                            <a href={demoUrl} target="_blank" rel="noreferrer" className={page.heroDemoAction}>{demoCta}</a>
                        </div>
                        <p className={styles.heroNote}>{ctaStartNote}</p>
                    </div>

                    <div
                        className={styles.heroVisual}
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                    >
                        <div className={styles.frameChips} role="tablist" aria-label={framesLabel}>
                            {frames.map((f, i) => (
                                <button
                                    key={f.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={i === active}
                                    className={i === active ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                                    onClick={() => setActive(i)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div key={frame.key} className={styles.frameCard}>
                            <span className={styles.frameTag}>{frame.tag}</span>
                            <div className={styles.frameTitle}>{frame.title}</div>
                            {frame.key === 'rank' ? (
                                <div className={styles.frameRadar}>
                                    <MatchRadar axes={matchAxes} required={matchRequired} compact ariaLabel={radarAria} />
                                </div>
                            ) : null}
                            <ul className={styles.frameLines}>
                                {frame.lines.map((line) => (
                                    <li key={line}>{line}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
