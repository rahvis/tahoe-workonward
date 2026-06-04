'use client';

import type { ReactNode } from 'react';
import styles from '../analytics.module.css';
import type {
    AnalyticsBreakdownRow,
    AnalyticsCreditTrendPoint,
    AnalyticsFunnelStage,
    AnalyticsRangeKey,
    AnalyticsRollupMetadata,
    AnalyticsSeriesPoint,
} from '@/lib/organization';

const RANGE_OPTIONS: Array<{ key: AnalyticsRangeKey; label: string }> = [
    { key: '7d', label: '7D' },
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
    { key: '365d', label: '1Y' },
];

export const ANALYTICS_TABLE_PAGE_SIZE = 20;

export function formatDayLabel(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function RangeTabs({
    value,
    onChange,
}: {
    value: AnalyticsRangeKey;
    onChange: (value: AnalyticsRangeKey) => void;
}) {
    return (
        <div className={styles.rangeTabs}>
            {RANGE_OPTIONS.map((option) => (
                <button
                    key={option.key}
                    type="button"
                    className={`${styles.rangeTab} ${value === option.key ? styles.rangeTabActive : ''}`}
                    aria-pressed={value === option.key}
                    onClick={() => onChange(option.key)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

export function AnalyticsTabs<T extends string>({
    tabs,
    value,
    onChange,
    label,
    actions,
}: {
    tabs: Array<{ key: T; label: string }>;
    value: T;
    onChange: (value: T) => void;
    label: string;
    actions?: ReactNode;
}) {
    return (
        <nav className={styles.pageTabs} aria-label={label}>
            <div className={styles.pageTabList} role="tablist">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={value === tab.key}
                        className={value === tab.key ? styles.pageTabActive : styles.pageTab}
                        onClick={() => onChange(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            {actions ? <div className={styles.pageTabActions}>{actions}</div> : null}
        </nav>
    );
}

export function RollupFreshness({ data }: { data: AnalyticsRollupMetadata }) {
    const last = data.last_rollup_at
        ? new Date(data.last_rollup_at).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
        : 'not available';
    const lag = data.rollup_lag_seconds == null ? null : Math.round(data.rollup_lag_seconds / 60);
    const label = data.rollup_status === 'fresh'
        ? 'Fresh'
        : data.rollup_status === 'stale'
        ? 'Stale'
        : 'Needs refresh';
    const statusClass = data.rollup_status === 'fresh'
        ? styles.rollupFresh
        : data.rollup_status === 'stale'
        ? styles.rollupStale
        : styles.rollupMissing;
    return (
        <div className={`${styles.freshnessNote} ${statusClass}`}>
            <span>{label}</span>
            <span>{last}</span>
            {lag == null ? null : <span>{lag}m lag</span>}
        </div>
    );
}

export function PaginationFooter({
    page,
    pageSize = ANALYTICS_TABLE_PAGE_SIZE,
    totalItems,
    label = 'rows',
    onPageChange,
}: {
    page: number;
    pageSize?: number;
    totalItems: number;
    label?: string;
    onPageChange: (page: number) => void;
}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const end = Math.min(totalItems, safePage * pageSize);

    return (
        <div className={styles.tableFooter}>
            <span>
                {totalItems === 0
                    ? `0 ${label}`
                    : `Rows ${start}-${end} of ${totalItems} ${label}`}
            </span>
            <div className={styles.paginationControls}>
                <button
                    type="button"
                    className={styles.paginationButton}
                    disabled={safePage <= 1}
                    onClick={() => onPageChange(safePage - 1)}
                >
                    Previous
                </button>
                <span className={styles.paginationMeta}>{safePage} / {totalPages}</span>
                <button
                    type="button"
                    className={styles.paginationButton}
                    disabled={safePage >= totalPages}
                    onClick={() => onPageChange(safePage + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export function Sparkline({
    values,
    stroke = 'var(--tahoe-color-accent)',
}: {
    values: number[];
    stroke?: string;
}) {
    if (!values.length) {
        return <div className={styles.finePrint}>No trend yet.</div>;
    }
    const width = 120;
    const height = 36;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(1, max - min);
    const points = values.map((value, index) => {
        const x = (index / Math.max(1, values.length - 1)) * width;
        const y = height - ((value - min) / span) * (height - 4) - 2;
        return `${x},${y}`;
    });
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            <polyline
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                points={points.join(' ')}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

export function ActivityHeatStrip({ points }: { points: AnalyticsSeriesPoint[] }) {
    const max = Math.max(1, ...points.map((point) => point.value));
    return (
        <div className={styles.heatStrip}>
            {points.map((point) => {
                const alpha = 0.08 + (point.value / max) * 0.9;
                return (
                    <div
                        key={point.day}
                        className={styles.heatCell}
                        title={`${formatDayLabel(point.day)}: ${point.value.toLocaleString()}`}
                        style={{
                            background: `rgba(255, 104, 44, ${alpha.toFixed(2)})`,
                            minHeight: `${18 + Math.min(28, (point.value / max) * 28)}px`,
                        }}
                    />
                );
            })}
        </div>
    );
}

export function BarList({
    rows,
    formatter = (value) => value.toLocaleString(),
    emptyTitle = 'No data yet',
    emptyCopy = 'Tahoe will render this breakdown once enough activity exists for the selected window.',
}: {
    rows: AnalyticsBreakdownRow[];
    formatter?: (value: number) => string;
    emptyTitle?: string;
    emptyCopy?: string;
}) {
    if (!rows.length) {
        return (
            <div className={styles.emptyState}>
                <h2>{emptyTitle}</h2>
                <p>{emptyCopy}</p>
            </div>
        );
    }
    const max = Math.max(1, ...rows.map((row) => row.value));
    return (
        <div className={styles.barList}>
            {rows.map((row) => {
                const label = row.label.trim().toLowerCase() === 'coresignal' ? 'Search' : row.label;
                return (
                    <div key={row.key} className={styles.barRow}>
                        <div className={styles.barLabelRow}>
                            <span className={styles.barLabel}>{label}</span>
                            <span className={styles.barValue}>
                                {formatter(row.value)} · {row.percentage.toFixed(1)}%
                            </span>
                        </div>
                        <div className={styles.barTrack}>
                            <div
                                className={styles.barFill}
                                style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function areaPath(points: Array<{ x: number; y: number }>, height: number) {
    if (!points.length) return '';
    const start = `M ${points[0].x} ${height}`;
    const line = points.map((point) => `L ${point.x} ${point.y}`).join(' ');
    const end = `L ${points[points.length - 1].x} ${height} Z`;
    return `${start} ${line} ${end}`;
}

function bandPath(upperPoints: Array<{ x: number; y: number }>, lowerPoints: Array<{ x: number; y: number }>) {
    if (!upperPoints.length || !lowerPoints.length || upperPoints.length !== lowerPoints.length) {
        return '';
    }
    const upperLine = upperPoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');
    const lowerLine = [...lowerPoints]
        .reverse()
        .map((point) => `L ${point.x} ${point.y}`)
        .join(' ');
    return `${upperLine} ${lowerLine} Z`;
}

export function StackedSpendChart({ points }: { points: AnalyticsCreditTrendPoint[] }) {
    if (!points.length) {
        return <div className={styles.emptyState}><h2>No credit trend yet</h2><p>Run search, enrichment, and outreach activity to unlock spend analytics.</p></div>;
    }
    const width = 760;
    const height = 240;
    const max = Math.max(1, ...points.map((point) => point.total));
    const normalized = points.map((point, index) => {
        const x = 40 + (index / Math.max(1, points.length - 1)) * (width - 64);
        const baseline = height - 24;
        const searchTop = baseline - (point.search / max) * (height - 56);
        const enrichmentTop = baseline - ((point.search + point.enrichment) / max) * (height - 56);
        const outreachTop = baseline - ((point.search + point.enrichment + point.outreach) / max) * (height - 56);
        return {
            x,
            baseline,
            searchTop,
            enrichmentTop,
            outreachTop,
            label: formatDayLabel(point.day),
            total: point.total,
        };
    });
    return (
        <div className={styles.chartFrame}>
            <svg className={styles.svgChart} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Credit spend trend">
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = 16 + (height - 40) * ratio;
                    return <line key={ratio} x1="36" x2={width - 12} y1={y} y2={y} stroke="rgba(32,32,32,0.08)" />;
                })}
                <path
                    d={areaPath(normalized.map((point) => ({ x: point.x, y: point.searchTop })), height - 24)}
                    fill="rgba(255, 173, 116, 0.74)"
                />
                <path
                    d={bandPath(
                        normalized.map((point) => ({ x: point.x, y: point.enrichmentTop })),
                        normalized.map((point) => ({ x: point.x, y: point.searchTop })),
                    )}
                    fill="rgba(255, 104, 44, 0.44)"
                />
                <path
                    d={bandPath(
                        normalized.map((point) => ({ x: point.x, y: point.outreachTop })),
                        normalized.map((point) => ({ x: point.x, y: point.enrichmentTop })),
                    )}
                    fill="rgba(190, 82, 0, 0.74)"
                />
                {normalized.map((point) => (
                    <g key={point.x}>
                        <circle cx={point.x} cy={point.outreachTop} r="3" fill="var(--tahoe-color-text-primary)" />
                        <text x={point.x} y={height - 6} fontSize="10" textAnchor="middle" fill="var(--tahoe-color-text-tertiary)">
                            {point.label}
                        </text>
                    </g>
                ))}
            </svg>
            <div className={styles.chartLegend}>
                <span className={styles.legendItem}><span className={styles.legendSwatch} style={{ background: 'rgba(255, 173, 116, 0.9)' }} />Search</span>
                <span className={styles.legendItem}><span className={styles.legendSwatch} style={{ background: 'rgba(255, 104, 44, 0.65)' }} />Enrichment</span>
                <span className={styles.legendItem}><span className={styles.legendSwatch} style={{ background: 'rgba(190, 82, 0, 0.85)' }} />Outreach</span>
            </div>
        </div>
    );
}

export function FunnelChart({ stages }: { stages: AnalyticsFunnelStage[] }) {
    if (!stages.length) {
        return <div className={styles.emptyState}><h2>No funnel yet</h2><p>Once recruiters save candidates, enrich them, and launch campaigns, Tahoe will visualize the full workflow funnel here.</p></div>;
    }
    const max = Math.max(1, ...stages.map((stage) => stage.count));
    return (
        <div className={styles.funnelGrid}>
            {stages.map((stage, index) => (
                <div key={stage.key} className={styles.funnelStage}>
                    <div
                        className={`${styles.funnelBar} ${index % 2 === 1 ? styles.funnelBarAlt : ''}`}
                        style={{ height: `${Math.max(36, (stage.count / max) * 160)}px` }}
                    />
                    <div className={styles.funnelLabel}>{stage.label}</div>
                    <div className={styles.funnelMeta}>{stage.count.toLocaleString()}</div>
                    <div className={styles.funnelMeta}>
                        {stage.conversion_from_previous == null ? 'Start of funnel' : `${stage.conversion_from_previous.toFixed(1)}% from previous`}
                    </div>
                    {stage.conversion_from_previous == null ? null : (
                        <div className={styles.funnelDrop}>
                            {Math.max(0, 100 - stage.conversion_from_previous).toFixed(1)}% drop-off
                        </div>
                    )}
                    <div className={styles.funnelMeta}>
                        {stage.avg_hours_from_previous == null ? 'Time gap not available' : `${stage.avg_hours_from_previous.toFixed(1)}h average from previous stage`}
                    </div>
                </div>
            ))}
        </div>
    );
}
