'use client';
import { useEffect, useState } from 'react';
import styles from './water-waves.module.css';

/**
 * Animated water for the Our Story pull quotes. Instead of static concentric
 * rings, each quote gets a scatter of thin wave lines that drift like a current.
 * Lines are generated on mount (so each quote, and each page load, looks a little
 * different and natural) across three loose zones: the left margin, the right
 * margin, and behind the quote itself. Each line loops seamlessly because it
 * translates by exactly one container width, which is a whole number of wave
 * periods. Respects prefers-reduced-motion.
 */

type Wave = {
    id: number;
    left: number; // %
    top: number; // %
    width: number; // px (visible window)
    svgW: number;
    svgH: number;
    amp: number;
    period: number;
    strokeWidth: number;
    opacity: number;
    duration: number; // s
    delay: number; // s
    reverse: boolean;
    path: string;
};

const rnd = (a: number, b: number) => Math.random() * (b - a) + a;

// A smooth sine-like wave path spanning [-pad, spanW + pad], oscillating ±amp
// around a baseline. The over-scan keeps the wave continuous at both edges.
function buildWave(spanW: number, amp: number, period: number): string {
    const half = period / 2;
    const y = amp + 1;
    const pad = period;
    let d = `M ${-pad} ${y} q ${half / 2} ${-amp} ${half} 0`;
    for (let x = -pad + half; x < spanW + pad; x += half) {
        d += ` t ${half} 0`;
    }
    return d;
}

function makeWaves(): Wave[] {
    // [leftMin%, leftMax%, countMin, countMax]
    const zones: [number, number, number, number][] = [
        [-2, 14, 2, 3], // left margin
        [78, 92, 2, 3], // right margin
        [22, 66, 1, 3], // behind the quote
    ];
    const waves: Wave[] = [];
    let id = 0;
    for (const [lmin, lmax, cmin, cmax] of zones) {
        const n = Math.round(rnd(cmin, cmax));
        for (let i = 0; i < n; i++) {
            const width = rnd(64, 168);
            const amp = rnd(2.5, 6);
            const desiredPeriod = rnd(34, 58);
            const k = Math.max(1, Math.round(width / desiredPeriod));
            const period = width / k; // divides width -> seamless loop
            const svgW = width * 2;
            const svgH = amp * 2 + 4;
            waves.push({
                id: id++,
                left: rnd(lmin, lmax),
                top: rnd(6, 86),
                width,
                svgW,
                svgH,
                amp,
                period,
                strokeWidth: rnd(0.7, 1.1),
                opacity: rnd(0.1, 0.34),
                duration: rnd(7, 16),
                delay: -rnd(0, 12),
                reverse: Math.random() < 0.5,
                path: buildWave(svgW, amp, period),
            });
        }
    }
    return waves;
}

export default function WaterWaves() {
    // Generate on the client only, so the scatter is fresh each load and there
    // is no server/client hydration mismatch from Math.random. Deferred to the
    // next frame so it runs after first paint rather than as a sync re-render.
    const [waves, setWaves] = useState<Wave[]>([]);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setWaves(makeWaves()));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className={styles.layer} aria-hidden="true">
            {waves.map((w) => (
                <div
                    key={w.id}
                    className={styles.wave}
                    style={{
                        left: `${w.left}%`,
                        top: `${w.top}%`,
                        width: `${w.width}px`,
                        height: `${w.svgH}px`,
                        opacity: w.opacity,
                    }}
                >
                    <svg
                        className={w.reverse ? styles.flowReverse : styles.flow}
                        width={w.svgW}
                        height={w.svgH}
                        viewBox={`0 0 ${w.svgW} ${w.svgH}`}
                        fill="none"
                        stroke="#3f6f80"
                        strokeWidth={w.strokeWidth}
                        strokeLinecap="round"
                        style={
                            {
                                '--flow-shift': `-${w.width}px`,
                                animationDuration: `${w.duration}s`,
                                animationDelay: `${w.delay}s`,
                            } as React.CSSProperties
                        }
                    >
                        <path d={w.path} />
                    </svg>
                </div>
            ))}
        </div>
    );
}
