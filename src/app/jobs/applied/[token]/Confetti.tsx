'use client';

import { useMemo } from 'react';
import styles from './confetti.module.css';

// Soft, celebratory palette (greens + brand accent + neutrals).
const COLORS = ['#4caf7d', '#7fc2a0', '#ff682c', '#ffd9c7', '#cfe8d8'];

// Deterministic pseudo-random in [0,1) per (index, salt): pure (no Math.random,
// no Date) so it satisfies the purity rule and renders identically on server +
// client (no hydration mismatch), while still scattering the pieces.
function rand(i: number, salt: number): number {
    return (((i + 1) * (salt * 9301 + 49297)) % 233280) / 233280;
}

/** A peaceful, dependency-free confetti drift that runs once on mount. */
export default function Confetti({ count = 28 }: { count?: number }) {
    const pieces = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => ({
                left: rand(i, 1) * 100,
                delay: rand(i, 2) * 1.2,
                duration: 3 + rand(i, 3) * 2.5,
                drift: (rand(i, 4) * 2 - 1) * 40,
                rotate: rand(i, 5) * 360,
                size: 6 + rand(i, 6) * 5,
                color: COLORS[i % COLORS.length],
                round: i % 3 === 0,
            })),
        [count],
    );

    return (
        <div className={styles.layer} aria-hidden="true">
            {pieces.map((p, i) => (
                <span
                    key={i}
                    className={styles.piece}
                    style={{
                        left: `${p.left}%`,
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        borderRadius: p.round ? '50%' : '2px',
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        '--drift': `${p.drift}px`,
                        '--rot': `${p.rotate}deg`,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}
