import styles from './match-radar.module.css';

type Axis = { label: string; value: number };

/**
 * Explainable-match spider-web (radar) chart — a hand-rolled inline SVG (no chart
 * library). Renders the candidate's coverage polygon over the job's required outline
 * across N axes, with labelled values. Server-renderable; the soft draw-in is pure CSS
 * and is disabled under `prefers-reduced-motion`. The adjacent evidence/gaps list (in
 * the page) is the accessible text equivalent; here we provide an `aria-label`/`<title>`.
 */
export default function MatchRadar({
    axes,
    required,
    ariaLabel,
    className,
    compact = false,
}: {
    axes: readonly Axis[];
    required: number;
    ariaLabel?: string;
    className?: string;
    compact?: boolean;
}) {
    const size = 300;
    const cx = size / 2;
    const cy = compact ? size / 2 : 148;
    const R = compact ? 96 : 100;
    const n = axes.length;

    const point = (valuePct: number, i: number, radius = R): [number, number] => {
        const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
        const r = (radius * valuePct) / 100;
        return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    };

    const toPoly = (pts: Array<[number, number]>) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

    const rings = [25, 50, 75, 100];
    const requiredPoly = toPoly(axes.map((_, i) => point(required, i)));
    const candidatePts = axes.map((a, i) => point(a.value, i));
    const candidatePoly = toPoly(candidatePts);

    return (
        <svg
            className={`${styles.radar} ${className ?? ''}`}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={ariaLabel}
            preserveAspectRatio="xMidYMid meet"
        >
            {ariaLabel ? <title>{ariaLabel}</title> : null}

            {/* concentric "web" rings */}
            {rings.map((r) => (
                <polygon key={r} className={styles.ring} points={toPoly(axes.map((_, i) => point(r, i)))} />
            ))}

            {/* spokes */}
            {axes.map((a, i) => {
                const [x, y] = point(100, i);
                return <line key={`spoke-${a.label}`} className={styles.spoke} x1={cx} y1={cy} x2={x} y2={y} />;
            })}

            {/* job's required outline */}
            <polygon className={styles.required} points={requiredPoly} />

            {/* candidate coverage */}
            <polygon className={styles.candidate} points={candidatePoly} />
            {candidatePts.map(([x, y], i) => (
                <circle key={`dot-${axes[i].label}`} className={styles.dot} cx={x} cy={y} r={compact ? 2.6 : 3} />
            ))}

            {/* axis labels + values */}
            {!compact &&
                axes.map((a, i) => {
                    const [lx, ly] = point(118, i);
                    const anchor = lx > cx + 4 ? 'start' : lx < cx - 4 ? 'end' : 'middle';
                    return (
                        <text key={`lbl-${a.label}`} className={styles.axisLabel} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle">
                            {a.label} <tspan className={styles.axisValue}>{a.value}</tspan>
                        </text>
                    );
                })}
        </svg>
    );
}

export type { Axis };
